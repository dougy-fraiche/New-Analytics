import {
  Folder,
  MoreHorizontal,
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
  LogOut,
  User,
  ChevronsUpDown,
  ChevronDown,
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
import { type ReactNode } from "react";
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
  SidebarHeader,
  SidebarFooter,
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
import { useProjects, type Dashboard } from "../contexts/ProjectContext";
import { toast } from "sonner";
import { ootbCategories } from "../data/ootb-dashboards";
import { CollapsibleSidebarSection } from "./CollapsibleSidebarSection";
import { SidebarDialogs } from "./SidebarDialogs";
import { useSidebarDialogs } from "../hooks/useSidebarDialogs";
import { usePersistedState } from "../hooks/usePersistedState";
import { useKeyboardShortcut } from "../hooks/useKeyboardShortcuts";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSidebar } from "./ui/sidebar";
import { ROUTES } from "../routes";
import {
  DropdownMenu as UserDropdownMenu,
  DropdownMenuContent as UserDropdownMenuContent,
  DropdownMenuItem as UserDropdownMenuItem,
  DropdownMenuLabel as UserDropdownMenuLabel,
  DropdownMenuSeparator as UserDropdownMenuSeparator,
  DropdownMenuTrigger as UserDropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { cn } from "./ui/utils";

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

interface DashboardDragItem {
  dashboardId: string;
  fromProjectId: string;
  dashboardName: string;
}

// Draggable wrapper for dashboard items inside folders
function DraggableDashboardItem({
  dashboard,
  projectId,
  children,
}: {
  dashboard: Dashboard;
  projectId: string;
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

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";
  const { conversations, deleteConversation, restoreConversation } = useConversations();
  const {
    projects,
    moveDashboardToProject,
    standaloneDashboards,
    deleteStandaloneDashboard,
    restoreStandaloneDashboard,
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
    moveDashboardToProject(item.fromProjectId, item.dashboardId, toProjectId);
    const targetFolder = projects.find((p) => p.id === toProjectId);
    toast.success("Dashboard moved", {
      description: `"${item.dashboardName}" has been moved to "${targetFolder?.name}".`,
    });
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pt-4 pb-2">
          {/* App switcher dropdown */}
          <SidebarMenu className="mb-0">
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center"
                    tooltip="Switch application"
                  >
                    <img
                      src="/app-icon.svg"
                      alt="New Analytics"
                      className="size-8 shrink-0 object-contain"
                    />
                    <span className="truncate flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                      New Analytics
                    </span>
                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="bottom"
                  align="start"
                  className="w-56 max-h-[70vh] overflow-y-auto"
                >
                  {APP_CATEGORIES.map((category, catIdx) => (
                    <DropdownMenuGroup key={category.label}>
                      {catIdx > 0 && <DropdownMenuSeparator />}
                      <DropdownMenuLabel className="text-xs uppercase tracking-wider">
                        {category.label}
                      </DropdownMenuLabel>
                      {category.items.map((app) => {
                        return (
                          <DropdownMenuItem
                            key={app.name}
                            className={app.active ? "bg-accent text-accent-foreground" : ""}
                          >
                            <span className="truncate">{app.name}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="gap-1 pt-2 group-data-[collapsible=icon]:pt-4">
          {/* Explore — collapsible draft threads (`E` still navigates to Explore via RootLayout) */}
          <CollapsibleSidebarSection
            icon={Compass}
            label="Explore"
            path="/"
            open={exploreOpen}
            onToggle={setExploreOpen}
            headerIsActive={location.pathname === "/"}
          >
            {activeConversations.length === 0 ? (
              <SidebarMenuSubItem>
                <span className="px-2 py-1.5 text-xs text-muted-foreground">No drafts yet</span>
              </SidebarMenuSubItem>
            ) : (
              <>
                {visibleConversations.map((conversation) => {
                  const isActive = location.pathname === `/conversation/${conversation.id}`;
                  return (
                    <SidebarMenuSubItem key={conversation.id}>
                      <div className={SUB_ITEM_ROW_WRAPPER_CLASS}>
                        <SidebarMenuSubButton asChild isActive={isActive} className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8">
                          <Link to={`/conversation/${conversation.id}`}>
                            <span className="truncate">{conversation.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
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
                              onClick={() => {
                                const snapshot = { ...conversation };
                                deleteConversation(conversation.id);
                                toast.success("Conversation deleted", {
                                  description: `"${conversation.name}" has been deleted.`,
                                  action: {
                                    label: "Undo",
                                    onClick: () => {
                                      restoreConversation(snapshot);
                                      toast.success("Conversation restored");
                                    },
                                  },
                                });
                              }}
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
                    <SidebarMenuSubButton asChild isActive={location.pathname === "/conversations"}>
                      <Link to="/conversations" className="text-muted-foreground">
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
                <SidebarMenuButton asChild isActive={location.pathname === "/actions/history"} tooltip="History">
                  <Link to="/actions/history">
                    <History />
                    <span>History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          {/* Dashboards heading */}
          <div className="pt-2 group-data-[collapsible=icon]:pt-0">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Dashboards</SidebarGroupLabel>
          </div>

          <div className="py-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={
                    location.pathname === "/automation-opportunities" ||
                    location.pathname.startsWith("/automation-opportunities/agent/")
                  }
                  tooltip="Automation Opportunities"
                >
                  <Link to="/automation-opportunities">
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
            path="/observability"
            open={observabilityOpen}
            onToggle={setObservabilityOpen}
            headerIsActive={location.pathname === ROUTES.OBSERVABILITY}
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
              const isCopilotRoute = location.pathname === ROUTES.COPILOT;
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
                </>
              );
            })()}
          </CollapsibleSidebarSection>

          {/* Saved (user-created) Dashboards */}
          <CollapsibleSidebarSection
            icon={Bookmark}
            label="Saved"
            path="/saved"
            open={savedOpen}
            onToggle={setSavedOpen}
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
                        isActive={location.pathname === `/saved/${project.id}`}
                        className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8 p-0"
                      >
                        <div className="group/folder-row relative flex h-7 w-full min-w-0 items-center gap-2 px-2 has-[button:focus-visible]:[&_[data-folder-row-icon]>svg]:opacity-0">
                          <Link
                            to={`/saved/${project.id}`}
                            className="flex min-w-0 flex-1 items-center gap-2 rounded-sm outline-hidden ring-sidebar-ring focus-visible:ring-2"
                          >
                            <span
                              data-folder-row-icon
                              className="relative inline-flex size-4 shrink-0 items-center justify-center"
                            >
                              <Folder
                                className="size-4 shrink-0 opacity-100 group-hover/folder-row:opacity-0"
                                aria-hidden
                              />
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
                              location.pathname === `/project/${project.id}/dashboard/${dashboard.id}`;
                            return (
                              <DraggableDashboardItem key={dashboard.id} dashboard={dashboard} projectId={project.id}>
                                <SidebarMenuSubItem>
                                  <div className={SUB_ITEM_ROW_WRAPPER_CLASS}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isActive}
                                      className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8"
                                    >
                                      <Link to={`/project/${project.id}/dashboard/${dashboard.id}`}>
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
                                              type: "OPEN_RENAME_DASHBOARD",
                                              payload: {
                                                projectId: project.id,
                                                dashboardId: dashboard.id,
                                                name: dashboard.name,
                                              },
                                            })
                                          }
                                        >
                                          <Pencil className="h-4 w-4 mr-2" />
                                          Rename
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
              const isActive = location.pathname === `/saved/dashboard/${dashboard.id}`;
              return (
                <SidebarMenuSubItem key={dashboard.id}>
                  <div className={SUB_ITEM_ROW_WRAPPER_CLASS}>
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive}
                      className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8"
                    >
                      <Link to={`/saved/dashboard/${dashboard.id}`}>
                        <span className="truncate">{dashboard.name}</span>
                      </Link>
                    </SidebarMenuSubButton>
                    <SubItemOverflowDropdown
                      tooltip="More options"
                      srLabel={`More options for ${dashboard.name}`}
                    >
                      <DropdownMenuContent side="right" align="start">
                        <DropdownMenuItem
                          onClick={() => {
                            const snapshot = { ...dashboard };
                            deleteStandaloneDashboard(dashboard.id);
                            toast.success("Dashboard deleted", {
                              description: `"${dashboard.name}" has been deleted.`,
                              action: {
                                label: "Undo",
                                onClick: () => {
                                  restoreStandaloneDashboard(snapshot);
                                  toast.success("Dashboard restored");
                                },
                              },
                            });
                          }}
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
          </CollapsibleSidebarSection>
        </SidebarContent>

        {/* User avatar footer */}
        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <UserDropdownMenu>
                <UserDropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="font-normal data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarFallback
                        delayMs={0}
                        className="rounded-full bg-primary text-primary-foreground text-xs"
                      >
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">John Doe</span>
                      <span className="truncate text-xs font-normal text-muted-foreground">john.doe@company.com</span>
                    </div>
                    <ChevronDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </UserDropdownMenuTrigger>
                <UserDropdownMenuContent
                  side="top"
                  align="start"
                  className="w-56"
                  sideOffset={4}
                >
                  <UserDropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm" style={{ fontWeight: 500 }}>John Doe</p>
                      <p className="text-xs text-muted-foreground">john.doe@company.com</p>
                    </div>
                  </UserDropdownMenuLabel>
                  <UserDropdownMenuSeparator />
                  <UserDropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </UserDropdownMenuItem>
                  <UserDropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </UserDropdownMenuItem>
                  <UserDropdownMenuSeparator />
                  <UserDropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </UserDropdownMenuItem>
                </UserDropdownMenuContent>
              </UserDropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* All dialogs extracted into a dedicated component */}
      <SidebarDialogs
        state={dialogState}
        dispatch={dispatch}
        projects={projects}
        handleCreateProject={dialogs.handleCreateProject}
        handleRenameProject={dialogs.handleRenameProject}
        handleRenameDashboard={dialogs.handleRenameDashboard}
        handleAddDashboard={dialogs.handleAddDashboard}
        handleMoveDashboard={dialogs.handleMoveDashboard}
        handleRenameConversation={dialogs.handleRenameConversation}
        confirmDeleteDashboard={dialogs.confirmDeleteDashboard}
        confirmDeleteFolder={dialogs.confirmDeleteFolder}
      />
    </>
  );
}
