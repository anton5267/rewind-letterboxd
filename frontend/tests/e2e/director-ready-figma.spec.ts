import { expect, test, type BrowserContext } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const directedTitles = ["Titanic", "Avatar", "Avatar: The Way of Water", "Avatar: Fire and Ash", "Aliens", "The Terminator", "Terminator 2: Judgment Day", "True Lies", "The Abyss", "Ghosts of the Abyss", "Aliens of the Deep"];
const writtenTitles = ["Titanic", "Avatar", "Avatar: The Way of Water", "Avatar: Fire and Ash", "Aliens", "The Terminator", "Terminator 2: Judgment Day", "True Lies", "Point Break", "Alita: Battle Angel", "Rambo: First Blood Part II", "Strange Days"];
const art = (id: number) => `https://images.example.invalid/film-${id}.svg`;

function credits(titles: string[], startId: number) {
  return titles.map((title, index) => ({
    id: startId + index, title, releaseDate: `${2025 - index}-01-01`, rating: 4.2,
    photoUrl: art(startId + index), characterName: null,
  }));
}

async function installDirectorFixture(context: BrowserContext) {
  await context.route("https://images.example.invalid/**", route => {
    const title = new URL(route.request().url()).pathname.split("/").pop()?.replace(".svg", "") ?? "Film";
    return route.fulfill({ contentType: "image/svg+xml", body: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 174 260"><rect width="174" height="260" fill="#24485b"/><text x="87" y="130" fill="white" font-family="Arial" font-size="12" text-anchor="middle">${title}</text></svg>` });
  });
  await context.route(url => new URL(url).pathname.startsWith("/api/"), route => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/users/me") return route.fulfill({ status: 401, json: {} });
    if (url.pathname === "/api/genres") return route.fulfill({ json: [] });
    if (url.pathname === "/api/directors/85") return route.fulfill({ json: {
      id: 85, name: "James Cameron", photoUrl: art(85), type: "DIRECTOR",
      relatedPeople: [{ id: 85, type: "WRITER" }],
      biography: "James Francis Cameron is a Canadian filmmaker. He is a major figure in the post-New Hollywood era and often uses novel technologies with a classical filmmaking style. Cameron first gained",
      biographyLanguage: "en", careerJobs: ["Producer"], films: credits(directedTitles, 990_000),
    } });
    if (url.pathname === "/api/writers/85") return route.fulfill({ json: {
      id: 85, name: "James Cameron", photoUrl: art(85), type: "WRITER", films: credits(writtenTitles, 991_000),
    } });
    if (url.pathname.startsWith("/api/movies/") && url.pathname.endsWith("/details")) return route.fulfill({ json: { backdropUrl: null } });
    return route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, number: 0 } });
  });
}

test("READY James Cameron director frame matches desktop Figma composition", async ({ context, page }) => {
  await installDirectorFixture(context);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/uk/people/director/85");
  const directed = page.locator('section[aria-labelledby="filmography-title"]');
  const written = page.locator('section[aria-labelledby="person-writer-85-title"]');
  await expect(page.getByRole("heading", { level: 1, name: "James Cameron" })).toBeVisible();
  await expect(page.getByTestId("person-role-summary")).toHaveText("Сценарист | Продюсер | Режисер");
  await expect(directed.locator("article")).toHaveCount(11);
  await expect(written.locator("article")).toHaveCount(12);
  await expect(directed.getByRole("heading", { level: 2, name: "Режисерські роботи" })).toBeVisible();
  await expect(written.getByRole("heading", { level: 2, name: "Сценарні роботи" })).toBeVisible();
  const geometry = await page.evaluate(() => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const { x, y, width, height } = element.getBoundingClientRect();
      return { x, y, width, height };
    };
    return {
      pageHeight: document.documentElement.scrollHeight,
      hero: rect("main > section:first-child"),
      directed: rect('section[aria-labelledby="filmography-title"]'),
      directedGrid: rect("#person-films"),
      written: rect('section[aria-labelledby^="person-writer-"]'),
      writtenGrid: rect("#person-writer-85-grid"),
      footer: rect("footer"),
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  console.log("JAMES_CAMERON_READY_FIGMA", geometry);
  expect(geometry.overflow).toBe(0);
  expect(Math.abs(geometry.pageHeight - 2842)).toBeLessThanOrEqual(1);
  expect(geometry.hero?.height).toBe(907);
  expect(geometry.directedGrid?.y).toBe(1092);
  expect(Math.abs((geometry.writtenGrid?.y ?? 0) - 1847)).toBeLessThanOrEqual(1);
  expect(Math.abs((geometry.footer?.y ?? 0) - 2577)).toBeLessThanOrEqual(1);
  await mkdir(resolve(process.cwd(), "../artifacts/visual-audit-20261125/people"), { recursive: true });
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261125/people/james-cameron-uk-desktop-1440.png"), fullPage: true });
});
