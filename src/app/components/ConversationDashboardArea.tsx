import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Sparkles,
  LayoutDashboard,
  BarChart3,
  Bookmark,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  RotateCcw,
  LineChart,
  CircleGauge,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
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
import { DashboardData } from "../contexts/ConversationContext";
import { DashboardChartGrid } from "./ChartVariants";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import {
  PageHeader,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { cn } from "./ui/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useContainerBreakpoint } from "../hooks/useContainerBreakpoint";
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
import type { ChartRow } from "../types/conversation-types";

/** Stable fallbacks so chart datasets stay referentially stable across parent re-renders (e.g. Explore typewriter). */
const DEFAULT_CONVERSATION_TREND: ChartRow[] = [
  { date: "Jan 6", interactions: 3842 },
  { date: "Jan 13", interactions: 4156 },
  { date: "Jan 20", interactions: 3987 },
  { date: "Jan 27", interactions: 4523 },
  { date: "Feb 3", interactions: 4891 },
  { date: "Feb 10", interactions: 5234 },
  { date: "Feb 17", interactions: 4978 },
  { date: "Feb 24", interactions: 5412 },
  { date: "Mar 3", interactions: 5687 },
  { date: "Mar 10", interactions: 5321 },
  { date: "Mar 17", interactions: 5843 },
  { date: "Mar 24", interactions: 6102 },
];

const DEFAULT_CONVERSATION_BREAKDOWN: ChartRow[] = [
  { category: "Password Reset", volume: 1842 },
  { category: "Billing Support", volume: 1356 },
  { category: "Product Inquiry", volume: 987 },
  { category: "Shipping Status", volume: 764 },
  { category: "Returns & Refunds", volume: 623 },
];
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { KpiSparkline, KPI_SPARKLINE_SERIES } from "./KpiSparkline";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import type { PrimaryFindingViewModel } from "../lib/anomaly-primary-finding";

interface ConversationDashboardAreaProps {
  isThinking: boolean;
  dashboardData: DashboardData | null;
  anomalyPrimaryFinding?: PrimaryFindingViewModel | null;
  conversationTitle?: string;
  /** When provided, widget AI prompts are sent to this handler instead of the dashboard chat panel */
  onWidgetPrompt?: (
    widgetTitle: string,
    message: string,
    chartType?: string,
    selectedKpiLabel?: string | null,
  ) => void;
  onSave?: (dashboard: DashboardData) => void;
  isSaved?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
}

const DASHBOARD_BUILD_BAR_HEIGHTS = [34, 62, 48, 78, 55, 70, 41, 66];

/** Shown while the assistant is generating the first dashboard payload (Explore → conversation). */
function DashboardBuildingAnimation() {
  const reduceMotion = useReducedMotion() ?? false;
  const barEase = [0.22, 1, 0.36, 1] as const;
  const barDuration = reduceMotion ? 0.01 : 0.55;
  const barStagger = reduceMotion ? 0 : 0.055;

  return (
    <div
      className="flex h-full min-h-[min(320px,50vh)] flex-col items-center justify-center gap-8 p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="AI is preparing your dashboard"
    >
      <div className="relative w-full max-w-[320px] overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-b from-primary/[0.06] via-muted/30 to-muted/50 p-5 shadow-sm">
        {!reduceMotion ? (
          <motion.div
            className="pointer-events-none absolute inset-y-2 left-0 w-[42%] bg-gradient-to-r from-transparent via-primary/18 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "280%" }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            aria-hidden
          />
        ) : null}

        <div className="relative flex flex-col gap-4">
          <div className="space-y-2">
            <motion.div
              className="h-2.5 rounded-md bg-primary/30"
              initial={{ scaleX: reduceMotion ? 1 : 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.45,
                ease: barEase,
                delay: reduceMotion ? 0 : 0.05,
              }}
              style={{ transformOrigin: "left center" }}
            />
            <motion.div
              className="h-2 w-[82%] rounded-md bg-muted-foreground/18"
              initial={{ scaleX: reduceMotion ? 1 : 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: reduceMotion ? 0.01 : 0.45,
                ease: barEase,
                delay: reduceMotion ? 0 : 0.12,
              }}
              style={{ transformOrigin: "left center" }}
            />
          </div>

          <div className="flex h-[7.5rem] items-end gap-1.5 px-0.5">
            {DASHBOARD_BUILD_BAR_HEIGHTS.map((pct, i) => (
              <motion.div
                key={i}
                className="min-h-0 flex-1 rounded-t-[3px] bg-primary/50 shadow-[0_-1px_0_0_rgba(0,0,0,0.06)] dark:bg-primary/45"
                initial={{ height: reduceMotion ? `${pct}%` : "0%" }}
                animate={{ height: `${pct}%` }}
                transition={{
                  duration: barDuration,
                  ease: barEase,
                  delay: reduceMotion ? 0 : 0.14 + barStagger * i,
                }}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-0.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-10 flex-1 rounded-lg border border-border/70 bg-background/85 dark:bg-background/40"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0.01 }
                    : {
                        type: "spring",
                        stiffness: 420,
                        damping: 28,
                        delay: 0.55 + i * 0.07,
                      }
                }
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex max-w-sm flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-2 text-foreground">
          <motion.span
            aria-hidden
            animate={reduceMotion ? {} : { rotate: [0, 10, -8, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="h-4 w-4 text-primary" />
          </motion.span>
          <span className="text-sm font-medium">AI is preparing your dashboard</span>
        </div>
        <motion.p
          className="text-xs text-muted-foreground"
          animate={reduceMotion ? {} : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          Building charts and layout…
        </motion.p>
      </div>
    </div>
  );
}

function EmptyDashboardState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 pt-12">
      <div className="flex flex-col items-center gap-4">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <LayoutDashboard className="h-8 w-8 text-muted-foreground/60" />
        </div>

        {/* Text */}
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl text-foreground/80">No insights yet</h2>
          <p className="text-sm text-muted-foreground">
            Continue the conversation to generate insights and dashboards.
            Ask about specific metrics, trends, or request a dashboard to visualize your data.
          </p>
        </div>

        {/* Hint cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 max-w-lg">
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">
                Ask for trends
              </p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">
                Request insights
              </p>
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardContent className="p-4 text-center">
              <LayoutDashboard className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">
                Create a dashboard
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LevelBadge({
  level,
}: {
  level: "High" | "Medium" | "Low";
}) {
  const className =
    level === "High"
      ? "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
      : level === "Low"
        ? "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        : undefined;

  return (
    <Badge variant={className ? "outline" : "secondary"} className={className}>
      {level}
    </Badge>
  );
}

function AnomalyPrimaryFindingContent({
  model,
  conversationTitle,
}: {
  model: PrimaryFindingViewModel;
  conversationTitle?: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader>
        <section>
          <h1 className="text-3xl tracking-tight">{conversationTitle || "Primary Finding"}</h1>
          <p className="mt-1 text-muted-foreground">
            Structured anomaly investigation summary
          </p>
        </section>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
          <div className={cn(pageMainColumnClassName, "space-y-4")}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex-1">Primary Finding</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{model.primaryFinding}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-base flex-1">Financial Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {model.financialImpactStats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border bg-muted/30 p-3"
                    >
                      <p className="text-sm text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-base font-semibold">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{model.financialImpactAssumption}</p>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex-1">Risk Level</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <LevelBadge level={model.riskLevel} />
                  <p className="text-sm text-muted-foreground">{model.riskDetail}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex-1">Confidence Level</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <LevelBadge level={model.confidenceLevel} />
                  <p className="text-sm text-muted-foreground">{model.confidenceDetail}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex-1">Protocol Step</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm">{model.protocolStepLabel}</p>
                <Badge
                  variant={model.protocolStepStatus === "Complete" ? "outline" : "secondary"}
                  className={
                    model.protocolStepStatus === "Complete"
                      ? "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : undefined
                  }
                >
                  {model.protocolStepStatus}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex-1">Root Cause</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/90">
                  {model.rootCauses.map((cause) => (
                    <li key={cause.heading}>
                      <span className="font-medium">{cause.heading}:</span>{" "}
                      <span>{cause.detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardContent({
  dashboard,
  onSave,
  isSaved,
  onRename,
  onDelete,
}: {
  dashboard: DashboardData;
  onSave?: (dashboard: DashboardData) => void;
  isSaved?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  const { ref: dashboardContentRef, isBelowBreakpoint: isCompactDashboard } =
    useContainerBreakpoint<HTMLDivElement>(768);
  const [dateRange, setDateRange] = useState<DateRangeOption>(DEFAULT_FILTERS.dateRange);
  const [team, setTeam] = useState(DEFAULT_FILTERS.team);
  const [product, setProduct] = useState(DEFAULT_FILTERS.product);
  const hasFilterChanges = useMemo(
    () =>
      dateRange !== DEFAULT_FILTERS.dateRange ||
      team !== DEFAULT_FILTERS.team ||
      product !== DEFAULT_FILTERS.product,
    [dateRange, team, product],
  );

  const trendFromDashboard = dashboard.chartData?.trend;
  const breakdownFromDashboard = dashboard.chartData?.breakdown;

  const trendData = useMemo(
    () =>
      trendFromDashboard && trendFromDashboard.length > 0
        ? trendFromDashboard
        : DEFAULT_CONVERSATION_TREND,
    [trendFromDashboard],
  );

  const breakdownData = useMemo(
    () =>
      breakdownFromDashboard && breakdownFromDashboard.length > 0
        ? breakdownFromDashboard
        : DEFAULT_CONVERSATION_BREAKDOWN,
    [breakdownFromDashboard],
  );

  const chartTrendDataset = useMemo(
    () => ({
      data: trendData,
      xKey: "date",
      yKey: "interactions",
    }),
    [trendData],
  );

  const chartCategoryDataset = useMemo(
    () => ({
      data: breakdownData,
      xKey: "category",
      yKey: "volume",
    }),
    [breakdownData],
  );

  return (
    <div ref={dashboardContentRef} key="dashboard-content" className="flex h-full min-h-0 flex-col">
      <PageHeader>
          <section className="flex items-center gap-2">
            <h1 className="text-3xl tracking-tight">{dashboard.title}</h1>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {isSaved ? (
                <Badge variant="secondary" className="h-8 gap-1.5 px-3">
                  <Check className="h-3 w-3" />
                  Saved
                </Badge>
              ) : (
                <Button size="sm" onClick={() => onSave?.(dashboard)}>
                  <Bookmark className="mr-2 h-4 w-4" />
                  Save
                </Button>
              )}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Dashboard options</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onRename}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </section>
          {dashboard.description && (
            <p className="text-muted-foreground mt-1">{dashboard.description}</p>
          )}
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

      <div className="min-h-0 flex-1 overflow-auto">
        <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
        <div className={cn(pageMainColumnClassName, "space-y-4")}>
        <HeaderAIInsightsRow dashboardId={dashboard.id} dashboardData={dashboard} />

        <div className="flex flex-wrap items-center gap-4 !mt-8">
          <h3 className="flex items-center gap-2 tracking-tight">
            <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Key Performance Indicators
          </h3>
        </div>

        <div
          className={`grid gap-4 ${
            isCompactDashboard
              ? "grid-cols-1"
              : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
          }`}
        >
          <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <CardDescription className="flex-1">Total Escalations</CardDescription>
                <WidgetAskAIAndOverflow
                  widgetTitle="Total Escalations"
                  chartType="metric"
                  widgetAnchorId={`${dashboard.id}-kpi-total-escalations`}
                  tooltipLabel="Ask AI about this metric"
                />
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

          <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <CardDescription className="flex-1">Avg Resolution Time</CardDescription>
                <WidgetAskAIAndOverflow
                  widgetTitle="Avg Resolution Time"
                  chartType="metric"
                  widgetAnchorId={`${dashboard.id}-kpi-avg-resolution`}
                  tooltipLabel="Ask AI about this metric"
                />
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

          <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <CardDescription className="flex-1">Customer Satisfaction</CardDescription>
                <WidgetAskAIAndOverflow
                  widgetTitle="Customer Satisfaction"
                  chartType="metric"
                  widgetAnchorId={`${dashboard.id}-kpi-csat`}
                  tooltipLabel="Ask AI about this metric"
                />
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

          <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <CardDescription className="flex-1">Resolution Rate</CardDescription>
                <WidgetAskAIAndOverflow
                  widgetTitle="Resolution Rate"
                  chartType="metric"
                  widgetAnchorId={`${dashboard.id}-kpi-resolution-rate`}
                  tooltipLabel="Ask AI about this metric"
                />
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
          dashboardId={dashboard.id}
          trend={chartTrendDataset}
          category={chartCategoryDataset}
        />
        </div>
        </div>
      </div>
    </div>
  );
}

export function ConversationDashboardArea({
  isThinking,
  dashboardData,
  anomalyPrimaryFinding,
  conversationTitle,
  onWidgetPrompt,
  onSave,
  isSaved,
  onRename,
  onDelete,
}: ConversationDashboardAreaProps) {
  // Determine what to show
  if (isThinking && !dashboardData) {
    return <DashboardBuildingAnimation />;
  }

  if (dashboardData) {
    return (
      <WidgetAIProvider persistKey={`conversation-${dashboardData.id}`} onWidgetPrompt={onWidgetPrompt}>
        <DashboardContent
          dashboard={dashboardData}
          onSave={onSave}
          isSaved={isSaved}
          onRename={onRename}
          onDelete={onDelete}
        />
      </WidgetAIProvider>
    );
  }

  if (anomalyPrimaryFinding) {
    return (
      <AnomalyPrimaryFindingContent
        model={anomalyPrimaryFinding}
        conversationTitle={conversationTitle}
      />
    );
  }

  return <EmptyDashboardState />;
}
