import { useParams, useNavigate } from "react-router";
import { useState, useEffect, useMemo } from "react";
import {
  RotateCcw,
  Download,
  MoreVertical,
  Pencil,
  Pin,
  Copy,
  Settings,
  Clock,
  Trash2,
  TrendingDown,
  TrendingUp,
  CircleGauge,
  LineChart,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "./ui/card";
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
  SelectSeparator,
  SelectTrigger,
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
import { useProjects } from "../contexts/ProjectContext";
import { DashboardChartGrid } from "./ChartVariants";
import { toast } from "sonner";
import { DeleteDashboardDialog } from "./DeleteDashboardDialog";
import { DuplicateDashboardDialog } from "./DuplicateDashboardDialog";
import { PageContent, PageHeader } from "./PageChrome";
import { allOotbDashboards, standaloneCategories } from "../data/ootb-dashboards";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { PageTransition } from "./PageTransition";
import { KpiSparkline, KPI_SPARKLINE_SERIES } from "./KpiSparkline";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import {
  DATE_RANGE_CUSTOM_OPTION,
  DATE_RANGE_LABELS,
  DATE_RANGE_PRIMARY_OPTIONS,
  DATE_RANGE_SECONDARY_OPTIONS,
  type DateRangeOption,
} from "../data/date-ranges";
import {
  DEFAULT_DASHBOARD_FILTERS as DEFAULT_FILTERS,
  type DashboardProductFilter,
  type DashboardTeamFilter,
} from "../data/dashboard-filters";
import { LabeledFilterInline, LabeledSelectValue } from "./HeaderFilters";

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
  const [dateRange, setDateRange] = useState<DateRangeOption>(DEFAULT_FILTERS.dateRange);
  const [team, setTeam] = useState(DEFAULT_FILTERS.team);
  const [product, setProduct] = useState(DEFAULT_FILTERS.product);

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

  // For OOTB dashboards, the dashboardId IS the ootb type.
  // For saved dashboards, use the explicit sourceOotbId if available.
  const chatSourceOotbId = isSavedDashboard
    ? savedDashboardSourceOotbId
    : dashboardId;

  const navigate = useNavigate();

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const hasFilterChanges = useMemo(() => {
    return (
      dateRange !== DEFAULT_FILTERS.dateRange ||
      team !== DEFAULT_FILTERS.team ||
      product !== DEFAULT_FILTERS.product
    );
  }, [dateRange, team, product]);

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
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId={chatSourceOotbId}>
      <div className="flex flex-col h-full min-h-0">
        {/* Fixed header: title, description, global buttons */}
        <PageHeader>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl tracking-tight">{meta.title}</h1>
            <div className="ml-auto flex items-center gap-2">
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
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeOption)}>
              <SelectTrigger className="h-8 w-auto shrink-0">
                <LabeledFilterInline label="Date range">{DATE_RANGE_LABELS[dateRange]}</LabeledFilterInline>
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_PRIMARY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {DATE_RANGE_LABELS[opt]}
                  </SelectItem>
                ))}
                <SelectSeparator />
                {DATE_RANGE_SECONDARY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {DATE_RANGE_LABELS[opt]}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={DATE_RANGE_CUSTOM_OPTION}>
                  {DATE_RANGE_LABELS[DATE_RANGE_CUSTOM_OPTION]}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={team} onValueChange={(v) => setTeam(v as DashboardTeamFilter)}>
              <SelectTrigger className="h-8 w-auto shrink-0">
                <LabeledSelectValue label="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-teams">All Teams</SelectItem>
                <SelectItem value="tier-1">Tier 1 Support</SelectItem>
                <SelectItem value="tier-2">Tier 2 Support</SelectItem>
                <SelectItem value="technical">Technical Team</SelectItem>
              </SelectContent>
            </Select>

            <Select value={product} onValueChange={(v) => setProduct(v as DashboardProductFilter)}>
              <SelectTrigger className="h-8 w-auto shrink-0">
                <LabeledSelectValue label="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-products">All Products</SelectItem>
                <SelectItem value="product-a">Product A</SelectItem>
                <SelectItem value="product-b">Product B</SelectItem>
                <SelectItem value="product-c">Product C</SelectItem>
              </SelectContent>
            </Select>

            {hasFilterChanges && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0"
                onClick={() => {
                  setDateRange(DEFAULT_FILTERS.dateRange);
                  setTeam(DEFAULT_FILTERS.team);
                  setProduct(DEFAULT_FILTERS.product);
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            )}
          </div>
        </PageHeader>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-auto">
          <PageContent className="p-4 md:p-8">
          <PageTransition>
          <div ref={dashboardContentRef} className="space-y-4">
          {dashboardId ? (
            <HeaderAIInsightsRow
              dashboardId={dashboardId}
              dashboardData={{
                id: dashboardId,
                title: meta.title,
                description: meta.description,
              }}
            />
          ) : null}
          {/* Section heading */}
          <div className="flex items-center gap-4 flex-wrap">
            <h3 className="mt-8 flex items-center gap-2 tracking-tight">
              <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Key Performance Indicators
            </h3>
          </div>

          {/* Metric Cards */}
          <div
            className={`grid gap-4 ${
              isCompactDashboard
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            }`}
          >
              <Card
                className={`group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30 ${highlightedKpiCards.has(0) ? anomalyCardClass : ""}`}
              >
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <CardDescription className="flex-1">Total Escalations</CardDescription>
                    <WidgetAskAIAndOverflow widgetTitle="Total Escalations" chartType="metric" />
                  </div>
                  <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                    <KpiMetricValueTitle value="260" />
                    <Badge
                      variant="secondary"
                      className="shrink-0 border-transparent bg-emerald-600 text-xs text-white dark:bg-emerald-600 dark:text-white"
                    >
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +12%
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <KpiSparkline
                    values={[...KPI_SPARKLINE_SERIES.totalEscalations]}
                    seriesName="Escalations"
                    formatValue={(v) => v.toLocaleString()}
                  />
                </CardContent>
              </Card>

              <Card
                className={`group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30 ${highlightedKpiCards.has(1) ? anomalyCardClass : ""}`}
              >
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <CardDescription className="flex-1">Avg Resolution Time</CardDescription>
                    <WidgetAskAIAndOverflow widgetTitle="Avg Resolution Time" chartType="metric" />
                  </div>
                  <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                    <KpiMetricValueTitle value="4.3h" />
                    <Badge
                      variant="secondary"
                      className="shrink-0 border-transparent bg-red-600 text-xs text-white dark:bg-red-600 dark:text-white"
                    >
                      <span className="inline-flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        -8%
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <KpiSparkline
                    values={[...KPI_SPARKLINE_SERIES.avgResolutionHours]}
                    seriesName="Avg. resolution"
                    formatValue={(v) => `${v.toFixed(1)} h`}
                  />
                </CardContent>
              </Card>

              <Card
                className={`group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30 ${highlightedKpiCards.has(2) ? anomalyCardClass : ""}`}
              >
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <CardDescription className="flex-1">Customer Satisfaction</CardDescription>
                    <WidgetAskAIAndOverflow widgetTitle="Customer Satisfaction" chartType="metric" />
                  </div>
                  <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                    <KpiMetricValueTitle value="94%" />
                    <Badge
                      variant="secondary"
                      className="shrink-0 border-transparent bg-emerald-600 text-xs text-white dark:bg-emerald-600 dark:text-white"
                    >
                      <span className="inline-flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +2%
                      </span>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <KpiSparkline
                    values={[...KPI_SPARKLINE_SERIES.customerSatisfactionPct]}
                    seriesName="Satisfaction"
                    formatValue={(v) => `${v.toFixed(1)}%`}
                  />
                </CardContent>
              </Card>

              <Card
                className={`group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30 ${highlightedKpiCards.has(3) ? anomalyCardClass : ""}`}
              >
                <CardHeader className="pb-0">
                  <div className="flex items-center gap-2">
                    <CardDescription className="flex-1">Resolution Rate</CardDescription>
                    <WidgetAskAIAndOverflow widgetTitle="Resolution Rate" chartType="metric" />
                  </div>
                  <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                    <KpiMetricValueTitle value="87%" />
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      No change
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <KpiSparkline
                    values={[...KPI_SPARKLINE_SERIES.resolutionRatePct]}
                    seriesName="Resolution rate"
                    formatValue={(v) => `${v.toFixed(1)}%`}
                  />
                </CardContent>
              </Card>
          </div>

          <h3 className="!mt-8 flex items-center gap-2 tracking-tight">
            <LineChart className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Insights & Analysis
          </h3>

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
          </PageTransition>
          </PageContent>
        </div>
      </div>

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