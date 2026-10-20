import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

export const repoRoot = fileURLToPath(new URL("../", import.meta.url));
export const outputRoot = path.join(repoRoot, "artifacts", "diploma-video");
export const screens = [
  ["01-uk-home", "/uk/home"],
  ["02-en-home", "/en/home"],
  ["03-uk-films", "/uk/films"],
  ["04-uk-film-details", "/uk/films/1"],
  ["05-uk-journal", "/uk/journal"],
  ["06-uk-help", "/uk/help"],
];

export function captureOptions() {
  const args = process.argv.slice(2);
  let baseUrl = process.env.DIPLOMA_BASE_URL || process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
  let explicitBaseUrl = Boolean(process.env.DIPLOMA_BASE_URL || process.env.E2E_BASE_URL);
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--base-url" && args[index + 1]) baseUrl = args[++index];
    else if (args[index].startsWith("--base-url=")) baseUrl = args[index].slice("--base-url=".length);
    else throw new Error("Usage: node scripts/capture-diploma-{frames|video}.mjs [--base-url http://127.0.0.1:3000]");
    explicitBaseUrl = true;
  }
  const parsed = new URL(baseUrl);
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Capture base URL must be HTTP(S) without credentials, query or fragment");
  }
  return { baseUrl: parsed.href.replace(/\/+$/, ""), explicitBaseUrl };
}

export function inside(directory, file) {
  const relative = path.relative(directory, file);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export const sha256 = data => createHash("sha256").update(data).digest("hex");

export async function backupExistingFiles(files) {
  let backupRoot;
  const records = [];
  for (const file of files) {
    const resolved = path.resolve(file);
    if (!inside(outputRoot, resolved)) throw new Error("Capture output escaped the repository artifact directory");
    let original;
    try { original = await fs.readFile(resolved); }
    catch (error) { if (error.code === "ENOENT") continue; throw error; }
    backupRoot ??= path.join(path.dirname(repoRoot.replace(/[\\/]$/, "")), ".codex-backups",
      `diploma-capture-${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`);
    const relative = path.relative(outputRoot, resolved);
    const destination = path.join(backupRoot, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, original, { flag: "wx" });
    const digest = sha256(original);
    if (sha256(await fs.readFile(destination)) !== digest) throw new Error("Capture backup hash mismatch");
    records.push({ file: relative, bytes: original.length, sha256: digest });
  }
  if (backupRoot) {
    await fs.writeFile(path.join(backupRoot, "SHA256.json"), JSON.stringify(records, null, 2) + "\n", { flag: "wx" });
    console.log(`Previous artifacts backed up and SHA256 verified: ${backupRoot}`);
  }
}

export async function waitForScreen(page) {
  await page.locator("header").waitFor({ state: "visible" });
  await page.locator("main").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const main = document.querySelector("main");
    return document.querySelectorAll("main").length === 1
      && main.querySelector("h1")?.textContent.trim()
      && !document.querySelector("#route-loading-title, #app-error-title")
      && !main.matches('[aria-busy="true"]')
      && !main.querySelector('[aria-busy="true"]');
  }, null, { timeout: 60_000 });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForFunction(() => [...document.images].filter(image => {
    const rect = image.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0
      && rect.top < innerHeight && rect.left < innerWidth;
  }).every(image => image.complete && image.naturalWidth > 0), null, { timeout: 60_000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
