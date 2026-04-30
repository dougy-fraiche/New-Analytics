import { expect, test } from "@playwright/test";
import { ROUTES } from "../../src/app/routes";

type VisualRoute = {
  name: string;
  path: string;
  readyHeading: RegExp;
};

type OverflowRoute = {
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

const overflowRoutes: OverflowRoute[] = [
  { path: ROUTES.ACTIONS_HISTORY, readyHeading: /^History$/i },
  { path: ROUTES.RECOMMENDED_ACTIONS, readyHeading: /Recommended Actions/i },
  { path: ROUTES.CONVERSATIONS, readyHeading: /Conversations/i },
  { path: ROUTES.OBSERVABILITY, readyHeading: /Observability/i },
  { path: ROUTES.INSIGHTS, readyHeading: /All Insights/i },
  { path: ROUTES.SAVED, readyHeading: /^Saved$/i },
];

for (const route of overflowRoutes) {
  test(`mobile root does not horizontally overflow: ${route.path}`, async ({ page }, testInfo) => {
    test.skip(!/mobile/i.test(testInfo.project.name), "Mobile viewport only");

    await page.goto(route.path);
    await expect(page.getByRole("heading", { name: route.readyHeading }).first()).toBeVisible();
    await page.waitForLoadState("networkidle");

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1);
  });
}
