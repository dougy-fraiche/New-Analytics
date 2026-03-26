import { Outlet, useLocation, useParams, useNavigate } from "react-router";
import { useState, useMemo } from "react";
import { SidebarProvider } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNavBar } from "./TopNavBar";
import { SearchOverlay } from "./SearchOverlay";
import { ConversationProvider, useConversations } from "../contexts/ConversationContext";
import { ProjectProvider, useProjects } from "../contexts/ProjectContext";
import { DashboardChatProvider } from "../contexts/DashboardChatContext";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { findOotbDashboardById, ootbCategories } from "../data/ootb-dashboards";
import { ChatPanelSlotContext } from "../contexts/ChatPanelSlotContext";
import { HeaderActionsSlotContext } from "../contexts/HeaderActionsSlotContext";
import { Toaster } from "./ui/sonner";
import { KeyboardShortcutProvider, useKeyboardShortcut } from "../hooks/useKeyboardShortcuts";
import { PortalContainerContext } from "../contexts/PortalContainerContext";

/** Inner layout — safely consumes all providers mounted by the outer RootLayout wrapper. */
function RootLayoutInner() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatPanelSlot, setChatPanelSlot] = useState<HTMLDivElement | null>(null);
  const [headerActionsSlot, setHeaderActionsSlot] = useState<HTMLDivElement | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { conversations } = useConversations();
  const { projects, standaloneDashboards } = useProjects();

  // Navigate to Explore on "E" key — registered via central shortcut registry.
  // Disabled when the search overlay is open so single-key shortcuts don't
  // interfere with the search input.
  useKeyboardShortcut(
    searchOpen
      ? null
      : {
          id: "global:explore-navigate",
          key: "e",
          handler: (e: KeyboardEvent) => {
            e.preventDefault();
            navigate("/");
            setTimeout(() => {
              window.dispatchEvent(new Event("focusExploreInput"));
            }, 50);
          },
          priority: 0,
        },
  );

  // Generate breadcrumbs based on current route (memoized to avoid recomputation)
  const breadcrumbs = useMemo(() => {
    // Root pages — no breadcrumb title needed (sidebar already indicates context)
    if (location.pathname === "/") {
      return [];
    }

    if (location.pathname === "/observability") {
      return [];
    }

    if (location.pathname === "/automation-opportunities") {
      return [];
    }

    // Observability category folder
    if (location.pathname.startsWith("/observability/") && params.categoryId) {
      const category = ootbCategories.find((c) => c.id === params.categoryId);
      if (category) {
        return [
          { label: "Observability", href: "/observability" },
          { label: category.name },
        ];
      }
    }

    if (location.pathname === "/saved") {
      return [];
    }

    // Pinned
    if (location.pathname === "/pinned") {
      return [];
    }

    // Recommended Actions
    if (location.pathname === "/recommended-actions") {
      return [];
    }

    // Action History
    if (location.pathname === "/actions/history") {
      return [];
    }

    // All Insights
    if (location.pathname === "/insights") {
      return [];
    }

    // Settings
    if (location.pathname === "/settings") {
      return [];
    }

    // All Conversations page (sub of Explore)
    if (location.pathname === "/conversations") {
      return [
        { label: "Explore", href: "/" },
        { label: "All Conversations" },
      ];
    }

    // Individual conversation
    if (params.conversationId) {
      const conversation = conversations.find(c => c.id === params.conversationId);
      if (conversation) {
        // Find the latest dashboard title from messages — only show a title crumb once insights are loaded
        let latestDashboardTitle: string | null = null;
        for (let i = conversation.messages.length - 1; i >= 0; i--) {
          if (conversation.messages[i].dashboardData) {
            latestDashboardTitle = conversation.messages[i].dashboardData!.title;
            break;
          }
        }
        if (latestDashboardTitle) {
          return [
            { label: "Explore", href: "/" },
            { label: latestDashboardTitle },
          ];
        }
        // No dashboard yet — show a generic crumb so the user can navigate back
        return [{ label: "Explore", href: "/" }, { label: "New Thread" }];
      }
    }

    // Observability dashboard
    if (location.pathname.startsWith("/dashboard/")) {
      const dashboardId = params.dashboardId;
      const ootbInfo = dashboardId ? findOotbDashboardById(dashboardId) : undefined;
      const dashboardName = ootbInfo?.name || "Dashboard";
      const crumbs: { label: string; href?: string }[] = [
        { label: "Observability", href: "/observability" },
      ];
      if (ootbInfo?.categoryName && ootbInfo?.categoryId) {
        crumbs.push({ label: ootbInfo.categoryName, href: `/observability/${ootbInfo.categoryId}` });
      }
      crumbs.push({ label: dashboardName });
      return crumbs;
    }

    // Standalone custom dashboard (not in a folder)
    if (location.pathname.startsWith("/saved/dashboard/") && params.dashboardId) {
      const standaloneDb = standaloneDashboards.find(d => d.id === params.dashboardId);
      return [
        { label: "Saved", href: "/saved" },
        { label: standaloneDb?.name || "Dashboard" },
      ];
    }

    // Saved folder view
    if (location.pathname.startsWith("/saved/") && params.folderId) {
      const folder = projects.find(p => p.id === params.folderId);
      if (folder) {
        // Check if we're viewing a dashboard within the folder
        if (location.pathname.includes("/dashboard/")) {
          const dashboard = folder.dashboards.find(d => d.id === params.dashboardId);
          return [
            { label: "Saved", href: "/saved" },
            { label: folder.name, href: `/saved/${folder.id}` },
            { label: dashboard?.name || "Dashboard" },
          ];
        }
        // Just viewing the folder
        return [
          { label: "Saved", href: "/saved" },
          { label: folder.name },
        ];
      }
    }

    // Project dashboard (saved dashboard)
    if (location.pathname.startsWith("/project/") && params.projectId && params.dashboardId) {
      const project = projects.find(p => p.id === params.projectId);
      const dashboard = project?.dashboards.find(d => d.id === params.dashboardId);
      if (project && dashboard) {
        return [
          { label: "Saved", href: "/saved" },
          { label: project.name, href: `/saved/${project.id}` },
          { label: dashboard.name },
        ];
      }
    }

    return [];
  }, [location.pathname, params, conversations, projects, standaloneDashboards]);

  // Check if current route needs full-height layout (no outer scroll/padding — page manages its own)
  const isFullHeightPage =
    location.pathname.includes('/dashboard') ||
    location.pathname.startsWith('/conversation/') ||
    location.pathname === '/' ||
    location.pathname === '/insights' ||
    location.pathname === '/automation-opportunities' ||
    (location.pathname.startsWith('/observability/') && location.pathname !== '/observability');

  return (
    <PortalContainerContext.Provider value={portalContainer}>
    <ChatPanelSlotContext.Provider value={chatPanelSlot}>
      <HeaderActionsSlotContext.Provider value={headerActionsSlot}>
        <SidebarProvider className="h-screen w-full">
          <div className="flex h-full w-full">
            <AppSidebar />
            <div className="flex flex-1 flex-col min-w-0 min-h-0">
              <TopNavBar
                onSearchClick={() => setSearchOpen(true)}
                breadcrumbs={breadcrumbs}
                onActionsSlotRef={setHeaderActionsSlot}
              />
              <div data-panel-container className="flex flex-1 min-w-0 min-h-0">
                <div className="flex-1 flex flex-col min-w-0" style={{ minWidth: "min(420px, 100%)" }}>
                  <main className={`flex-1 ${isFullHeightPage ? 'flex flex-col min-h-0 overflow-hidden' : 'overflow-auto'}`}>
                    <div
                      className={`w-full min-h-0 ${isFullHeightPage ? 'flex flex-1 min-h-0 flex-col' : ''}`}
                    >
                      <Outlet />
                    </div>
                  </main>
                </div>
                {/* Portal target for chat panels — pages render into this via createPortal */}
                <div ref={setChatPanelSlot} className="min-w-0" />
              </div>
            </div>
          </div>
          <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
          <Toaster position="bottom-right" />
        </SidebarProvider>
        {/* Portal container for all Radix flyout menus (dropdowns, popovers, tooltips, etc.)
            Keeps portals inside our React tree so they work in Figma's sandboxed iframe.
            Fixed overlay ensures portaled content is never clipped by overflow on ancestors. */}
        <div
          ref={setPortalContainer}
          id="radix-portal-root"
          className="fixed inset-0 pointer-events-none overflow-visible z-[9999] [&>*]:pointer-events-auto"
        />
      </HeaderActionsSlotContext.Provider>
    </ChatPanelSlotContext.Provider>
    </PortalContainerContext.Provider>
  );
}

/** Top-level layout route: wraps children with all app providers,
 *  then renders the inner layout that consumes them. */
export function RootLayout() {
  return (
    <KeyboardShortcutProvider>
      <ConversationProvider>
        <ProjectProvider>
          <DashboardChatProvider>
            <DndProvider backend={HTML5Backend}>
              <RootLayoutInner />
            </DndProvider>
          </DashboardChatProvider>
        </ProjectProvider>
      </ConversationProvider>
    </KeyboardShortcutProvider>
  );
}