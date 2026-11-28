import { copyFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { createCloudflareCatalogBuildEnvironment } from "./cloudflare-pages-build-config.mjs";

const frontendDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoDir = path.dirname(frontendDir);
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const catalogBuildEnvironment = createCloudflareCatalogBuildEnvironment(process.env);

function run(command, args, { cwd = repoDir, env = process.env } = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} exited with status ${result.status}.`);
}

run(npmCommand, ["ci", "--prefix", "frontend"]);
run(npmCommand, ["run", "verify:build", "--prefix", "frontend"]);
run("node", ["frontend/scripts/prerender-public-catalog-routes.mjs"], {
  env: { ...process.env, ...catalogBuildEnvironment },
});
run("node", ["frontend/scripts/verify-language-root-routes.mjs"]);
await copyFile(path.join(frontendDir, "dist", "index.html"), path.join(frontendDir, "dist", "404.html"));
