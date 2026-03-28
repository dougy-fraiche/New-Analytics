import { useMemo, useState } from "react";
import { Sparkles, LayoutDashboard, BarChart3, Bookmark, MoreVertical, Pencil, Trash2, Check, RotateCcw } from "lucide-react";
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
import { PageContent, PageHeader } from "./PageChrome";
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

interface ConversationDashboardAreaProps {
  isThinking: boolean;
  dashboardData: DashboardData | null;
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

function ThinkingAnimation() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm">AI is preparing your dashboard</span>
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
          <div>
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Ask for trends
                </p>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <Sparkles className="h-5 w-5 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Request insights
                </p>
              </CardContent>
            </Card>
          </div>
          <div>
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

  // Generate default trend data if not provided
  const trendData = dashboard.chartData?.trend || [
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

  // Generate default breakdown data if not provided
  const breakdownData = dashboard.chartData?.breakdown || [
    { category: "Password Reset", volume: 1842 },
    { category: "Billing Support", volume: 1356 },
    { category: "Product Inquiry", volume: 987 },
    { category: "Shipping Status", volume: 764 },
    { category: "Returns & Refunds", volume: 623 },
  ];

  return (
    <div ref={dashboardContentRef} key="dashboard-content" className="flex h-full min-h-0 flex-col">
      <PageHeader>
        <div>
          <div className="flex items-center gap-2">
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
          </div>
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
        </div>
      </PageHeader>

      <div className="min-h-0 flex-1 overflow-auto">
        <PageContent className="space-y-4 px-4 pt-6 pb-8 md:px-8">
        <HeaderAIInsightsRow dashboardId={dashboard.id} dashboardData={dashboard} />
        {/* Key Metrics with stagger animation */}
        {dashboard.metrics && dashboard.metrics.length > 0 && (
          <div
            className={`grid gap-4 ${
              isCompactDashboard
                ? "grid-cols-1"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
            }`}
          >
            {dashboard.metrics.map((metric, idx) => (
              <div key={idx}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>{metric.label}</CardDescription>
                    <CardTitle className="text-3xl">{metric.value}</CardTitle>
                  </CardHeader>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Randomized Chart Grid */}
        <DashboardChartGrid
          dashboardId={dashboard.id}
          trend={{ data: trendData, xKey: "date", yKey: "interactions" }}
          category={{ data: breakdownData, xKey: "category", yKey: "volume" }}
        />
        </PageContent>
      </div>
    </div>
  );
}

export function ConversationDashboardArea({
  isThinking,
  dashboardData,
  onWidgetPrompt,
  onSave,
  isSaved,
  onRename,
  onDelete,
}: ConversationDashboardAreaProps) {
  // Determine what to show
  if (isThinking && !dashboardData) {
    return <ThinkingAnimation />;
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

  return <EmptyDashboardState />;
}