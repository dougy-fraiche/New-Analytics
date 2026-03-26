import {
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
  Compass,
  LayoutDashboard,
  FolderPlus,
  FolderInput,
  Zap,
  Rocket,
  Pin,
  PinOff,
  Bookmark,
  ChartLine,
  Settings,
  FolderOpen,
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
  SidebarHeader,
  SidebarFooter,
} from "./ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Kbd } from "./ui/kbd";
import { Badge } from "./ui/badge";
import { useConversations } from "../contexts/ConversationContext";
import { useProjects, type Dashboard } from "../contexts/ProjectContext";
import { toast } from "sonner";
import { ootbCategories, allOotbDashboards } from "../data/ootb-dashboards";
import { CollapsibleSidebarSection } from "./CollapsibleSidebarSection";
import { SidebarDialogs } from "./SidebarDialogs";
import { useSidebarDialogs } from "../hooks/useSidebarDialogs";
import { usePersistedState } from "../hooks/usePersistedState";
import { useKeyboardShortcut } from "../hooks/useKeyboardShortcuts";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useSidebar } from "./ui/sidebar";
import {
  DropdownMenu as UserDropdownMenu,
  DropdownMenuContent as UserDropdownMenuContent,
  DropdownMenuItem as UserDropdownMenuItem,
  DropdownMenuLabel as UserDropdownMenuLabel,
  DropdownMenuSeparator as UserDropdownMenuSeparator,
  DropdownMenuTrigger as UserDropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";

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
    favorites,
    toggleFavorite,
  } = useProjects();

  // Dialog state (extracted into hook + reducer)
  const dialogs = useSidebarDialogs();
  const { state: dialogState, dispatch } = dialogs;

  // Persisted collapse states
  const [pinnedOpen, setPinnedOpen] = usePersistedState("sidebar-pinned-open", true);
  const [observabilityOpen, setObservabilityOpen] = usePersistedState("sidebar-observability-open", true);
  const [savedOpen, setSavedOpen] = usePersistedState("sidebar-saved-open", true);
  const [folderOpenState, setFolderOpenState] = usePersistedState<Record<string, boolean>>("sidebar-folders-open", {});

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
      id: "sidebar:toggle-pinned",
      key: "F",
      shift: true,
      handler: (e: KeyboardEvent) => {
        e.preventDefault();
        setPinnedOpen((prev) => !prev);
      },
    },
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

  // Shared classes for the absolute-positioned overflow trigger inside sub-items.
  const subItemOverflowClasses =
    "absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-sm text-sidebar-foreground opacity-0 group-focus-within/subitem:opacity-100 group-hover/subitem:opacity-100 data-[state=open]:opacity-100 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-hidden";

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pt-4 pb-0">
          {/* App switcher dropdown */}
          <SidebarMenu className="mb-4">
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
                      className="size-6 shrink-0 object-contain"
                    />
                    <span
                      className="truncate flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
                      style={{ fontWeight: 600 }}
                    >
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
                        const Icon = app.icon;
                        return (
                          <DropdownMenuItem
                            key={app.name}
                            className={app.active ? "bg-accent text-accent-foreground" : ""}
                          >
                            <Icon className="mr-2 h-4 w-4 shrink-0" />
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

          {/* Explore with nested conversations */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location.pathname === "/"} className="group/explore" tooltip="Explore">
                <Link to="/">
                  <Compass />
                  <span>Explore</span>
                  <Kbd className="ml-auto opacity-0 group-hover/explore:opacity-100 transition-opacity group-data-[collapsible=icon]:hidden">E</Kbd>
                </Link>
              </SidebarMenuButton>
              <SidebarMenuSub>
                {activeConversations.length === 0 ? (
                  <SidebarMenuSubItem>
                    <span className="px-2 py-1.5 text-xs text-muted-foreground">No conversations yet</span>
                  </SidebarMenuSubItem>
                ) : (
                  <>
                    {visibleConversations.map((conversation) => {
                      const isActive = location.pathname === `/conversation/${conversation.id}`;
                      return (
                        <SidebarMenuSubItem key={conversation.id}>
                          <div className="relative group/subitem">
                            <SidebarMenuSubButton asChild isActive={isActive} className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8">
                              <Link to={`/conversation/${conversation.id}`}>
                                <span className="truncate">{conversation.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className={subItemOverflowClasses}>
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                  <span className="sr-only">More options for {conversation.name}</span>
                                </button>
                              </DropdownMenuTrigger>
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
                            </DropdownMenu>
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
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Actions label + menu (kept as one header child to avoid SidebarHeader gap) */}
          <div className="mt-1 group-data-[collapsible=icon]:mt-0 flex flex-col gap-0">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Actions</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/recommended-actions"} tooltip="Recommended">
                  <Link to="/recommended-actions">
                    <Zap />
                    <span className="flex-1">Recommended</span>
                    <Badge
                      variant="destructive"
                      className="ml-auto h-5 min-w-5 px-1.5 rounded-full group-data-[collapsible=icon]:hidden"
                    >
                      3
                    </Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/actions/history"} tooltip="Deployed">
                  <Link to="/actions/history">
                    <Rocket />
                    <span>Deployed</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-1 pt-0 group-data-[collapsible=icon]:pt-0">
          {/* Dashboards heading */}
          <div className="pt-2 group-data-[collapsible=icon]:pt-0">
            <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Dashboards</SidebarGroupLabel>
          </div>

          {/* Pinned */}
          <CollapsibleSidebarSection
            icon={Pin}
            label="Pinned"
            path="/pinned"
            open={pinnedOpen}
            onToggle={setPinnedOpen}
          >
            {favorites.length === 0 ? (
              <SidebarMenuSubItem>
                <span className="px-2 py-1.5 text-xs text-muted-foreground">No pinned items yet</span>
              </SidebarMenuSubItem>
            ) : (
              <>
                {(favorites.length > 5 ? favorites.slice(0, 5) : favorites).map((fav) => {
                  const isActive = location.pathname === fav.path;
                  const isProjectDashboard = fav.id.includes("/");
                  const folderPath = isProjectDashboard ? `/saved/${fav.id.split("/")[0]}` : null;
                  return (
                    <SidebarMenuSubItem key={`fav-${fav.id}`}>
                      <div className="relative group/subitem">
                        <SidebarMenuSubButton asChild isActive={isActive} className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8">
                          <Link to={fav.path}>
                            <span className="truncate">{fav.name}</span>
                          </Link>
                        </SidebarMenuSubButton>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className={subItemOverflowClasses}>
                              <MoreHorizontal className="h-3.5 w-3.5" />
                              <span className="sr-only">More options for {fav.name}</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start">
                            {folderPath && (
                              <>
                                <DropdownMenuItem onClick={() => navigate(folderPath)}>
                                  <FolderOpen className="h-4 w-4 mr-2" />
                                  Show in folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                toggleFavorite(fav);
                                toast.success("Unpinned", {
                                  description: `"${fav.name}" has been unpinned.`,
                                });
                              }}
                            >
                              <PinOff className="h-4 w-4 mr-2" />
                              Unpin
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </SidebarMenuSubItem>
                  );
                })}
                {favorites.length > 5 && (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton asChild>
                      <Link to="/pinned" className="text-muted-foreground">
                        <span>View all →</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )}
              </>
            )}
          </CollapsibleSidebarSection>

          <div className="py-0">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/automation-opportunities"} tooltip="Automation Opportunities">
                  <Link to="/automation-opportunities">
                    <Bot />
                    <span>Automation Opportunities</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          {/* Observability (out-of-the-box) dashboards */}
          <CollapsibleSidebarSection
            icon={ChartLine}
            label="Observability"
            path="/observability"
            open={observabilityOpen}
            onToggle={setObservabilityOpen}
          >
            {ootbCategories.length === 0 ? (
              <SidebarMenuSubItem>
                <span className="px-2 py-1.5 text-xs text-muted-foreground">No dashboards available</span>
              </SidebarMenuSubItem>
            ) : (
              ootbCategories.map((category) => {
                const categoryPath =
                  category.dashboards.length === 0
                    ? `/dashboard/${category.id}`
                    : `/observability/${category.id}`;
                const isActive =
                  category.dashboards.length === 0
                    ? location.pathname === `/dashboard/${category.id}`
                    : location.pathname.startsWith(`/observability/${category.id}`);
                return (
                  <SidebarMenuSubItem key={category.id}>
                    <SidebarMenuSubButton asChild isActive={isActive}>
                      <Link to={categoryPath}>
                        <span className="truncate">{category.name}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })
            )}
          </CollapsibleSidebarSection>

          {/* Saved (user-created) Dashboards */}
          <CollapsibleSidebarSection
            icon={Bookmark}
            label="Saved"
            path="/saved"
            open={savedOpen}
            onToggle={setSavedOpen}
          >
            <SidebarMenuSubItem>
              <SidebarMenuSubButton onClick={() => dispatch({ type: "OPEN_NEW_PROJECT" })}>
                <FolderPlus className="h-4 w-4" />
                <span>New Folder</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>

            {projects.length === 0 && standaloneDashboards.length === 0 && (
              <SidebarMenuSubItem>
                <span className="px-2 py-1.5 text-xs text-muted-foreground">No saved dashboards yet</span>
              </SidebarMenuSubItem>
            )}

            {/* User-created folder/projects */}
            {projects.map((project) => (
              <DroppableFolderWrapper
                key={project.id}
                projectId={project.id}
                onDrop={(item) => handleDndDrop(item, project.id)}
              >
                <Collapsible
                  open={isFolderOpen(project.id)}
                  onOpenChange={(open) => toggleFolder(project.id, open)}
                  className="w-full group/collapsible"
                >
                  <SidebarMenuSubItem>
                    <div className="relative group/subitem">
                      <CollapsibleTrigger asChild>
                        <SidebarMenuSubButton
                          isActive={location.pathname === `/saved/${project.id}`}
                          className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8"
                        >
                          <Folder className="h-4 w-4" />
                          <span className="truncate">{project.name}</span>
                        </SidebarMenuSubButton>
                      </CollapsibleTrigger>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={subItemOverflowClasses}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                            <span className="sr-only">More options for {project.name}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem onClick={() => navigate(`/saved/${project.id}`)}>
                            <FolderOpen className="h-4 w-4 mr-2" />
                            Open folder
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
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
                      </DropdownMenu>
                    </div>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {project.dashboards.map((dashboard) => {
                          const isActive =
                            location.pathname === `/project/${project.id}/dashboard/${dashboard.id}`;
                          return (
                            <DraggableDashboardItem key={dashboard.id} dashboard={dashboard} projectId={project.id}>
                              <SidebarMenuSubItem>
                                <div className="relative group/subitem">
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isActive}
                                    className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8"
                                  >
                                    <Link to={`/project/${project.id}/dashboard/${dashboard.id}`}>
                                      <span className="truncate">{dashboard.name}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className={subItemOverflowClasses}>
                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                        <span className="sr-only">More options for {dashboard.name}</span>
                                      </button>
                                    </DropdownMenuTrigger>
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
                                  </DropdownMenu>
                                </div>
                              </SidebarMenuSubItem>
                            </DraggableDashboardItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuSubItem>
                </Collapsible>
              </DroppableFolderWrapper>
            ))}

            {/* Standalone dashboards (not inside any folder) */}
            {standaloneDashboards.map((dashboard) => {
              const isActive = location.pathname === `/saved/dashboard/${dashboard.id}`;
              return (
                <SidebarMenuSubItem key={dashboard.id}>
                  <div className="relative group/subitem">
                    <SidebarMenuSubButton
                      asChild
                      isActive={isActive}
                      className="group-hover/subitem:pr-8 group-focus-within/subitem:pr-8"
                    >
                      <Link to={`/saved/dashboard/${dashboard.id}`}>
                        <span className="truncate">{dashboard.name}</span>
                      </Link>
                    </SidebarMenuSubButton>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className={subItemOverflowClasses}>
                          <MoreHorizontal className="h-3.5 w-3.5" />
                          <span className="sr-only">More options for {dashboard.name}</span>
                        </button>
                      </DropdownMenuTrigger>
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
                    </DropdownMenu>
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
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage src="https://images.unsplash.com/photo-1672685667592-0392f458f46f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW4lMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MzY4NjY2MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" alt="John Doe" className="rounded-full object-cover" />
                      <AvatarFallback className="rounded-full bg-primary text-primary-foreground text-xs">
                        JD
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate" style={{ fontWeight: 500 }}>John Doe</span>
                      <span className="truncate text-xs text-muted-foreground">john.doe@company.com</span>
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