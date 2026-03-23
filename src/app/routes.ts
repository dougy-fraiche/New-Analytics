/** Centralized route path constants — prevents hardcoded path strings throughout the app. */
export const ROUTES = {
  EXPLORE: "/",
  CONVERSATION: (id: string) => `/conversation/${id}`,
  CONVERSATIONS: "/conversations",
  AUTOMATION_OPPORTUNITIES: "/automation-opportunities",
  OBSERVABILITY: "/observability",
  OBSERVABILITY_CATEGORY: (categoryId: string) => `/observability/${categoryId}`,
  OBSERVABILITY_DASHBOARD: (categoryId: string, dashboardId: string) =>
    `/observability/${categoryId}/${dashboardId}`,
  DASHBOARD: (dashboardId: string) => `/dashboard/${dashboardId}`,
  SAVED: "/saved",
  SAVED_FOLDER: (folderId: string) => `/saved/${folderId}`,
  SAVED_DASHBOARD: (dashboardId: string) => `/saved/dashboard/${dashboardId}`,
  PROJECT_DASHBOARD: (projectId: string, dashboardId: string) =>
    `/project/${projectId}/dashboard/${dashboardId}`,
  PINNED: "/pinned",
  RECOMMENDED_ACTIONS: "/recommended-actions",
  ACTIONS_HISTORY: "/actions/history",
  INSIGHTS: "/insights",
  SETTINGS: "/settings",
} as const;
