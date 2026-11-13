import { expect, test, type Page } from "@playwright/test";

const baseURL = new URL(process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000");
const storageKey = `rewind:stale-asset:${baseURL.pathname}`;

async function triggerPreloadError(page: Page) {
  await page.evaluate(() => {
    for (let index = 0; index < 3; index += 1) {
      window.dispatchEvent(new Event("vite:preloadError", { cancelable: true }));
    }
  });
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({ status: 401, json: {} }));
});

for (const lang of ["uk", "en"] as const) {
  test(`new deployment recovers once and preserves the ${lang} URL`, async ({ page }) => {
    let documentLoads = 0;
    let deploymentChecks = 0;
    page.on("request", request => { if (request.resourceType() === "document") documentLoads += 1; });
    await page.route(url => url.pathname === baseURL.pathname, async route => {
      if (route.request().resourceType() !== "fetch") return route.continue();
      deploymentChecks += 1;
      await route.fulfill({ contentType: "text/html", body: `<script type="module" src="${baseURL.pathname}assets/index-next.js"></script>` });
    });

    await page.goto(`${lang}/about/?source=asset-recovery#credits-heading`);
    await expect(page.locator("#about-title")).toBeVisible();
    const originalURL = page.url();
    const originalEntry = await page.locator('script[type="module"][src]').first().getAttribute("src");
    await triggerPreloadError(page);
    await expect.poll(() => documentLoads).toBe(2);
    await expect(page.locator("#about-title")).toBeVisible();
    await expect(page).toHaveURL(originalURL);
    expect(await page.evaluate(key => JSON.parse(sessionStorage.getItem(key)!).entry, storageKey)).toBe(new URL(originalEntry!, baseURL).href);

    // Simulate old HTML being served again after the automatic reload.
    await triggerPreloadError(page);
    await expect(page.locator("#about-title")).toBeVisible();
    expect(documentLoads).toBe(2);
    expect(deploymentChecks).toBe(1);
  });
}

test("unchanged deployment keeps the loaded page", async ({ page }) => {
  let documentLoads = 0;
  page.on("request", request => { if (request.resourceType() === "document") documentLoads += 1; });
  await page.goto("en/about/");
  await expect(page.locator("#about-title")).toBeVisible();
  const entry = await page.locator('script[type="module"][src]').first().getAttribute("src");
  await page.route(url => url.pathname === baseURL.pathname, route => route.fulfill({
    contentType: "text/html", body: `<script type="module" src="${entry}"></script>`,
  }));
  const checked = page.waitForEvent("requestfinished", { predicate: request => new URL(request.url()).pathname === baseURL.pathname });
  await triggerPreloadError(page);
  await checked;
  expect(await page.evaluate(key => sessionStorage.getItem(key), storageKey)).toBeNull();
  await expect(page.locator("#about-title")).toBeVisible();
  expect(documentLoads).toBe(1);
});

test("recent recovery bounds retries across different entry bundles", async ({ page }) => {
  let deploymentChecks = 0;
  await page.goto("en/about/");
  await expect(page.locator("#about-title")).toBeVisible();
  await page.evaluate(key => sessionStorage.setItem(key, JSON.stringify({ entry: "previous-entry", at: Date.now() })), storageKey);
  await page.route(url => url.pathname === baseURL.pathname, route => {
    deploymentChecks += 1;
    return route.abort();
  });
  await triggerPreloadError(page);
  await expect(page.locator("#about-title")).toBeVisible();
  expect(deploymentChecks).toBe(0);
});

test("failed deployment check keeps the loaded page", async ({ page }) => {
  let documentLoads = 0;
  page.on("request", request => { if (request.resourceType() === "document") documentLoads += 1; });
  await page.goto("en/about/");
  await expect(page.locator("#about-title")).toBeVisible();
  await page.route(url => url.pathname === baseURL.pathname, route => route.abort("internetdisconnected"));
  const failed = page.waitForEvent("requestfailed", { predicate: request => new URL(request.url()).pathname === baseURL.pathname });
  await triggerPreloadError(page);
  await failed;
  await expect(page.locator("#about-title")).toBeVisible();
  expect(documentLoads).toBe(1);
});

test("a deleted production route stylesheet recovers through Vite", async ({ page }) => {
  await page.goto("en/help/");
  await expect(page.locator("main")).toBeVisible();
  const entry = await page.locator('script[type="module"][src]').first().getAttribute("src");
  test.skip(!entry?.includes("/assets/"), "Requires a Vite production preview to exercise the generated preloader.");

  let deletedStylesheets = 0;
  let documentLoads = 0;
  page.on("request", request => { if (request.resourceType() === "document") documentLoads += 1; });
  await page.route("**/assets/About-*.css", route => {
    deletedStylesheets += 1;
    return deletedStylesheets === 1
      ? route.fulfill({ status: 404, contentType: "text/plain", body: "Deleted previous stylesheet" })
      : route.continue();
  });
  await page.route(url => url.pathname === baseURL.pathname, route => route.fulfill({
    contentType: "text/html", body: `<script type="module" src="${baseURL.pathname}assets/index-next.js"></script>`,
  }));

  await page.locator('a[href$="/en/about"]').first().click();
  await expect(page.locator("#about-title")).toBeVisible();
  expect(deletedStylesheets).toBe(2);
  expect(documentLoads).toBe(1);
  await expect(page.locator("#app-error-title")).toHaveCount(0);
});
