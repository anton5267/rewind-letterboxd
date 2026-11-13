import { expect, test } from "@playwright/test";
import { build } from "esbuild";

test("credits search shows empty results only after a completed search", async ({ page }) => {
  const bundle = await build({
    absWorkingDir: process.cwd(),
    stdin: {
      contents: `
        import React, { useState } from 'react';
        import { createRoot } from 'react-dom/client';
        import { MemoryRouter } from 'react-router-dom';
        import Credits from './src/components/AdminMovieCreditsField';
        function Fixture() {
          const [value, setValue] = useState({ actors: [], directors: [], producers: [] });
          return <MemoryRouter initialEntries={['/en/admin']}><Credits value={value} onChange={setValue} /></MemoryRouter>;
        }
        createRoot(document.getElementById('root')).render(<Fixture />);
      `,
      loader: "tsx",
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    outdir: "unused",
    define: { "process.env.NODE_ENV": '"test"' },
    plugins: [{
      name: "credits-search-fixture",
      setup(builder) {
        builder.onResolve({ filter: /api\/people\.api$/ }, () => ({ path: "people", namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({ contents: `
          export function searchPeople() {
            return new Promise(resolve => { window.completeCreditsSearch = () => resolve({ data: { content: [] } }); });
          }
        ` }));
      },
    }],
  });
  const script = bundle.outputFiles.find(file => file.path.endsWith(".js"))!.text;
  await page.route("**/credits-search-fixture", route => route.fulfill({
    contentType: "text/html",
    body: `<div id="root"></div><script>${script.replace(/<\/script/gi, "<\\/script")}</script>`,
  }));
  await page.goto("http://127.0.0.1:3000/credits-search-fixture");
  const actors = page.getByRole("group", { name: "Cast", exact: true });
  const input = actors.getByRole("textbox");
  await input.fill("ab");
  await expect(actors.getByRole("status")).toHaveCount(0);
  await actors.getByRole("button", { name: "Search", exact: true }).click();
  await expect(actors).toHaveAttribute("aria-busy", "true");
  await expect(actors.getByRole("status")).toHaveCount(0);
  await page.evaluate(() => (window as any).completeCreditsSearch());
  await expect(actors.getByRole("status")).toBeVisible();
  await input.fill("abc");
  await expect(actors.getByRole("status")).toHaveCount(0);
});
