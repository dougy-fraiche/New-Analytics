import { Outlet, useLocation, useParams, useNavigate } from "react-router";
import { useState, useMemo, useEffect, useCallback } from "react";
import { SidebarProvider } from "./ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopNavBar } from "./TopNavBar";
import { SearchOverlay } from "./SearchOverlay";
import { ConversationProvider, useConversations } from "../contexts/ConversationContext";
import { ProjectProvider, useProjects } from "../contexts/ProjectContext";
import { DashboardChatProvider } from "../contexts/DashboardChatContext";
import { AiAssistantExploreBridgeProvider } from "../contexts/AiAssistantExploreBridgeContext";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { findOotbDashboardById, ootbCategories } from "../data/ootb-dashboards";
import { ChatPanelSlotContext } from "../contexts/ChatPanelSlotContext";
import { HeaderActionsSlotContext } from "../contexts/HeaderActionsSlotContext";
import { Toaster } from "./ui/sonner";
import { KeyboardShortcutProvider, useKeyboardShortcut } from "../hooks/useKeyboardShortcuts";
import { PortalContainerContext } from "../contexts/PortalContainerContext";
import { CreateAIAgentJobsProvider } from "../contexts/CreateAIAgentJobsContext";
import { CreateAIAgentJobsLayer } from "./CreateAIAgentJobsLayer";
import { DashboardChatPanel } from "./DashboardChatPanel";
import { GlobalAiExploreHistorySeed } from "./GlobalAiExploreHistorySeed";
import { resolveAiAssistantRouteContext } from "../lib/resolve-ai-assistant-route-context";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import { AiAssistantPanelControlProvider } from "../contexts/AiAssistantPanelControlContext";

const AI_ASSISTANT_OPEN_STORAGE_KEY = "ai-assistant-panel-open";
const WIDGET_AI_MESSAGE_SENT_EVENT = "widget-ai-message-sent";

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

  /** Explore hero only — AI panel is collapsed/disabled here; conversation URLs use the global panel. */
  const isExploreHome = location.pathname === "/";

  const [aiAssistantOpen, setAiAssistantOpenState] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(AI_ASSISTANT_OPEN_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const setAiAssistantOpen = useCallback((open: boolean) => {
    setAiAssistantOpenState(open);
    try {
      window.sessionStorage.setItem(AI_ASSISTANT_OPEN_STORAGE_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const openPanel = useCallback(() => {
    if (isExploreHome) return;
    setAiAssistantOpen(true);
  }, [isExploreHome, setAiAssistantOpen]);

  useEffect(() => {
    if (isExploreHome) {
      setAiAssistantOpenState(false);
      try {
        window.sessionStorage.setItem(AI_ASSISTANT_OPEN_STORAGE_KEY, "0");
      } catch {
        /* ignore */
      }
    }
  }, [isExploreHome]);

  // Open the assistant automatically when viewing an Explore conversation thread.
  useEffect(() => {
    if (location.pathname.startsWith("/conversation/")) {
      setAiAssistantOpen(true);
    }
  }, [location.pathname, setAiAssistantOpen]);

  // When a widget sends a prompt, ensure the global assistant panel is open.
  useEffect(() => {
    const handler = (e: Event) => {
      if (isExploreHome) return;
      const detail = (e as CustomEvent<{ persistKey?: string }>).detail;
      if (detail?.persistKey && detail.persistKey !== GLOBAL_AI_ASSISTANT_KEY) return;
      setAiAssistantOpen(true);
    };

    window.addEventListener(WIDGET_AI_MESSAGE_SENT_EVENT, handler as EventListener);
    return () => window.removeEventListener(WIDGET_AI_MESSAGE_SENT_EVENT, handler as EventListener);
  }, [isExploreHome, setAiAssistantOpen]);

  const aiRouteContext = useMemo(
    () =>
      resolveAiAssistantRouteContext(location.pathname, params, {
        projects,
        standaloneDashboards,
      }),
    [location.pathname, params, projects, standaloneDashboards],
  );

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
    // Root pages — keep a single breadcrumb visible
    if (location.pathname === "/") {
      return [{ label: "Explore" }];
    }

    if (location.pathname === "/observability") {
      return [{ label: "Observability" }];
    }

    if (location.pathname === "/automation-opportunities") {
      return [{ label: "Automation Opportunities" }];
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
      return [{ label: "Saved" }];
    }

    // Pinned
    if (location.pathname === "/pinned") {
      return [{ label: "Pinned" }];
    }

    // Recommended Actions
    if (location.pathname === "/recommended-actions") {
      return [{ label: "Recommended Actions" }];
    }

    // Action History
    if (location.pathname === "/actions/history") {
      return [{ label: "Action History" }];
    }

    // All Insights
    if (location.pathname === "/insights") {
      return [{ label: "All Insights" }];
    }

    // Settings
    if (location.pathname === "/settings") {
      return [{ label: "Settings" }];
    }

    // Draft Insights list (sub of Explore)
    if (location.pathname === "/conversations") {
      return [
        { label: "Explore", href: "/" },
        { label: "Draft Insights" },
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

  /** Short label for the AI Assistant input context pill (last breadcrumb, else route fallbacks). */
  const aiPageContextLabel = useMemo(() => {
    let label: string | undefined;
    if (breadcrumbs.length > 0) {
      label = breadcrumbs[breadcrumbs.length - 1]!.label;
    } else if (location.pathname === "/insights") {
      label = "All Insights";
    } else if (location.pathname === "/automation-opportunities") {
      label = "Automation Opportunities";
    } else if (location.pathname === "/observability") {
      label = "Observability";
    } else if (location.pathname === "/saved") {
      label = "Saved";
    } else if (location.pathname === "/pinned") {
      label = "Pinned";
    } else if (location.pathname === "/recommended-actions") {
      label = "Recommended Actions";
    } else if (location.pathname === "/actions/history") {
      label = "Action History";
    } else if (location.pathname === "/settings") {
      label = "Settings";
    }

    // Breadcrumbs omit the active tab dashboard on `/observability/:cat/:dash`; use dashboard title for the pill.
    if (
      location.pathname.startsWith("/observability/") &&
      params.categoryId &&
      params.dashboardId
    ) {
      const dash = findOotbDashboardById(params.dashboardId);
      if (dash?.name) label = dash.name;
    }

    const trimmed = label?.trim();
    return trimmed || undefined;
  }, [breadcrumbs, location.pathname, params.categoryId, params.dashboardId]);

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
        <AiAssistantPanelControlProvider openPanel={openPanel}>
        <GlobalAiExploreHistorySeed />
        <SidebarProvider className="h-screen w-full">
          <div className="flex h-full w-full">
            <AppSidebar />
            <div className="flex flex-1 flex-col min-w-0 min-h-0">
              <TopNavBar
                onSearchClick={() => setSearchOpen(true)}
                breadcrumbs={breadcrumbs}
                onActionsSlotRef={setHeaderActionsSlot}
                aiAssistantOpen={aiAssistantOpen}
                onAiAssistantOpenChange={setAiAssistantOpen}
                aiAssistantDisabled={isExploreHome}
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
                {/* Global AI assistant mount; Explore hero (`/`) omits the panel */}
                <div ref={setChatPanelSlot} className="min-w-0 flex shrink-0">
                  {!isExploreHome ? (
                    <div
                      className={[
                        "relative flex shrink-0 overflow-hidden transition-[max-width] duration-200 ease-linear",
                        aiAssistantOpen ? "max-w-[40rem]" : "max-w-0",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "h-full shrink-0 transition-transform duration-200 ease-linear will-change-transform",
                          aiAssistantOpen ? "translate-x-0" : "translate-x-full",
                        ].join(" ")}
                      >
                        <DashboardChatPanel
                          dashboardId={aiRouteContext.dashboardId}
                          sourceOotbId={aiRouteContext.sourceOotbId}
                          pageContextLabel={aiPageContextLabel}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
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
        <CreateAIAgentJobsLayer />
        </AiAssistantPanelControlProvider>
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
            <AiAssistantExploreBridgeProvider>
              <DndProvider backend={HTML5Backend}>
                <CreateAIAgentJobsProvider>
                  <RootLayoutInner />
                </CreateAIAgentJobsProvider>
              </DndProvider>
            </AiAssistantExploreBridgeProvider>
          </DashboardChatProvider>
        </ProjectProvider>
      </ConversationProvider>
    </KeyboardShortcutProvider>
  );
}