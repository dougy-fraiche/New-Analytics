import { expect, test } from "@playwright/test";
import { ROUTES } from "../../src/app/routes";

type RouteCheck = {
  path: string;
  heading: RegExp;
};

const routeChecks: RouteCheck[] = [
  { path: ROUTES.EXPLORE, heading: /Top Recommended Actions/i },
  { path: ROUTES.AUTOMATION_OPPORTUNITIES, heading: /Automation Opportunities/i },
  { path: ROUTES.RECOMMENDED_ACTIONS, heading: /Recommended Actions/i },
  { path: ROUTES.ACTIONS_HISTORY, heading: /^History$/i },
  { path: ROUTES.OBSERVABILITY, heading: /^Observability$/i },
  { path: ROUTES.SETTINGS, heading: /^Settings$/i },
];

for (const routeCheck of routeChecks) {
  test(`route smoke: ${routeCheck.path}`, async ({ page }) => {
    await page.goto(routeCheck.path);
    await expect(page.getByRole("heading", { name: routeCheck.heading }).first()).toBeVisible();
    await expect(page.getByText("Page not found")).toHaveCount(0);
  });
}

test("route smoke: conversation route fallback loads app shell", async ({ page }) => {
  await page.goto(ROUTES.CONVERSATION("mock-thread"));
  const assistantHeading = page.getByRole("heading", { name: /AI Assistant/i }).first();
  const askAiButton = page.getByRole("button", { name: /Ask AI/i }).first();

  if (await assistantHeading.isVisible()) {
    await expect(assistantHeading).toBeVisible();
  } else {
    await expect(askAiButton).toBeVisible();
  }

  await expect(page.getByRole("button", { name: /^Search$/i }).first()).toBeVisible();
  await expect(page.getByText("Page not found")).toHaveCount(0);
});
