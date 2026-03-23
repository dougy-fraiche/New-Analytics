import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";
import { ThemeProvider } from "next-themes";
import { RootLayout } from "./components/RootLayout";
import { ExplorePage } from "./components/ExplorePage";
import { AlertCircle } from "lucide-react";

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
    path: "/",
    Component: RootLayout,
    ErrorBoundary: ErrorBoundary,
    HydrateFallback: HydrateFallback,
    children: [
      { index: true, Component: ExplorePage },
      { path: "conversation/:conversationId", Component: ExplorePage },
      { path: "conversations", ...lazyRoute(() => import("./components/AllConversationsPage"), "AllConversationsPage") },
      { path: "automation-opportunities", ...lazyRoute(() => import("./components/AutomationOpportunitiesPage"), "AutomationOpportunitiesPage") },
      { path: "observability", ...lazyRoute(() => import("./components/ObservabilityPage"), "ObservabilityPage") },
      { path: "observability/:categoryId", ...lazyRoute(() => import("./components/ObservabilityCategoryPage"), "ObservabilityCategoryPage") },
      { path: "observability/:categoryId/:dashboardId", ...lazyRoute(() => import("./components/ObservabilityCategoryPage"), "ObservabilityCategoryPage") },
      { path: "saved", ...lazyRoute(() => import("./components/SavedFoldersPage"), "SavedFoldersPage") },
      { path: "saved/:folderId", ...lazyRoute(() => import("./components/SavedFoldersPage"), "SavedFoldersPage") },
      { path: "saved/:folderId/dashboard/:dashboardId", ...lazyRoute(() => import("./components/DashboardPage"), "DashboardPage") },
      { path: "pinned", ...lazyRoute(() => import("./components/FavoritesPage"), "FavoritesPage") },
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
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <RouterProvider router={router} fallbackElement={null} />
    </ThemeProvider>
  );
}