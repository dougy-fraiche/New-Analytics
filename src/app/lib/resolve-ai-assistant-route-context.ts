import type { Dashboard, Project } from "../contexts/ProjectContext";
import { ootbCategories } from "../data/ootb-dashboards";
import { ROUTES, ROUTE_PREFIXES } from "../routes";
import {
  findProjectBySlug,
  findProjectDashboardBySlugs,
  findStandaloneDashboardBySlug,
} from "./saved-slugs";

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

  if (
    pathname === ROUTES.AUTOMATION_OPPORTUNITIES ||
    pathname === ROUTES.AUTOMATION_OPPORTUNITIES_SETTINGS
  ) {
    return { dashboardId: AUTOMATION_OPPORTUNITIES_ID, sourceOotbId: AUTOMATION_OPPORTUNITIES_ID };
  }

  if (pathname === ROUTES.OBSERVABILITY) {
    return { dashboardId: "observability", sourceOotbId: "observability" };
  }

  if (pathname === ROUTES.COPILOT || pathname.startsWith(ROUTE_PREFIXES.copilotNested)) {
    return { dashboardId: "ai-agents-copilot", sourceOotbId: "ai-agents-copilot" };
  }

  if (
    pathname === ROUTES.KNOWLEDGE_PERFORMANCE ||
    pathname.startsWith(ROUTE_PREFIXES.knowledgePerformanceNested)
  ) {
    return { dashboardId: "knowledge-performance", sourceOotbId: "knowledge-performance" };
  }

  if (pathname.startsWith(`${ROUTES.AUTOMATION_OPPORTUNITIES}/agent/`)) {
    return { dashboardId: AUTOMATION_OPPORTUNITIES_ID, sourceOotbId: AUTOMATION_OPPORTUNITIES_ID };
  }

  if (pathname === ROUTES.AI_AGENTS_SETTINGS) {
    return { dashboardId: "ai-agents-settings", sourceOotbId: "ai-agents-settings" };
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

  if (pathname.startsWith(ROUTE_PREFIXES.saved)) {
    const savedRemainder = pathname.slice(ROUTE_PREFIXES.saved.length);
    const savedSegments = savedRemainder.split("/").filter(Boolean);

    if (savedSegments.length >= 2) {
      const [folderSlug, dashboardSlug] = savedSegments;
      if (folderSlug && dashboardSlug) {
        const match = findProjectDashboardBySlugs(projects, folderSlug, dashboardSlug);
        if (!match) {
          return {};
        }
        return {
          dashboardId: match.dashboard.id,
          sourceOotbId: match.dashboard.sourceOotbId ?? match.dashboard.id,
        };
      }
    }

    if (savedSegments.length === 1) {
      const [savedSlug] = savedSegments;
      if (!savedSlug) return {};

      const folder = findProjectBySlug(projects, savedSlug);
      if (folder) {
        return {
          dashboardId: `saved-folder-${folder.id}`,
          sourceOotbId: `saved-folder-${folder.id}`,
        };
      }

      const standaloneDashboard = findStandaloneDashboardBySlug(
        standaloneDashboards,
        savedSlug,
      );
      if (standaloneDashboard) {
        return {
          dashboardId: standaloneDashboard.id,
          sourceOotbId: standaloneDashboard.sourceOotbId ?? standaloneDashboard.id,
        };
      }
    }
  }

  return {};
}
