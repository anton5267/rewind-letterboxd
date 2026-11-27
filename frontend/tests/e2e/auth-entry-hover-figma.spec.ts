import { expect, test } from "@playwright/test";

test("READY desktop auth-entry CTAs reproduce their Figma hover states without moving", async ({ page }) => {
  await page.route("**/api/users/me", route => route.fulfill({ status: 401, json: {} }));
  await page.route("**/api/auth/refresh", route => route.fulfill({ status: 401, json: {} }));
  await page.setViewportSize({ width: 1440, height: 1614 });
  await page.goto("/en/auth");

  const cases = [
    { label: "Create Account", y: 919, backingY: 936, backingHeight: 72 },
    { label: "Log In", y: 1023, backingY: 1050, backingHeight: 62 },
  ];

  for (const item of cases) {
    const action = page.getByRole("link", { name: item.label });
    const label = action.getByText(item.label);
    const face = action.locator('[data-auth-entry-layer="face"]');
    const backing = action.locator('[data-auth-entry-layer="backing"]');

    await expect(action).toHaveAttribute("href", item.label === "Log In" ? "/en/login" : "/en/register");
    await expect(label).toHaveCSS("color", "rgb(126, 126, 126)");
    await expect(face).toHaveCSS("backdrop-filter", "blur(40px)");
    await expect(backing).toHaveCSS("background-color", "rgb(34, 34, 34)");
    await expect(backing).toHaveCSS("filter", "blur(40px)");
    await expect.poll(() => face.evaluate(node => getComputedStyle(node).getPropertyValue("--auth-entry-border-alpha").trim())).toBe("0.1");
    await expect(face).toHaveCSS("transition-duration", "0.3s");
    await expect(face).toHaveCSS("transition-timing-function", "ease-out");

    const actionBox = await action.boundingBox();
    const faceBox = await face.boundingBox();
    const backingBox = await backing.boundingBox();
    expect(Math.abs((actionBox?.x ?? 0) - 406)).toBeLessThanOrEqual(1);
    expect(Math.abs((actionBox?.y ?? 0) - item.y)).toBeLessThanOrEqual(1);
    expect(actionBox?.width).toBe(627);
    expect(actionBox?.height).toBe(89);
    expect(Math.abs((faceBox?.x ?? 0) - 406)).toBeLessThanOrEqual(1);
    expect(Math.abs((faceBox?.y ?? 0) - item.y)).toBeLessThanOrEqual(1);
    expect(faceBox?.width).toBe(627);
    expect(faceBox?.height).toBe(72);
    expect(Math.abs((backingBox?.x ?? 0) - 406)).toBeLessThanOrEqual(1);
    expect(Math.abs((backingBox?.y ?? 0) - item.backingY)).toBeLessThanOrEqual(1);
    expect(backingBox?.width).toBe(627);
    expect(backingBox?.height).toBe(item.backingHeight);

    await action.hover();
    await expect(label).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(backing).toHaveCSS("background-color", "rgb(53, 53, 53)");
    await expect.poll(() => face.evaluate(node => getComputedStyle(node).getPropertyValue("--auth-entry-border-alpha").trim())).toBe("0.25");
    const hoveredBox = await action.boundingBox();
    expect(Math.abs((hoveredBox?.y ?? 0) - item.y)).toBeLessThanOrEqual(1);
  }
});
