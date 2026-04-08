/** Centralized route path constants — prevents hardcoded path strings throughout the app. */
export const ROUTES = {
  EXPLORE: "/",
  CONVERSATION: (id: string) => `/conversation/${id}`,
  CONVERSATIONS: "/conversations",
  AUTOMATION_OPPORTUNITIES: "/automation-opportunities",
  /** Stable agent id (UUID) as the path segment. */
  AUTOMATION_OPPORTUNITIES_AGENT: (agentId: string) => `/automation-opportunities/agent/${agentId}`,
  OBSERVABILITY: "/observability",
  AI_AGENTS: "/ai-agents",
  AI_AGENTS_DASHBOARD: (dashboardId: string) => `/ai-agents/${dashboardId}`,
  COPILOT: "/copilot",
  DASHBOARD: (dashboardId: string) => `/dashboard/${dashboardId}`,
  SAVED: "/saved",
  SAVED_FOLDER: (folderId: string) => `/saved/${folderId}`,
  SAVED_DASHBOARD: (dashboardId: string) => `/saved/dashboard/${dashboardId}`,
  PROJECT_DASHBOARD: (projectId: string, dashboardId: string) =>
    `/project/${projectId}/dashboard/${dashboardId}`,
  RECOMMENDED_ACTIONS: "/recommended-actions",
  ACTIONS_HISTORY: "/actions/history",
  INSIGHTS: "/insights",
  SETTINGS: "/settings",
  /** Full-screen interaction playback (opened in popup; may sit outside RootLayout). */
  INTERACTION_PLAYBACK: "/interaction-playback",
} as const;

/**
 * Prefixes for `pathname.startsWith` (trailing slash where nested segments follow).
 * Keeps assistant route resolution aligned with `ROUTES`.
 */
export const ROUTE_PREFIXES = {
  conversation: "/conversation/",
  automationOpportunitiesAgent: `${ROUTES.AUTOMATION_OPPORTUNITIES}/agent/`,
  dashboard: "/dashboard/",
  aiAgentsNested: `${ROUTES.AI_AGENTS}/`,
  copilot: ROUTES.COPILOT,
  savedDashboard: "/saved/dashboard/",
  saved: "/saved/",
  project: "/project/",
} as const;
