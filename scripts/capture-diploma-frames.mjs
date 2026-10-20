import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "../frontend/node_modules/playwright/index.mjs";
import { backupExistingFiles, captureOptions, outputRoot, screens, sha256, waitForScreen } from "./diploma-capture-utils.mjs";

const { baseUrl } = captureOptions();
const outputDir = path.join(outputRoot, "frames");
const manifestPath = path.join(outputRoot, "capture-source.json");
const captured = [];
const browser = await chromium.launch({ headless: false, channel: process.env.E2E_BROWSER_CHANNEL ?? "chrome" });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  for (const [name, route] of screens) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
    if (!response?.ok()) throw new Error(`Capture route ${route} returned HTTP ${response?.status() ?? "no response"}`);
    await waitForScreen(page);
    captured.push({ name, route, image: await page.screenshot({ fullPage: false, animations: "disabled" }) });
    console.log(`Captured local slideshow frame ${name}: ${route}`);
  }
} finally {
  await browser.close();
}

// Keep prior frames untouched unless every new route is ready and captured.
const files = captured.map(frame => path.join(outputDir, `${frame.name}.png`));
await backupExistingFiles([...files, manifestPath]);
await fs.mkdir(outputDir, { recursive: true });
for (const [index, frame] of captured.entries()) await fs.writeFile(files[index], frame.image);
await fs.writeFile(manifestPath, JSON.stringify({
  kind: "local-slideshow-frames",
  baseUrl,
  capturedAt: new Date().toISOString(),
  viewport: { width: 1280, height: 720 },
  frames: captured.map(frame => ({ file: `frames/${frame.name}.png`, route: frame.route, sha256: sha256(frame.image) })),
}, null, 2) + "\n");
console.log(`Saved ${captured.length} local slideshow frames: ${outputDir}`);
