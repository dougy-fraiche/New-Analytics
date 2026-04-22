import { expect, test } from "@playwright/test";
import { ROUTES } from "../../src/app/routes";
import { attachRuntimeHealthCapture } from "./helpers/runtime-health";

const routesToCheck = [
  ROUTES.EXPLORE,
  ROUTES.AUTOMATION_OPPORTUNITIES,
  ROUTES.RECOMMENDED_ACTIONS,
  ROUTES.ACTIONS_HISTORY,
  ROUTES.OBSERVABILITY,
  ROUTES.SETTINGS,
  ROUTES.CONVERSATION("mock-thread"),
];

test("no runtime console warnings/errors while navigating key routes", async ({ page }) => {
  const runtimeHealth = attachRuntimeHealthCapture(page);

  for (const route of routesToCheck) {
    await page.goto(route);
    await expect(page.getByText("Page not found")).toHaveCount(0);
  }

  await runtimeHealth.assertNoRuntimeIssues();
});
