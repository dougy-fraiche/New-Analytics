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
});
