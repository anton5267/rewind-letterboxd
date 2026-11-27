import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const frames = [
  ["uk", "help", 2856, 2653], ["uk", "hq-accounts", 1531, 1328], ["uk", "important-data", 1272, 1069],
  ["uk", "contact", 1402, 1199], ["uk", "film-data", 1122, 919], ["uk", "faq", 1865, 1662],
  ["uk", "conditions", 1626, 1423], ["uk", "rules", 2083, 1880], ["uk", "safety-notice", 1384, 1181],
  ["uk", "terms", 1654, 1451], ["uk", "delete-account", 1495, 1289],
  ["en", "help", 2583, 2377], ["en", "hq-accounts", 1487, 1281], ["en", "important-data", 1247, 1041],
  ["en", "contact", 1356, 1153], ["en", "film-data", 1102, 899], ["en", "faq", 1730, 1524],
  ["en", "conditions", 1583, 1377], ["en", "rules", 1984, 1778], ["en", "safety-notice", 1303, 1100],
  ["en", "terms", 1570, 1367], ["en", "delete-account", 1453, 1247],
] as const;

for (const [locale, route, frameHeight, footerY] of frames) {
  test(`${locale}/${route} mobile service layout renders without overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 393, height: frameHeight });
    const captureDir = resolve(process.cwd(), "../artifacts/visual-audit-20261125/service-mobile");
    await mkdir(captureDir, { recursive: true });
    await page.goto(`/${locale}/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${locale}/${route} horizontal overflow`).toBeLessThanOrEqual(393);
    if (route === "hq-accounts") {
      const expectedHeadingY = locale === "uk" ? [552, 714, 876, 1061, 1223] : [536, 699, 840, 1003, 1166];
      const headings = page.locator("main article section h3");
      await expect(headings).toHaveCount(5);
      for (const [index, y] of expectedHeadingY.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} HQ section ${index + 1}`).toBeLessThan(2);
    }
    await page.screenshot({ path: resolve(captureDir, `rewind-${route}-${locale}-mobile-393x${frameHeight}.png`) });
    const footer = page.locator("footer");
    const actualFooterY = (await footer.boundingBox())?.y ?? 0;
    console.log(`${locale}/${route} footer y=${actualFooterY.toFixed(1)}, Figma y=${footerY}`);
    if (["hq-accounts", "film-data", "important-data", "contact", "faq", "conditions", "safety-notice"].includes(route)) expect(Math.abs(actualFooterY - footerY), `${locale}/${route} Figma footer position`).toBeLessThan(2);
    if (route === "film-data") {
      const intro = page.locator('main article [class*="editorialIntro"] p').first();
      const headings = page.locator('main article section[class*="editorialSection"] h3');
      const bodies = page.locator('main article section[class*="editorialSection"] p');
      const expected = locale === "uk" ? { intro: 552, headings: [661, 796], bodies: [690, 825] } : { intro: 536, headings: [649, 789], bodies: [678, 818] };
      expect(Math.abs(((await intro.boundingBox())?.y ?? 0) - expected.intro), `${locale} Film Data intro`).toBeLessThan(2);
      await expect(headings).toHaveCount(2);
      for (const [index, y] of expected.headings.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Film Data heading ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.bodies.entries()) expect(Math.abs(((await bodies.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Film Data body ${index + 1}`).toBeLessThan(2);
    }
    if (route === "important-data") {
      const intro = page.locator('main article [class*="editorialIntro"] p').first();
      const headings = page.locator('main article [class*="editorialSection"] h3');
      const bodies = page.locator('main article [class*="editorialSection"] p');
      const expected = locale === "uk" ? { intro: 552, headings: [711, 896], bodies: [745, 930] } : { intro: 536, headings: [695, 881], bodies: [727, 913] };
      expect(Math.abs(((await intro.boundingBox())?.y ?? 0) - expected.intro), `${locale} Important Data intro`).toBeLessThan(2);
      await expect(headings).toHaveCount(2);
      for (const [index, y] of expected.headings.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Important Data heading ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.bodies.entries()) expect(Math.abs(((await bodies.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Important Data body ${index + 1}`).toBeLessThan(2);
    }
    if (route === "contact") {
      const intro = page.locator('main article [class*="editorialIntro"] > p').first();
      const email = page.locator('main article [class*="contactAvailability"]');
      const headings = page.locator('main article [class*="editorialSection"] h3');
      const sections = page.locator('main article [class*="editorialSection"]');
      const closing = page.locator('main article [class*="contactClosing"]');
      const expected = locale === "uk"
        ? { intro: 552, email: 687, headings: [734, 896, 1033], listStarts: [763, 925, 1062], closing: 1127 }
        : { intro: 536, email: 673, headings: [720, 881, 1009], listStarts: [747, 908, 1036], closing: 1101 };
      expect(Math.abs(((await intro.boundingBox())?.y ?? 0) - expected.intro), `${locale} Contact intro`).toBeLessThan(2);
      expect(Math.abs(((await email.boundingBox())?.y ?? 0) - expected.email), `${locale} Contact email`).toBeLessThan(2);
      await expect(headings).toHaveCount(3);
      for (const [index, y] of expected.headings.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Contact section ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.listStarts.entries()) expect(Math.abs(((await sections.nth(index).locator("li").first().boundingBox())?.y ?? 0) - y), `${locale} Contact list ${index + 1}`).toBeLessThan(3);
      expect(Math.abs(((await closing.boundingBox())?.y ?? 0) - expected.closing), `${locale} Contact closing`).toBeLessThan(2);
    }
    if (route === "faq") {
      const headings = page.locator('main article [class*="editorialSection"] h3');
      const bodies = page.locator('main article [class*="editorialSection"] > p');
      const expected = locale === "uk"
        ? { headings: [575, 747, 942, 1114, 1309, 1504], bodies: [615, 787, 982, 1154, 1349, 1544] }
        : { headings: [536, 708, 880, 1028, 1200, 1396], bodies: [576, 748, 920, 1068, 1264, 1436] };
      await expect(headings).toHaveCount(6);
      await expect(bodies).toHaveCount(6);
      for (const [index, y] of expected.headings.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} FAQ heading ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.bodies.entries()) expect(Math.abs(((await bodies.nth(index).boundingBox())?.y ?? 0) - y), `${locale} FAQ answer ${index + 1}`).toBeLessThan(2);
    }
    if (route === "conditions") {
      const headings = page.locator('main article [class*="editorialSection"] h3');
      const bodies = page.locator('main article [class*="editorialSection"] > p');
      const expected = locale === "uk"
        ? { headings: [552, 669, 831, 993, 1155, 1295], bodies: [586, 703, 865, 1027, 1189, 1329] }
        : { headings: [536, 654, 817, 958, 1121, 1262], bodies: [568, 686, 849, 990, 1153, 1294] };
      await expect(headings).toHaveCount(6);
      await expect(bodies).toHaveCount(6);
      for (const [index, y] of expected.headings.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Conditions heading ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.bodies.entries()) expect(Math.abs(((await bodies.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Conditions text ${index + 1}`).toBeLessThan(2);
    }
    if (route === "safety-notice") {
      const headings = page.locator('main article [class*="editorialSection"] h3');
      const bodies = page.locator('main article [class*="editorialSection"] > p');
      const expected = locale === "uk"
        ? { headings: [552, 670, 805, 940, 1075], bodies: [581, 699, 834, 969, 1104] }
        : { headings: [536, 634, 766, 881, 996], bodies: [565, 663, 795, 910, 1025] };
      await expect(headings).toHaveCount(expected.headings.length);
      await expect(bodies).toHaveCount(expected.bodies.length);
      for (const [index, y] of expected.headings.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Safety Notice heading ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.bodies.entries()) expect(Math.abs(((await bodies.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Safety Notice text ${index + 1}`).toBeLessThan(2);
    }
    if (route === "help") {
      const headings = page.locator('main article [class*="helpStep"] h3, main article [class*="helpGuide"] h3');
      const bodies = page.locator('main article [class*="helpStep"] p, main article [class*="helpGuide"] p');
      const actions = page.locator('main article [class*="helpStep"] a, main article [class*="helpGuide"] a');
      const expected = locale === "uk"
        ? { headings: [552, 807, 1039, 1273, 1505, 1715, 1947, 2202, 2434], bodies: [584, 839, 1095, 1305, 1537, 1747, 1979, 2234, 2466], actions: [748, 980, 1214, 1446, 1656, 1888, 2143, 2375, 2607] }
        : { headings: [536, 746, 956, 1166, 1376, 1586, 1773, 1983, 2193], bodies: [568, 778, 988, 1198, 1408, 1618, 1805, 2015, 2225], actions: [687, 897, 1107, 1317, 1527, 1714, 1924, 2134, 2321] };
      await expect(headings).toHaveCount(9);
      await expect(bodies).toHaveCount(9);
      await expect(actions).toHaveCount(9);
      for (const [index, y] of expected.headings.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Help heading ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.bodies.entries()) expect(Math.abs(((await bodies.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Help text ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.actions.entries()) expect(Math.abs(((await actions.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Help action ${index + 1}`).toBeLessThan(2);
      expect(Math.abs(actualFooterY - footerY), `${locale} Help footer position`).toBeLessThan(2);
    }
    if (route === "rules") {
      const headings = page.locator('main article [class*="editorialSection"] h3');
      const bodies = page.locator('main article [class*="editorialSection"] > :is(p, ol)');
      const expected = locale === "uk"
        ? { headings: [588, 728, 868, 1008, 1148, 1378, 1495, 1635, 1752], bodies: [622, 762, 902, 1042, 1182, 1412, 1529, 1669, 1786] }
        : { headings: [536, 677, 818, 959, 1100, 1286, 1404, 1545, 1663], bodies: [568, 709, 850, 991, 1132, 1318, 1436, 1577, 1695] };
      await expect(headings).toHaveCount(9);
      await expect(bodies).toHaveCount(9);
      for (const [index, y] of expected.headings.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Rules heading ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.bodies.entries()) expect(Math.abs(((await bodies.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Rules body ${index + 1}`).toBeLessThan(2);
      expect(Math.abs(actualFooterY - footerY), `${locale} Rules footer position`).toBeLessThan(2);
    }
    if (route === "terms") {
      const headings = page.locator('main article [class*="editorialSection"] h3');
      const bodies = page.locator('main article [class*="editorialSection"] > p');
      const expected = locale === "uk"
        ? { headings: [552, 687, 805, 957, 1075, 1193, 1345], bodies: [581, 716, 834, 986, 1104, 1222, 1374] }
        : { headings: [536, 654, 772, 907, 1025, 1143, 1261], bodies: [565, 683, 801, 936, 1054, 1172, 1290] };
      await expect(headings).toHaveCount(7);
      await expect(bodies).toHaveCount(7);
      for (const [index, y] of expected.headings.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Terms heading ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.bodies.entries()) expect(Math.abs(((await bodies.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Terms body ${index + 1}`).toBeLessThan(2);
      expect(Math.abs(actualFooterY - footerY), `${locale} Terms footer position`).toBeLessThan(2);
    }
    if (route === "delete-account") {
      const headings = page.locator('main article [class*="editorialSection"] h3');
      const bodies = page.locator('main article [class*="editorialSection"] > :is(p, ol)');
      const cta = page.locator('main article [class*="deletionLink"]');
      const expected = locale === "uk"
        ? { headings: [536, 699, 940, 1141], bodies: [568, 731, 972, 1173], cta: 1052 }
        : { headings: [536, 677, 908, 1109], bodies: [568, 709, 940, 1141], cta: 1020 };
      await expect(headings).toHaveCount(4);
      await expect(bodies).toHaveCount(4);
      for (const [index, y] of expected.headings.entries()) expect(Math.abs(((await headings.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Account Deletion heading ${index + 1}`).toBeLessThan(2);
      for (const [index, y] of expected.bodies.entries()) expect(Math.abs(((await bodies.nth(index).boundingBox())?.y ?? 0) - y), `${locale} Account Deletion body ${index + 1}`).toBeLessThan(2);
      expect(Math.abs(((await cta.boundingBox())?.y ?? 0) - expected.cta), `${locale} Account Deletion form CTA`).toBeLessThan(2);
      expect(Math.abs(actualFooterY - footerY), `${locale} Account Deletion footer position`).toBeLessThan(2);
    }
    const mobileNavigation = page.locator(`header nav[aria-label="${locale === "uk" ? "Головна навігація" : "Main navigation"}"]`).nth(1);
    expect((await mobileNavigation.boundingBox())?.y, `${locale}/${route} fixed mobile navigation`).toBe(frameHeight - 92);
    expect((await mobileNavigation.boundingBox())?.height, `${locale}/${route} mobile navigation height`).toBe(92);
    await page.setViewportSize({ width: 320, height: 852 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${locale}/${route} narrow phone overflow`).toBeLessThanOrEqual(320);
  });
}
