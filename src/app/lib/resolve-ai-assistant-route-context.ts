import type { Dashboard, Project } from "../contexts/ProjectContext";
import { ootbCategories } from "../data/ootb-dashboards";
import { ROUTES, ROUTE_PREFIXES } from "../routes";

const AUTOMATION_OPPORTUNITIES_ID = "automation-opportunities";

export type AiAssistantRouteContext = {
  /** Route-derived id for display context (saved dashboard id, OOTB id, etc.) */
  dashboardId?: string;
  /** Used for suggested prompts + generateAIResponse */
  sourceOotbId?: string;
};

/**
 * Route-based context for the global AI assistant (single thread).
 * The Explore hero route (`/`) hides the global panel; `/conversation/*` uses the same
 * assistant thread as the rest of the app (see RootLayout).
 */
export function resolveAiAssistantRouteContext(
  pathname: string,
  params: Readonly<Partial<Record<string, string>>>,
  deps: {
    projects: Project[];
    standaloneDashboards: Dashboard[];
  },
): AiAssistantRouteContext {
  const { projects, standaloneDashboards } = deps;

  if (pathname === ROUTES.INSIGHTS) {
    return { dashboardId: "all-insights", sourceOotbId: "all-insights" };
  }

  if (pathname === ROUTES.AUTOMATION_OPPORTUNITIES) {
    return { dashboardId: AUTOMATION_OPPORTUNITIES_ID, sourceOotbId: AUTOMATION_OPPORTUNITIES_ID };
  }

  // OOTB dashboard: /dashboard/:dashboardId
  if (pathname.startsWith(ROUTE_PREFIXES.dashboard) && params.dashboardId) {
    const id = params.dashboardId;
    return { dashboardId: id, sourceOotbId: id };
  }

  // Observability category (tabbed dashboards)
  if (pathname.startsWith(ROUTE_PREFIXES.observabilityNested) && params.categoryId) {
    const category = ootbCategories.find((c) => c.id === params.categoryId);
    if (!category || category.dashboards.length === 0) {
      return {};
    }
    const activeId =
      params.dashboardId && category.dashboards.some((d) => d.id === params.dashboardId)
        ? params.dashboardId
        : category.dashboards[0]!.id;
    return { dashboardId: activeId, sourceOotbId: activeId };
  }

  // Standalone saved dashboard
  if (pathname.startsWith(ROUTE_PREFIXES.savedDashboard) && params.dashboardId) {
    const d = standaloneDashboards.find((x) => x.id === params.dashboardId);
    if (!d) return { dashboardId: params.dashboardId };
    return {
      dashboardId: d.id,
      sourceOotbId: d.sourceOotbId ?? d.id,
    };
  }

  // Saved folder dashboard: /saved/:folderId/dashboard/:dashboardId
  if (
    pathname.includes("/dashboard/") &&
    pathname.startsWith(ROUTE_PREFIXES.saved) &&
    params.folderId &&
    params.dashboardId
  ) {
    const folder = projects.find((p) => p.id === params.folderId);
    const d = folder?.dashboards.find((x) => x.id === params.dashboardId);
    if (!d) return { dashboardId: params.dashboardId };
    return {
      dashboardId: d.id,
      sourceOotbId: d.sourceOotbId ?? d.id,
    };
  }

  // Project dashboard: /project/:projectId/dashboard/:dashboardId
  if (pathname.startsWith(ROUTE_PREFIXES.project) && params.projectId && params.dashboardId) {
    const project = projects.find((p) => p.id === params.projectId);
    const d = project?.dashboards.find((x) => x.id === params.dashboardId);
    if (!d) return { dashboardId: params.dashboardId };
    return {
      dashboardId: d.id,
      sourceOotbId: d.sourceOotbId ?? d.id,
    };
  }

  return {};
}
