import path from "node:path";
import { createReadStream } from "node:fs";
import { readFile, realpath, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "../frontend/node_modules/playwright/index.mjs";
import { backupExistingFiles, captureOptions, inside, outputRoot, screens, sha256 } from "./diploma-capture-utils.mjs";

const options = captureOptions();
const source = JSON.parse(await readFile(path.join(outputRoot, "capture-source.json"), "utf8"));
if (source.kind !== "local-slideshow-frames" || source.frames?.length !== screens.length) {
  throw new Error("Capture all six local slideshow frames before recording the video");
}
if (options.explicitBaseUrl && source.baseUrl !== options.baseUrl) {
  throw new Error("Capture source differs from the requested base URL; recapture frames with the same --base-url");
}
for (const [index, [name]] of screens.entries()) {
  const file = `frames/${name}.png`;
  if (source.frames[index].file !== file || sha256(await readFile(path.join(outputRoot, file))) !== source.frames[index].sha256) {
    throw new Error(`Local slideshow frame does not match capture metadata: ${file}`);
  }
}

const contentTypes = { ".html": "text/html; charset=utf-8", ".png": "image/png", ".json": "application/json" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
    const filePath = path.resolve(outputRoot, `.${pathname}`);
    if (!inside(outputRoot, filePath) || request.method !== "GET") {
      response.writeHead(404).end();
      return;
    }
    if (!inside(outputRoot, await realpath(filePath))) {
      response.writeHead(404).end();
      return;
    }
    const info = await stat(filePath);
    if (!info.isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] ?? "application/octet-stream", "Content-Length": info.size });
    createReadStream(filePath).on("error", () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});

let browser;
try {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  browser = await chromium.launch({ headless: false, channel: process.env.E2E_BROWSER_CHANNEL ?? "chrome" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/record.html`, { waitUntil: "domcontentloaded" });
  const recordingError = new Promise((_, reject) => { page.once("pageerror", reject); });
  recordingError.catch(() => {}); // The click can surface an error before the wait is attached.
  await page.getByRole("button", { name: "Record WebM" }).click();
  await Promise.race([
    page.waitForFunction(() => /ready|error/.test(document.querySelector("#status")?.textContent ?? ""), null, { timeout: 60_000 }),
    recordingError,
  ]);
  const status = await page.locator("#status").textContent();
  if (Number(status?.match(/ready (\d+)/)?.[1] ?? 0) === 0 || status.includes("error")) throw new Error(`Local slideshow encoder: ${status}`);
  const downloadPromise = page.waitForEvent("download", { timeout: 10_000 });
  await page.getByRole("link", { name: "Download WebM" }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  if (!stream) throw new Error("Local slideshow WebM download is unavailable");
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const video = Buffer.concat(chunks);
  if (video.length === 0 || !video.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) {
    throw new Error("Local slideshow encoder returned an invalid WebM header");
  }
  const videoPath = path.join(outputRoot, "rewind-diploma-demo.webm");
  const metadataPath = path.join(outputRoot, "slideshow-source.json");
  await backupExistingFiles([videoPath, metadataPath]);
  await writeFile(videoPath, video);
  await writeFile(metadataPath, JSON.stringify({
    kind: "local-slideshow",
    baseUrl: source.baseUrl,
    framesCapturedAt: source.capturedAt,
    recordedAt: new Date().toISOString(),
    frameCount: screens.length,
    file: path.basename(videoPath),
    bytes: video.length,
    sha256: sha256(video),
  }, null, 2) + "\n");
  console.log(`Saved six-frame local slideshow: ${videoPath} (${video.length} bytes; source ${source.baseUrl})`);
} finally {
  await browser?.close();
  if (server.listening) await new Promise(resolve => server.close(resolve));
}
