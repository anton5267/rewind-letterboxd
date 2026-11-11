import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(frontendDir, "dist");
const languageRoots = [
  { language: "uk", title: "Ваш кіножурнал | REWIND" },
  { language: "en", title: "Your film diary | REWIND" },
];

for (const { language, title } of languageRoots) {
  const rootPath = path.join(distDir, language, "index.html");
  const homePath = path.join(distDir, language, "home", "index.html");
  const [rootHtml, homeHtml] = await Promise.all([
    readFile(rootPath, "utf8"),
    readFile(homePath, "utf8"),
  ]);

  if (rootHtml !== homeHtml) {
    throw new Error(`/${language}/ must serve the generated localized home shell.`);
  }
  if (!rootHtml.includes(`<title>${title}</title>`)) {
    throw new Error(`/${language}/ has an unexpected localized page title.`);
  }

  const canonicalUrl = rootHtml.match(/<link rel="canonical" href="([^"]+)"\s*\/>/)?.[1];
  if (!canonicalUrl?.endsWith(`/${language}/home/`)) {
    throw new Error(`/${language}/ must canonicalize to /${language}/home/.`);
  }
}

console.log("Verified UK and EN localized root shells and canonical home URLs.");
