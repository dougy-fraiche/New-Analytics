import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useParams,
} from "react-router";
import { ThemeProvider } from "next-themes";
import { RootLayout } from "./components/RootLayout";
import { ExplorePage } from "./components/ExplorePage";
import { KnowledgePerformancePage } from "./components/KnowledgePerformancePage";
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

/** Legacy nested `/observability/*` bookmarks → `/ai-agents` routes. */
function LegacyObservabilityRedirect() {
  const { categoryId, dashboardId } = useParams<{ categoryId?: string; dashboardId?: string }>();
  if (categoryId === "ai-agents" && dashboardId === "ai-agents-copilot") {
    return <Navigate to={ROUTES.COPILOT} replace />;
  }
  if (categoryId === "ai-agents" && dashboardId) {
    return <Navigate to={ROUTES.AI_AGENTS_DASHBOARD(dashboardId)} replace />;
  }
  if (categoryId === "copilot") {
    return <Navigate to={ROUTES.COPILOT} replace />;
  }
  if (categoryId === "knowledge-performance") {
    return <Navigate to={ROUTES.KNOWLEDGE_PERFORMANCE} replace />;
  }
  return <Navigate to={ROUTES.AI_AGENTS} replace />;
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
      { path: "observability/:categoryId", element: <LegacyObservabilityRedirect /> },
      { path: "observability/:categoryId/:dashboardId", element: <LegacyObservabilityRedirect /> },
      { path: "ai-agents/ai-agents-copilot", element: <Navigate to={ROUTES.COPILOT} replace /> },
      { path: "ai-agents", ...lazyRoute(() => import("./components/ObservabilityCategoryPage"), "ObservabilityCategoryPage") },
      { path: "ai-agents/:dashboardId", ...lazyRoute(() => import("./components/ObservabilityCategoryPage"), "ObservabilityCategoryPage") },
      { path: "copilot", ...lazyRoute(() => import("./components/CopilotPage"), "CopilotPage") },
      { path: "knowledge-performance", Component: KnowledgePerformancePage },
      { path: "saved", ...lazyRoute(() => import("./components/SavedFoldersPage"), "SavedFoldersPage") },
      { path: "saved/:folderId", ...lazyRoute(() => import("./components/SavedFoldersPage"), "SavedFoldersPage") },
      { path: "saved/:folderId/dashboard/:dashboardId", ...lazyRoute(() => import("./components/DashboardPage"), "DashboardPage") },
      { path: "recommended-actions", ...lazyRoute(() => import("./components/RecommendedActionsPage"), "RecommendedActionsPage") },
      { path: "actions/history", ...lazyRoute(() => import("./components/ActionsHistoryPage"), "ActionsHistoryPage") },
      { path: "insights", ...lazyRoute(() => import("./components/AllInsightsPage"), "AllInsightsPage") },
      { path: "settings", ...lazyRoute(() => import("./components/SettingsPage"), "SettingsPage") },
      { path: "dashboard/:dashboardId", ...lazyRoute(() => import("./components/DashboardPage"), "DashboardPage") },
      { path: "project/:projectId/dashboard/:dashboardId", ...lazyRoute(() => import("./components/DashboardPage"), "DashboardPage") },
      { path: "saved/dashboard/:dashboardId", ...lazyRoute(() => import("./components/DashboardPage"), "DashboardPage") },
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
