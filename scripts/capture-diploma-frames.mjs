import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "../letterboxd/letterboxd-login-figma-final2/node_modules/playwright/index.mjs";

const outputDir = path.resolve("artifacts/diploma-video/frames");
const baseUrl = "http://127.0.0.1:3000";
const screens = [
  ["01-uk-home", "/uk/home"],
  ["02-en-home", "/en/home"],
  ["03-uk-films", "/uk/films"],
  ["04-uk-film-details", "/uk/films/1"],
  ["05-uk-journal", "/uk/journal"],
  ["06-uk-help", "/uk/help"],
];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
try {
  for (const [name, route] of screens) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: false });
    console.log(`${name}: ${route}`);
  }
} finally {
  await browser.close();
}
