import { useParams, useNavigate } from "react-router";
import { useState, useMemo, useEffect } from "react";
import {
  RotateCcw,
  Download,
  MoreVertical,
  Pencil,
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
import { useProjects } from "../contexts/ProjectContext";
import { DashboardChartGrid } from "./ChartVariants";
import { toast } from "sonner";
import { DeleteDashboardDialog } from "./DeleteDashboardDialog";
import { DuplicateDashboardDialog } from "./DuplicateDashboardDialog";
import {
  PageHeader,
  PageHeaderPrimaryRow,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { allOotbDashboards, standaloneCategories } from "../data/ootb-dashboards";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { PageTransition } from "./PageTransition";
import { KpiSparkline } from "./KpiSparkline";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { TableAgentCell } from "./TableAgentCell";
import { TableBadge } from "./TableBadge";
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

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { getDashboardAnomalyHighlights } from "../lib/dashboard-anomaly-highlights";
import { useContainerBreakpoint } from "../hooks/useContainerBreakpoint";
import { cn } from "./ui/utils";
import { showDeletedObjectToast } from "../lib/object-deletion-toast";
import { EditDashboardDialog } from "./EditDashboardDialog";
import { dashboardTrendBadgeKpiByKey } from "../data/dashboard-kpis";
import { ROUTES } from "../routes";
import {
  findProjectDashboardBySlugs,
  getSavedFolderDashboardPath,
  getSavedStandaloneDashboardPath,
  validateSavedFolderDashboardName,
  validateSavedFolderName,
  validateSavedStandaloneDashboardName,
} from "../lib/saved-slugs";
import {
  buildSavedDashboardSnapshot,
  deriveSavedDashboardKpiLabels,
} from "../lib/saved-dashboard-snapshot";
import { formatSparklineValueFromReference, getTrendDirectionFromBadge } from "../lib/kpi-trend-sparkline";
import type { SavedDashboardSnapshotKpi } from "../types/saved-dashboard-snapshot";

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

const TOTAL_ESCALATIONS_KPI = dashboardTrendBadgeKpiByKey.totalEscalations;
const AVG_RESOLUTION_KPI = dashboardTrendBadgeKpiByKey.avgResolutionHours;
const CUSTOMER_SATISFACTION_KPI = dashboardTrendBadgeKpiByKey.customerSatisfactionPct;
const RESOLUTION_RATE_KPI = dashboardTrendBadgeKpiByKey.resolutionRatePct;
const DEFAULT_KPI_CARDS: SavedDashboardSnapshotKpi[] = [
  TOTAL_ESCALATIONS_KPI,
  AVG_RESOLUTION_KPI,
  CUSTOMER_SATISFACTION_KPI,
  RESOLUTION_RATE_KPI,
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

interface DashboardPageProps {
  resolvedStandaloneDashboardId?: string;
}

export function DashboardPage({ resolvedStandaloneDashboardId }: DashboardPageProps = {}) {
  const { dashboardId, folderSlug, dashboardSlug } = useParams<{
    dashboardId?: string;
    folderSlug?: string;
    dashboardSlug?: string;
  }>();
  const {
    projects,
    addProject,
    updateDashboardInProject,
    deleteDashboardFromProject,
    restoreDashboardToProject,
    standaloneDashboards,
    updateStandaloneDashboard,
    deleteStandaloneDashboard,
    restoreStandaloneDashboard,
    moveDashboardToProject,
    moveDashboardToStandalone,
    moveStandaloneToFolder,
  } = useProjects();

  // Edit state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeOption>(DEFAULT_FILTERS.dateRange);
  const [team, setTeam] = useState(DEFAULT_FILTERS.team);
  const [product, setProduct] = useState(DEFAULT_FILTERS.product);

  const folderDashboardMatch =
    folderSlug && dashboardSlug
      ? findProjectDashboardBySlugs(projects, folderSlug, dashboardSlug)
      : undefined;
  const folderDashboardProject = folderDashboardMatch?.project;
  const folderDashboard = folderDashboardMatch?.dashboard;

  const standaloneMatch = resolvedStandaloneDashboardId
    ? standaloneDashboards.find((dashboard) => dashboard.id === resolvedStandaloneDashboardId)
    : undefined;

  const isFolderDashboard = Boolean(folderDashboardProject && folderDashboard);
  const isStandaloneDashboard = Boolean(standaloneMatch);
  const isSavedDashboard = isFolderDashboard || isStandaloneDashboard;
  const savedDashboard = folderDashboard ?? standaloneMatch ?? null;
  const sourceProjectId = folderDashboardProject?.id ?? null;
  const activeDashboardId = savedDashboard?.id ?? dashboardId;

  // Deterministic chart layout seeded by dashboard ID
  const chartLayoutId =
    isFolderDashboard && sourceProjectId && activeDashboardId
      ? `${sourceProjectId}-${activeDashboardId}`
      : activeDashboardId || "default";

  // Highlight 1–2 KPI widgets per dashboard to suggest anomalies (stable per dashboard)
  const {
    anomalyCardClass,
    highlightedKpiCards,
    highlightedChartPanels,
    highlightTableCard,
  } = getDashboardAnomalyHighlights(chartLayoutId);

  const { ref: dashboardContentRef, isBelowBreakpoint: isCompactDashboard } =
    useContainerBreakpoint<HTMLDivElement>(768);

  const customDashboardName = savedDashboard?.name ?? null;
  const customDashboardDescription = savedDashboard?.description;
  const savedDashboardSourceOotbId = savedDashboard?.sourceOotbId;

  const meta = customDashboardName
    ? {
        title: customDashboardName,
        description: customDashboardDescription || "User-generated analytics dashboard",
      }
    : activeDashboardId
    ? dashboardMeta[activeDashboardId as keyof typeof dashboardMeta] || {
        title: "Custom Dashboard",
        description: "User-generated analytics dashboard",
      }
    : { title: "Dashboard", description: "" };

  useEffect(() => {
    if (!isSavedDashboard || !savedDashboard || savedDashboard.snapshot) return;
    const snapshot = buildSavedDashboardSnapshot({
      seed: `${savedDashboard.id}|${savedDashboard.name}|${savedDashboard.description ?? ""}|${savedDashboard.sourceOotbId ?? ""}`,
      title: savedDashboard.name,
      description: savedDashboard.description,
      sourceOotbId: savedDashboard.sourceOotbId,
    });
    const kpis = deriveSavedDashboardKpiLabels(snapshot);

    if (sourceProjectId) {
      updateDashboardInProject(sourceProjectId, savedDashboard.id, {
        snapshot,
        kpis,
      });
    } else {
      updateStandaloneDashboard(savedDashboard.id, {
        snapshot,
        kpis,
      });
    }
  }, [
    isSavedDashboard,
    savedDashboard,
    sourceProjectId,
    updateDashboardInProject,
    updateStandaloneDashboard,
  ]);

  const activeSnapshot = isSavedDashboard ? savedDashboard?.snapshot : undefined;
  const activeKpis = activeSnapshot?.kpis?.length ? activeSnapshot.kpis : DEFAULT_KPI_CARDS;
  const activeTrendDataset = activeSnapshot?.datasets.trend ?? {
    data: trendData,
    xKey: "date",
    yKey: "conversations",
  };
  const activeCategoryDataset = activeSnapshot?.datasets.category ?? {
    data: categoryData,
    xKey: "category",
    yKey: "tickets",
  };
  const activeComparisonDataset = activeSnapshot?.datasets.comparison ?? {
    data: comparisonData,
    xKey: "week",
    yKey: "thisPeriod",
    y2Key: "lastPeriod",
  };
  const activeTableRows = activeSnapshot?.table?.length ? activeSnapshot.table : tableData;

  const handleStartEdit = () => {
    setShowEditDialog(true);
  };

  // For OOTB dashboards, the dashboardId IS the ootb type.
  // For saved dashboards, use the explicit sourceOotbId if available.
  const chatSourceOotbId = isSavedDashboard
    ? savedDashboardSourceOotbId
    : activeDashboardId;

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
    if (isFolderDashboard && sourceProjectId && activeDashboardId) {
      const project = projects.find((p) => p.id === sourceProjectId);
      const dashboardSnapshot = project?.dashboards.find((d) => d.id === activeDashboardId);
      deleteDashboardFromProject(sourceProjectId, activeDashboardId);
      navigate(ROUTES.SAVED);
      showDeletedObjectToast({
        objectType: "Dashboard",
        objectName: meta.title,
        onUndo: dashboardSnapshot
          ? () => {
              restoreDashboardToProject(sourceProjectId, dashboardSnapshot);
            }
          : undefined,
      });
    } else if (isStandaloneDashboard && standaloneMatch && activeDashboardId) {
      const snapshot = { ...standaloneMatch };
      deleteStandaloneDashboard(activeDashboardId);
      navigate(ROUTES.SAVED);
      showDeletedObjectToast({
        objectType: "Dashboard",
        objectName: meta.title,
        onUndo: () => {
          restoreStandaloneDashboard(snapshot);
        },
      });
    }
    setShowDeleteConfirm(false);
  };

  const handleConfirmEdit = (values: {
    name: string;
    description: string;
    locationProjectId: string | null;
  }) => {
    if (!activeDashboardId || !isSavedDashboard) return;
    const trimmedName = values.name.trim();
    if (!trimmedName) return;

    const currentSourceProjectId = sourceProjectId;
    const destinationProjectId = values.locationProjectId;
    const nextDescription = values.description || undefined;

    const validationError =
      destinationProjectId === null
        ? validateSavedStandaloneDashboardName(
            trimmedName,
            projects,
            standaloneDashboards,
            currentSourceProjectId ? undefined : activeDashboardId,
          )
        : validateSavedFolderDashboardName(
            destinationProjectId,
            trimmedName,
            projects,
            currentSourceProjectId === destinationProjectId ? activeDashboardId : undefined,
          );

    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (currentSourceProjectId) {
      updateDashboardInProject(currentSourceProjectId, activeDashboardId, {
        name: trimmedName,
        description: nextDescription,
      });
    } else {
      updateStandaloneDashboard(activeDashboardId, {
        name: trimmedName,
        description: nextDescription,
      });
    }

    let nextSourceProjectId = currentSourceProjectId;

    if (currentSourceProjectId && destinationProjectId === null) {
      moveDashboardToStandalone(currentSourceProjectId, activeDashboardId);
      nextSourceProjectId = null;
    } else if (
      currentSourceProjectId &&
      destinationProjectId &&
      destinationProjectId !== currentSourceProjectId
    ) {
      moveDashboardToProject(currentSourceProjectId, activeDashboardId, destinationProjectId);
      nextSourceProjectId = destinationProjectId;
    } else if (!currentSourceProjectId && destinationProjectId) {
      moveStandaloneToFolder(activeDashboardId, destinationProjectId);
      nextSourceProjectId = destinationProjectId;
    }

    toast.success("Dashboard updated", {
      description: `"${trimmedName}" has been updated.`,
    });
    setShowEditDialog(false);

    if (nextSourceProjectId) {
      const nextProject = projects.find((project) => project.id === nextSourceProjectId);
      if (nextProject) {
        navigate(
          getSavedFolderDashboardPath(nextProject, {
            name: trimmedName,
          }),
        );
      } else {
        navigate(ROUTES.SAVED);
      }
    } else {
      navigate(
        getSavedStandaloneDashboardPath({
          name: trimmedName,
        }),
      );
    }
  };

  if ((folderSlug || dashboardSlug) && !isFolderDashboard) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h1 className="text-4xl mb-2">404</h1>
          <p className="text-muted-foreground">Saved dashboard not found</p>
        </div>
      </div>
    );
  }

  if (resolvedStandaloneDashboardId && !isStandaloneDashboard) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h1 className="text-4xl mb-2">404</h1>
          <p className="text-muted-foreground">Saved dashboard not found</p>
        </div>
      </div>
    );
  }

  return (
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId={chatSourceOotbId}>
      <div className="flex flex-col h-full min-h-0">
        {/* Fixed header: title and global buttons */}
        <PageHeader>
          <PageHeaderPrimaryRow
            title={<h1 className="text-3xl tracking-tight">{meta.title}</h1>}
            description={meta.description}
            actions={(
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Dashboard options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Dashboard options</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  {!isSavedDashboard && (
                    <>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule Report
                      </DropdownMenuItem>
                    </>
                  )}
                  {isSavedDashboard && (
                    <DropdownMenuItem onClick={handleStartEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowDuplicateDialog(true)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
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
            )}
          />
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
          <div className={cn(pageRootListScrollGutterClassName, "pb-4 md:pb-8")}>
          <PageTransition className={pageMainColumnClassName}>
          <div ref={dashboardContentRef} className="space-y-4">
          {activeDashboardId ? (
            <HeaderAIInsightsRow
              dashboardId={activeDashboardId}
              dashboardData={{
                id: activeDashboardId,
                title: meta.title,
                description: meta.description,
              }}
            />
          ) : null}
          {/* Section heading — 2rem below AI insights only (avoid space-y-4 + mt-8 stacking) */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-4",
              activeDashboardId ? "!mt-8" : undefined,
            )}
          >
            <h3 className="flex items-center gap-2 tracking-tight">
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
            {activeKpis.map((kpi, index) => {
              const direction = getTrendDirectionFromBadge(kpi.trend);
              const TrendIcon = direction === "up" ? TrendingUp : TrendingDown;
              const badgeToneClass =
                direction === "up"
                  ? "border-transparent bg-emerald-600 text-xs text-white dark:bg-emerald-600 dark:text-white"
                  : direction === "down"
                    ? "border-transparent bg-red-600 text-xs text-white dark:bg-red-600 dark:text-white"
                    : "text-xs";

              return (
                <Card
                  key={`${kpi.label}-${index}`}
                  className={`group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30 ${
                    highlightedKpiCards.has(index) ? anomalyCardClass : ""
                  }`}
                >
                  <CardHeader className="pb-0">
                    <div className="flex items-center gap-2">
                      <CardDescription className="flex-1">{kpi.label}</CardDescription>
                      <WidgetAskAIAndOverflow widgetTitle={kpi.label} chartType="metric" />
                    </div>
                    <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                      <KpiMetricValueTitle value={kpi.value} />
                      <Badge variant="secondary" className={`shrink-0 ${badgeToneClass}`}>
                        {direction === "neutral" ? (
                          kpi.trend
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <TrendIcon className="h-3 w-3" />
                            {kpi.trend}
                          </span>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <KpiSparkline
                      values={kpi.sparkline}
                      seriesName={kpi.seriesName}
                      formatValue={(v) => formatSparklineValueFromReference(kpi.value, v)}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <h3 className="!mt-8 flex items-center gap-2 tracking-tight">
            <LineChart className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Insights & Analysis
          </h3>

          {/* Randomized Chart Grid */}
          <DashboardChartGrid
            dashboardId={chartLayoutId}
            trend={activeTrendDataset}
            category={activeCategoryDataset}
            comparison={activeComparisonDataset}
            highlightedPanelIndices={highlightedChartPanels}
            anomalyClassName={anomalyCardClass}
            expandSingletonRows
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
                {activeTableRows.map((row) => (
                  <TableRow key={row.agent}>
                    <TableCell className="font-medium">
                      <TableAgentCell name={row.agent} />
                    </TableCell>
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
                      <TableBadge variant="outline">{row.satisfaction}</TableBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </div>
          </PageTransition>
          </div>
        </div>
      </div>

      {isSavedDashboard && (
        <EditDashboardDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          initialName={meta.title}
          initialDescription={customDashboardDescription || ""}
          initialLocationProjectId={sourceProjectId}
          projects={projects.map((project) => ({ id: project.id, name: project.name }))}
          onCreateFolder={(folderName) => {
            const trimmed = folderName.trim();
            if (!trimmed) return null;
            const validationError = validateSavedFolderName(trimmed, projects, standaloneDashboards);
            if (validationError) {
              toast.error(validationError);
              return null;
            }
            return addProject(trimmed);
          }}
          onSubmit={handleConfirmEdit}
        />
      )}

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
        dashboardDescription={isSavedDashboard ? customDashboardDescription : meta.description}
        initialLocationProjectId={isSavedDashboard ? sourceProjectId : null}
        sourceOotbId={
          isSavedDashboard ? savedDashboardSourceOotbId ?? activeDashboardId : activeDashboardId
        }
        kpis={savedDashboard?.kpis}
        snapshot={savedDashboard?.snapshot}
      />
    </WidgetAIProvider>
  );
}
