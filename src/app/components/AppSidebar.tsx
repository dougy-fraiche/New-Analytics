import {
  FolderClosed,
  FolderOpen,
  MoreHorizontal,
  Loader2,
  Pencil,
  Trash2,
  Compass,
  LayoutDashboard,
  FolderInput,
  History,
  Bookmark,
  ChartLine,
  ChevronRight,
  Settings,
  BarChart2,
  PhoneForwarded,
  Headset,
  Eye,
  Clapperboard,
  CalendarClock,
  ClipboardCheck,
  Target,
  Bot,
  GraduationCap,
  MessageSquare,
  Diamond,
  Plus,
  FileBarChart,
  BotMessageSquare,
  BrainCircuit,
  Cable,
  CloudCog,
  type LucideIcon,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { type MouseEvent, type ReactNode, useCallback, useEffect, useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  Sidebar,
  SidebarContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuAction,
} from "./ui/sidebar";
import { Collapsible, CollapsibleContent } from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useConversations } from "../contexts/ConversationContext";
import type { Conversation } from "../contexts/ConversationContext";
import { useProjects, type Dashboard } from "../contexts/ProjectContext";
import { toast } from "sonner";
import { ootbCategories } from "../data/ootb-dashboards";
import { CollapsibleSidebarSection } from "./CollapsibleSidebarSection";
import { SidebarDialogs } from "./SidebarDialogs";
import { useSidebarDialogs } from "../hooks/useSidebarDialogs";
import { usePersistedState } from "../hooks/usePersistedState";
import { useKeyboardShortcut } from "../hooks/useKeyboardShortcuts";
import { useSidebar } from "./ui/sidebar";
import { ROUTES } from "../routes";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";
import {
  getDashboardSlug,
  getProjectSlug,
  validateSavedFolderDashboardName,
  validateSavedStandaloneDashboardName,
} from "../lib/saved-slugs";

interface AppItem {
  name: string;
  icon: LucideIcon;
  active?: boolean;
}

interface AppCategory {
  label: string;
  items: AppItem[];
}

const APP_CATEGORIES: AppCategory[] = [
  {
    label: "General",
    items: [{ name: "Admin", icon: Settings }],
  },
  {
    label: "Omnichannel Routing",
    items: [
      { name: "ACD", icon: PhoneForwarded },
      { name: "Agent", icon: Headset },
      { name: "Supervisor", icon: Eye },
      { name: "Studio", icon: Clapperboard },
    ],
  },
  {
    label: "Workforce Engagement",
    items: [
      { name: "Workforce Management", icon: CalendarClock },
      { name: "QM Analytics", icon: ClipboardCheck },
      { name: "inView PM", icon: Target },
      { name: "Coaching", icon: GraduationCap },
      { name: "Interactions", icon: MessageSquare },
      { name: "My Zone", icon: Diamond },
    ],
  },
  {
    label: "Data & Analytics",
    items: [
      { name: "Analytics", icon: BarChart2, active: true },
      { name: "Dashboard", icon: LayoutDashboard },
      { name: "Reporting", icon: FileBarChart },
      { name: "Self-Service Analytics", icon: BotMessageSquare },
    ],
  },
  {
    label: "Automation",
    items: [{ name: "Workforce Intelligence", icon: BrainCircuit }],
  },
  {
    label: "Partner",
    items: [
      { name: "Adapters", icon: Cable },
      { name: "Partner Hub", icon: CloudCog },
    ],
  },
];

const DASHBOARD_DND_TYPE = "SIDEBAR_DASHBOARD";
const SHOW_KNOWLEDGE_PERFORMANCE_IN_SIDEBAR = false;

interface DashboardDragItem {
  dashboardId: string;
  fromProjectId: string | null;
  dashboardName: string;
}

// Draggable wrapper for dashboard items inside folders
function DraggableDashboardItem({
  dashboard,
  projectId,
  children,
}: {
  dashboard: Dashboard;
  projectId: string | null;
  children: ReactNode;
}) {
  const [{ isDragging }, drag] = useDrag<DashboardDragItem, unknown, { isDragging: boolean }>({
    type: DASHBOARD_DND_TYPE,
    item: { dashboardId: dashboard.id, fromProjectId: projectId, dashboardName: dashboard.name },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.4 : 1 }} className="w-full transition-opacity">
      {children}
    </div>
  );
}

// Droppable wrapper for folder items in the sidebar
function DroppableFolderWrapper({
  projectId,
  onDrop,
  children,
}: {
  projectId: string;
  onDrop: (item: DashboardDragItem) => void;
  children: ReactNode;
}) {
  const [{ isOver, canDrop }, drop] = useDrop<DashboardDragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: DASHBOARD_DND_TYPE,
    canDrop: (item) => item.fromProjectId !== projectId,
    drop: (item) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`w-full rounded-md transition-colors ${isOver && canDrop ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
    >
      {children}
    </div>
  );
}

// Droppable wrapper for the Saved root location (dashboards not in a folder)
function DroppableSavedRootWrapper({
  onDrop,
  children,
}: {
  onDrop: (item: DashboardDragItem) => void;
  children: ReactNode;
}) {
  const [{ isOver, canDrop }, drop] = useDrop<DashboardDragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: DASHBOARD_DND_TYPE,
    canDrop: (item) => item.fromProjectId !== null,
    drop: (item, monitor) => {
      // If a nested folder target handled this already, do nothing.
      if (monitor.didDrop()) return;
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  return (
    <div
      ref={drop}
      className={`w-full rounded-md transition-colors ${isOver && canDrop ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
    >
      {children}
    </div>
  );
}

/** Submenu row: keep label truncated while overflow ··· menu is open (focus moves to portal). */
const SUB_ITEM_ROW_WRAPPER_CLASS =
  "relative group/subitem has-[button[data-state=open]]:[&_[data-sidebar=menu-sub-button]]:pr-8";

/** 20×20 control, rounded-sm — shared by submenu overflow triggers and Saved “New folder”. */
const SUB_ITEM_ICON_BUTTON_BOX =
  "flex h-5 w-5 shrink-0 items-center justify-center rounded-sm p-0 text-sidebar-foreground outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-0";

const SUB_ITEM_OVERFLOW_TRIGGER_CLASS = cn(
  SUB_ITEM_ICON_BUTTON_BOX,
  "absolute right-2.5 top-1/2 -translate-y-1/2 opacity-0 group-focus-within/subitem:opacity-100 group-hover/subitem:opacity-100 data-[state=open]:opacity-100",
);

function SubItemOverflowDropdown({
  tooltip,
  srLabel,
  children,
}: {
  tooltip: string;
  srLabel: string;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button type="button" className={SUB_ITEM_OVERFLOW_TRIGGER_CLASS}>
              <MoreHorizontal className="h-3.5 w-3.5" />
              <span className="sr-only">{srLabel}</span>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6} align="center">
          {tooltip}
        </TooltipContent>
      </Tooltip>
      {children}
    </DropdownMenu>
  );
}

function isConversationAssistantInFlight(conversation: Conversation): boolean {
  const last = conversation.messages[conversation.messages.length - 1];
  if (!last || last.role !== "assistant") return false;
  if (last.isTypingContent) return true;
  if (!(last.content ?? "").trim()) return true;
  return Boolean(last.toolSteps?.some((step) => step.status === "running"));
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, openMobile, setOpenMobile, state: sidebarState } = useSidebar();
  const { conversations } = useConversations();
  const {
    projects,
    moveDashboardToProject,
    moveDashboardToStandalone,
    moveStandaloneToFolder,
    standaloneDashboards,
  } = useProjects();

  // Persisted collapse states
  const [exploreOpen, setExploreOpen] = usePersistedState("sidebar-explore-open", true);
  const [observabilityOpen, setObservabilityOpen] = usePersistedState("sidebar-observability-open", true);
  const [savedOpen, setSavedOpen] = usePersistedState("sidebar-saved-open", true);
  const [folderOpenState, setFolderOpenState] = usePersistedState<Record<string, boolean>>("sidebar-folders-open", {});

  // Dialog state (extracted into hook + reducer)
  const dialogs = useSidebarDialogs({
    onFolderCreated: (project) => {
      setSavedOpen(true);
      setFolderOpenState((prev) => ({ ...prev, [project.id]: true }));
    },
  });
  const { state: dialogState, dispatch } = dialogs;

  const isFolderOpen = (projectId: string) => folderOpenState[projectId] ?? false;
  const toggleFolder = (projectId: string, open: boolean) => {
    setFolderOpenState((prev) => ({ ...prev, [projectId]: open }));
  };

  const activeConversations = conversations.filter((c) => !c.archived);
  const visibleConversations = activeConversations.slice(0, 5);
  const hasMore = activeConversations.length > 5;
  const previousConversationInFlightRef = useRef<Map<string, boolean>>(new Map());
  const conversationPrefix = ROUTES.CONVERSATION("");

  const activeConversationId =
    location.pathname.startsWith(conversationPrefix)
      ? location.pathname.replace(conversationPrefix, "")
      : null;
  const isSidebarCollapsed = sidebarState === "collapsed";
  const isExploreSectionRoute =
    location.pathname === ROUTES.EXPLORE ||
    location.pathname === ROUTES.CONVERSATIONS ||
    location.pathname.startsWith(conversationPrefix);
  const isObservabilitySectionRoute =
    location.pathname === ROUTES.OBSERVABILITY ||
    location.pathname.startsWith(`${ROUTES.OBSERVABILITY}/`);
  const isSavedSectionRoute =
    location.pathname === ROUTES.SAVED ||
    location.pathname.startsWith(`${ROUTES.SAVED}/`);
  const isExploreHeaderActive = isSidebarCollapsed
    ? isExploreSectionRoute
    : location.pathname === ROUTES.EXPLORE;
  const isObservabilityHeaderActive = isSidebarCollapsed
    ? isObservabilitySectionRoute
    : location.pathname === ROUTES.OBSERVABILITY;
  const isSavedHeaderActive = isSidebarCollapsed
    ? isSavedSectionRoute
    : location.pathname === ROUTES.SAVED;

  const folderPath = (projectName: string) => ROUTES.SAVED_FOLDER(getProjectSlug({ name: projectName }));
  const folderDashboardPath = (projectName: string, dashboardName: string) =>
    ROUTES.SAVED_FOLDER_DASHBOARD(
      getProjectSlug({ name: projectName }),
      getDashboardSlug({ name: dashboardName }),
    );
  const standaloneDashboardPath = (dashboardName: string) =>
    ROUTES.SAVED_STANDALONE_DASHBOARD(getDashboardSlug({ name: dashboardName }));

  useEffect(() => {
    const nextConversationInFlight = new Map<string, boolean>();

    for (const conversation of activeConversations) {
      const currentlyInFlight = isConversationAssistantInFlight(conversation);
      const wasInFlight = previousConversationInFlightRef.current.get(conversation.id);

      if (wasInFlight && !currentlyInFlight && activeConversationId !== conversation.id) {
        toast.success("Conversation ready", {
          description: `"${conversation.name}" finished processing.`,
          action: {
            label: "Open",
            onClick: () => navigate(ROUTES.CONVERSATION(conversation.id)),
          },
        });
      }

      nextConversationInFlight.set(conversation.id, currentlyInFlight);
    }

    previousConversationInFlightRef.current = nextConversationInFlight;
  }, [activeConversationId, activeConversations, navigate]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useKeyboardShortcut([
    {
      id: "sidebar:toggle-observability",
      key: "O",
      shift: true,
      handler: (e: KeyboardEvent) => {
        e.preventDefault();
        setObservabilityOpen((prev) => !prev);
      },
    },
    {
      id: "sidebar:toggle-saved",
      key: "S",
      shift: true,
      handler: (e: KeyboardEvent) => {
        e.preventDefault();
        setSavedOpen((prev) => !prev);
      },
    },
  ]);

  // ── DnD handler ───────────────────────────────────────────────────────
  const handleDndDrop = (item: DashboardDragItem, toProjectId: string) => {
    const validationError = validateSavedFolderDashboardName(
      toProjectId,
      item.dashboardName,
      projects,
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (item.fromProjectId) {
      moveDashboardToProject(item.fromProjectId, item.dashboardId, toProjectId);
    } else {
      moveStandaloneToFolder(item.dashboardId, toProjectId);
    }
    const targetFolder = projects.find((p) => p.id === toProjectId);
    toast.success("Dashboard moved", {
      description: `"${item.dashboardName}" has been moved to "${targetFolder?.name}".`,
    });
  };

  const handleSavedRootDndDrop = (item: DashboardDragItem) => {
    if (!item.fromProjectId) return;
    const validationError = validateSavedStandaloneDashboardName(
      item.dashboardName,
      projects,
      standaloneDashboards,
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }
    moveDashboardToStandalone(item.fromProjectId, item.dashboardId);
    toast.success("Dashboard moved", {
      description: `"${item.dashboardName}" has been moved to "Saved".`,
    });
  };

  const handleSidebarContentClickCapture = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (!isMobile || !openMobile) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest("a[href]")) return;
    setOpenMobile(false);
  }, [isMobile, openMobile, setOpenMobile]);

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="group-data-[side=left]:border-r-0 group-data-[side=right]:border-l-0 [&_[data-slot=sidebar-inner]]:bg-transparent"
      >
        <SidebarContent
          className="gap-1 pt-4 group-data-[collapsible=icon]:pt-4"
          onClickCapture={handleSidebarContentClickCapture}
        >
          {/* Explore — collapsible conversation threads (`E` still navigates to Explore via RootLayout) */}
          <CollapsibleSidebarSection
            icon={Compass}
            label="Explore"
            path={ROUTES.EXPLORE}
            open={exploreOpen}
            onToggle={setExploreOpen}
            headerIsActive={isExploreHeaderActive}
          >
            {activeConversations.length === 0 ? (
              <SidebarMenuSubItem>
                <span className="px-2 py-1.5 text-xs text-muted-foreground">No conversations yet</span>
              </SidebarMenuSubItem>
            ) : (
              <>
                {visibleConversations.map((conversation) => {
                  const conversationPath = ROUTES.CONVERSATION(conversation.id);
                  const isActive = location.pathname === conversationPath;
                  const assistantInFlight = isConversationAssistantInFlight(conversation);
                  return (
                    <SidebarMenuSubItem key={conversation.id}>
                      <div className={SUB_ITEM_ROW_WRAPPER_CLASS}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive}
                          className={cn(
                            "group-hover/subitem:pr-8 group-focus-within/subitem:pr-8",
                            assistantInFlight && "pr-8",
                          )}
                        >
                          <Link to={conversationPath}>
                            <span className="truncate">{conversation.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                        {assistantInFlight ? (
                          <span
                            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-opacity duration-150 group-hover/subitem:opacity-0 group-focus-within/subitem:opacity-0"
                            aria-label="Assistant is thinking"
                          >
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                          </span>
                        ) : null}
                        <SubItemOverflowDropdown
                          tooltip="More options"
                          srLabel={`More options for ${conversation.name}`}
                        >
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuItem
                              onClick={() =>
                                dispatch({
                                  type: "OPEN_RENAME_CONVERSATION",
                                  payload: { conversationId: conversation.id, name: conversation.name },
                                })
                              }
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => dialogs.handleDeleteConversation(conversation.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </SubItemOverflowDropdown>
                      </div>
                    </SidebarMenuSubItem>
                  );
                })}
                {hasMore && (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={location.pathname === ROUTES.CONVERSATIONS}>
                      <Link to={ROUTES.CONVERSATIONS} className="text-muted-foreground">
                        <span>View all →</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )}
              </>
            )}
          </CollapsibleSidebarSection>

          <div className="flex flex-col gap-0">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Actions</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === ROUTES.ACTIONS_HISTORY} tooltip="History">
                  <Link to={ROUTES.ACTIONS_HISTORY}>
                    <History />
                    <span>History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          {/* Dashboards heading */}
          <div className="pt-2 group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Dashboards</SidebarGroupLabel>
          </div>

          <div className="py-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={
                    location.pathname === ROUTES.AUTOMATION_OPPORTUNITIES ||
                    location.pathname.startsWith(ROUTES.AUTOMATION_OPPORTUNITIES_AGENT(""))
                  }
                  tooltip="Automation Opportunities"
                >
                  <Link to={ROUTES.AUTOMATION_OPPORTUNITIES}>
                    <Bot />
                    <span>Automation Opportunities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          <CollapsibleSidebarSection
            icon={ChartLine}
            label="Observability"
            path={ROUTES.OBSERVABILITY}
            open={observabilityOpen}
            onToggle={setObservabilityOpen}
            headerIsActive={isObservabilityHeaderActive}
          >
            {(() => {
              const aiAgentsCategory = ootbCategories.find((c) => c.id === "ai-agents");
              if (!aiAgentsCategory?.dashboards.length) return null;
              const overviewId =
                aiAgentsCategory.dashboards.find((d) => d.id !== "ai-agents-copilot")?.id ??
                aiAgentsCategory.dashboards[0]!.id;
              const onAiAgentsRoute =
                location.pathname === ROUTES.AI_AGENTS ||
                location.pathname.startsWith(`${ROUTES.AI_AGENTS}/`);
              const isCopilotRoute =
                location.pathname === ROUTES.COPILOT ||
                location.pathname.startsWith(`${ROUTES.COPILOT}/`);
              const isKnowledgePerformanceRoute =
                location.pathname === ROUTES.KNOWLEDGE_PERFORMANCE ||
                location.pathname.startsWith(`${ROUTES.KNOWLEDGE_PERFORMANCE}/`);
              const parentNavActive = onAiAgentsRoute && !isCopilotRoute;

              return (
                <>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={parentNavActive}>
                      <Link to={ROUTES.AI_AGENTS_DASHBOARD(overviewId)}>
                        <span className="truncate">{aiAgentsCategory.name}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild isActive={isCopilotRoute}>
                      <Link to={ROUTES.COPILOT}>
                        <span className="truncate">Copilot</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  {SHOW_KNOWLEDGE_PERFORMANCE_IN_SIDEBAR && (
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild isActive={isKnowledgePerformanceRoute}>
                        <Link to={ROUTES.KNOWLEDGE_PERFORMANCE}>
                          <span className="truncate">Knowledge Performance</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  )}
                </>
              );
            })()}
          </CollapsibleSidebarSection>

          {/* Saved (user-created) Dashboards */}
          <DroppableSavedRootWrapper onDrop={handleSavedRootDndDrop}>
            <CollapsibleSidebarSection
              icon={Bookmark}
              label="Saved"
              path={ROUTES.SAVED}
              open={savedOpen}
              onToggle={setSavedOpen}
              headerIsActive={isSavedHeaderActive}
              itemAction={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuAction
                      className={cn(
                        "static inset-auto translate-none bg-transparent after:hidden [&>svg]:h-3.5 [&>svg]:w-3.5",
                        SUB_ITEM_ICON_BUTTON_BOX,
                      )}
                      aria-label="New folder"
                      onMouseDown={(e) => {
                        if (e.button === 0) e.preventDefault();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        dispatch({ type: "OPEN_NEW_PROJECT" });
                      }}
                    >
                      <Plus />
                    </SidebarMenuAction>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={6} align="center">
                    New folder
                  </TooltipContent>
                </Tooltip>
              }
            >
            {projects.length === 0 && standaloneDashboards.length === 0 && (
              <SidebarMenuSubItem>
                <span className="px-2 py-1.5 text-xs text-muted-foreground">No saved dashboards yet</span>
              </SidebarMenuSubItem>
            )}

            {/* User-created folder/projects */}
            {projects.map((project) => {
              const folderOpen = isFolderOpen(project.id);
              return (
              <DroppableFolderWrapper
                key={project.id}
                projectId={project.id}
                onDrop={(item) => handleDndDrop(item, project.id)}
              >
                <Collapsible
                  open={folderOpen}
                  onOpenChange={(open) => toggleFolder(project.id, open)}
                  className="w-full group/collapsible"
                >
                  <SidebarMenuSubItem>
                    <div className={SUB_ITEM_ROW_WRAPPER_CLASS}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={location.pathname === folderPath(project.name)}
                        className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8 p-0"
                      >
                        <div className="group/folder-row relative flex h-7 w-full min-w-0 items-center gap-2 px-2 has-[button:focus-visible]:[&_[data-folder-row-icon]>svg]:opacity-0">
                          <Link
                            to={folderPath(project.name)}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-sm outline-hidden ring-sidebar-ring focus-visible:ring-2"
                          >
                            <span
                              data-folder-row-icon
                              className="relative inline-flex size-4 shrink-0 items-center justify-center"
                            >
                              {folderOpen ? (
                                <FolderOpen
                                  className="size-4 shrink-0 opacity-100 group-hover/folder-row:opacity-0"
                                  aria-hidden
                                />
                              ) : (
                                <FolderClosed
                                  className="size-4 shrink-0 opacity-100 group-hover/folder-row:opacity-0"
                                  aria-hidden
                                />
                              )}
                            </span>
                            <span className="truncate">{project.name}</span>
                          </Link>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-expanded={folderOpen}
                                aria-label={folderOpen ? "Collapse" : "Expand"}
                                className="absolute left-2 top-1/2 z-10 flex size-4 -translate-y-1/2 items-center justify-center rounded-sm text-sidebar-foreground outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-0 opacity-0 pointer-events-none group-hover/folder-row:pointer-events-auto group-hover/folder-row:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
                                onMouseDown={(e) => {
                                  if (e.button === 0) e.preventDefault();
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleFolder(project.id, !folderOpen);
                                }}
                              >
                                <ChevronRight
                                  className={`size-4 shrink-0 ${folderOpen ? "rotate-90" : ""}`}
                                  aria-hidden
                                />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={6} align="center">
                              {folderOpen ? "Collapse" : "Expand"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </SidebarMenuSubButton>
                      <SubItemOverflowDropdown
                        tooltip="More options"
                        srLabel={`More options for ${project.name}`}
                      >
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            onClick={() =>
                              dispatch({
                                type: "OPEN_RENAME_PROJECT",
                                payload: { projectId: project.id, name: project.name },
                              })
                            }
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => dialogs.handleDeleteProject(project.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </SubItemOverflowDropdown>
                    </div>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {project.dashboards.length === 0 ? (
                          <SidebarMenuSubItem>
                            <span className="block px-2 py-1.5 text-xs text-muted-foreground">
                              No dashboards in this folder
                            </span>
                          </SidebarMenuSubItem>
                        ) : (
                          project.dashboards.map((dashboard) => {
                            const isActive =
                              location.pathname ===
                              folderDashboardPath(project.name, dashboard.name);
                            return (
                              <DraggableDashboardItem key={dashboard.id} dashboard={dashboard} projectId={project.id}>
                                <SidebarMenuSubItem>
                                  <div className={SUB_ITEM_ROW_WRAPPER_CLASS}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isActive}
                                      className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8"
                                    >
                                      <Link to={folderDashboardPath(project.name, dashboard.name)}>
                                        <span className="truncate">{dashboard.name}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                    <SubItemOverflowDropdown
                                      tooltip="More options"
                                      srLabel={`More options for ${dashboard.name}`}
                                    >
                                      <DropdownMenuContent side="right" align="start">
                                        <DropdownMenuItem
                                          onClick={() =>
                                            dispatch({
                                              type: "OPEN_EDIT_DASHBOARD",
                                              payload: {
                                                projectId: project.id,
                                                dashboardId: dashboard.id,
                                                name: dashboard.name,
                                                description: dashboard.description || "",
                                              },
                                            })
                                          }
                                        >
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            dispatch({
                                              type: "OPEN_MOVE_DASHBOARD",
                                              payload: {
                                                fromProjectId: project.id,
                                                dashboardId: dashboard.id,
                                                dashboardName: dashboard.name,
                                              },
                                            })
                                          }
                                        >
                                          <FolderInput className="h-4 w-4 mr-2" />
                                          Move to Folder
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          onClick={() =>
                                            dialogs.handleDeleteDashboard(project.id, dashboard.id, dashboard.name)
                                          }
                                          className="text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </SubItemOverflowDropdown>
                                  </div>
                                </SidebarMenuSubItem>
                              </DraggableDashboardItem>
                            );
                          })
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuSubItem>
                </Collapsible>
              </DroppableFolderWrapper>
              );
            })}

            {/* Standalone dashboards (not inside any folder) */}
            {standaloneDashboards.map((dashboard) => {
              const isActive = location.pathname === standaloneDashboardPath(dashboard.name);
              return (
                <DraggableDashboardItem key={dashboard.id} dashboard={dashboard} projectId={null}>
                  <SidebarMenuSubItem>
                    <div className={SUB_ITEM_ROW_WRAPPER_CLASS}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={isActive}
                        className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8"
                      >
                        <Link to={standaloneDashboardPath(dashboard.name)}>
                          <span className="truncate">{dashboard.name}</span>
                        </Link>
                      </SidebarMenuSubButton>
                      <SubItemOverflowDropdown
                        tooltip="More options"
                        srLabel={`More options for ${dashboard.name}`}
                      >
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem
                            onClick={() =>
                              dispatch({
                                type: "OPEN_EDIT_DASHBOARD",
                                payload: {
                                  projectId: null,
                                  dashboardId: dashboard.id,
                                  name: dashboard.name,
                                  description: dashboard.description || "",
                                },
                              })
                            }
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              dispatch({
                                type: "OPEN_MOVE_DASHBOARD",
                                payload: {
                                  fromProjectId: null,
                                  dashboardId: dashboard.id,
                                  dashboardName: dashboard.name,
                                },
                              })
                            }
                          >
                            <FolderInput className="h-4 w-4 mr-2" />
                            Move to Folder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => dialogs.handleDeleteDashboard(null, dashboard.id, dashboard.name)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </SubItemOverflowDropdown>
                    </div>
                  </SidebarMenuSubItem>
                </DraggableDashboardItem>
              );
            })}
            </CollapsibleSidebarSection>
          </DroppableSavedRootWrapper>
        </SidebarContent>

      </Sidebar>

      {/* All dialogs extracted into a dedicated component */}
      <SidebarDialogs
        state={dialogState}
        dispatch={dispatch}
        projects={projects}
        handleCreateProject={dialogs.handleCreateProject}
        handleRenameProject={dialogs.handleRenameProject}
        handleEditDashboard={dialogs.handleEditDashboard}
        handleCreateFolderFromEdit={dialogs.handleCreateFolderFromEdit}
        handleAddDashboard={dialogs.handleAddDashboard}
        handleMoveDashboard={dialogs.handleMoveDashboard}
        handleRenameConversation={dialogs.handleRenameConversation}
        confirmDeleteConversation={dialogs.confirmDeleteConversation}
        confirmDeleteDashboard={dialogs.confirmDeleteDashboard}
        confirmDeleteFolder={dialogs.confirmDeleteFolder}
      />
    </>
  );
}
