import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

test("service pages use the Figma editorial hero and retain route navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const route of ["help", "faq", "contact", "rules", "privacy", "film-data", "important-data", "delete-account", "terms", "conditions", "safety-notice", "hq-accounts"]) {
    await page.goto(`/uk/${route}`);
    const hero = page.locator('main > [class*="hero"]');
    await expect(hero).toHaveCSS("min-height", "818px");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('main > [class*="hero"] nav')).toHaveCount(route === "faq" ? 1 : 0);
    const details = await page.locator("main > article").boundingBox();
    expect(details?.width).toBeCloseTo(1200, 0);
  }
});

test("service page sections preserve the Figma editorial rhythm across breakpoints", async ({ page }) => {
  const expectedSections = { help: 9, contact: 3, rules: 9, privacy: 5, "film-data": 2, "delete-account": 4, terms: 7, conditions: 6, "safety-notice": 5, "hq-accounts": 1 };
  const expectedMobileSections = { ...expectedSections, "hq-accounts": 5 };

  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [route, count] of Object.entries(expectedSections)) {
    await page.goto(`/en/${route}`);
    const article = page.locator("main > article");
    await expect(article.locator("section")).toHaveCount(count);
    const firstRow = article.locator("section").first();
    const firstHeading = firstRow.getByRole("heading", { level: 3 });
    await expect(firstHeading).toBeVisible();
    const rowBox = await firstRow.boundingBox();
    expect(rowBox?.x).toBeCloseTo(120, 0);
    expect(rowBox?.width).toBe(1200);
  }

  await page.setViewportSize({ width: 393, height: 844 });
  for (const [route, count] of Object.entries(expectedMobileSections)) {
    await page.goto(`/uk/${route}`);
    const article = page.locator("main > article");
    await expect(article.locator("section")).toHaveCount(count);
    await expect(article.locator("section").first().getByRole("heading", { level: 3 })).toBeVisible();
    await expect(article.locator("section").first().locator("p, ul, ol").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
  }
});

test("READY Contact, Help and HQ Accounts match their Figma desktop geometry", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/contact");
  const contactTitleLocator = page.locator("main > div[class*='hero'] h1");
  await expect(contactTitleLocator).toBeVisible();
  const contactTitle = await contactTitleLocator.evaluate(node => node.getBoundingClientRect().toJSON());
  const contactIntro = await page.locator('main > article [class*="editorialIntro"] > p').first().boundingBox();
  const contactEmail = await page.locator('main > article [class*="contactAvailability"] a').boundingBox();
  const contactSections = page.locator('main > article [class*="editorialSection"]');
  const contactAnchors = await Promise.all([0, 1, 2].map(async index => ({
    section: await contactSections.nth(index).boundingBox(),
    heading: await contactSections.nth(index).getByRole("heading", { level: 3 }).boundingBox(),
    body: await contactSections.nth(index).locator("p, ul").first().boundingBox(),
  })));
  const contactClosing = await page.locator('main > article [class*="contactClosing"]').boundingBox();
  const contactFooter = await page.locator("footer").boundingBox();
  const contactPageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(contactTitle.x).toBeCloseTo(483, 0);
  expect(contactTitle.y).toBeCloseTo(280, 0);
  expect(contactTitle.width).toBeCloseTo(547, 0);
  expect(contactTitle.height).toBeCloseTo(65, 0);
  expect(contactIntro).toMatchObject({ x: 120, y: 713, width: 1126, height: 66 });
  expect(contactEmail?.y).toBeCloseTo(790, 0);
  for (const [index, y] of [883, 1050, 1239].entries()) expect(contactAnchors[index].heading?.y).toBeCloseTo(y, 0);
  expect(contactClosing?.y).toBeCloseTo(1378, 0);
  expect(contactFooter?.y).toBeCloseTo(1468, 0);
  expect(contactPageHeight).toBe(1733);

  await page.goto("/en/help");
  const helpArticle = page.locator("main > article");
  const helpSteps = helpArticle.locator('[class*="helpSteps"] > section');
  const expectedHeadings = [713, 975, 1436, 1894, 2300, 2707];
  await expect(helpSteps).toHaveCount(expectedHeadings.length);
  for (const [index, y] of expectedHeadings.entries()) {
    const step = helpSteps.nth(index);
    const heading = step.getByRole("heading", { level: 3 });
    await expect(heading).toBeVisible();
    expect((await heading.boundingBox())?.y).toBe(y);
  }
  const firstHelpImage = await helpSteps.first().locator('[class*="helpIllustration"]').boundingBox();
  expect(firstHelpImage).toMatchObject({ x: 927, y: 713, width: 393, height: 202 });
  const guides = helpArticle.locator('[class*="helpGuides"] > section');
  await expect(guides).toHaveCount(3);
  const firstGuideHeading = await guides.first().getByRole("heading", { level: 3 }).boundingBox();
  expect(firstGuideHeading?.y).toBe(3343);
  const helpFooter = await page.locator("footer").boundingBox();
  expect(helpFooter?.y).toBeCloseTo(3760, 0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(4025);

  await page.goto("/en/hq-accounts");
  const hqHeroLead = page.locator("main > div[class*='hero'] [class*='heroCopy'] p[class*='lead']");
  await expect(hqHeroLead).toHaveText("HQ is a profile badge in the Rewind community, helping members recognise the account.");
  await expect(hqHeroLead).toHaveCSS("height", "57.5938px");
  const hqFooterLogo = page.locator("footer img[alt='REWIND']");
  await expect(hqFooterLogo).toBeVisible();
  await expect.poll(() => hqFooterLogo.evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  const hqFooterLogoBox = await hqFooterLogo.boundingBox();
  expect(hqFooterLogoBox?.x).toBe(143);
  expect(hqFooterLogoBox?.y).toBeCloseTo(1228, 0);
  expect(hqFooterLogoBox?.width).toBe(184);
  expect(hqFooterLogoBox?.height).toBe(30);
  const hqFooterSocial = page.locator("footer > div").nth(1).locator("img");
  const hqFooterSocialBox = await hqFooterSocial.boundingBox();
  expect(hqFooterSocialBox?.x).toBeCloseTo(657.5, 1);
  expect(hqFooterSocialBox?.y).toBeCloseTo(1274, 0);
  expect(hqFooterSocialBox?.width).toBeCloseTo(125, 0);
  expect(hqFooterSocialBox?.height).toBeCloseTo(21.6094, 3);
  const hqFooterCopyright = page.locator("footer > div").nth(2);
  const hqFooterCopyrightBox = await hqFooterCopyright.boundingBox();
  expect(hqFooterCopyrightBox?.x).toBe(220);
  expect(hqFooterCopyrightBox?.y).toBeCloseTo(1315, 0);
  expect(hqFooterCopyrightBox?.width).toBe(1000);
  expect(hqFooterCopyrightBox?.height).toBe(18);
  await expect(hqFooterCopyright).toHaveCSS("text-align", "left");
  await expect(page.locator("footer > nav")).toBeHidden();
  const hqFooterLinkGeometry = await page.locator("footer > div:first-child nav a").evaluateAll(links => links.map(link => {
    const box = link.getBoundingClientRect();
    return { x: box.x, width: box.width };
  }));
  for (const [index, [x, width]] of [[508, 119], [710, 70], [863, 60], [1006, 80], [1169, 127]].entries()) {
    expect(Math.abs(hqFooterLinkGeometry[index].x - x), `HQ footer link ${index + 1} source x`).toBeLessThan(1.5);
    expect(hqFooterLinkGeometry[index].width, `HQ footer link ${index + 1} source width`).toBe(width);
  }
  const hqArticle = page.locator("main > article");
  const hqIntro = await hqArticle.locator('[class*="editorialIntro"] p').boundingBox();
  expect(hqIntro).toMatchObject({ x: 120, y: 713, width: 1126, height: 44 });
  const hqSection = hqArticle.locator('[class*="editorialSection"]');
  expect((await hqSection.boundingBox())?.y).toBe(836);
  expect((await hqSection.getByRole("heading", { level: 3 }).boundingBox())?.y).toBe(870);
  expect((await hqSection.locator("p").boundingBox())?.y).toBeCloseTo(920, 0);
  expect((await page.locator("footer").boundingBox())?.y).toBeCloseTo(1165, 0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(1430);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261126/hq-accounts/local-hq-accounts-en-desktop-1440.png"), fullPage: true });
});

test("READY Terms desktop geometry matches its Figma editorial frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/terms");
  await expect(page.locator("main > div[class*='hero'] h1")).toBeVisible();
  const sections = page.locator("main > article section");
  const measurements = {
    title: await page.locator("main > div[class*='hero'] h1").evaluate(node => node.getBoundingClientRect().toJSON()),
    headings: await Promise.all(Array.from({ length: 7 }, (_, i) => sections.nth(i).getByRole("heading", { level: 3 }).evaluate(node => node.getBoundingClientRect().toJSON()))),
    footer: await page.locator("footer").evaluate(node => node.getBoundingClientRect().toJSON()),
    pageHeight: await page.evaluate(() => document.documentElement.scrollHeight),
  };
  expect(measurements.title.y).toBe(280);
  expect(measurements.headings).toHaveLength(7);
  for (const [index, y] of [718, 846, 950, 1079, 1208, 1335, 1462].entries()) expect(Math.abs(measurements.headings[index].y - y)).toBeLessThan(2.5);
  expect(Math.abs(measurements.footer.y - 1565)).toBeLessThan(2.5);
  expect(measurements.pageHeight).toBe(1832);
});

test("READY Film Data desktop geometry matches its Figma editorial frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/film-data");
  const title = page.locator("main > div[class*='hero'] h1");
  await expect(title).toBeVisible();
  const intro = page.locator("main > article [class*='editorialIntro'] > p");
  const sections = page.locator("main > article [class*='editorialSection']");
  await expect(sections).toHaveCount(2);
  const first = sections.nth(0);
  const second = sections.nth(1);
  expect((await title.boundingBox())?.y).toBe(280);
  const introBox = await intro.boundingBox();
  expect(introBox).toMatchObject({ x: 120, y: 713, width: 1126 });
  expect(introBox?.height).toBeGreaterThan(44);
  expect(introBox?.height).toBeLessThan(45);
  expect((await first.getByRole("heading", { level: 3 }).boundingBox())?.y).toBeCloseTo(801, 0);
  expect((await first.locator("p").boundingBox())?.y).toBeCloseTo(835, 0);
  expect((await second.getByRole("heading", { level: 3 }).boundingBox())?.y).toBeCloseTo(923, 0);
  expect(Math.abs(((await second.locator("p").boundingBox())?.y ?? 0) - 957)).toBeLessThan(1);
  expect((await page.locator("footer").boundingBox())?.y).toBeCloseTo(1268, 0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(1533);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/service-pages/rewind-film-data-en-desktop-1440x1533.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(page.locator("main > article")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("READY Account Deletion desktop geometry matches its Figma editorial frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/delete-account");
  const title = page.locator("main > div[class*='hero'] h1");
  const sections = page.locator("main > article [class*='editorialSection']");
  await expect(title).toBeVisible();
  await expect(sections).toHaveCount(4);
  expect((await title.boundingBox())?.y).toBe(280);
  const headings = await Promise.all(Array.from({ length: 4 }, (_, index) => sections.nth(index).getByRole("heading", { level: 3 }).boundingBox()));
  const bodies = await Promise.all([0, 1, 2, 3].map(index => sections.nth(index).locator("p,ol").first().boundingBox()));
  for (const [index, y] of [713, 876, 1083, 1308].entries()) expect(Math.abs((headings[index]?.y ?? 0) - y)).toBeLessThan(2);
  for (const [index, y] of [763, 926, 1133, 1358].entries()) expect(Math.abs((bodies[index]?.y ?? 0) - y)).toBeLessThan(2);
  await expect(sections.nth(1).locator("ol li")).toHaveCount(4);
  const deletionLink = page.getByRole("link", { name: "Open account deletion form" });
  await expect(deletionLink).toHaveAttribute("href", /profile#profile-delete-form-title$/);
  expect(Math.abs(((await page.locator("footer").boundingBox())?.y ?? 0) - 1543)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(1808);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/service-pages/rewind-account-deletion-en-desktop-1440x1808.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("READY Safety Notice desktop geometry matches its Figma editorial frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/safety-notice");
  const title = page.locator("main > div[class*='hero'] h1");
  const sections = page.locator("main > article [class*='editorialSection']");
  await expect(title).toBeVisible();
  await expect(sections).toHaveCount(5);
  expect((await title.boundingBox())?.y).toBe(280);
  const headings = await Promise.all(Array.from({ length: 5 }, (_, index) => sections.nth(index).getByRole("heading", { level: 3 }).boundingBox()));
  const bodies = await Promise.all(Array.from({ length: 5 }, (_, index) => sections.nth(index).locator("p").boundingBox()));
  for (const [index, y] of [713, 819, 947, 1075, 1203].entries()) expect(Math.abs((headings[index]?.y ?? 0) - y)).toBeLessThan(2);
  for (const [index, y] of [747, 853, 981, 1109, 1237].entries()) expect(Math.abs((bodies[index]?.y ?? 0) - y)).toBeLessThan(2);
  expect(Math.abs(((await page.locator("footer").boundingBox())?.y ?? 0) - 1340)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(1605);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/service-pages/rewind-safety-notice-en-desktop-1440x1605.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("READY Conditions desktop geometry matches its Figma editorial frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/conditions");
  const title = page.locator("main > div[class*='hero'] h1");
  const sections = page.locator("main > article [class*='editorialSection']");
  await expect(title).toBeVisible();
  await expect(sections).toHaveCount(6);
  expect((await title.boundingBox())?.y).toBe(280);
  const headings = await Promise.all(Array.from({ length: 6 }, (_, index) => sections.nth(index).getByRole("heading", { level: 3 }).boundingBox()));
  const bodies = await Promise.all(Array.from({ length: 6 }, (_, index) => sections.nth(index).locator("p").boundingBox()));
  for (const [index, y] of [713, 876, 1038, 1200, 1363, 1507].entries()) expect(Math.abs((headings[index]?.y ?? 0) - y)).toBeLessThan(2);
  for (const [index, y] of [763, 926, 1088, 1250, 1413, 1557].entries()) expect(Math.abs((bodies[index]?.y ?? 0) - y)).toBeLessThan(2);
  expect(Math.abs(((await page.locator("footer").boundingBox())?.y ?? 0) - 1765)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(2030);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/service-pages/rewind-conditions-en-desktop-1440x2030.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("READY Rules of Use desktop geometry matches its Figma editorial frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/rules");
  const title = page.locator("main > div[class*='hero'] h1");
  const sections = page.locator("main > article [class*='editorialSection']");
  await expect(title).toBeVisible();
  await expect(sections).toHaveCount(9);
  expect((await title.boundingBox())?.y).toBe(280);
  const headings = await Promise.all(Array.from({ length: 9 }, (_, index) => sections.nth(index).getByRole("heading", { level: 3 }).boundingBox()));
  const bodies = await Promise.all(Array.from({ length: 9 }, (_, index) => sections.nth(index).locator("p,ol").first().boundingBox()));
  for (const [index, y] of [713, 876, 1039, 1202, 1343, 1545, 1686, 1827, 1968].entries()) expect(Math.abs((headings[index]?.y ?? 0) - y)).toBeLessThan(2);
  for (const [index, y] of [763, 926, 1089, 1252, 1393, 1595, 1736, 1877, 2018].entries()) expect(Math.abs((bodies[index]?.y ?? 0) - y)).toBeLessThan(2);
  await expect(sections.nth(4).locator("ol li")).toHaveCount(4);
  expect(Math.abs(((await page.locator("footer").boundingBox())?.y ?? 0) - 2204)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(2469);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/service-pages/rewind-rules-en-desktop-1440x2469.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("READY Privacy Policy desktop geometry matches its Figma editorial frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/privacy");
  const sections = page.locator("main > article [class*='editorialSection']");
  await expect(sections).toHaveCount(5);
  const headings = await Promise.all(Array.from({ length: 5 }, (_, index) => sections.nth(index).getByRole("heading", { level: 3 }).boundingBox()));
  const bodies = await Promise.all(Array.from({ length: 5 }, (_, index) => sections.nth(index).locator("p,ul").first().boundingBox()));
  const intro = await page.locator("main > article [class*='editorialIntro'] p").boundingBox();
  expect(Math.abs((intro?.y ?? 0) - 713)).toBeLessThan(2);
  for (const [index, y] of [801, 943, 1107, 1227, 1325].entries()) expect(Math.abs((headings[index]?.y ?? 0) - y)).toBeLessThan(2);
  for (const [index, y] of [835, 977, 1141, 1261, 1359].entries()) expect(Math.abs((bodies[index]?.y ?? 0) - y)).toBeLessThan(2);
  await expect(sections.nth(0).locator("ul li")).toHaveCount(3);
  await expect(sections.nth(1).locator("ul li")).toHaveCount(4);
  expect(Math.abs(((await page.locator("footer").boundingBox())?.y ?? 0) - 1757)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(2022);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/service-pages/rewind-privacy-en-desktop-1440x2022.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("READY Important Data desktop geometry matches its Figma editorial frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/important-data");
  const title = page.locator("main > div[class*='hero'] h1");
  const intro = page.locator("main > article [class*='editorialIntro'] p");
  const sections = page.locator("main > article [class*='editorialSection']");
  await expect(title).toBeVisible();
  await expect(sections).toHaveCount(2);
  expect((await title.boundingBox())?.y).toBe(280);
  const introBox = await intro.boundingBox();
  const headings = await Promise.all([0, 1].map(index => sections.nth(index).getByRole("heading", { level: 3 }).boundingBox()));
  const bodies = await Promise.all([0, 1].map(index => sections.nth(index).locator("p").boundingBox()));
  expect(Math.abs((introBox?.y ?? 0) - 713)).toBeLessThan(2);
  expect(Math.abs((introBox?.height ?? 0) - 67.2)).toBeLessThan(2);
  for (const [index, y] of [848, 1012].entries()) expect(Math.abs((headings[index]?.y ?? 0) - y)).toBeLessThan(2);
  for (const [index, y] of [898, 1062].entries()) expect(Math.abs((bodies[index]?.y ?? 0) - y)).toBeLessThan(2);
  expect(Math.abs(((await page.locator("footer").boundingBox())?.y ?? 0) - 1309)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(1574);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/service-pages/rewind-important-data-en-desktop-1440x1574.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("READY Frequent Questions desktop geometry matches its Figma editorial frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/faq");
  const title = page.locator("main > div[class*='hero'] h1");
  const sections = page.locator("main > article [class*='editorialSection']");
  const nav = page.locator("main > div[class*='hero'] nav");
  await expect(sections).toHaveCount(6);
  await expect(nav.locator("a")).toHaveCount(9);
  expect((await title.boundingBox())?.y).toBe(280);
  const navBox = await nav.boundingBox();
  expect(navBox?.x).toBe(120);
  expect(navBox?.y).toBe(176);
  expect(navBox?.width).toBe(278);
  expect((await nav.locator("a").first().boundingBox())?.y).toBe(230);
  const headings = await Promise.all(Array.from({ length: 6 }, (_, index) => sections.nth(index).getByRole("heading", { level: 3 }).boundingBox()));
  const bodies = await Promise.all(Array.from({ length: 6 }, (_, index) => sections.nth(index).locator("p").boundingBox()));
  for (const [index, y] of [713, 876, 1039, 1202, 1365, 1528].entries()) expect(Math.abs((headings[index]?.y ?? 0) - y)).toBeLessThan(2);
  for (const [index, y] of [763, 926, 1089, 1252, 1415, 1578].entries()) expect(Math.abs((bodies[index]?.y ?? 0) - y)).toBeLessThan(2);
  expect(Math.abs(((await page.locator("footer").boundingBox())?.y ?? 0) - 1786)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(2051);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/service-pages/rewind-faq-en-desktop-1440x2051.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("READY About Us desktop geometry matches its Figma editorial frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/en/about");
  const title = page.getByRole("heading", { level: 1, name: "About Us" });
  const sections = page.locator("main > article > div[class*='story'] > section");
  const nav = page.locator("main > div[class*='hero'] nav");
  await expect(title).toBeVisible();
  await expect(sections).toHaveCount(8);
  await expect(nav.locator("a")).toHaveCount(9);
  expect((await title.boundingBox())?.y).toBe(280);
  const headings = await Promise.all(Array.from({ length: 8 }, (_, index) => sections.nth(index).getByRole("heading", { level: 2 }).boundingBox()));
  const bodies = await Promise.all(Array.from({ length: 8 }, (_, index) => sections.nth(index).locator("p").boundingBox()));
  for (const [index, y] of [713, 912, 1133, 1332, 1548, 1747, 1946, 2145].entries()) expect(Math.abs((headings[index]?.y ?? 0) - y)).toBeLessThan(2);
  for (const [index, y] of [763, 962, 1183, 1382, 1598, 1797, 1996, 2195].entries()) expect(Math.abs((bodies[index]?.y ?? 0) - y)).toBeLessThan(2);
  expect(Math.abs(((await page.locator("footer").boundingBox())?.y ?? 0) - 2422)).toBeLessThan(2);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(2687);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/service-pages/rewind-about-en-desktop-1440x2687.png"), fullPage: true });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
});

test("admin shares the compact shell and keeps personal and platform metrics separate", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/users/me", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", role: "ADMIN", displayName: "Lola James",
    avatarUrl: "https://images.example.invalid/lola-james.png", isHq: true,
  } }));
  await page.route("https://images.example.invalid/lola-james.png", route => route.fulfill({ path: resolve(process.cwd(), "tests/e2e/fixtures/admin-user-profile-figma/lola-james.png"), contentType: "image/png" }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/admin/dashboard", route => route.fulfill({ json: { users: 12, activeUsers: 9, hqUsers: 2, movies: 40, reviews: 18, hiddenReviews: 1 } }));
  await page.route("**/api/admin/users**", route => route.fulfill({ json: { content: [{
    id: 900011, username: "profile-fixture", displayName: "Profile Fixture", email: "profile@example.invalid",
    role: "USER", avatarUrl: null, isActive: true, isHq: false,
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/users/900011", route => route.fulfill({ json: {
    id: 900011, username: "profile-fixture", displayName: "Profile Fixture", email: "profile@example.invalid",
    role: "USER", avatarUrl: null, isActive: true, isHq: false, createdAt: "2026-01-01T00:00:00Z",
  } }));
  await page.route("**/api/admin/users/900011/overview", route => route.fulfill({ json: {
    adminHistory: [{ id: 1, action: "SITE_SETTING_UPDATED", targetType: "SITE_SETTING", targetId: null, createdAt: "2026-01-01T00:00:00Z" }],
    stats: { watched: 74, reviews: 37, likesReceived: 145, comments: 64, customLists: 15 },
  } }));
  await page.route("**/api/admin/settings", route => route.fulfill({ json: [
    { key: "site_name", value: "Rewind", updatedBy: null, updatedAt: null },
    { key: "default_locale", value: "uk", updatedBy: null, updatedAt: null },
    { key: "maintenance_mode", value: "false", updatedBy: null, updatedAt: null },
    { key: "journal_enabled", value: "true", updatedBy: null, updatedAt: null },
  ] }));
  await page.route("**/api/admin/reviews**", route => route.fulfill({ json: { content: [{
    id: 900021, movieId: 77, movieTitle: "Review fixture", userId: 900011, username: "profile-fixture",
    content: "A Figma aligned review fixture.", rating: 4, isHidden: false, moderatedReason: null,
    moderatedAt: null, createdAt: "2026-01-01T00:00:00Z",
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/comments**", route => route.fulfill({ json: { content: [{
    id: 900022, reviewId: 900021, userId: 900011, username: "profile-fixture", content: "A Figma aligned comment fixture.",
    isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2026-01-01T00:00:00Z",
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/lists**", route => route.fulfill({ json: { content: [{
    id: 900023, userId: 900011, username: "profile-fixture", name: "Lists fixture", description: null,
    listType: "CUSTOM", isPublic: true, itemCount: 6, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", featuredPosition: null,
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/moderation/queue**", route => route.fulfill({ json: { content: [{
    type: "REVIEW", id: 900021, parentId: null, movieId: 77, subject: "Review fixture", userId: 900011,
    username: "profile-fixture", content: "Moderation fixture.", createdAt: "2026-01-01T00:00:00Z",
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/reported-reviews**", route => route.fulfill({ json: { content: [{
    id: 900021, movieId: 77, movieTitle: "Review fixture", userId: 900011, username: "review-author", email: "review@example.invalid",
    content: "Reported review fixture", rating: 4, isHidden: false, moderatedReason: null, moderatedAt: null,
    createdAt: "2026-01-01T00:00:00Z", reportId: 900031, reportReason: "SPAM", reportCreatedAt: "2026-01-02T00:00:00Z", likesCount: 1, commentsCount: 0,
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/reported-comments**", route => route.fulfill({ json: { content: [{
    id: 900022, reviewId: 900021, userId: 900012, username: "comment-author", email: "comment@example.invalid", content: "Reported comment fixture",
    isHidden: false, moderatedReason: null, moderatedAt: null, createdAt: "2026-01-01T00:00:00Z", reportId: 900032, reportReason: "BULLYING", reportCreatedAt: "2026-01-03T00:00:00Z",
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/reported-lists**", route => route.fulfill({ json: { content: [{
    id: 900023, userId: 900013, username: "list-author", email: "list@example.invalid", name: "Reported list fixture", description: null,
    listType: "CUSTOM", isPublic: true, itemCount: 2, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", featuredPosition: null,
    reportId: 900033, reportReason: "INAPPROPRIATE_CONTENT", reportCreatedAt: "2026-01-04T00:00:00Z", likeCount: 0,
  }], totalPages: 1, totalElements: 1 } }));
  await page.route("**/api/admin/audit-logs**", route => route.fulfill({ json: { content: [
    { id: 900024, adminId: 900030, action: "REVIEW_DELETED", targetType: "REVIEW", targetId: 1, metadata: null, createdAt: "2025-12-18T12:00:00Z" },
    { id: 900025, adminId: 900031, action: "USER_UPDATED", targetType: "USER", targetId: 2, metadata: null, createdAt: "2025-12-30T12:00:00Z" },
    { id: 900026, adminId: 900032, action: "USER_DEACTIVATED", targetType: "USER", targetId: 3, metadata: null, createdAt: "2025-12-17T12:00:00Z" },
  ], totalPages: 1, totalElements: 3 } }));
  await page.route("**/api/admin/activity**", route => route.fulfill({ json: {
    users: [
      { id: 900011, username: "profile-fixture", displayName: "Profile Fixture", email: "profile@example.invalid", followerCount: 12, isActive: true },
      { id: 900012, username: "blocked-fixture", displayName: "Blocked Fixture", email: "blocked@example.invalid", followerCount: 3, isActive: false },
      { id: 900013, username: "list-author", displayName: "List Author", email: "list@example.invalid", followerCount: 8, isActive: true },
      { id: 900014, username: "review-author", displayName: "Review Author", email: "review@example.invalid", followerCount: 5, isActive: true },
    ],
    metrics: { averageWatched: 245, averageReviews: 34, averageAllLists: 12, averageCustomLists: 7, averageSessionMinutes: null, averageWatchlist: 28 },
  } }));
  await page.route("**/api/admin/notifications**", route => route.fulfill({ json: { content: [
    { id: 900041, recipientId: 900011, actorId: 900012, type: "FOLLOW", createdAt: "2026-11-20T12:00:00Z", read: false },
    { id: 900042, recipientId: 900011, actorId: 900013, type: "REVIEW_LIKED", createdAt: "2026-11-19T12:00:00Z", read: true },
  ], totalPages: 1, totalElements: 2 } }));
  await page.route("**/api/admin/users?**", route => {
    const requestUrl = new URL(route.request().url());
    const query = (requestUrl.searchParams.get("q") ?? "").toLowerCase();
    const content = Array.from({ length: 14 }, (_, index) => ({
      id: 901000 + index, username: `activity-user-${index + 1}`, displayName: ["Petro Pushkash", "Kristian Eriksen", "Harry Maguire", "Ricardo Quaresma"][index % 4],
      email: `activity-user-${index + 1}@example.invalid`, role: "USER", avatarUrl: null, isActive: index !== 2, isHq: false,
      createdAt: "2026-01-01T00:00:00Z", followerCount: [15000, 260, 93, 1200, 340, 12, 350, 28000, 890, 223, 234000, 13, 7, 45][index],
    })).filter(item => !query || item.username.includes(query) || item.email.includes(query) || item.displayName.toLowerCase().includes(query));
    return route.fulfill({ json: { content, totalPages: 6, totalElements: query ? content.length : 84, number: Number(requestUrl.searchParams.get("page") ?? 0), size: Number(requestUrl.searchParams.get("size") ?? 50) } });
  });
  await page.route(/\/api\/admin\/users\/90003[0-2]$/, route => {
    const id = Number(new URL(route.request().url()).pathname.split("/").at(-1));
    const names = ["Liza Sample", "Sasha Sample", "Georgi Sample"];
    return route.fulfill({ json: {
      id, username: `moderator-${id}`, displayName: names[id - 900030], email: `moderator-${id}@example.invalid`,
      role: "ADMIN", avatarUrl: null, isActive: true, isHq: false, createdAt: "2025-01-01T00:00:00Z",
    } });
  });
  await page.route("**/api/admin/users/900010/overview", route => route.fulfill({ json: { stats: { watched: 8, customLists: 3, reviews: 4, likesReceived: 5, watchlist: 6 } } }));
  await page.route("**/api/users/900010/profile", route => route.fulfill({ json: {
    id: 900010, username: "admin-fixture", displayName: "Lola James", avatarUrl: null, hq: true,
    stats: { ratings: 2, reviews: 4, watched: 8, watchlist: 6, favorites: 3 },
    ratingDistribution: [{ rating: 2, count: 1 }, { rating: 4, count: 1 }], socialLinks: [], lists: [], recentReviews: [],
  } }));
  await page.goto("/uk/admin");
  const hero = page.locator('main > header');
  await expect(hero).toHaveCSS("min-height", "390px");
  const avatar = await hero.locator('[class*="avatar"]').boundingBox();
  expect(avatar?.width).toBe(80);
  const heroBox = await hero.boundingBox();
  expect(heroBox!.height).toBeLessThanOrEqual(500);
  const navigation = hero.getByRole("navigation");
  await expect(navigation.getByRole("link")).toHaveCount(12);
  const personal = page.locator('section[aria-labelledby="admin-personal-metrics"]');
  await expect(personal.getByText("Створені списки", { exact: true })).toHaveCount(1);
  const platformDisclosure = page.locator("main details");
  await expect(platformDisclosure).not.toHaveAttribute("open", "");
  await platformDisclosure.locator("summary").click();
  const platform = page.getByRole("region", { name: "Статистика платформи" });
  await expect(platform.locator('[class*="summaryCard"]')).toHaveCount(6);
  expect((await platform.boundingBox())?.width).toBe(1200);
  for (const view of ["users", "reviews", "comments", "lists", "moderation", "logs", "settings"]) {
    const link = navigation.locator(`a[href="/uk/admin?view=${view}"]`);
    const label = await link.getAttribute("aria-label");
    await link.click();
    await expect(link).toHaveAttribute("aria-current", "page");
    // Current READY Admin content screens use their own heading. The shared
    // shell title is intentionally reserved for Dashboard to avoid duplication.
    await expect(page.locator('main > h2')).toHaveCount(0);
    await expect(page.locator('main > section').first()).toBeVisible();
    const section = await page.locator('main > section').first().boundingBox();
    if (view === "moderation" || view === "logs") {
      expect(section?.x).toBe(0);
      expect(section?.width).toBe(1440);
    } else {
      expect(section?.x).toBeCloseTo(120, 0);
      expect(section?.width).toBe(1200);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  }
  await page.goto("/en/admin?view=settings");
  await expect(page.locator('main[aria-busy="false"]')).toBeVisible();
  await expect(page.locator("#admin-dashboard-title")).toHaveText("Lola James");
  const heroPortrait = page.locator('main > header [class*="avatar"] img');
  await expect(heroPortrait).toHaveAttribute("src", "https://images.example.invalid/lola-james.png");
  await expect.poll(() => heroPortrait.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
  const settings = page.locator('section[aria-labelledby="admin-settings-title"]');
  await expect(settings.locator('input, select')).toHaveCount(4);
  await page.setViewportSize({ width: 1440, height: 2378 });
  const adminSettingsGeometry = {
    hero: await page.locator('main > header').boundingBox(),
    avatar: await page.locator('main > header [class*="avatar"]').boundingBox(),
    profileTitle: await page.locator('main > header h1').boundingBox(),
    title: await page.getByRole("heading", { level: 2, name: "General Settings" }).boundingBox(),
    navigation: await page.locator('main > header nav').boundingBox(),
    workspace: await page.locator('[class*="settingsWorkspace"]').boundingBox(),
    footer: await page.locator("footer").boundingBox(),
    pageHeight: await page.evaluate(() => document.documentElement.scrollHeight),
  };
  expect(adminSettingsGeometry.hero?.height).toBe(1020);
  expect(adminSettingsGeometry.avatar).toMatchObject({ x: 580, y: 294, width: 280, height: 280 });
  expect(adminSettingsGeometry.profileTitle?.y).toBeCloseTo(590, 0);
  expect(adminSettingsGeometry.title?.y).toBeCloseTo(1081, 0);
  expect(adminSettingsGeometry.navigation?.y).toBeCloseTo(775, 0);
  expect(adminSettingsGeometry.workspace).toMatchObject({ x: 120, width: 1200, height: 734 });
  expect(adminSettingsGeometry.workspace?.y).toBeCloseTo(1219, 0);
  expect(adminSettingsGeometry.footer?.y).toBeCloseTo(2113, 0);
  expect(adminSettingsGeometry.pageHeight).toBe(2378);
  await expect(page.locator('main > header nav a:visible')).toHaveCount(9);
  const captureDirectory = resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-settings");
  await mkdir(captureDirectory, { recursive: true });
  await page.screenshot({ path: resolve(captureDirectory, "rewind-settings-en-desktop-1440x2378.png"), fullPage: false });

  await page.goto("/en/admin?view=moderator-logs");
  const logs = page.locator('section[aria-label="Moderator Logs"]');
  await expect(logs).toHaveAttribute("aria-busy", "false");
  await expect(logs.locator('[class*="auditRow"]')).toHaveCount(3);
  await page.setViewportSize({ width: 1440, height: 2749 });
  const logCards = logs.locator('[class*="auditRow"]');
  const logGeometry = {
    hero: await page.locator('main > header').boundingBox(),
    heading: await logs.getByRole("heading", { level: 2 }).boundingBox(),
    cards: await Promise.all([0, 1, 2].map(index => logCards.nth(index).boundingBox())),
    footer: await page.locator("footer").boundingBox(),
    pageHeight: await page.evaluate(() => document.documentElement.scrollHeight),
  };
  expect(logGeometry.hero?.height).toBe(1020);
  expect(logGeometry.heading?.y).toBeCloseTo(1073, 0);
  for (const [index, y] of [1219, 1653, 2031].entries()) expect(Math.abs((logGeometry.cards[index]?.y ?? 0) - y)).toBeLessThan(3);
  for (const [index, height] of [348, 293, 293].entries()) expect(Math.abs((logGeometry.cards[index]?.height ?? 0) - height)).toBeLessThan(2);
  expect(logGeometry.footer?.y).toBeCloseTo(2482, 0);
  expect(logGeometry.pageHeight).toBe(2749);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-settings/rewind-moderator-logs-en-desktop-1440x2749.png"), fullPage: false });

  await page.goto("/en/admin?view=logs");
  const activity = page.locator('main > section[aria-label="Activity List"]');
  await expect(activity.getByRole("row")).toHaveCount(5);
  await expect(activity.locator('[class*="metricCard"]')).toHaveCount(6);
  await page.setViewportSize({ width: 1440, height: 3111 });
  const activityGeometry = {
    hero: await page.locator('main > header').boundingBox(),
    workspace: await activity.boundingBox(),
    title: await activity.getByRole("heading", { level: 2 }).boundingBox(),
    users: await activity.locator('[class*="usersPanel"]').boundingBox(),
    notifications: await activity.locator('[class*="notificationsPanel"]').boundingBox(),
    metrics: await activity.locator('[class*="metricsPanel"]').boundingBox(),
    footer: await page.locator("footer").boundingBox(),
    pageHeight: await page.evaluate(() => document.documentElement.scrollHeight),
  };
  expect(activityGeometry.hero?.height).toBe(1020);
  expect(activityGeometry.workspace?.x).toBe(0);
  expect(activityGeometry.workspace?.width).toBe(1440);
  expect(activityGeometry.title?.y).toBeCloseTo(1073, 0);
  expect(activityGeometry.users?.x).toBe(120);
  expect(activityGeometry.users?.y).toBeCloseTo(1219, 0);
  expect(activityGeometry.users?.width).toBe(1200);
  expect(activityGeometry.notifications?.y).toBeCloseTo(1689, 0);
  expect(activityGeometry.notifications?.height).toBe(305);
  expect(activityGeometry.metrics?.y).toBeCloseTo(2079, 0);
  expect(activityGeometry.metrics?.height).toBe(607);
  expect(activityGeometry.footer?.y).toBeCloseTo(2846, 0);
  expect(activityGeometry.pageHeight).toBe(3111);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-activity/rewind-admin-activity-en-desktop-1440x3111.png"), fullPage: false });
  await activity.getByRole("link", { name: "More users" }).click();
  await expect(page).toHaveURL(/view=more-users/);
  const moreUsers = page.locator('main > section[aria-label="Users"]');
  await expect(moreUsers.getByRole("row")).toHaveCount(15);
  await expect(moreUsers.getByRole("navigation", { name: "User pages" })).toBeVisible();
  const userSearch = moreUsers.getByRole("searchbox");
  await userSearch.fill("activity-user-2");
  await moreUsers.getByRole("button", { name: "Search" }).click();
  await expect(moreUsers.getByRole("row")).toHaveCount(2);
  await userSearch.fill("");
  await moreUsers.getByRole("button", { name: "Search" }).click();
  await expect(moreUsers.getByRole("row")).toHaveCount(15);
  await page.setViewportSize({ width: 1440, height: 2720 });
  const moreUsersGeometry = {
    hero: await page.locator('main > header').boundingBox(),
    title: await moreUsers.getByRole("heading", { level: 2 }).boundingBox(),
    search: await moreUsers.getByRole("searchbox").boundingBox(),
    table: await moreUsers.locator('[class*="activityTableRail"]').boundingBox(),
    footer: await page.locator("footer").boundingBox(),
    pageHeight: await page.evaluate(() => document.documentElement.scrollHeight),
  };
  expect(moreUsersGeometry.hero?.height).toBe(1020);
  expect(moreUsersGeometry.title?.y).toBeCloseTo(1073, 0);
  expect(moreUsersGeometry.search?.y).toBeCloseTo(1219, 0);
  expect(moreUsersGeometry.table?.x).toBe(120);
  expect(moreUsersGeometry.table?.y).toBeCloseTo(1295, 0);
  expect(moreUsersGeometry.table?.width).toBe(1200);
  expect(moreUsersGeometry.pageHeight).toBe(2720);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-activity/rewind-more-users-en-desktop-1440x2720.png"), fullPage: false });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);

  await page.goto("/en/admin?view=moderation");
  const moderation = page.locator('section[aria-label="List of Content for Moderation"]');
  await expect(moderation).toHaveAttribute("aria-busy", "false");
  await expect(moderation.getByRole("row")).toHaveCount(4);
  await page.setViewportSize({ width: 1440, height: 2171 });
  const moderationGeometry = {
    hero: await page.locator('main > header').boundingBox(),
    heading: await moderation.getByRole("heading", { level: 2 }).boundingBox(),
    workspace: await moderation.boundingBox(),
    footer: await page.locator("footer").boundingBox(),
    pageHeight: await page.evaluate(() => document.documentElement.scrollHeight),
  };
  expect(moderationGeometry.hero?.height).toBe(1020);
  expect(moderationGeometry.heading?.y).toBeCloseTo(1073, 0);
  expect(moderationGeometry.workspace?.x).toBe(0);
  expect(moderationGeometry.workspace?.width).toBe(1440);
  expect(moderationGeometry.workspace?.height).toBe(873);
  expect(moderationGeometry.footer?.y).toBe(1893);
  expect(moderationGeometry.pageHeight).toBe(2171);
  await page.screenshot({ path: resolve(process.cwd(), "../artifacts/visual-audit-20261124/admin-moderation/rewind-moderation-en-desktop-1440x2171.png"), fullPage: false });
  await page.setViewportSize({ width: 393, height: 852 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await expect(moderation.getByRole("row").filter({ hasText: "review-author" })).toBeVisible();
});
