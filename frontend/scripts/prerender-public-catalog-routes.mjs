import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(frontendDir, "dist");
const apiBaseUrl = process.env.PUBLIC_CATALOG_API_BASE_URL?.replace(/\/+$/, "");
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const siteBaseUrl = process.env.PUBLIC_SITE_URL;

if (!apiBaseUrl || !publishableKey || !siteBaseUrl) {
  throw new Error("PUBLIC_CATALOG_API_BASE_URL, SUPABASE_PUBLISHABLE_KEY, and PUBLIC_SITE_URL are required.");
}

const siteBase = new URL(siteBaseUrl);
if (siteBase.protocol !== "https:") throw new Error("PUBLIC_SITE_URL must use HTTPS.");
if (!siteBase.pathname.endsWith("/")) siteBase.pathname += "/";
const apiUrl = new URL(apiBaseUrl);
if (apiUrl.protocol !== "https:") throw new Error("PUBLIC_CATALOG_API_BASE_URL must use HTTPS.");

const templatePath = path.join(distDir, "index.html");
const template = await readFile(templatePath, "utf8");
const generatedRoutes = new Set();

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

async function requestCatalog(resource) {
  const response = await fetch(`${apiBaseUrl}${resource}`, {
    headers: { apikey: publishableKey },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`Public catalog build request failed (${response.status}): ${resource}`);
  return response.json();
}

async function fetchAllPages(resource, type) {
  const separator = resource.includes("?") ? "&" : "?";
  const sort = type === "movies" ? "&sort=newest" : "";
  const pageUrl = page => `${resource}${separator}page=${page}&size=50${sort}`;
  const first = await requestCatalog(pageUrl(0));
  if (!Array.isArray(first.content) || !Number.isSafeInteger(first.totalPages) || first.totalPages < 0 || first.totalPages > 101) {
    throw new Error(`Unexpected paginated response for ${resource}.`);
  }
  const content = [...first.content];
  for (let page = 1; page < first.totalPages; page += 1) {
    const result = await requestCatalog(pageUrl(page));
    if (!Array.isArray(result.content)) throw new Error(`Missing page content for ${resource} page ${page}.`);
    content.push(...result.content);
  }
  if (content.length !== first.totalElements || new Set(content.map(item => item.id)).size !== content.length) {
    throw new Error(`Catalog changed while enumerating ${type}; refusing to generate incomplete routes.`);
  }
  return content;
}

function publicImageUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function routeHtml({ route, language, title, description, imageUrl }) {
  const canonicalUrl = new URL(`${route.replace(/^\/+|\/+$/g, "")}/`, siteBase).href;
  let html = template
    .replace(/<html\s+lang="[^"]*"/i, `<html lang="${language}"`)
    .replace(/<title>[^<]*<\/title>/i, () => `<title>${escapeHtml(title)} | REWIND</title>`);
  const metadata = [
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(title)} | REWIND" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:locale" content="${language === "uk" ? "uk_UA" : "en_US"}" />`,
    `<meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}" />`,
  ];
  if (imageUrl) metadata.push(`<meta property="og:image" content="${escapeHtml(imageUrl)}" />`);
  html = html.replace(/<\/head>/i, () => `${metadata.join("\n    ")}\n  </head>`);
  return html;
}

async function writeRoute(page) {
  const relativePath = page.route.split("/");
  if (relativePath.some(part => part === ".." || part === "." || part === "")) {
    throw new Error(`Invalid generated route: ${page.route}`);
  }
  const routeKey = `${page.language}/${relativePath.slice(1).join("/")}`;
  if (generatedRoutes.has(routeKey)) throw new Error(`Duplicate generated route: ${routeKey}`);
  generatedRoutes.add(routeKey);

  const outputPath = path.resolve(distDir, ...relativePath, "index.html");
  if (!outputPath.startsWith(`${distDir}${path.sep}`)) throw new Error(`Generated route escaped dist: ${page.route}`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, routeHtml(page), "utf8");
}

const defaultPages = [
  { route: "uk/home", language: "uk", title: "Каталог фільмів", description: "Переглядайте публічний каталог фільмів REWIND." },
  { route: "uk/films", language: "uk", title: "Фільми", description: "Шукайте фільми та відкривайте їхні сторінки в каталозі REWIND." },
  { route: "uk/films/discover", language: "uk", title: "Знайти фільм", description: "Знайдіть фільм за назвою, жанром, роком або рейтингом." },
  { route: "en/home", language: "en", title: "Film catalogue", description: "Browse the public REWIND film catalogue." },
  { route: "en/films", language: "en", title: "Films", description: "Search films and open their pages in the REWIND catalogue." },
  { route: "en/films/discover", language: "en", title: "Discover films", description: "Find films by title, genre, release year, or rating." },
];

for (const page of defaultPages) await writeRoute(page);

const movies = await fetchAllPages("/movies/search", "movies");
for (const movie of movies) {
  if (!Number.isSafeInteger(movie.id) || movie.id <= 0 || typeof movie.title !== "string" || !movie.title.trim()) {
    throw new Error("Public movie search returned an invalid movie for static route generation.");
  }
  const year = movie.releaseDate?.slice(0, 4);
  for (const language of ["uk", "en"]) {
    const title = year ? `${movie.title} (${year})` : movie.title;
    const description = language === "uk"
      ? `Інформація про фільм ${title} у публічному каталозі REWIND.`
      : `Explore ${title} in the public REWIND film catalogue.`;
    await writeRoute({
      route: `${language}/films/${movie.id}`,
      language,
      title,
      description,
      imageUrl: publicImageUrl(movie.photoUrl),
    });
  }
}

for (const type of ["actor", "director"]) {
  const people = await fetchAllPages(`/people/search?type=${type}`, type);
  for (const person of people) {
    if (!Number.isSafeInteger(person.id) || person.id <= 0 || typeof person.name !== "string" || !person.name.trim()) {
      throw new Error(`Public ${type} search returned an invalid person for static route generation.`);
    }
    for (const language of ["uk", "en"]) {
      const roleUk = type === "actor" ? "актора" : "режисера";
      const roleEn = type === "actor" ? "actor" : "director";
      const description = language === "uk"
        ? `Фільмографія ${roleUk} ${person.name} у публічному каталозі REWIND.`
        : `${person.name}'s ${roleEn} filmography in the public REWIND catalogue.`;
      await writeRoute({
        route: `${language}/people/${type}/${person.id}`,
        language,
        title: person.name,
        description,
        imageUrl: publicImageUrl(person.photoUrl),
      });
    }
  }
}

console.log(`Generated ${generatedRoutes.size} static public catalog route pages.`);
