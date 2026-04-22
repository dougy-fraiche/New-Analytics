import { expect, test } from "@playwright/test";
import { ROUTES } from "../../src/app/routes";

type VisualRoute = {
  name: string;
  path: string;
  readyHeading: RegExp;
};

const visualRoutes: VisualRoute[] = [
  {
    name: "automation-opportunities",
    path: ROUTES.AUTOMATION_OPPORTUNITIES,
    readyHeading: /Automation Opportunities/i,
  },
  {
    name: "recommended-actions",
    path: ROUTES.RECOMMENDED_ACTIONS,
    readyHeading: /Recommended Actions/i,
  },
  {
    name: "actions-history",
    path: ROUTES.ACTIONS_HISTORY,
    readyHeading: /^History$/i,
  },
];

for (const route of visualRoutes) {
  test(`visual regression: ${route.name}`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.readyHeading }).first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    const mainRegion = page.locator("main");
    await expect(mainRegion).toBeVisible();
    await expect(mainRegion).toHaveScreenshot(`${route.name}.png`, {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    });
  });
}
