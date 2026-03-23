import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Calendar, Filter, Download, Share2, MoreVertical, Pencil, Pin, Copy, Settings, Clock, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Separator } from "./ui/separator";
import { DashboardChatPanel } from "./DashboardChatPanel";
import { useProjects } from "../contexts/ProjectContext";
import { DashboardChartGrid } from "./ChartVariants";
import { toast } from "sonner";
import { useChatPanelSlot } from "../contexts/ChatPanelSlotContext";
import { createPortal } from "react-dom";
import { DeleteDashboardDialog } from "./DeleteDashboardDialog";
import { DuplicateDashboardDialog } from "./DuplicateDashboardDialog";
import { allOotbDashboards, standaloneCategories } from "../data/ootb-dashboards";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { DashboardAISummary } from "./DashboardAISummary";
import { WidgetAIPromptButton } from "./WidgetAIPromptButton";
import { WidgetOverflowMenu } from "./WidgetOverflowMenu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getDashboardAnomalyHighlights } from "../lib/dashboard-anomaly-highlights";
import { useContainerBreakpoint } from "../hooks/useContainerBreakpoint";

// Build OOTB meta lookup
const dashboardMeta: Record<string, { title: string; description: string }> = {};
for (const d of allOotbDashboards) {
  dashboardMeta[d.id] = { title: d.name, description: d.description };
}
for (const cat of standaloneCategories) {
  dashboardMeta[cat.id] = {
    title: cat.name,
    description: `${cat.name} comparison and analytics`,
  };
}

const trendData = [
  { date: "Jan 6", conversations: 1247 },
  { date: "Jan 13", conversations: 1389 },
  { date: "Jan 20", conversations: 1502 },
  { date: "Jan 27", conversations: 1285 },
  { date: "Feb 3", conversations: 1437 },
  { date: "Feb 10", conversations: 1592 },
  { date: "Feb 17", conversations: 1678 },
  { date: "Feb 24", conversations: 1543 },
  { date: "Mar 3", conversations: 1721 },
  { date: "Mar 10", conversations: 1834 },
  { date: "Mar 17", conversations: 1756 },
  { date: "Mar 24", conversations: 1892 },
];

const categoryData = [
  { category: "Account Access", tickets: 342 },
  { category: "Billing Inquiry", tickets: 287 },
  { category: "Technical Issue", tickets: 214 },
  { category: "Feature Request", tickets: 156 },
  { category: "Bug Report", tickets: 98 },
];

const comparisonData = [
  { week: "Week 1", thisPeriod: 892, lastPeriod: 764 },
  { week: "Week 2", thisPeriod: 1024, lastPeriod: 831 },
  { week: "Week 3", thisPeriod: 943, lastPeriod: 897 },
  { week: "Week 4", thisPeriod: 1156, lastPeriod: 952 },
  { week: "Week 5", thisPeriod: 1087, lastPeriod: 1014 },
  { week: "Week 6", thisPeriod: 1243, lastPeriod: 1078 },
];

const tableData = [
  {
    agent: "Sarah Johnson",
    escalations: 23,
    resolved: 187,
    avgTime: "4.2h",
    satisfaction: "94%",
  },
  {
    agent: "Michael Chen",
    escalations: 18,
    resolved: 203,
    avgTime: "3.8h",
    satisfaction: "96%",
  },
  {
    agent: "Emily Rodriguez",
    escalations: 31,
    resolved: 176,
    avgTime: "5.1h",
    satisfaction: "91%",
  },
  {
    agent: "David Kim",
    escalations: 15,
    resolved: 215,
    avgTime: "3.5h",
    satisfaction: "97%",
  },
  {
    agent: "Lisa Wang",
    escalations: 27,
    resolved: 192,
    avgTime: "4.6h",
    satisfaction: "93%",
  },
];

export function DashboardPage() {
  const { dashboardId, projectId } = useParams();
  const { projects, renameDashboardInProject, toggleFavorite, isFavorite, deleteDashboardFromProject, restoreDashboardToProject, standaloneDashboards, renameStandaloneDashboard, deleteStandaloneDashboard, restoreStandaloneDashboard } = useProjects();

  // Rename state
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Deterministic chart layout seeded by dashboard ID
  const chartLayoutId = projectId
    ? `${projectId}-${dashboardId}`
    : dashboardId || "default";

  // Highlight 1–2 KPI widgets per dashboard to suggest anomalies (stable per dashboard)
  const {
    anomalyCardClass,
    highlightedKpiCards,
    highlightedChartPanels,
    highlightTableCard,
  } = getDashboardAnomalyHighlights(chartLayoutId);

  const { ref: dashboardContentRef, isBelowBreakpoint: isCompactDashboard } =
    useContainerBreakpoint<HTMLDivElement>(768);

  // Find the custom dashboard name if this is a saved dashboard
  let customDashboardName: string | null = null;
  let customDashboardDescription: string | undefined;
  let savedDashboardSourceOotbId: string | undefined;
  const isFolderDashboard = !!(projectId && dashboardId);
  // Check standalone dashboards (route: /saved/dashboard/:dashboardId)
  const standaloneMatch = !projectId ? standaloneDashboards.find((d) => d.id === dashboardId) : undefined;
  const isStandaloneDashboard = !!standaloneMatch;
  const isSavedDashboard = isFolderDashboard || isStandaloneDashboard;
  if (isFolderDashboard) {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      const dashboard = project.dashboards.find((d) => d.id === dashboardId);
      if (dashboard) {
        customDashboardName = dashboard.name;
        customDashboardDescription = dashboard.description;
        savedDashboardSourceOotbId = dashboard.sourceOotbId;
      }
    }
  } else if (standaloneMatch) {
    customDashboardName = standaloneMatch.name;
    customDashboardDescription = standaloneMatch.description;
    savedDashboardSourceOotbId = standaloneMatch.sourceOotbId;
  }

  const meta = customDashboardName
    ? {
        title: customDashboardName,
        description: customDashboardDescription || "User-generated analytics dashboard",
      }
    : dashboardId
    ? dashboardMeta[dashboardId as keyof typeof dashboardMeta] || {
        title: "Custom Dashboard",
        description: "User-generated analytics dashboard",
      }
    : { title: "Dashboard", description: "" };

  // Sync rename value when title changes externally
  useEffect(() => {
    if (!showRenameDialog) {
      setRenameValue(meta.title);
    }
  }, [meta.title, showRenameDialog]);

  const handleStartRename = () => {
    setRenameValue(meta.title);
    setShowRenameDialog(true);
  };

  const handleConfirmRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== meta.title && dashboardId) {
      if (projectId) {
        renameDashboardInProject(projectId, dashboardId, trimmed);
      } else if (isStandaloneDashboard) {
        renameStandaloneDashboard(dashboardId, trimmed);
      }
      toast.success("Dashboard renamed", {
        description: `Renamed to "${trimmed}".`,
      });
    }
    setShowRenameDialog(false);
  };

  const handleCancelRename = () => {
    setRenameValue(meta.title);
    setShowRenameDialog(false);
  };

  // Pin helpers – build composite key and path from route params
  const favoriteId = projectId ? `${projectId}/${dashboardId}` : dashboardId || "";
  const favoritePath = projectId
    ? `/project/${projectId}/dashboard/${dashboardId}`
    : isStandaloneDashboard
    ? `/saved/dashboard/${dashboardId}`
    : `/dashboard/${dashboardId}`;
  const currentlyPinned = isFavorite(favoriteId);

  // Compute the persistence key and OOTB type for the chat panel
  const chatPersistKey = projectId
    ? `${projectId}/${dashboardId}`
    : dashboardId;
  // For OOTB dashboards, the dashboardId IS the ootb type.
  // For saved dashboards, use the explicit sourceOotbId if available.
  const chatSourceOotbId = isSavedDashboard
    ? savedDashboardSourceOotbId
    : dashboardId;

  const chatPanelSlot = useChatPanelSlot();
  const navigate = useNavigate();

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (isFolderDashboard && projectId && dashboardId) {
      const project = projects.find((p) => p.id === projectId);
      const dashboardSnapshot = project?.dashboards.find((d) => d.id === dashboardId);
      deleteDashboardFromProject(projectId, dashboardId);
      navigate("/saved");
      toast.success("Dashboard deleted", {
        description: `"${meta.title}" has been deleted.`,
        action: {
          label: "Undo",
          onClick: () => {
            if (dashboardSnapshot) {
              restoreDashboardToProject(projectId, dashboardSnapshot);
              toast.success("Dashboard restored");
            }
          },
        },
      });
    } else if (isStandaloneDashboard && standaloneMatch && dashboardId) {
      const snapshot = { ...standaloneMatch };
      deleteStandaloneDashboard(dashboardId);
      navigate("/saved");
      toast.success("Dashboard deleted", {
        description: `"${meta.title}" has been deleted.`,
        action: {
          label: "Undo",
          onClick: () => {
            restoreStandaloneDashboard(snapshot);
            toast.success("Dashboard restored");
          },
        },
      });
    }
    setShowDeleteConfirm(false);
  };

  return (
    <WidgetAIProvider persistKey={chatPersistKey || "__no_dashboard__"} ootbTypeId={chatSourceOotbId}>
      <div className="flex flex-col h-full min-h-0">
        {/* Fixed header: title, description, global buttons */}
        <header className="shrink-0 sticky top-0 z-10 bg-background px-4 md:px-8 pt-6 pb-0">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl tracking-tight">{meta.title}</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`h-8 w-8 ${currentlyPinned ? "text-primary hover:text-primary/80" : "text-muted-foreground"}`}
                    onClick={() => {
                      toggleFavorite({ id: favoriteId, name: meta.title, path: favoritePath });
                      toast.success(currentlyPinned ? "Unpinned" : "Pinned");
                    }}
                  >
                    <Pin className={`h-4 w-4 ${currentlyPinned ? "fill-current" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{currentlyPinned ? "Unpin" : "Pin"}</TooltipContent>
              </Tooltip>
                <DropdownMenu>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Dashboard options</TooltipContent>
                  </Tooltip>
                  <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                  {isSavedDashboard && (
                    <DropdownMenuItem onClick={handleStartRename}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowDuplicateDialog(true)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Report
                  </DropdownMenuItem>
                  {isSavedDashboard && (
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-muted-foreground mt-1">{meta.description}</p>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-auto">
          <div ref={dashboardContentRef} className="space-y-6 p-4 md:p-8">
          {/* AI Summary — saved dashboards only */}
          {isSavedDashboard && dashboardId && (
            <DashboardAISummary dashboardId={dashboardId} />
          )}

          {/* Section heading + Filters + Export (single row) */}
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="tracking-tight">Key Performance Indicators</h2>

            <div className="ml-auto flex items-center gap-3 flex-wrap w-full sm:w-auto">
              <Select defaultValue="30d">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="12m">Last 12 months</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all-teams">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-teams">All Teams</SelectItem>
                  <SelectItem value="tier-1">Tier 1 Support</SelectItem>
                  <SelectItem value="tier-2">Tier 2 Support</SelectItem>
                  <SelectItem value="technical">Technical Team</SelectItem>
                </SelectContent>
              </Select>

              <Select defaultValue="all-products">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-products">All Products</SelectItem>
                  <SelectItem value="product-a">Product A</SelectItem>
                  <SelectItem value="product-b">Product B</SelectItem>
                  <SelectItem value="product-c">Product C</SelectItem>
                </SelectContent>
              </Select>

              {isSavedDashboard && (
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {/* Metric Cards */}
          <div
            className={`grid gap-4 ${
              isCompactDashboard
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            }`}
          >
              <Card className={`group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30 ${highlightedKpiCards.has(0) ? anomalyCardClass : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardDescription className="flex-1">Total Escalations</CardDescription>
                    <WidgetAIPromptButton widgetTitle="Total Escalations" chartType="metric" />
                    <WidgetOverflowMenu widgetTitle="Total Escalations" chartType="metric" />
                  </div>
                  <CardTitle className="text-3xl">260</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="destructive" className="text-xs">
                    +12% from last period
                  </Badge>
                </CardContent>
              </Card>

              <Card className={`group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30 ${highlightedKpiCards.has(1) ? anomalyCardClass : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardDescription className="flex-1">Avg Resolution Time</CardDescription>
                    <WidgetAIPromptButton widgetTitle="Avg Resolution Time" chartType="metric" />
                    <WidgetOverflowMenu widgetTitle="Avg Resolution Time" chartType="metric" />
                  </div>
                  <CardTitle className="text-3xl">4.3h</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="default" className="text-xs">
                    -8% from last period
                  </Badge>
                </CardContent>
              </Card>

              <Card className={`group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30 ${highlightedKpiCards.has(2) ? anomalyCardClass : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardDescription className="flex-1">Customer Satisfaction</CardDescription>
                    <WidgetAIPromptButton widgetTitle="Customer Satisfaction" chartType="metric" />
                    <WidgetOverflowMenu widgetTitle="Customer Satisfaction" chartType="metric" />
                  </div>
                  <CardTitle className="text-3xl">94%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="default" className="text-xs">
                    +2% from last period
                  </Badge>
                </CardContent>
              </Card>

              <Card className={`group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30 ${highlightedKpiCards.has(3) ? anomalyCardClass : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardDescription className="flex-1">Resolution Rate</CardDescription>
                    <WidgetAIPromptButton widgetTitle="Resolution Rate" chartType="metric" />
                    <WidgetOverflowMenu widgetTitle="Resolution Rate" chartType="metric" />
                  </div>
                  <CardTitle className="text-3xl">87%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="text-xs">
                    No change
                  </Badge>
                </CardContent>
              </Card>
          </div>

          {/* Randomized Chart Grid */}
          <DashboardChartGrid
            dashboardId={chartLayoutId}
            trend={{ data: trendData, xKey: "date", yKey: "conversations" }}
            category={{ data: categoryData, xKey: "category", yKey: "tickets" }}
            comparison={{
              data: comparisonData,
              xKey: "week",
              yKey: "thisPeriod",
              y2Key: "lastPeriod",
            }}
            highlightedPanelIndices={highlightedChartPanels}
            anomalyClassName={anomalyCardClass}
          />

          {/* Data Table */}
          <div className={highlightTableCard ? anomalyCardClass : ""}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Escalations</TableHead>
                  <TableHead className="text-right">Resolved</TableHead>
                  <TableHead className="text-right">Avg Time</TableHead>
                  <TableHead className="text-right">Satisfaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.agent}>
                    <TableCell className="font-medium">{row.agent}</TableCell>
                    <TableCell className="text-right">
                      {row.escalations}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.resolved}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.avgTime}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{row.satisfaction}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </div>
        </div>
      </div>

      {/* Conversational UI Panel — portaled to layout-level slot */}
      {chatPanelSlot && createPortal(
        <DashboardChatPanel
          dashboardId={chatPersistKey}
          sourceOotbId={chatSourceOotbId}
        />,
        chatPanelSlot
      )}

      {/* Rename Dashboard Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Dashboard</DialogTitle>
            <DialogDescription>
              Enter a new name for this dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="dashboard-rename-name">Name</Label>
            <Input
              id="dashboard-rename-name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && renameValue.trim()) {
                  handleConfirmRename();
                }
              }}
              placeholder="Dashboard name"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelRename}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!renameValue.trim()}
              onClick={handleConfirmRename}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dashboard Confirmation Dialog */}
      <DeleteDashboardDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => { if (!open) setShowDeleteConfirm(false); }}
        onConfirm={confirmDelete}
        dashboardName={meta.title}
      />

      {/* Duplicate Dashboard Confirmation Dialog */}
      <DuplicateDashboardDialog
        open={showDuplicateDialog}
        onOpenChange={(open) => { if (!open) setShowDuplicateDialog(false); }}
        dashboardName={meta.title}
        sourceOotbId={isSavedDashboard ? savedDashboardSourceOotbId : dashboardId}
      />
    </WidgetAIProvider>
  );
}