import { expect, test, type BrowserContext } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const filmImage = (id: number) => `https://image.tmdb.org/t/p/w342/rewind-figma-person-${id}.svg`;
const backdropUrl = "https://image.tmdb.org/t/p/original/rewind-figma-person-backdrop.svg";
const biography = "William Bradley ‘Brad’ Pitt was born on December 18, 1963 in Shawnee, Oklahoma and raised in Springfield, Missouri, the son of Jane Etta (Hillhouse), a school counselor, and William Alvin ‘Bill’ Pitt, a truck company manager.";

function credits(start: number, count: number, prefix: string) {
  return Array.from({ length: count }, (_, index) => ({
    id: start + index,
    title: `${prefix} ${index + 1}`,
    releaseDate: `${2025 - index}-01-01`,
    rating: 4.1,
    photoUrl: filmImage(start + index),
    characterName: null,
  }));
}

async function installPersonFixture(context: BrowserContext) {
  const starring = credits(994_000, 36, "Brad Pitt film");
  const producing = credits(995_000, 13, "Produced film");
  await context.route("https://image.tmdb.org/**", route => {
    const url = new URL(route.request().url());
    const label = url.pathname.includes("backdrop") ? "Figma backdrop" : url.pathname.split("/").pop()?.replace(".svg", "") ?? "Film";
    const hue = url.pathname.includes("backdrop") ? 212 : Number(url.pathname.match(/(\d+)\.svg$/)?.[1] ?? 0) % 360;
    return route.fulfill({
      contentType: "image/svg+xml",
      body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 174 260"><rect width="174" height="260" fill="hsl(${hue} 38% 26%)"/><text x="87" y="130" fill="white" font-family="Arial" font-size="11" text-anchor="middle">${label}</text></svg>`,
    });
  });
  await context.route(url => new URL(url).pathname.startsWith("/api/"), route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/genres") return route.fulfill({ json: [] });
    if (url.pathname === "/api/actors/85") return route.fulfill({ json: {
      id: 85,
      name: "Brad Pitt",
      photoUrl: filmImage(995_085),
      type: "ACTOR",
      biography,
      biographyLanguage: "en",
      careerJobs: ["Executive Producer"],
      relatedPeople: [{ id: 86, type: "PRODUCER" }],
      films: starring,
    } });
    if (url.pathname === "/api/producers/86") return route.fulfill({ json: {
      id: 86,
      name: "Brad Pitt",
      photoUrl: filmImage(995_085),
      type: "PRODUCER",
      films: producing,
    } });
    if (url.pathname.startsWith("/api/movies/") && url.pathname.endsWith("/details")) return route.fulfill({ json: { backdropUrl } });
    return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0 } });
  });
}

test("READY Brad Pitt person frames match collapsed and expanded desktop and mobile layouts", async ({ context, page }) => {
  await installPersonFixture(context);
  const artifactDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/people");
  mkdirSync(artifactDir, { recursive: true });
  const pageHeight = () => page.evaluate(() => document.documentElement.scrollHeight);
  const starring = () => page.locator('section[aria-labelledby="filmography-title"]');
  const produced = () => page.locator("section[aria-labelledby^='person-producer-']");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/uk/people/actor/85");
  await expect(page.getByRole("heading", { level: 1, name: "Brad Pitt" })).toBeVisible();
  await expect(page.getByTestId("person-role-summary")).toHaveText("Актор | Продюсер | Виконавчий продюсер");
  await expect(starring().locator("article")).toHaveCount(12);
  await expect(produced().locator("article")).toHaveCount(12);
  await expect(produced().getByRole("button", { name: "Усі фільми", exact: true })).toBeVisible();
  const collapsedHeight = await pageHeight();
  console.log("BRAD_PITT_FIGMA_COLLAPSED", await page.evaluate(() => Object.fromEntries(
    ['main > section:first-child', 'section[aria-labelledby="filmography-title"]', '#person-films', 'section[aria-labelledby^="person-producer-"]', 'footer']
      .map(selector => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) return [selector, null];
        const { x, y, width, height } = element.getBoundingClientRect();
        return [selector, { x, y: y + window.scrollY, width, height }];
      }),
  )));
  await page.screenshot({ path: resolve(artifactDir, "brad-pitt-collapsed-uk-desktop-1440.png"), fullPage: true });
  expect(Math.abs(collapsedHeight - 2842)).toBeLessThanOrEqual(1);

  await starring().getByRole("button", { name: "Усі фільми", exact: true }).click();
  await expect(starring().locator("article")).toHaveCount(36);
  await expect(starring().getByRole("button", { name: "Менше фільмів", exact: true })).toHaveAttribute("aria-expanded", "true");
  const expandedHeight = await pageHeight();
  console.log("BRAD_PITT_FIGMA_EXPANDED_HEIGHT", expandedHeight);
  await page.screenshot({ path: resolve(artifactDir, "brad-pitt-expanded-uk-desktop-1440.png"), fullPage: true });
  expect(Math.abs(expandedHeight - 4082)).toBeLessThanOrEqual(1);

  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto("/uk/people/actor/85");
  await expect(starring().locator("article")).toHaveCount(12);
  await expect(produced().locator("article")).toHaveCount(12);
  await expect(produced().getByRole("button", { name: "Усі фільми", exact: true })).toBeVisible();
  const mobileHeight = await pageHeight();
  console.log("BRAD_PITT_FIGMA_MOBILE_HEIGHT", mobileHeight);
  console.log("BRAD_PITT_FIGMA_MOBILE", await page.evaluate(() => Object.fromEntries(
    ['main > section:first-child', 'section[aria-labelledby="filmography-title"]', '#person-films', 'section[aria-labelledby^="person-producer-"]']
      .map(selector => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) return [selector, null];
        const { x, y, width, height } = element.getBoundingClientRect();
        return [selector, { x, y: y + window.scrollY, width, height }];
      }),
  )));
  await page.screenshot({ path: resolve(artifactDir, "brad-pitt-collapsed-uk-mobile-393.png"), fullPage: true });
  expect(Math.abs(mobileHeight - 1601)).toBeLessThanOrEqual(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(393);
});
