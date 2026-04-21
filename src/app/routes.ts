/** Centralized route path constants — prevents hardcoded path strings throughout the app. */
export const COPILOT_TABS = [
  "overview",
  "auto-summary",
  "task-assist",
  "rules-engine",
  "real-time-summary",
  "generative-responses",
] as const;

export type CopilotTabRoute = (typeof COPILOT_TABS)[number];

export const KNOWLEDGE_PERFORMANCE_TABS = [
  "overview",
  "agent-user-feedback",
  "rag-evals",
  "failed-query-patterns",
  "improve-knowledge",
] as const;

export type KnowledgePerformanceTabRoute = (typeof KNOWLEDGE_PERFORMANCE_TABS)[number];

export const ROUTES = {
  EXPLORE: "/",
  CONVERSATION: (id: string) => `/conversation/${id}`,
  ANOMALY_INVESTIGATION: (insightId: string | number) => `/anomaly-investigation/${insightId}`,
  CONVERSATIONS: "/conversations",
  AUTOMATION_OPPORTUNITIES: "/automation-opportunities",
  AUTOMATION_OPPORTUNITIES_SETTINGS: "/automation-opportunities/settings",
  /** Stable agent id (UUID) as the path segment. */
  AUTOMATION_OPPORTUNITIES_AGENT: (agentId: string) => `/automation-opportunities/agent/${agentId}`,
  OBSERVABILITY: "/observability",
  AI_AGENTS: "/observability/ai-agents",
  AI_AGENTS_SETTINGS: "/observability/ai-agents/settings",
  AI_AGENTS_DASHBOARD: (dashboardId: string) => `/observability/ai-agents/${dashboardId}`,
  COPILOT: "/observability/copilot",
  COPILOT_TAB: (tab: CopilotTabRoute) => `/observability/copilot/${tab}`,
  KNOWLEDGE_PERFORMANCE: "/observability/knowledge-performance",
  KNOWLEDGE_PERFORMANCE_TAB: (tab: KnowledgePerformanceTabRoute) =>
    `/observability/knowledge-performance/${tab}`,
  DASHBOARD: (dashboardId: string) => `/dashboard/${dashboardId}`,
  SAVED: "/saved",
  SAVED_FOLDER: (folderSlug: string) => `/saved/${folderSlug}`,
  SAVED_FOLDER_DASHBOARD: (folderSlug: string, dashboardSlug: string) =>
    `/saved/${folderSlug}/${dashboardSlug}`,
  SAVED_STANDALONE_DASHBOARD: (dashboardSlug: string) => `/saved/${dashboardSlug}`,
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
  dashboard: "/dashboard/",
  aiAgentsNested: `${ROUTES.AI_AGENTS}/`,
  copilotNested: `${ROUTES.COPILOT}/`,
  knowledgePerformanceNested: `${ROUTES.KNOWLEDGE_PERFORMANCE}/`,
  saved: "/saved/",
} as const;
