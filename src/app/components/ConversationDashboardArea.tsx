import { useMemo, useState } from "react";
import {
  Sparkles,
  LayoutDashboard,
  BarChart3,
  Loader2,
  Bookmark,
  MoreVertical,
  Pencil,
  Trash2,
  Check,
  RotateCcw,
  LineChart,
  CircleGauge,
  Search,
  FileText,
  Hash,
  Activity,
  AlertTriangle,
  PhoneCall,
  Users,
  ShieldAlert,
  UserCog,
  DollarSign,
  CircleAlert,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty";
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
import type { DashboardSuggestedAction } from "./DashboardAISummary";
import {
  PageHeader,
  PageHeaderPrimaryRow,
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
import { dashboardTrendBadgeKpiByKey } from "../data/dashboard-kpis";

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
import { KpiSparkline } from "./KpiSparkline";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import type { PrimaryFindingViewModel } from "../lib/anomaly-primary-finding";
import { recommendedActionsData } from "../data/recommended-actions";

const TOTAL_ESCALATIONS_KPI = dashboardTrendBadgeKpiByKey.totalEscalations;
const AVG_RESOLUTION_KPI = dashboardTrendBadgeKpiByKey.avgResolutionHours;
const CUSTOMER_SATISFACTION_KPI = dashboardTrendBadgeKpiByKey.customerSatisfactionPct;
const RESOLUTION_RATE_KPI = dashboardTrendBadgeKpiByKey.resolutionRatePct;

interface ConversationDashboardAreaProps {
  isThinking: boolean;
  dashboardData: DashboardData | null;
  anomalyPrimaryFinding?: PrimaryFindingViewModel | null;
  conversationTitle?: string;
  anomalyHeadingActionLabel?: string;
  onAnomalyHeadingAction?: () => void;
  hasCompletedAssistantMessage?: boolean;
  /** When provided, widget AI prompts are sent to this handler instead of the dashboard chat panel */
  onWidgetPrompt?: (
    widgetTitle: string,
    message: string,
    chartType?: string,
    widgetAnchorId?: string,
    selectedKpiLabel?: string | null,
  ) => void;
  onSave?: (dashboard: DashboardData) => void;
  isSaved?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
}

/** Shown while the assistant is generating the first dashboard payload (Explore → conversation). */
function DashboardBuildingAnimation() {
  return (
    <Empty
      variant="solid"
      className="h-full min-h-[min(320px,50vh)] border-0"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="AI is preparing your dashboard"
    >
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </EmptyMedia>
        <EmptyTitle>Preparing your dashboard</EmptyTitle>
        <EmptyDescription>Building charts and layout...</EmptyDescription>
      </EmptyHeader>
    </Empty>
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

function parseMetricNumber(value: string): number | null {
  const match = value.match(/-?\d[\d,]*(?:\.\d+)?/);
  if (!match?.[0]) return null;
  const parsed = Number.parseFloat(match[0].replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function buildAnomalyKpiSparklineValues(
  value: string,
  sublabel: string | undefined,
  index: number,
): number[] {
  const baseline = parseMetricNumber(value) ?? (40 + index * 6);
  const directionFromSublabel = sublabel?.toLowerCase().includes("down")
    ? -1
    : sublabel?.toLowerCase().includes("up")
      ? 1
      : 0;
  const direction = directionFromSublabel || (index % 2 === 0 ? 1 : -1);

  const amplitude = Math.max(Math.abs(baseline) * 0.08, 1);
  const points = 14;
  const start = baseline - direction * amplitude * 3.2;

  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const trendValue = start + (baseline - start) * t;
    const wiggle = Math.sin((i + index) * 0.8) * amplitude * 0.15;
    return Math.max(0, trendValue + wiggle);
  });
}

function rootCauseIconForHeading(heading: string) {
  switch (heading) {
    case "Precipitating Event":
      return AlertTriangle;
    case "Overwhelming Call Volume Spike":
      return PhoneCall;
    case "Queue Pressure & Capacity Constraints":
      return Users;
    case "Quality Degradation":
      return ShieldAlert;
    case "Staffing & Efficiency":
      return UserCog;
    case "Downstream Financial Impact":
      return DollarSign;
    default:
      return CircleAlert;
  }
}

function contextualAnomalyActionTitle(actionText: string, index: number): string {
  const lower = actionText.toLowerCase();
  if (/queue|routing|capacity/.test(lower)) {
    return "Stabilize Queue Routing Capacity";
  }
  if (/quality|qa|resolution|csat/.test(lower)) {
    return "Protect Resolution Quality";
  }
  if (/staffing|handoff|escalation|backlog/.test(lower)) {
    return "Rebalance Staffing Escalation Paths";
  }
  if (/cost|financial|callback|follow-up/.test(lower)) {
    return "Reduce Downstream Cost Exposure";
  }
  return `Mitigate Anomaly Driver ${index + 1}`;
}

function buildAnomalySuggestedActions(model: PrimaryFindingViewModel): DashboardSuggestedAction[] {
  const templates = recommendedActionsData.slice(0, 3);
  const csat = model.kpiCards.find((card) => card.label === "CSAT Score")?.value;
  const anomalies = model.kpiCards.find((card) => card.label === "Anomalies")?.value;
  const confidence = model.kpiCards.find((card) => card.label === "Confidence")?.value;
  const actionTexts = model.recommendedActions.slice(0, 3);

  while (actionTexts.length < 3) {
    const fallbackFromCause =
      model.rootCauses[actionTexts.length]?.detail ??
      "Prioritize remediation against the highest-confidence contributing factor.";
    actionTexts.push(fallbackFromCause);
  }

  return actionTexts.map((actionText, index) => {
    const template = templates[index] ?? templates[0]!;
    const impactValue =
      index === 0
        ? csat ? `CSAT ${csat}` : template.impactValue
        : index === 1
          ? anomalies ? `${anomalies} anomalies` : template.impactValue
          : confidence ? `Confidence ${confidence}` : template.impactValue;

    return {
      ...template,
      id: 10_000 + index,
      title: contextualAnomalyActionTitle(actionText, index),
      description: actionText,
      note: `Derived from root cause analysis factor ${index + 1}.`,
      impactValue,
      impactLabel: "Anomaly mitigation",
      affectedIntent: model.rootCauses[index]?.heading ?? template.affectedIntent,
      whatWillHappen: actionText,
      cardDescription: actionText,
    };
  });
}

function AnomalyPrimaryFindingContent({
  model,
  conversationTitle,
  onRename,
  onDelete,
}: {
  model: PrimaryFindingViewModel;
  conversationTitle?: string;
  anomalyHeadingActionLabel?: string;
  onAnomalyHeadingAction?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  const showConversationMenu = Boolean(onRename || onDelete);
  const relatedAnomalyFallback: (typeof model.relatedAnomalies)[number] = {
    label: "Service Quality",
    detail: "Quality and operational efficiency indicators moved outside expected baseline.",
  };
  const relatedAnomalyCards = (
    model.relatedAnomalies.length >= 2
      ? model.relatedAnomalies.slice(0, 2)
      : [...model.relatedAnomalies, relatedAnomalyFallback]
  ).slice(0, 2);
  const anomalySuggestedActions = useMemo(
    () => buildAnomalySuggestedActions(model),
    [model],
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHeader>
        <PageHeaderPrimaryRow
          title={<h1 className="text-3xl tracking-tight">{conversationTitle || "Primary Finding"}</h1>}
          actions={showConversationMenu ? (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Conversation options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">Conversation options</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                {onRename ? (
                  <DropdownMenuItem onClick={onRename}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                ) : null}
                {onDelete ? (
                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : undefined}
        />
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
          <div className={cn(pageMainColumnClassName, "space-y-4")}>
            <HeaderAIInsightsRow
              dashboardId={model.aiInsightsDashboardId}
              dashboardData={{
                id: model.aiInsightsDashboardId,
                title: conversationTitle || "Anomaly Investigation",
                description: model.headingSubtitle,
              }}
              defaultOpen
              suggestedActionsOverride={anomalySuggestedActions}
            />

            <h3 className="!mt-8 flex items-center gap-2 tracking-tight">
              <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Root Cause Analysis
              <span className="text-sm font-normal text-muted-foreground">
                {`${model.rootCauses.length} contributing factors`}
              </span>
            </h3>

            <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base flex-1">Contributing Factors</CardTitle>
                  <WidgetAskAIAndOverflow
                    showOverflowMenu={false}
                    widgetTitle="Card Source: Root Cause Analysis"
                    chartType="metric"
                    widgetAnchorId="anomaly-root-cause-analysis"
                    tooltipLabel="Ask AI about this insight"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {model.rootCauses.map((cause) => {
                  const CauseIcon = rootCauseIconForHeading(cause.heading);

                  return (
                    <div key={cause.heading} className="rounded-lg border p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <CauseIcon className="h-4 w-4 text-primary" aria-hidden />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{cause.heading}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{cause.detail}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <h3 className="!mt-8 flex items-center gap-2 tracking-tight">
              <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Key Performance Indicators
            </h3>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {model.kpiCards.map((kpi, index) => (
                <Card
                  key={kpi.label}
                  className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30"
                >
                  <CardHeader className="p-4 pb-0">
                    <div className="flex items-center gap-2">
                      <CardDescription className="flex-1">{kpi.label}</CardDescription>
                      <WidgetAskAIAndOverflow
                        showOverflowMenu={false}
                        widgetTitle={kpi.label}
                        chartType="metric"
                        widgetAnchorId={`anomaly-kpi-${index}`}
                        tooltipLabel="Ask AI about this metric"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 p-4 pt-0">
                    <KpiMetricValueTitle value={kpi.value} />
                    {kpi.sublabel ? (
                      <p className="text-sm text-muted-foreground">{kpi.sublabel}</p>
                    ) : null}
                    <KpiSparkline
                      values={buildAnomalyKpiSparklineValues(kpi.value, kpi.sublabel, index)}
                      seriesName={kpi.label}
                      formatValue={(v) =>
                        kpi.value.includes("%")
                          ? `${v.toFixed(1)}%`
                          : kpi.value.includes("$")
                            ? `$${Math.round(v).toLocaleString()}`
                            : Number.isInteger(v)
                              ? v.toLocaleString()
                              : v.toFixed(1)
                      }
                      className="h-8 min-h-8"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <CardTitle className="text-base flex-1">Qualitative Evidence</CardTitle>
                    <WidgetAskAIAndOverflow
                      showOverflowMenu={false}
                      widgetTitle="Qualitative Evidence"
                      chartType="metric"
                      widgetAnchorId="anomaly-qualitative-evidence"
                      tooltipLabel="Ask AI about this evidence"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{model.qualitativeEvidence}</p>
                </CardContent>
              </Card>

              <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <CardTitle className="text-base flex-1">Quantitative Evidence</CardTitle>
                    <WidgetAskAIAndOverflow
                      showOverflowMenu={false}
                      widgetTitle="Quantitative Evidence"
                      chartType="metric"
                      widgetAnchorId="anomaly-quantitative-evidence"
                      tooltipLabel="Ask AI about this evidence"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{model.quantitativeEvidence}</p>
                </CardContent>
              </Card>
            </div>

            <h3 className="!mt-8 flex items-center gap-2 tracking-tight">
              <Activity className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              Related Anomalies
            </h3>

            <div className="grid gap-4 xl:grid-cols-2">
              {relatedAnomalyCards.map((related, index) => (
                <Card
                  key={`${related.label}-${related.detail}`}
                  className="group/widget relative flex h-auto min-h-[8rem] shrink-0 flex-col overflow-hidden transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-md sm:h-[8rem]"
                >
                  <div className="flex min-h-0 w-full flex-1 flex-col rounded-xl text-left">
                    <CardHeader className="shrink-0 gap-1 space-y-0 px-4 pb-1.5 pt-3 pr-4">
                      <CardTitle className="line-clamp-2 text-base font-semibold leading-snug">
                        {related.label}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-xs leading-snug">
                        {related.detail}
                      </CardDescription>
                    </CardHeader>

                    <div className="mt-auto flex w-full min-w-0 shrink-0 flex-wrap items-center gap-2 px-4 pb-3 pt-2">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                        <Badge
                          variant={index === 0 ? "destructive" : "secondary"}
                          className={
                            index === 1
                              ? "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
                              : undefined
                          }
                        >
                          {index === 0 ? "Critical" : "High"}
                        </Badge>
                      </div>
                      {related.timestamp && !/csat/i.test(related.label) ? (
                        <span className="text-xs text-muted-foreground">{related.timestamp}</span>
                      ) : null}
                      <WidgetAskAIAndOverflow
                        showOverflowMenu={false}
                        widgetTitle={`Related Anomaly: ${related.label}`}
                        chartType="metric"
                        widgetAnchorId={`anomaly-related-${index}`}
                        tooltipLabel="Ask AI about this anomaly"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardContent({
  dashboard,
  conversationTitle,
  onSave,
  isSaved,
  onRename,
  onDelete,
}: {
  dashboard: DashboardData;
  conversationTitle?: string;
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
        <PageHeaderPrimaryRow
          title={<h1 className="text-3xl tracking-tight">{conversationTitle || dashboard.title}</h1>}
          actions={(
            <>
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
            </>
          )}
        />
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
        <div className={cn(pageMainColumnClassName, "space-y-4")}>
        <HeaderAIInsightsRow dashboardId={dashboard.id} dashboardData={dashboard} />
        <div className="flex flex-wrap items-center gap-2">
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
                <KpiMetricValueTitle value={TOTAL_ESCALATIONS_KPI.value} />
                <Badge
                  variant="secondary"
                  className="shrink-0 border-transparent bg-emerald-600 text-xs text-white dark:bg-emerald-600 dark:text-white"
                >
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {TOTAL_ESCALATIONS_KPI.trend}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <KpiSparkline
                values={TOTAL_ESCALATIONS_KPI.sparkline}
                seriesName={TOTAL_ESCALATIONS_KPI.seriesName}
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
                <KpiMetricValueTitle value={AVG_RESOLUTION_KPI.value} />
                <Badge
                  variant="secondary"
                  className="shrink-0 border-transparent bg-red-600 text-xs text-white dark:bg-red-600 dark:text-white"
                >
                  <span className="inline-flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    {AVG_RESOLUTION_KPI.trend}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <KpiSparkline
                values={AVG_RESOLUTION_KPI.sparkline}
                seriesName={AVG_RESOLUTION_KPI.seriesName}
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
                <KpiMetricValueTitle value={CUSTOMER_SATISFACTION_KPI.value} />
                <Badge
                  variant="secondary"
                  className="shrink-0 border-transparent bg-emerald-600 text-xs text-white dark:bg-emerald-600 dark:text-white"
                >
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {CUSTOMER_SATISFACTION_KPI.trend}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <KpiSparkline
                values={CUSTOMER_SATISFACTION_KPI.sparkline}
                seriesName={CUSTOMER_SATISFACTION_KPI.seriesName}
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
                <KpiMetricValueTitle value={RESOLUTION_RATE_KPI.value} />
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {RESOLUTION_RATE_KPI.trend}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <KpiSparkline
                values={RESOLUTION_RATE_KPI.sparkline}
                seriesName={RESOLUTION_RATE_KPI.seriesName}
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
          expandSingletonRows
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
  anomalyHeadingActionLabel,
  onAnomalyHeadingAction,
  hasCompletedAssistantMessage = false,
  onWidgetPrompt,
  onSave,
  isSaved,
  onRename,
  onDelete,
}: ConversationDashboardAreaProps) {
  // Determine what to show
  const shouldShowDashboardBuildingAnimation =
    isThinking &&
    !dashboardData &&
    (!anomalyPrimaryFinding || !hasCompletedAssistantMessage);

  if (shouldShowDashboardBuildingAnimation) {
    return <DashboardBuildingAnimation />;
  }

  if (dashboardData) {
    return (
      <WidgetAIProvider persistKey={`conversation-${dashboardData.id}`} onWidgetPrompt={onWidgetPrompt}>
        <DashboardContent
          dashboard={dashboardData}
          conversationTitle={conversationTitle}
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
      <WidgetAIProvider
        persistKey={`conversation-anomaly-${conversationTitle || "primary-finding"}`}
        onWidgetPrompt={onWidgetPrompt}
      >
        <AnomalyPrimaryFindingContent
          model={anomalyPrimaryFinding}
          conversationTitle={conversationTitle}
          anomalyHeadingActionLabel={anomalyHeadingActionLabel}
          onAnomalyHeadingAction={onAnomalyHeadingAction}
          onRename={onRename}
          onDelete={onDelete}
        />
      </WidgetAIProvider>
    );
  }

  return <EmptyDashboardState />;
}
