import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  Calendar,
  Download,
  MoreVertical,
  Settings,
  Clock,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  CircleGauge,
  LineChart,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Separator } from "./ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ootbCategories } from "../data/ootb-dashboards";
import { DashboardChartGrid } from "./ChartVariants";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useContainerBreakpoint } from "../hooks/useContainerBreakpoint";
import {
  PageHeader,
  pageHeaderTabsFooterClassName,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { PageTransition } from "./PageTransition";
import { KpiSparkline, KPI_SPARKLINE_SERIES } from "./KpiSparkline";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { LabeledFilterInline, LabeledSelectValue } from "./HeaderFilters";
import { AIAgentsOverviewTab } from "./AIAgentsOverviewTab";
import { AIAgentsEvaluationTab } from "./AIAgentsEvaluationTab";
import { AIAgentsIntentNluTab } from "./AIAgentsIntentNluTab";
import { cn } from "./ui/utils";
import { ROUTES } from "../routes";
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

// Mock data for dashboard content (same as DashboardPage)
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
  { agent: "Sarah Johnson", escalations: 23, resolved: 187, avgTime: "4.2h", satisfaction: "94%" },
  { agent: "Michael Chen", escalations: 18, resolved: 203, avgTime: "3.8h", satisfaction: "96%" },
  { agent: "Emily Rodriguez", escalations: 31, resolved: 176, avgTime: "5.1h", satisfaction: "91%" },
  { agent: "David Kim", escalations: 15, resolved: 215, avgTime: "3.5h", satisfaction: "97%" },
  { agent: "Lisa Wang", escalations: 27, resolved: 192, avgTime: "4.6h", satisfaction: "93%" },
];

export function ObservabilityCategoryPage() {
  const params = useParams<{ categoryId?: string; dashboardId?: string }>();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isAiAgentsRoute = pathname === ROUTES.AI_AGENTS || pathname.startsWith(`${ROUTES.AI_AGENTS}/`);
  const isCopilotLegacyRoute = pathname === ROUTES.AI_AGENTS_DASHBOARD("ai-agents-copilot");

  const categoryId =
    params.categoryId ??
    (pathname === ROUTES.AI_AGENTS || pathname.startsWith(`${ROUTES.AI_AGENTS}/`)
      ? "ai-agents"
      : undefined);
  const urlDashboardId = params.dashboardId;

  const category = ootbCategories.find((c) => c.id === categoryId);
  const visibleDashboards =
    category?.id === "ai-agents"
      ? category.dashboards.filter((d) => d.id !== "ai-agents-copilot")
      : category?.dashboards ?? [];

  const { ref: dashboardContentRef, isBelowBreakpoint: isCompactDashboard } =
    useContainerBreakpoint<HTMLDivElement>(768);
  const [dateRange, setDateRange] = useState<DateRangeOption>(DEFAULT_FILTERS.dateRange);
  const [team, setTeam] = useState(DEFAULT_FILTERS.team);
  const [product, setProduct] = useState(DEFAULT_FILTERS.product);

  const hasFilterChanges = useMemo(() => {
    return (
      dateRange !== DEFAULT_FILTERS.dateRange ||
      team !== DEFAULT_FILTERS.team ||
      product !== DEFAULT_FILTERS.product
    );
  }, [dateRange, team, product]);

  const standaloneCategoryId =
    category && category.dashboards.length === 0 ? category.id : null;

  useEffect(() => {
    if (standaloneCategoryId) {
      navigate(`/dashboard/${standaloneCategoryId}`, { replace: true });
    }
  }, [standaloneCategoryId, navigate]);

  useEffect(() => {
    if (!isAiAgentsRoute || pathname !== ROUTES.AI_AGENTS) return;
    const first = visibleDashboards[0]?.id;
    if (first) navigate(ROUTES.AI_AGENTS_DASHBOARD(first), { replace: true });
  }, [isAiAgentsRoute, pathname, visibleDashboards, navigate]);

  useEffect(() => {
    if (!isCopilotLegacyRoute) return;
    navigate(ROUTES.COPILOT, { replace: true });
  }, [isCopilotLegacyRoute, navigate]);

  if (!category) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h1 className="text-4xl mb-2">404</h1>
          <p className="text-muted-foreground">Category not found</p>
        </div>
      </div>
    );
  }

  if (standaloneCategoryId) {
    return null;
  }

  if (visibleDashboards.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h1 className="text-4xl mb-2">404</h1>
          <p className="text-muted-foreground">No dashboards configured for this category</p>
        </div>
      </div>
    );
  }

  // Determine the active dashboard tab
  const defaultDashboard = visibleDashboards[0];
  const activeDashboardId = urlDashboardId && visibleDashboards.some((d) => d.id === urlDashboardId)
    ? urlDashboardId
    : defaultDashboard.id;

  const activeDashboard = visibleDashboards.find((d) => d.id === activeDashboardId) || defaultDashboard;
  const headerSubtitle = category.pageDescription ?? activeDashboard.description;

  const handleTabChange = (tabValue: string) => {
    navigate(ROUTES.AI_AGENTS_DASHBOARD(tabValue), { replace: true });
  };

  return (
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId={activeDashboardId}>
      <Tabs value={activeDashboardId} onValueChange={handleTabChange} className="flex flex-col h-full min-h-0">
        <div className="flex flex-col h-full min-h-0">
          <PageHeader className={pageHeaderTabsFooterClassName}>
            <section>
              <section className="flex items-center gap-2">
                <h1 className="text-3xl tracking-tight">{category.name}</h1>
                <div className="ml-auto flex items-center gap-2">
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </section>
              <p className="text-muted-foreground mt-1">
                {headerSubtitle}
              </p>
            </section>
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
            <TabsList variant="line" className="mt-4">
              {visibleDashboards.map((dashboard) => (
                  <TabsTrigger key={dashboard.id} value={dashboard.id}>
                    {dashboard.name}
                  </TabsTrigger>
                ))}
            </TabsList>
          </PageHeader>
          <div className="flex-1 min-h-0 overflow-auto">
            <div className={cn(pageRootListScrollGutterClassName, "pb-4 md:pb-8")}>
            <PageTransition className={pageMainColumnClassName}>
            <div ref={dashboardContentRef} className="space-y-4">
            <HeaderAIInsightsRow
              dashboardId={activeDashboard.id}
              dashboardData={{
                id: activeDashboard.id,
                title: activeDashboard.name,
                description: activeDashboard.description,
              }}
            />
            {visibleDashboards.map((dashboard) => (
              <TabsContent key={dashboard.id} value={dashboard.id} className="space-y-4 mt-2">
                {dashboard.id === "ai-agents-overview" || dashboard.id === "ai-agents-copilot" ? (
                  <AIAgentsOverviewTab
                    isCompactDashboard={isCompactDashboard}
                    showWidgetOverflowMenu={false}
                  />
                ) : dashboard.id === "ai-agent-evaluation" ? (
                  <AIAgentsEvaluationTab
                    isCompactDashboard={isCompactDashboard}
                    showWidgetOverflowMenu={false}
                  />
                ) : dashboard.id === "intent-nlu" ? (
                  <AIAgentsIntentNluTab
                    isCompactDashboard={isCompactDashboard}
                    showWidgetOverflowMenu={false}
                  />
                ) : (
                  <>
                {/* KPI Section Header */}
                <h3 className="mt-8 flex items-center gap-2 tracking-tight">
                  <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Key Performance Indicators
                </h3>

                {/* Metric Cards */}
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
                          showOverflowMenu={false}
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
                          showOverflowMenu={false}
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
                          showOverflowMenu={false}
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
                          showOverflowMenu={false}
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

                {/* Chart Grid — unique per dashboard */}
                <DashboardChartGrid
                  dashboardId={dashboard.id}
                  trend={{ data: trendData, xKey: "date", yKey: "conversations" }}
                  category={{ data: categoryData, xKey: "category", yKey: "tickets" }}
                  comparison={{
                    data: comparisonData,
                    xKey: "week",
                    yKey: "thisPeriod",
                    y2Key: "lastPeriod",
                  }}
                  showWidgetOverflowMenu={false}
                />

                {/* Data Table */}
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
                      <TableRow key={row.agent} className="h-[3rem]">
                        <TableCell className="font-medium">{row.agent}</TableCell>
                        <TableCell className="text-right">{row.escalations}</TableCell>
                        <TableCell className="text-right">{row.resolved}</TableCell>
                        <TableCell className="text-right">{row.avgTime}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{row.satisfaction}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                  </>
                )}
              </TabsContent>
            ))}
          </div>
            </PageTransition>
            </div>
        </div>
      </div>
      </Tabs>

    </WidgetAIProvider>
  );
}
