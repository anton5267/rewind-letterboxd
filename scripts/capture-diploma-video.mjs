import path from "node:path";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "../letterboxd/letterboxd-login-figma-final2/node_modules/playwright/index.mjs";

const root = path.resolve("artifacts/diploma-video");
const contentTypes = { ".html": "text/html; charset=utf-8", ".png": "image/png" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const filePath = path.resolve(root, `.${pathname}`);
    if (!filePath.startsWith(root) || request.method !== "GET") {
      response.writeHead(404).end();
      return;
    }
    const info = await stat(filePath);
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream", "Content-Length": info.size });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(resolve => server.listen(8790, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
try {
  await page.goto("http://127.0.0.1:8790/record.html");
  await page.getByRole("button", { name: "Record WebM" }).click();
  await page.waitForFunction(() => document.querySelector("#status").textContent.includes("ready"));
  const status = await page.locator("#status").textContent();
  console.log(status);
  const size = Number(status.match(/ready (\d+)/)?.[1] ?? 0);
  if (size === 0) throw new Error("Chromium MediaRecorder returned an empty WebM blob");
  const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
  await page.getByRole("link", { name: "Download WebM" }).click();
  const file = await downloadPromise;
  await file.saveAs(path.join(root, "rewind-diploma-demo.webm"));
  console.log(`saved ${path.join(root, "rewind-diploma-demo.webm")}`);
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
