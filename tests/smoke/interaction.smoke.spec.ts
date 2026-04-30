import { expect, test } from "@playwright/test";
import { ROUTES } from "../../src/app/routes";
import { attachRuntimeHealthCapture } from "./helpers/runtime-health";

test.describe("interaction smoke", () => {
  test("recommended actions filters and reset", async ({ page }) => {
    test.skip(
      test.info().project.name !== "desktop-chrome",
      "Desktop interaction checks only.",
    );

    const runtimeHealth = attachRuntimeHealthCapture(page);
    await page.goto(ROUTES.RECOMMENDED_ACTIONS);

    const searchInput = page.getByPlaceholder("Search actions...");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("billing");
    await expect(page.getByRole("button", { name: /Reset Filters/i })).toBeVisible();
    await expect(page.getByText("Deploy Billing Inquiry Automation").first()).toBeVisible();

    await page.getByRole("button", { name: /Reset Filters/i }).click();
    await expect(searchInput).toHaveValue("");
    await runtimeHealth.assertNoRuntimeIssues();
  });

  test("automation opportunities tabs and card expansion", async ({ page }) => {
    test.skip(
      test.info().project.name !== "desktop-chrome",
      "Desktop interaction checks only.",
    );

    const runtimeHealth = attachRuntimeHealthCapture(page);
    await page.goto(ROUTES.AUTOMATION_OPPORTUNITIES);

    await page.getByRole("tab", { name: /^Topics$/i }).click();
    await expect(page.getByRole("heading", { name: /Top Opportunities/i })).toBeVisible();

    const expandButton = page
      .getByRole("button", { name: /Explore Breakdown & Related Opportunities/i })
      .first();
    await expandButton.click();
    await expect(page.getByRole("button", { name: /Hide Breakdown & Related Opportunities/i }).first())
      .toBeVisible();

    await page.getByRole("tab", { name: /^Sub-topics$/i }).click();
    await expect(page.getByText("Charge Breakdown").first()).toBeVisible();
    await runtimeHealth.assertNoRuntimeIssues();
  });

  test("sidebar menu and submenu state tokens apply in expanded and collapsed modes", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "desktop-chrome",
      "Desktop interaction checks only.",
    );

    await page.goto(ROUTES.ACTIONS_HISTORY);

    const selectedMenuButton = page.locator(
      '[data-sidebar="menu-button"][data-active="true"]',
    ).first();
    const hoverMenuButton = page.locator(
      '[data-sidebar="menu-button"][data-active="false"]',
    ).first();
    await expect(selectedMenuButton).toBeVisible();
    await expect(hoverMenuButton).toBeVisible();

    const selectedMenuStyles = await selectedMenuButton.evaluate((el) => {
      const base = getComputedStyle(el);
      const after = getComputedStyle(el, "::after");
      return {
        background: base.backgroundColor,
        color: base.color,
        indicatorOpacity: after.opacity,
        indicatorColor: after.backgroundColor,
      };
    });
    expect(selectedMenuStyles.background).toBe("rgb(226, 238, 252)");
    expect(selectedMenuStyles.color).toBe("rgb(24, 91, 164)");
    expect(selectedMenuStyles.indicatorOpacity).toBe("1");
    expect(selectedMenuStyles.indicatorColor).toBe("rgb(24, 91, 164)");

    const hoverMenuClassName = await hoverMenuButton.getAttribute("class");
    expect(hoverMenuClassName ?? "").toContain(
      "hover:bg-[var(--sidebar-state-hover-bg)]",
    );
    expect(hoverMenuClassName ?? "").toContain(
      "active:bg-[var(--sidebar-state-pressed-bg)]",
    );
    expect(hoverMenuClassName ?? "").toContain(
      "after:bg-[var(--sidebar-state-indicator-interactive)]",
    );

    await page.goto(ROUTES.COPILOT);
    const selectedSubmenuButton = page
      .locator('[data-sidebar="menu-sub-button"][data-active="true"]')
      .first();
    const hoverSubmenuButton = page
      .locator('[data-sidebar="menu-sub-button"][data-active="false"]')
      .first();
    await expect(selectedSubmenuButton).toBeVisible();
    await expect(hoverSubmenuButton).toBeVisible();

    const hoverSubmenuClassName = await hoverSubmenuButton.getAttribute("class");
    expect(hoverSubmenuClassName ?? "").toContain(
      "hover:bg-[var(--sidebar-state-hover-bg)]",
    );
    expect(hoverSubmenuClassName ?? "").toContain(
      "active:bg-[var(--sidebar-state-pressed-bg)]",
    );

    const selectedSubmenuStyles = await selectedSubmenuButton.evaluate((el) => {
      const base = getComputedStyle(el);
      return {
        background: base.backgroundColor,
        color: base.color,
      };
    });
    expect(selectedSubmenuStyles.background).toBe("rgb(226, 238, 252)");
    expect(selectedSubmenuStyles.color).toBe("rgb(24, 91, 164)");

    await page.goto(ROUTES.ACTIONS_HISTORY);
    await page.keyboard.press("Meta+b");
    const collapsedSelected = page
      .locator('[data-sidebar="menu-button"][data-active="true"]')
      .first();
    await expect(collapsedSelected).toBeVisible();
    const collapsedSelectedStyles = await collapsedSelected.evaluate((el) => {
      const base = getComputedStyle(el);
      const after = getComputedStyle(el, "::after");
      return {
        background: base.backgroundColor,
        indicatorOpacity: after.opacity,
        indicatorColor: after.backgroundColor,
      };
    });
    expect(collapsedSelectedStyles.background).toBe("rgb(226, 238, 252)");
    expect(collapsedSelectedStyles.indicatorOpacity).toBe("1");
    expect(collapsedSelectedStyles.indicatorColor).toBe("rgb(24, 91, 164)");
  });
});
