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
import { findOotbDashboardById } from "../data/ootb-dashboards";
import { ChatPanelSlotContext } from "../contexts/ChatPanelSlotContext";
import { HeaderActionsSlotContext } from "../contexts/HeaderActionsSlotContext";
import { Toaster } from "./ui/sonner";
import { KeyboardShortcutProvider, useKeyboardShortcut } from "../hooks/useKeyboardShortcuts";
import { PortalContainerContext } from "../contexts/PortalContainerContext";
import { CreateAIAgentJobsProvider, useCreateAIAgentJobs } from "../contexts/CreateAIAgentJobsContext";
import { DashboardChatPanel } from "./DashboardChatPanel";
import { resolveAiAssistantRouteContext } from "../lib/resolve-ai-assistant-route-context";
import {
  GLOBAL_AI_ASSISTANT_KEY,
  getExploreConversationAssistantKey,
} from "../lib/ai-assistant-global";
import { AiAssistantPanelControlProvider } from "../contexts/AiAssistantPanelControlContext";
import { ROUTES } from "../routes";
import { cn } from "./ui/utils";
import { topInsightsCards } from "../data/explore-data";
import {
  findProjectBySlug,
  findProjectDashboardBySlugs,
  findStandaloneDashboardBySlug,
  getSavedFolderPath,
} from "../lib/saved-slugs";

const AI_ASSISTANT_OPEN_STORAGE_KEY = "ai-assistant-panel-open";
const WIDGET_AI_MESSAGE_SENT_EVENT = "widget-ai-message-sent";
/** Fallback until ResizeObserver runs; matches `CHAT_PANEL_DEFAULT_WIDTH_REM` in DashboardChatPanel (22 × 16px). */
const CHAT_PANEL_FALLBACK_WIDTH_PX = 352;

/** Inner layout — safely consumes all providers mounted by the outer RootLayout wrapper. */
function RootLayoutInner() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [chatPanelSlot, setChatPanelSlot] = useState<HTMLDivElement | null>(null);
  const [chatPanelWidthPx, setChatPanelWidthPx] = useState(0);
  /** When true, main shell width tracks the panel immediately (no CSS transition lag). */
  const [assistantPanelResizing, setAssistantPanelResizing] = useState(false);
  const [headerActionsSlot, setHeaderActionsSlot] = useState<HTMLDivElement | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const { getAgentById } = useCreateAIAgentJobs();
  const { conversations } = useConversations();
  const { projects, standaloneDashboards } = useProjects();

  /** Explore hero route (`/`). */
  const isExploreHome = location.pathname === "/";

  /** Explore home (`/`) only — hero gradient sits on the page canvas; conversation + all other routes use white `main`. */
  const isExploreRoute = location.pathname === "/";
  const isCopilotRoute =
    location.pathname === ROUTES.COPILOT ||
    location.pathname.startsWith(`${ROUTES.COPILOT}/`);
  const isKnowledgePerformanceRoute =
    location.pathname === ROUTES.KNOWLEDGE_PERFORMANCE ||
    location.pathname.startsWith(`${ROUTES.KNOWLEDGE_PERFORMANCE}/`);

  const [aiAssistantPreferredOpen, setAiAssistantPreferredOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(AI_ASSISTANT_OPEN_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [aiAssistantOpen, setAiAssistantOpenState] = useState(
    () => aiAssistantPreferredOpen,
  );

  const setAiAssistantOpen = useCallback((open: boolean) => {
    setAiAssistantOpenState(open);
    setAiAssistantPreferredOpen(open);
    try {
      window.sessionStorage.setItem(AI_ASSISTANT_OPEN_STORAGE_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const openPanel = useCallback(() => {
    setAiAssistantOpen(true);
  }, [setAiAssistantOpen]);

  const handleTopNavAskAiToggle = useCallback((open: boolean) => {
    setAiAssistantOpen(open);
  }, [setAiAssistantOpen]);

  // Open the assistant automatically when viewing an Explore conversation thread.
  useEffect(() => {
    if (location.pathname.startsWith("/conversation/")) {
      setAiAssistantOpen(true);
    }
  }, [location.pathname, setAiAssistantOpen]);

  // When a widget sends a prompt, ensure the global assistant panel is open.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ persistKey?: string }>).detail;
      if (detail?.persistKey && detail.persistKey !== GLOBAL_AI_ASSISTANT_KEY) return;
      setAiAssistantOpen(true);
    };

    window.addEventListener(WIDGET_AI_MESSAGE_SENT_EVENT, handler as EventListener);
    return () => window.removeEventListener(WIDGET_AI_MESSAGE_SENT_EVENT, handler as EventListener);
  }, [setAiAssistantOpen]);

  useEffect(() => {
    if (!chatPanelSlot) {
      setChatPanelWidthPx(0);
      return;
    }
    const el = chatPanelSlot;
    const measure = () => setChatPanelWidthPx(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [chatPanelSlot]);

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

    if (location.pathname === "/automation-opportunities") {
      return [{ label: "Automation Opportunities" }];
    }

    if (location.pathname === ROUTES.OBSERVABILITY) {
      return [{ label: "Observability" }];
    }

    if (
      params.agentId &&
      location.pathname.startsWith(`${ROUTES.AUTOMATION_OPPORTUNITIES}/agent/`)
    ) {
      const agent = getAgentById(params.agentId);
      return [
        { label: "Automation Opportunities", href: ROUTES.AUTOMATION_OPPORTUNITIES },
        { label: agent?.scopeTitle ?? decodeURIComponent(params.agentId) ?? "Agent" },
      ];
    }

    if (
      location.pathname === ROUTES.AI_AGENTS ||
      location.pathname.startsWith(`${ROUTES.AI_AGENTS}/`)
    ) {
      return [
        { label: "Observability", href: ROUTES.OBSERVABILITY },
        { label: "AI Agents" },
      ];
    }

    if (isCopilotRoute) {
      return [
        { label: "Observability", href: ROUTES.OBSERVABILITY },
        { label: "Copilot" },
      ];
    }

    if (isKnowledgePerformanceRoute) {
      return [
        { label: "Observability", href: ROUTES.OBSERVABILITY },
        { label: "Knowledge Performance" },
      ];
    }

    if (location.pathname === "/saved") {
      return [{ label: "Saved" }];
    }

    // Recommended Actions
    if (location.pathname === "/recommended-actions") {
      return [{ label: "Recommended Actions" }];
    }

    // Actions history
    if (location.pathname === "/actions/history") {
      return [{ label: "History" }];
    }

    // All Insights
    if (location.pathname === "/insights") {
      return [{ label: "All Insights" }];
    }

    // Settings
    if (location.pathname === "/settings") {
      return [{ label: "Settings" }];
    }

    // Conversations list (sub of Explore)
    if (location.pathname === "/conversations") {
      return [
        { label: "Explore", href: "/" },
        { label: "Conversations" },
      ];
    }

    // Individual conversation
    if (params.conversationId) {
      const conversation = conversations.find(c => c.id === params.conversationId);
      if (conversation) {
        return [
          { label: "Explore", href: "/" },
          { label: conversation.name || "New Thread" },
        ];
      }
    }

    if (location.pathname.startsWith("/anomaly-investigation/")) {
      const anomalyInsightId = Number.parseInt(params.insightId ?? "", 10);
      const anomalyInsightTitle = Number.isFinite(anomalyInsightId)
        ? topInsightsCards.find(
            (card) => card.segment === "anomaly" && card.id === anomalyInsightId,
          )?.title
        : undefined;
      return [
        { label: "Explore", href: "/" },
        { label: anomalyInsightTitle || "Anomaly Investigation" },
      ];
    }

    // Standalone OOTB dashboard URLs
    if (location.pathname.startsWith("/dashboard/")) {
      const dashboardId = params.dashboardId;
      const ootbInfo = dashboardId ? findOotbDashboardById(dashboardId) : undefined;
      const dashboardName = ootbInfo?.name || "Dashboard";
      if (ootbInfo?.categoryName) {
        return [
          { label: "Observability", href: ROUTES.OBSERVABILITY },
          { label: ootbInfo.categoryName },
          { label: dashboardName },
        ];
      }
      return [{ label: "Observability", href: ROUTES.OBSERVABILITY }, { label: dashboardName }];
    }

    if (location.pathname.startsWith("/saved/") && params.folderSlug && params.dashboardSlug) {
      const savedMatch = findProjectDashboardBySlugs(
        projects,
        params.folderSlug,
        params.dashboardSlug,
      );
      if (savedMatch) {
        return [
          { label: "Saved", href: ROUTES.SAVED },
          { label: savedMatch.project.name, href: getSavedFolderPath(savedMatch.project) },
          { label: savedMatch.dashboard.name },
        ];
      }
    }

    if (location.pathname.startsWith("/saved/") && params.savedSlug) {
      const folder = findProjectBySlug(projects, params.savedSlug);
      if (folder) {
        return [
          { label: "Saved", href: ROUTES.SAVED },
          { label: folder.name },
        ];
      }

      const standaloneDashboard = findStandaloneDashboardBySlug(
        standaloneDashboards,
        params.savedSlug,
      );
      if (standaloneDashboard) {
        return [
          { label: "Saved", href: ROUTES.SAVED },
          { label: standaloneDashboard.name },
        ];
      }
    }

    return [];
  }, [
    location.pathname,
    params,
    conversations,
    projects,
    standaloneDashboards,
    getAgentById,
    isCopilotRoute,
    isKnowledgePerformanceRoute,
  ]);

  /** Short label for the AI Assistant input context pill (last breadcrumb, else route fallbacks). */
  const aiPageContextLabel = useMemo(() => {
    let label: string | undefined;
    if (breadcrumbs.length > 0) {
      label = breadcrumbs[breadcrumbs.length - 1]!.label;
    } else if (location.pathname === "/insights") {
      label = "All Insights";
    } else if (
      location.pathname === "/automation-opportunities" ||
      location.pathname.startsWith(`${ROUTES.AUTOMATION_OPPORTUNITIES}/agent/`)
    ) {
      if (params.agentId) {
        label = getAgentById(params.agentId)?.scopeTitle ?? decodeURIComponent(params.agentId) ?? "Agent";
      } else {
        label = "Automation Opportunities";
      }
    } else if (
      location.pathname === ROUTES.AI_AGENTS ||
      location.pathname.startsWith(`${ROUTES.AI_AGENTS}/`)
    ) {
      label = "AI Agents";
    } else if (isCopilotRoute) {
      label = "Copilot";
    } else if (isKnowledgePerformanceRoute) {
      label = "Knowledge Performance";
    } else if (location.pathname === ROUTES.OBSERVABILITY) {
      label = "Observability";
    } else if (location.pathname === "/saved") {
      label = "Saved";
    } else if (location.pathname === "/recommended-actions") {
      label = "Recommended Actions";
    } else if (location.pathname === "/actions/history") {
      label = "History";
    } else if (location.pathname === "/settings") {
      label = "Settings";
    }

    if (location.pathname.startsWith(`${ROUTES.AI_AGENTS}/`) && params.dashboardId) {
      const dash = findOotbDashboardById(params.dashboardId);
      if (dash?.name) label = dash.name;
    }

    const trimmed = label?.trim();
    return trimmed || undefined;
  }, [breadcrumbs, location.pathname, params.dashboardId, params.agentId, getAgentById]);

  const isExploreConversationRoute =
    location.pathname.startsWith("/conversation/") && Boolean(params.conversationId);
  const assistantPersistKey =
    isExploreConversationRoute && params.conversationId
      ? getExploreConversationAssistantKey(params.conversationId)
      : GLOBAL_AI_ASSISTANT_KEY;
  const showAssistantResetButton = !isExploreConversationRoute;

  const isSavedFolderDashboardRoute = Boolean(
    location.pathname.startsWith("/saved/") && params.folderSlug && params.dashboardSlug,
  );
  const isSavedStandaloneDashboardRoute = Boolean(
    location.pathname.startsWith("/saved/") &&
      params.savedSlug &&
      findStandaloneDashboardBySlug(standaloneDashboards, params.savedSlug),
  );

  // Check if current route needs full-height layout (no outer scroll/padding — page manages its own)
  const isFullHeightPage =
    location.pathname.includes("/dashboard") ||
    location.pathname.startsWith("/conversation/") ||
    location.pathname.startsWith("/anomaly-investigation/") ||
    location.pathname === "/" ||
    location.pathname === "/insights" ||
    location.pathname === "/automation-opportunities" ||
    location.pathname.startsWith(`${ROUTES.AUTOMATION_OPPORTUNITIES}/agent/`) ||
    isCopilotRoute ||
    isKnowledgePerformanceRoute ||
    location.pathname === ROUTES.AI_AGENTS ||
    location.pathname.startsWith(`${ROUTES.AI_AGENTS}/`) ||
    isSavedFolderDashboardRoute ||
    isSavedStandaloneDashboardRoute;

  const assistantLayoutInset = aiAssistantOpen;
  const assistantChromeWidthPx =
    !aiAssistantOpen
      ? 0
      : Math.max(chatPanelWidthPx || CHAT_PANEL_FALLBACK_WIDTH_PX, 120);

  return (
    <PortalContainerContext.Provider value={portalContainer}>
    <ChatPanelSlotContext.Provider value={chatPanelSlot}>
      <HeaderActionsSlotContext.Provider value={headerActionsSlot}>
        <AiAssistantPanelControlProvider openPanel={openPanel}>
        <SidebarProvider className="h-screen w-full">
          <div className="relative flex h-full w-full min-h-0 min-w-0 flex-row">
            {/* AI assistant — fixed width, absolutely positioned; revealed when the shell above slides away (no panel entry animation). */}
            <div
              ref={setChatPanelSlot}
              className={cn(
                "absolute inset-y-0 right-0 z-0 flex h-full min-h-0 shrink-0 transition-opacity duration-200 ease-linear",
                aiAssistantOpen ? "opacity-100" : "pointer-events-none opacity-0",
              )}
              aria-hidden={!aiAssistantOpen}
            >
              <DashboardChatPanel
                dashboardId={aiRouteContext.dashboardId}
                sourceOotbId={aiRouteContext.sourceOotbId}
                assistantPersistKey={assistantPersistKey}
                showResetButton={showAssistantResetButton}
                pageContextLabel={aiPageContextLabel}
                onAssistantPanelResizeStart={() => setAssistantPanelResizing(true)}
                onAssistantPanelResizeEnd={() => setAssistantPanelResizing(false)}
              />
            </div>
            {/* App shell — sits above the assistant; width + padding animate to expose the panel behind */}
            <div
              className={cn(
                "relative z-10 flex h-full min-h-0 min-w-0 flex-row",
                !assistantPanelResizing &&
                  "transition-[padding,width] duration-200 ease-linear",
                assistantLayoutInset && "bg-page pt-4 pl-4 pb-4",
              )}
                style={{
                width: !aiAssistantOpen ? "100%" : `calc(100% - ${assistantChromeWidthPx}px)`,
              }}
            >
              <div
                className={cn(
                  "relative flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden transition-[border-radius,box-shadow] duration-200 ease-linear",
                  assistantLayoutInset ? "rounded-xl shadow-md" : "rounded-none shadow-none",
                )}
              >
                <AppSidebar />
                <div
                  data-panel-container
                  className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                  style={{ minWidth: "min(420px, 100%)" }}
                >
                  <TopNavBar
                    onSearchClick={() => setSearchOpen(true)}
                    breadcrumbs={breadcrumbs}
                    onActionsSlotRef={setHeaderActionsSlot}
                    aiAssistantOpen={aiAssistantOpen}
                    onAiAssistantOpenChange={handleTopNavAskAiToggle}
                    aiAssistantDisabled={false}
                  />
                  <main
                    className={cn(
                      "w-full min-h-0 flex-1",
                      isFullHeightPage ? "flex flex-col overflow-hidden" : "overflow-auto",
                      !isExploreRoute && "bg-background",
                    )}
                  >
                    <Outlet />
                  </main>
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
