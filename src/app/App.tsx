import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router";
import { ThemeProvider } from "next-themes";
import { RootLayout } from "./components/RootLayout";
import { ExplorePage } from "./components/ExplorePage";
import { AlertCircle } from "lucide-react";
import { ROUTES } from "./routes";

function NotFound() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center">
        <h1 className="text-4xl mb-2">404</h1>
        <p className="text-muted-foreground">Page not found</p>
      </div>
    </div>
  );
}

function HydrateFallback() {
  return null;
}

function ErrorBoundary() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center max-w-md space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-2xl">Something went wrong</h1>
        <p className="text-muted-foreground">
          An unexpected error occurred. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

// ── Route-level lazy helpers ──────────────────────────────────────────────────
// Using React Router's native `lazy` property (instead of React.lazy + Suspense)
// so that React Router can wrap the async import in startTransition internally,
// preventing the "suspended during synchronous input" error.

const lazyRoute = (importFn: () => Promise<{ [key: string]: React.ComponentType }>, exportName: string) => ({
  lazy: async () => {
    const mod = await importFn();
    return { Component: mod[exportName] };
  },
});

const toChildPath = (route: string) => route.replace(/^\//, "");

const router = createBrowserRouter([
  {
    path: ROUTES.INTERACTION_PLAYBACK,
    ...lazyRoute(() => import("./components/InteractionPlaybackPage"), "InteractionPlaybackPage"),
  },
  {
    path: ROUTES.EXPLORE,
    Component: RootLayout,
    ErrorBoundary: ErrorBoundary,
    HydrateFallback: HydrateFallback,
    children: [
      { index: true, Component: ExplorePage },
      { path: toChildPath(ROUTES.CONVERSATION(":conversationId")), Component: ExplorePage },
      { path: toChildPath(ROUTES.ANOMALY_INVESTIGATION(":insightId")), Component: ExplorePage },
      {
        path: toChildPath(ROUTES.CONVERSATIONS),
        ...lazyRoute(() => import("./components/AllConversationsPage"), "AllConversationsPage"),
      },
      {
        path: toChildPath(ROUTES.AUTOMATION_OPPORTUNITIES),
        ...lazyRoute(
          () => import("./components/AutomationOpportunitiesPage"),
          "AutomationOpportunitiesPage",
        ),
      },
      {
        path: toChildPath(ROUTES.AUTOMATION_OPPORTUNITIES_SETTINGS),
        ...lazyRoute(
          () => import("./components/AutomationOpportunitiesSettingsPage"),
          "AutomationOpportunitiesSettingsPage",
        ),
      },
      {
        path: toChildPath(ROUTES.AUTOMATION_OPPORTUNITIES_AGENT(":agentId")),
        ...lazyRoute(
          () => import("./components/AutomationOpportunitiesAgentPage"),
          "AutomationOpportunitiesAgentPage",
        ),
      },
      {
        path: toChildPath(ROUTES.OBSERVABILITY),
        ...lazyRoute(() => import("./components/ObservabilityPage"), "ObservabilityPage"),
      },
      {
        path: toChildPath(ROUTES.AI_AGENTS),
        ...lazyRoute(() => import("./components/ObservabilityCategoryPage"), "ObservabilityCategoryPage"),
      },
      {
        path: toChildPath(ROUTES.AI_AGENTS_SETTINGS),
        ...lazyRoute(() => import("./components/AIAgentsSettingsPage"), "AIAgentsSettingsPage"),
      },
      {
        path: toChildPath(ROUTES.AI_AGENTS_DASHBOARD(":dashboardId")),
        ...lazyRoute(() => import("./components/ObservabilityCategoryPage"), "ObservabilityCategoryPage"),
      },
      { path: toChildPath(ROUTES.COPILOT), element: <Navigate to={ROUTES.COPILOT_TAB("overview")} replace /> },
      {
        path: toChildPath(ROUTES.COPILOT_TAB("overview")),
        ...lazyRoute(() => import("./components/CopilotOverviewPage"), "CopilotOverviewPage"),
      },
      {
        path: toChildPath(ROUTES.COPILOT_TAB("auto-summary")),
        ...lazyRoute(() => import("./components/CopilotAutoSummaryPage"), "CopilotAutoSummaryPage"),
      },
      {
        path: toChildPath(ROUTES.COPILOT_TAB("task-assist")),
        ...lazyRoute(() => import("./components/CopilotTaskAssistPage"), "CopilotTaskAssistPage"),
      },
      {
        path: toChildPath(ROUTES.COPILOT_TAB("rules-engine")),
        ...lazyRoute(() => import("./components/CopilotRulesEnginePage"), "CopilotRulesEnginePage"),
      },
      {
        path: toChildPath(ROUTES.COPILOT_TAB("real-time-summary")),
        ...lazyRoute(() => import("./components/CopilotRealTimeSummaryPage"), "CopilotRealTimeSummaryPage"),
      },
      {
        path: toChildPath(ROUTES.COPILOT_TAB("generative-responses")),
        ...lazyRoute(() => import("./components/CopilotGenerativeResponsesPage"), "CopilotGenerativeResponsesPage"),
      },
      {
        path: `${toChildPath(ROUTES.COPILOT)}/*`,
        element: <Navigate to={ROUTES.COPILOT_TAB("overview")} replace />,
      },
      {
        path: toChildPath(ROUTES.KNOWLEDGE_PERFORMANCE),
        element: <Navigate to={ROUTES.KNOWLEDGE_PERFORMANCE_TAB("overview")} replace />,
      },
      {
        path: toChildPath(ROUTES.KNOWLEDGE_PERFORMANCE_TAB("overview")),
        ...lazyRoute(
          () => import("./components/KnowledgePerformanceOverviewPage"),
          "KnowledgePerformanceOverviewPage",
        ),
      },
      {
        path: toChildPath(ROUTES.KNOWLEDGE_PERFORMANCE_TAB("agent-user-feedback")),
        ...lazyRoute(
          () => import("./components/KnowledgePerformanceAgentUserFeedbackPage"),
          "KnowledgePerformanceAgentUserFeedbackPage",
        ),
      },
      {
        path: toChildPath(ROUTES.KNOWLEDGE_PERFORMANCE_TAB("rag-evals")),
        ...lazyRoute(
          () => import("./components/KnowledgePerformanceRagEvalsPage"),
          "KnowledgePerformanceRagEvalsPage",
        ),
      },
      {
        path: toChildPath(ROUTES.KNOWLEDGE_PERFORMANCE_TAB("failed-query-patterns")),
        ...lazyRoute(
          () => import("./components/KnowledgePerformanceFailedQueryPatternsPage"),
          "KnowledgePerformanceFailedQueryPatternsPage",
        ),
      },
      {
        path: toChildPath(ROUTES.KNOWLEDGE_PERFORMANCE_TAB("improve-knowledge")),
        ...lazyRoute(
          () => import("./components/KnowledgePerformanceImproveKnowledgePage"),
          "KnowledgePerformanceImproveKnowledgePage",
        ),
      },
      {
        path: `${toChildPath(ROUTES.KNOWLEDGE_PERFORMANCE)}/*`,
        element: <Navigate to={ROUTES.KNOWLEDGE_PERFORMANCE_TAB("overview")} replace />,
      },
      {
        path: toChildPath(ROUTES.SAVED),
        ...lazyRoute(() => import("./components/SavedFoldersPage"), "SavedFoldersPage"),
      },
      {
        path: toChildPath(ROUTES.SAVED_FOLDER_DASHBOARD(":folderSlug", ":dashboardSlug")),
        ...lazyRoute(() => import("./components/DashboardPage"), "DashboardPage"),
      },
      {
        path: toChildPath(ROUTES.SAVED_STANDALONE_DASHBOARD(":savedSlug")),
        ...lazyRoute(() => import("./components/SavedSlugResolverPage"), "SavedSlugResolverPage"),
      },
      {
        path: toChildPath(ROUTES.RECOMMENDED_ACTIONS),
        ...lazyRoute(() => import("./components/RecommendedActionsPage"), "RecommendedActionsPage"),
      },
      {
        path: toChildPath(ROUTES.ACTIONS_HISTORY),
        ...lazyRoute(() => import("./components/ActionsHistoryPage"), "ActionsHistoryPage"),
      },
      { path: toChildPath(ROUTES.INSIGHTS), ...lazyRoute(() => import("./components/AllInsightsPage"), "AllInsightsPage") },
      { path: toChildPath(ROUTES.SETTINGS), ...lazyRoute(() => import("./components/SettingsPage"), "SettingsPage") },
      {
        path: toChildPath(ROUTES.DASHBOARD(":dashboardId")),
        ...lazyRoute(() => import("./components/DashboardPage"), "DashboardPage"),
      },
      { path: "*", Component: NotFound },
    ],
  },
]);

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
