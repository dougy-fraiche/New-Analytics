import { useMemo, useState, useRef, useLayoutEffect, useCallback } from "react";
import { Link } from "react-router";
import { Search, LayoutGrid, ExternalLink, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

import {
  PageHeader,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { cn } from "./ui/utils";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "./ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { LabeledSelectValue } from "./HeaderFilters";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  generateGridLayout,
  buildChartConfig,
  UniversalChart,
  type ChartType,
  type DatasetConfig,
} from "./ChartVariants";
import { allOotbDashboards, standaloneCategories } from "../data/ootb-dashboards";
import { useProjects } from "../contexts/ProjectContext";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import { PageTransition } from "./PageTransition";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import {
  getSavedFolderDashboardPath,
  getSavedStandaloneDashboardPath,
} from "../lib/saved-slugs";
import { ROUTES } from "../routes";

// ─── Shared data sets (same as DashboardPage) ──────────────────────────────

const trendDataset: DatasetConfig = {
  data: [
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
  ],
  xKey: "date",
  yKey: "conversations",
};

const categoryDataset: DatasetConfig = {
  data: [
    { category: "Account Access", tickets: 342 },
    { category: "Billing Inquiry", tickets: 287 },
    { category: "Technical Issue", tickets: 214 },
    { category: "Feature Request", tickets: 156 },
    { category: "Bug Report", tickets: 98 },
  ],
  xKey: "category",
  yKey: "tickets",
};

const comparisonDataset: DatasetConfig = {
  data: [
    { week: "Week 1", thisPeriod: 892, lastPeriod: 764 },
    { week: "Week 2", thisPeriod: 1024, lastPeriod: 831 },
    { week: "Week 3", thisPeriod: 943, lastPeriod: 897 },
    { week: "Week 4", thisPeriod: 1156, lastPeriod: 952 },
    { week: "Week 5", thisPeriod: 1087, lastPeriod: 1014 },
    { week: "Week 6", thisPeriod: 1243, lastPeriod: 1078 },
  ],
  xKey: "week",
  yKey: "thisPeriod",
  y2Key: "lastPeriod",
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardSource {
  name: string;
  path: string;
  type: "ootb" | "custom";
}

interface InsightWidget {
  /** Unique key = title + chartType combo */
  id: string;
  title: string;
  description: string;
  chartType: ChartType;
  dataSource: "trend" | "category" | "comparison";
  /** First dashboard that generated this panel (used for stable rendering) */
  firstDashboardId: string;
  firstPanelIndex: number;
  /** All dashboards containing this widget */
  dashboards: DashboardSource[];
}

// ─── Widget generation ──────────────────────────────────────────────────────

function collectAllWidgets(
  customDashboards: Array<{ id: string; name: string; path: string }>
): InsightWidget[] {
  const widgetMap = new Map<string, InsightWidget>();

  const processDashboard = (
    dashboardId: string,
    source: DashboardSource
  ) => {
    const layout = generateGridLayout(dashboardId, true);
    for (let i = 0; i < layout.panels.length; i++) {
      const panel = layout.panels[i];
      // Deduplicate by title + chartType
      const key = `${panel.title}__${panel.chartType}`;
      const existing = widgetMap.get(key);
      if (existing) {
        // Only add the dashboard source if not already tracked
        if (!existing.dashboards.some((d) => d.path === source.path)) {
          existing.dashboards.push(source);
        }
      } else {
        widgetMap.set(key, {
          id: key,
          title: panel.title,
          description: panel.description,
          chartType: panel.chartType,
          dataSource: panel.dataSource,
          firstDashboardId: dashboardId,
          firstPanelIndex: i,
          dashboards: [source],
        });
      }
    }
  };

  // OOTB dashboards
  for (const dashboard of allOotbDashboards) {
    processDashboard(dashboard.id, {
      name: dashboard.name,
      path: ROUTES.DASHBOARD(dashboard.id),
      type: "ootb",
    });
  }

  // Standalone categories (the category IS the dashboard)
  for (const cat of standaloneCategories) {
    processDashboard(cat.id, {
      name: cat.name,
      path: ROUTES.DASHBOARD(cat.id),
      type: "ootb",
    });
  }

  // Custom dashboards
  for (const custom of customDashboards) {
    processDashboard(custom.id, {
      name: custom.name,
      path: custom.path,
      type: "custom",
    });
  }

  return Array.from(widgetMap.values());
}

// ─── Chart type filter options ──────────────────────────────────────────────

const CHART_TYPE_LABELS: Record<string, string> = {
  all: "All Types",
  area: "Area",
  "area-gradient": "Area Gradient",
  line: "Line",
  "line-curved": "Line Curved",
  scatter: "Scatter",
  "bar-vertical": "Bar Vertical",
  "bar-gradient": "Bar Gradient",
  "bar-horizontal": "Bar Horizontal",
  pie: "Pie",
  donut: "Donut",
  funnel: "Funnel",
  treemap: "Treemap",
  radar: "Radar",
  "radar-filled": "Radar Filled",
  radial: "Radial (deprecated)",
  "bar-grouped": "Bar Grouped",
  "bar-stacked": "Bar Stacked",
  "line-multi": "Line Multi",
  "area-stacked": "Area Stacked",
};

// ─── Component ──────────────────────────────────────────────────────────────

export function AllInsightsPage() {
  const { projects, standaloneDashboards } = useProjects();
  const [searchQuery, setSearchQuery] = useState("");
  const [chartTypeFilter, setChartTypeFilter] = useState("all");

  // Flatten custom dashboards for widget collection
  const customDashboards = useMemo(() => {
    const items: Array<{ id: string; name: string; path: string }> = [];
    for (const project of projects) {
      for (const dashboard of project.dashboards) {
        items.push({
          id: dashboard.id,
          name: dashboard.name,
          path: getSavedFolderDashboardPath(project, dashboard),
        });
      }
    }
    for (const sd of standaloneDashboards) {
      items.push({
        id: sd.id,
        name: sd.name,
        path: getSavedStandaloneDashboardPath(sd),
      });
    }
    return items;
  }, [projects, standaloneDashboards]);

  // Collect all unique widgets
  const allWidgets = useMemo(
    () => collectAllWidgets(customDashboards),
    [customDashboards]
  );

  // Derive available chart types for the filter
  const availableChartTypes = useMemo(() => {
    const types = new Set(allWidgets.map((w) => w.chartType));
    return Array.from(types).sort();
  }, [allWidgets]);

  // Filter
  const filteredWidgets = useMemo(() => {
    return allWidgets.filter((widget) => {
      // Chart type filter
      if (chartTypeFilter !== "all" && widget.chartType !== chartTypeFilter) return false;
      // Search
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        widget.title.toLowerCase().includes(q) ||
        widget.description.toLowerCase().includes(q) ||
        widget.chartType.toLowerCase().includes(q) ||
        widget.dashboards.some((d) => d.name.toLowerCase().includes(q))
      );
    });
  }, [allWidgets, searchQuery, chartTypeFilter]);

  return (
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId="all-insights">
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <PageHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <LayoutGrid className="h-6 w-6 text-muted-foreground" />
            </div>
            <section>
              <h1 className="text-3xl tracking-tight">All Insights</h1>
              <p className="text-muted-foreground mt-1">
                A catalog of every unique widget across all dashboards
              </p>
            </section>
          </div>
        </PageHeader>
        <div className="flex-1 overflow-auto min-h-0">
          <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
            <PageTransition className={cn(pageMainColumnClassName, "space-y-6")}>
            <HeaderAIInsightsRow
              dashboardId="insights"
              dashboardData={{
                id: "insights",
                title: "All Insights",
                description: "A catalog of every unique widget across all dashboards",
              }}
            />
            {/* Summary badges */}
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {allWidgets.length} unique widgets
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {allOotbDashboards.length + standaloneCategories.length + customDashboards.length} total dashboards
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {availableChartTypes.length} chart types
              </Badge>
            </div>

            {allWidgets.length > 0 ? (
              <>
                {/* Search + Filters */}
                <div className="flex w-full flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search widgets by name, type, or dashboard..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={chartTypeFilter} onValueChange={setChartTypeFilter}>
                    <SelectTrigger className="h-8 w-auto shrink-0">
                      <LabeledSelectValue label="Chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {availableChartTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {CHART_TYPE_LABELS[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(searchQuery || chartTypeFilter !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        setSearchQuery("");
                        setChartTypeFilter("all");
                      }}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset Filters
                    </Button>
                  )}
                  <span className="text-sm text-muted-foreground ml-auto shrink-0">
                    {filteredWidgets.length} of {allWidgets.length} widgets
                  </span>
                </div>

                {/* Widget Grid */}
                {filteredWidgets.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <LayoutGrid />
                      </EmptyMedia>
                      <EmptyTitle>No widgets match your search or filters</EmptyTitle>
                      <EmptyDescription>
                        Try adjusting your search or filter criteria
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredWidgets.map((widget) => (
                      <InsightWidgetCard key={widget.id} widget={widget} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <LayoutGrid />
                  </EmptyMedia>
                  <EmptyTitle>No widgets yet</EmptyTitle>
                  <EmptyDescription>
                    Explore conversations to generate dashboard widgets
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
            </PageTransition>
          </div>
        </div>

      </div>
    </WidgetAIProvider>
  );
}

// ─── Individual Widget Card ─────────────────────────────────────────────────

function InsightWidgetCard({ widget }: { widget: InsightWidget }) {
  const dataset =
    widget.dataSource === "trend"
      ? trendDataset
      : widget.dataSource === "comparison"
      ? comparisonDataset
      : categoryDataset;

  const config = buildChartConfig(
    widget.chartType,
    dataset.data,
    dataset.xKey,
    dataset.yKey,
    dataset.y2Key,
    widget.firstPanelIndex
  );

  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(widget.dashboards.length);
  const rowRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const labelRef = useRef<HTMLSpanElement>(null);

  const measure = useCallback(() => {
    const row = rowRef.current;
    if (!row || expanded) return;
    const rowRight = row.getBoundingClientRect().right;
    // Reserve space for the "+x more" button (~70px)
    const moreButtonWidth = 70;
    let count = 0;
    for (let i = 0; i < widget.dashboards.length; i++) {
      const el = itemRefs.current[i];
      if (!el) break;
      const elRight = el.getBoundingClientRect().right;
      // Check if this item fits; if not the last, account for the "+x more" button
      if (i < widget.dashboards.length - 1) {
        if (elRight > rowRight - moreButtonWidth) break;
      } else {
        if (elRight > rowRight) break;
      }
      count++;
    }
    setVisibleCount(Math.max(1, count));
  }, [widget.dashboards.length, expanded]);

  useLayoutEffect(() => {
    measure();
    const row = rowRef.current;
    if (!row) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(row);
    return () => ro.disconnect();
  }, [measure]);

  const hiddenCount = widget.dashboards.length - visibleCount;
  const showToggle = hiddenCount > 0;

  return (
    <Card className="flex flex-col group/widget">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-base truncate">{widget.title}</CardTitle>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <WidgetAskAIAndOverflow widgetTitle={widget.title} chartType={widget.chartType} />
            <Badge variant="outline" className="text-xs">
              {CHART_TYPE_LABELS[widget.chartType] || widget.chartType}
            </Badge>
          </div>
        </div>
        <CardDescription>{widget.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <UniversalChart
          type={widget.chartType}
          data={dataset.data}
          xKey={dataset.xKey}
          yKey={dataset.yKey}
          y2Key={dataset.y2Key}
          config={config}
          panelId={`insight-${widget.id}`}
          colSpan={2}
        />
        </CardContent>
        <CardFooter className="mt-auto pt-4">
          <WidgetAIExplanation widgetTitle={widget.title} chartType={widget.chartType} />
        </CardFooter>
      {/* Dashboard sources */}
      <div className="border-t px-6 py-3">
        {!expanded ? (
          <div ref={rowRef} className="flex items-center gap-1.5 overflow-hidden">
            <span ref={labelRef} className="text-xs text-muted-foreground mr-1 shrink-0">Used in:</span>
            <TooltipProvider delayDuration={500}>
              {widget.dashboards.map((src, i) => (
                <Tooltip key={src.path}>
                  <TooltipTrigger asChild>
                    <Link
                      ref={(el: HTMLAnchorElement | null) => { itemRefs.current[i] = el; }}
                      to={src.path}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 transition-colors text-foreground shrink-0 ${
                        i >= visibleCount ? "invisible absolute" : ""
                      }`}
                    >
                      <span className="truncate max-w-[140px]">{src.name}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go to {src.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            {showToggle && (
              <button
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-0.5 text-xs text-primary hover:text-primary/80 transition-colors cursor-pointer shrink-0"
              >
                +{hiddenCount} more
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1 shrink-0">Used in:</span>
            <TooltipProvider delayDuration={500}>
              {widget.dashboards.map((src) => (
                <Tooltip key={src.path}>
                  <TooltipTrigger asChild>
                    <Link
                      to={src.path}
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 transition-colors text-foreground"
                    >
                      <span className="truncate max-w-[140px]">{src.name}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go to {src.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            <button
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              show less
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
