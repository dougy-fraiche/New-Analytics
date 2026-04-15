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
 * This only resolves prompt/response context metadata. Assistant thread persistence
 * (global vs route-scoped) is handled by RootLayout.
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

  // Explore draft list (sub-route of Explore)
  if (pathname === ROUTES.CONVERSATIONS) {
    return { dashboardId: "conversations", sourceOotbId: "explore-thread" };
  }

  // Explore conversation thread — explicit id for prompts + handlers
  if (pathname.startsWith(ROUTE_PREFIXES.conversation) && params.conversationId) {
    return { dashboardId: params.conversationId, sourceOotbId: "explore-thread" };
  }

  if (pathname === ROUTES.INSIGHTS) {
    return { dashboardId: "all-insights", sourceOotbId: "all-insights" };
  }

  if (pathname === ROUTES.AUTOMATION_OPPORTUNITIES) {
    return { dashboardId: AUTOMATION_OPPORTUNITIES_ID, sourceOotbId: AUTOMATION_OPPORTUNITIES_ID };
  }

  if (pathname === ROUTES.OBSERVABILITY) {
    return { dashboardId: "observability", sourceOotbId: "observability" };
  }

  if (pathname === ROUTES.COPILOT) {
    return { dashboardId: "ai-agents-copilot", sourceOotbId: "ai-agents-copilot" };
  }

  if (pathname.startsWith(`${ROUTES.AUTOMATION_OPPORTUNITIES}/agent/`)) {
    return { dashboardId: AUTOMATION_OPPORTUNITIES_ID, sourceOotbId: AUTOMATION_OPPORTUNITIES_ID };
  }

  // OOTB dashboard: /dashboard/:dashboardId
  if (pathname.startsWith(ROUTE_PREFIXES.dashboard) && params.dashboardId) {
    const id = params.dashboardId;
    return { dashboardId: id, sourceOotbId: id };
  }

  // AI Agents (tabbed OOTB dashboards)
  if (pathname === ROUTES.AI_AGENTS || pathname.startsWith(ROUTE_PREFIXES.aiAgentsNested)) {
    const category = ootbCategories.find((c) => c.id === "ai-agents");
    if (!category || category.dashboards.length === 0) {
      return {};
    }
    const visibleDashboards = category.dashboards.filter((d) => d.id !== "ai-agents-copilot");
    if (visibleDashboards.length === 0) {
      return {};
    }
    const activeId =
      params.dashboardId && visibleDashboards.some((d) => d.id === params.dashboardId)
        ? params.dashboardId
        : visibleDashboards[0]!.id;
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
