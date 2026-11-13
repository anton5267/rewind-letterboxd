import { expect, test } from "@playwright/test";
import { build } from "esbuild";
import path from "node:path";

test("a delayed list report status cannot affect the next viewer", async ({ page }) => {
  const bundle = await build({
    absWorkingDir: process.cwd(),
    stdin: {
      contents: `
        import React from 'react';
        import { createRoot } from 'react-dom/client';
        import { MemoryRouter, Routes, Route } from 'react-router-dom';
        import PublicList from './src/pages/PublicList';
        createRoot(document.getElementById('root')).render(
          <MemoryRouter initialEntries={['/en/lists/public/123']}>
            <Routes><Route path='/en/lists/public/:id' element={<PublicList />} /></Routes>
          </MemoryRouter>);
      `,
      loader: "tsx",
      resolveDir: process.cwd(),
    },
    bundle: true,
    external: ["/images/*"],
    write: false,
    outdir: "unused",
    define: { "process.env.NODE_ENV": '"test"', "import.meta.env": "{}" },
    plugins: [{
      name: "report-fixtures",
      setup(builder) {
        builder.onResolve({ filter: /context\/AuthContext$/ }, () => ({ path: "auth", namespace: "fixture" }));
        builder.onResolve({ filter: /api\/(lists|comments)\.api$/ }, () => ({ path: "api", namespace: "fixture" }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path: fixture }) => ({
          resolveDir: path.resolve("src"),
          contents: fixture === "auth" ? `
            import { useSyncExternalStore } from 'react';
            let actor = 1;
            const listeners = new Set();
            window.switchReportViewer = () => { actor = 2; listeners.forEach(fn => fn()); };
            export function useAuth() {
              const id = useSyncExternalStore(fn => { listeners.add(fn); return () => listeners.delete(fn); }, () => actor);
              return { isAuth: true, ready: true, user: { id } };
            }
          ` : `
            export const getPublicList = async () => ({ data: { id: 123, ownerId: 99,
              ownerUsername: 'owner', name: 'Fixture list', tags: [], movies: [], likeCount: 0 } });
            export const getPublicListLikeStatus = async () => ({ data: { liked: false, likes: 0 } });
            export const likePublicList = async () => {};
            export const unlikePublicList = async () => {};
            let calls = 0;
            export const getMyListReport = () => ++calls === 1
              ? new Promise(resolve => { window.releaseOldReportStatus = () => resolve({ data: { reported: true } }); })
              : Promise.resolve({ data: { reported: false } });
            export const getMyCommentReport = getMyListReport;
            export const reportList = async () => ({});
            export const reportComment = reportList;
          `,
        }));
      },
    }],
  });
  const script = bundle.outputFiles.find(file => file.path.endsWith(".js"))!.text;
  await page.route("**/report-actor-fixture", route => route.fulfill({
    contentType: "text/html",
    body: `<div id="root"></div><script>${script.replace(/<\/script/gi, "<\\/script")}</script>`,
  }));
  await page.goto("http://127.0.0.1:3000/report-actor-fixture");
  const form = page.locator('[data-content-report-type="list"]');
  await form.getByRole("button", { name: "Report list", exact: true }).click();
  await expect(form).toHaveAttribute("data-content-report-type", "list");
  await expect.poll(() => page.evaluate(() => typeof (window as any).releaseOldReportStatus)).toBe("function");
  await page.evaluate(() => (window as any).switchReportViewer());
  await expect(form.getByRole("button", { name: "Report list", exact: true })).toBeVisible();
  await form.getByRole("button", { name: "Report list", exact: true }).click();
  const submit = form.getByRole("button", { name: "Submit report", exact: true });
  await expect(submit).toBeEnabled();
  await page.evaluate(() => (window as any).releaseOldReportStatus());
  await expect(submit).toBeEnabled();
  await expect(form.getByText("Report submitted.", { exact: true })).toHaveCount(0);
});
