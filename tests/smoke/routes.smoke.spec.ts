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
    const topNav = page.locator('[data-slot="top-nav"]');
    const appBodyRow = page.locator('[data-slot="app-body-row"]');
    const mainAppCardShell = page.locator('[data-slot="main-app-card-shell"]');
    await expect(topNav).toBeVisible();
    await expect(appBodyRow).toBeVisible();
    await expect(mainAppCardShell).toBeVisible();
    await expect(page.getByRole("button", { name: /^User menu$/i }).first()).toBeVisible();
    await expect(page.locator('[data-sidebar="footer"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="breadcrumb"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="top-nav"] [data-slot="breadcrumb"]')).toHaveCount(0);
    const topNavBox = await topNav.boundingBox();
    const appBodyBox = await appBodyRow.boundingBox();
    expect(topNavBox).not.toBeNull();
    expect(appBodyBox).not.toBeNull();
    expect(Math.abs(appBodyBox!.y - (topNavBox!.y + topNavBox!.height))).toBeLessThanOrEqual(1);
    await expect(mainAppCardShell.locator('[data-slot="sidebar"]')).toHaveCount(0);
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

  await expect(page.locator('[data-slot="top-nav"]')).toBeVisible();
  const appBodyRow = page.locator('[data-slot="app-body-row"]');
  const mainAppCardShell = page.locator('[data-slot="main-app-card-shell"]');
  await expect(appBodyRow).toBeVisible();
  await expect(mainAppCardShell).toBeVisible();
  await expect(page.getByRole("button", { name: /^User menu$/i }).first()).toBeVisible();
  await expect(page.locator('[data-sidebar="footer"]')).toHaveCount(0);
  const breadcrumbBar = page.locator('[data-slot="page-header"]');
  if (await breadcrumbBar.count()) {
    await expect(breadcrumbBar).toBeVisible();
    await expect(page.locator('[data-slot="page-header"] [data-slot="breadcrumb"]')).toHaveCount(1);
  } else {
    await expect(page.locator('[data-slot="breadcrumb"]')).toHaveCount(0);
  }
  await expect(page.locator('[data-slot="top-nav"] [data-slot="breadcrumb"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Search$/i }).first()).toBeVisible();
  const topNavBox = await page.locator('[data-slot="top-nav"]').boundingBox();
  const appBodyBox = await appBodyRow.boundingBox();
  expect(topNavBox).not.toBeNull();
  expect(appBodyBox).not.toBeNull();
  expect(Math.abs(appBodyBox!.y - (topNavBox!.y + topNavBox!.height))).toBeLessThanOrEqual(1);
  await expect(mainAppCardShell.locator('[data-slot="sidebar"]')).toHaveCount(0);
  await expect(page.getByText("Page not found")).toHaveCount(0);
});

test("route smoke: top nav remains global width when AI assistant opens", async ({ page }) => {
  await page.goto(ROUTES.AUTOMATION_OPPORTUNITIES);
  const topNav = page.locator('[data-slot="top-nav"]');
  const mainAppCardShell = page.locator('[data-slot="main-app-card-shell"]');
  await expect(topNav).toBeVisible();
  await expect(mainAppCardShell).toBeVisible();
  await page.getByRole("button", { name: /Ask AI/i }).first().click();
  await expect(page.getByRole("heading", { name: /AI Assistant/i }).first()).toBeVisible();
  await expect(page.locator('[data-slot="assistant-card-shell"]')).toBeVisible();

  const topNavBox = await topNav.boundingBox();
  const viewport = page.viewportSize();
  expect(topNavBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(Math.abs((topNavBox?.width ?? 0) - (viewport?.width ?? 0))).toBeLessThanOrEqual(2);
});
