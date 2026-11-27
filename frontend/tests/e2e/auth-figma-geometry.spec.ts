import { expect, test } from "@playwright/test";

const near = (actual: number, expected: number, tolerance = 4) => expect(Math.abs(actual - expected)).toBeLessThan(tolerance);

test("auth entry and mobile forms match their Figma anchors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  for (const [route, height] of [["auth", 852], ["register", 852], ["login", 852], ["forgot-password", 874]] as const) {
    await page.setViewportSize({ width: 393, height });
    await page.goto(`/en/${route}`);
    const main = page.locator("main[data-rewind-auth-page]");
    await expect(main).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(393);
    if (route === "auth") {
      const logo = await main.locator("[class*='mobileLogo'] img").boundingBox();
      const create = await main.getByRole("link", { name: "Create Account" }).boundingBox();
      const login = await main.getByRole("link", { name: "Log In" }).boundingBox();
      near(logo?.y ?? 0, 295); near(create?.y ?? 0, 428); near(login?.y ?? 0, 502);
    } else {
      const heading = await main.getByRole("heading", { level: 1 }).boundingBox();
      const inputs = await main.locator("input").evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
      const submit = await main.locator('button[type="submit"]').boundingBox();
      if (route === "register") {
        const accountPrompt = await main.locator("[class*='footer']").boundingBox();
        near(heading?.y ?? 0, 101);
        for (const [index, y] of [290, 364, 438].entries()) near(inputs[index]?.y ?? 0, y);
        near(submit?.y ?? 0, 538, 8);
        near(accountPrompt?.y ?? 0, 650, 4);
        await expect(main.locator("input").nth(0)).toHaveAttribute("placeholder", "Enter username");
        await expect(main.locator("input").nth(1)).toHaveAttribute("placeholder", "Enter email");
        await expect(main.getByRole("button", { name: "Create Account" })).toBeVisible();
      } else if (route === "login") {
        near(heading?.y ?? 0, 169);
        near(inputs[0]?.y ?? 0, 364, 8); near(inputs[1]?.y ?? 0, 438, 8);
        near(submit?.y ?? 0, 538, 8);
        await expect(main.locator("input").first()).toHaveAttribute("placeholder", "Enter email");
      } else {
        near(heading?.y ?? 0, 360);
        near(inputs[0]?.y ?? 0, 498); near(submit?.y ?? 0, 575);
        near((await main.getByRole("link", { name: "Create new account" }).boundingBox())?.y ?? 0, 762);
        await expect(main.locator("input").first()).toHaveAttribute("placeholder", "Enter email");
      }
    }
    await page.screenshot({ path: `../artifacts/visual-audit-20261124/auth/rewind-${route}-en-mobile-393.png`, fullPage: true });
  }
});

test("auth shells and implementation-created desktop registration match their design anchors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  for (const route of ["auth", "register", "login", "forgot-password"]) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/en/${route}`);
    const main = page.locator("main[data-rewind-auth-page]");
    await expect(main).toBeVisible();
    const metrics = await page.evaluate(() => {
      const box = (node: Element | null) => node?.getBoundingClientRect().toJSON() ?? null;
      return { title: box(document.querySelector("main h1")), inputs: Array.from(document.querySelectorAll("main input")).map(box), button: box(document.querySelector('main button[type="submit"]')), card: box(document.querySelector("main section, main > div[class*='card']")), footer: box(document.querySelector("footer")), pageHeight: document.documentElement.scrollHeight };
    });
    if (route === "auth") {
      near(metrics.card?.x ?? 0, 121); near(metrics.card?.y ?? 0, 316);
      near(metrics.card?.width ?? 0, 1198); near(metrics.card?.height ?? 0, 873);
      expect(metrics.pageHeight).toBe(1614);
    } else if (route === "register") {
      near(metrics.title?.y ?? 0, 410);
      for (const [index, y] of [508, 616, 724].entries()) near(metrics.inputs[index]?.y ?? 0, y);
      near(metrics.button?.y ?? 0, 895); near(metrics.button?.height ?? 0, 89);
      near(metrics.card?.height ?? 0, 1011); expect(metrics.pageHeight).toBe(1752);
    } else if (route === "forgot-password") {
      near(metrics.title?.y ?? 0, 576);
      near(metrics.inputs[0]?.y ?? 0, 740);
      near(metrics.button?.y ?? 0, 867); near(metrics.button?.height ?? 0, 89);
      near(metrics.card?.height ?? 0, 873.375); expect(metrics.pageHeight).toBe(1614);
    } else {
      for (const [index, y] of [508, 616].entries()) near(metrics.inputs[index]?.y ?? 0, y);
      const loginStyles = await page.evaluate(() => {
        const email = document.querySelector("#login-email")!;
        const submit = document.querySelector('main button[type="submit"]')!;
        const prompt = document.querySelector('main p[class*="footer"]')!;
        const emailStyle = getComputedStyle(email);
        const submitStyle = getComputedStyle(submit);
        const promptStyle = getComputedStyle(prompt);
        return { emailFontSize: emailStyle.fontSize, emailBlur: emailStyle.backdropFilter, emailBorder: emailStyle.backgroundImage, emailShadow: emailStyle.boxShadow,
          submitFontSize: submitStyle.fontSize, submitColor: submitStyle.color, submitShadow: submitStyle.boxShadow,
          promptFontSize: promptStyle.fontSize };
      });
      const accountPrompt = await page.locator('main p[class*="footer"]').boundingBox();
      near(accountPrompt?.x ?? 0, 554);
      near(accountPrompt?.y ?? 0, 931);
      near(accountPrompt?.width ?? 0, 356);
      near(accountPrompt?.height ?? 0, 29);
      near(metrics.button?.y ?? 0, 787);
      near(metrics.button?.height ?? 0, 72);
      expect(loginStyles.emailFontSize).toBe("20px");
      expect(loginStyles.emailBlur).toContain("40px");
      expect(loginStyles.emailBorder).toContain("rgba(180, 180, 182, 0.1)");
      expect(loginStyles.emailShadow).toContain("22px 40px");
      expect(loginStyles.submitFontSize).toBe("24px");
      expect(loginStyles.submitColor).toBe("rgb(126, 126, 126)");
      expect(loginStyles.submitShadow).toContain("27px 40px");
      expect(loginStyles.promptFontSize).toBe("24px");
      await expect(page.locator('footer nav[aria-label*="information" i]')).toBeHidden();
    }
    await page.screenshot({ path: `../artifacts/visual-audit-20261127/auth-register-implementation/rewind-${route}-en-desktop-1440.png`, fullPage: true });
  }
});
