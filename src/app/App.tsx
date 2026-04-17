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
      { path: "conversation/:conversationId", Component: ExplorePage },
      { path: "anomaly-investigation/:insightId", Component: ExplorePage },
      { path: "conversations", ...lazyRoute(() => import("./components/AllConversationsPage"), "AllConversationsPage") },
      {
        path: "automation-opportunities/agent/:agentId",
        ...lazyRoute(
          () => import("./components/AutomationOpportunitiesAgentPage"),
          "AutomationOpportunitiesAgentPage",
        ),
      },
      { path: "automation-opportunities", ...lazyRoute(() => import("./components/AutomationOpportunitiesPage"), "AutomationOpportunitiesPage") },
      { path: "observability", ...lazyRoute(() => import("./components/ObservabilityPage"), "ObservabilityPage") },
      { path: "observability/ai-agents", ...lazyRoute(() => import("./components/ObservabilityCategoryPage"), "ObservabilityCategoryPage") },
      { path: "observability/ai-agents/:dashboardId", ...lazyRoute(() => import("./components/ObservabilityCategoryPage"), "ObservabilityCategoryPage") },
      { path: "observability/copilot", element: <Navigate to={ROUTES.COPILOT_TAB("overview")} replace /> },
      { path: "observability/copilot/overview", ...lazyRoute(() => import("./components/CopilotOverviewPage"), "CopilotOverviewPage") },
      { path: "observability/copilot/auto-summary", ...lazyRoute(() => import("./components/CopilotAutoSummaryPage"), "CopilotAutoSummaryPage") },
      { path: "observability/copilot/task-assist", ...lazyRoute(() => import("./components/CopilotTaskAssistPage"), "CopilotTaskAssistPage") },
      { path: "observability/copilot/rules-engine", ...lazyRoute(() => import("./components/CopilotRulesEnginePage"), "CopilotRulesEnginePage") },
      { path: "observability/copilot/real-time-summary", ...lazyRoute(() => import("./components/CopilotRealTimeSummaryPage"), "CopilotRealTimeSummaryPage") },
      {
        path: "observability/copilot/generative-responses",
        ...lazyRoute(() => import("./components/CopilotGenerativeResponsesPage"), "CopilotGenerativeResponsesPage"),
      },
      { path: "observability/copilot/*", element: <Navigate to={ROUTES.COPILOT_TAB("overview")} replace /> },
      { path: "observability/knowledge-performance", element: <Navigate to={ROUTES.KNOWLEDGE_PERFORMANCE_TAB("overview")} replace /> },
      {
        path: "observability/knowledge-performance/overview",
        ...lazyRoute(
          () => import("./components/KnowledgePerformanceOverviewPage"),
          "KnowledgePerformanceOverviewPage",
        ),
      },
      {
        path: "observability/knowledge-performance/agent-user-feedback",
        ...lazyRoute(
          () => import("./components/KnowledgePerformanceAgentUserFeedbackPage"),
          "KnowledgePerformanceAgentUserFeedbackPage",
        ),
      },
      {
        path: "observability/knowledge-performance/rag-evals",
        ...lazyRoute(
          () => import("./components/KnowledgePerformanceRagEvalsPage"),
          "KnowledgePerformanceRagEvalsPage",
        ),
      },
      {
        path: "observability/knowledge-performance/failed-query-patterns",
        ...lazyRoute(
          () => import("./components/KnowledgePerformanceFailedQueryPatternsPage"),
          "KnowledgePerformanceFailedQueryPatternsPage",
        ),
      },
      {
        path: "observability/knowledge-performance/improve-knowledge",
        ...lazyRoute(
          () => import("./components/KnowledgePerformanceImproveKnowledgePage"),
          "KnowledgePerformanceImproveKnowledgePage",
        ),
      },
      {
        path: "observability/knowledge-performance/*",
        element: <Navigate to={ROUTES.KNOWLEDGE_PERFORMANCE_TAB("overview")} replace />,
      },
      { path: "saved", ...lazyRoute(() => import("./components/SavedFoldersPage"), "SavedFoldersPage") },
      { path: "saved/:folderSlug/:dashboardSlug", ...lazyRoute(() => import("./components/DashboardPage"), "DashboardPage") },
      { path: "saved/:savedSlug", ...lazyRoute(() => import("./components/SavedSlugResolverPage"), "SavedSlugResolverPage") },
      { path: "recommended-actions", ...lazyRoute(() => import("./components/RecommendedActionsPage"), "RecommendedActionsPage") },
      { path: "actions/history", ...lazyRoute(() => import("./components/ActionsHistoryPage"), "ActionsHistoryPage") },
      { path: "insights", ...lazyRoute(() => import("./components/AllInsightsPage"), "AllInsightsPage") },
      { path: "settings", ...lazyRoute(() => import("./components/SettingsPage"), "SettingsPage") },
      { path: "dashboard/:dashboardId", ...lazyRoute(() => import("./components/DashboardPage"), "DashboardPage") },
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
