import type { EChartsCoreOption } from "echarts";
import { useCallback, useState, type ReactNode } from "react";
import {
  ArrowRight,
  AudioLines,
  Columns3,
  Download,
  CircleGauge,
  LineChart,
  MessageCircle,
  MessageCircleMore,
  MessageSquareShare,
  MessagesSquare,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { EChartsCanvas, type ChartDataSelectInfo } from "./EChartsCanvas";
import { KpiSparkline } from "./KpiSparkline";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import type { ChartType } from "./ChartVariants";

type Kpi = {
  label: string;
  value: string;
  trend: string;
  sparkline: number[];
};

const kpis: Kpi[] = [
  {
    label: "Total Sessions",
    value: "12,847",
    trend: "+8.3%",
    sparkline: [10200, 10800, 11200, 11650, 12000, 12400, 12847],
  },
  {
    label: "Active Sessions",
    value: "162",
    trend: "+5.2%",
    sparkline: [118, 126, 132, 138, 144, 152, 162],
  },
  {
    label: "Avg. Session Length",
    value: "3.2 min",
    trend: "-2.1%",
    sparkline: [3.8, 3.7, 3.6, 3.45, 3.35, 3.28, 3.2],
  },
  {
    label: "Handovers (Escalations)",
    value: "342",
    trend: "-4.5%",
    sparkline: [398, 384, 372, 362, 354, 348, 342],
  },
  {
    label: "Positive Ratings",
    value: "94.2%",
    trend: "+1.8%",
    sparkline: [90.1, 91.0, 91.8, 92.4, 93.0, 93.6, 94.2],
  },
  {
    label: "Unique Contacts",
    value: "10,456",
    trend: "+6.7%",
    sparkline: [8450, 8760, 9020, 9420, 9730, 10080, 10456],
  },
];

function getTrendDirection(trend: string): "up" | "down" | "neutral" {
  const normalized = trend.trim();
  if (normalized.startsWith("+")) return "up";
  if (normalized.startsWith("-") || normalized.startsWith("−")) return "down";
  return "neutral";
}

const sessionsOverTimeOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 28 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "line",
      smooth: 0.35,
      symbol: "none",
      lineStyle: { width: 2.5, color: "#6E56CF" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(110, 86, 207, 0.24)" },
            { offset: 1, color: "rgba(110, 86, 207, 0.02)" },
          ],
        },
      },
      data: [1500, 1740, 2010, 2190, 2520, 2010, 1760],
    },
  ],
};

const sessionsByChannelOption: EChartsCoreOption = {
  grid: { left: 64, right: 12, top: 12, bottom: 20 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "category",
    /* Bottom → top: least → greatest (ECharts lists categories from bottom first). */
    data: ["Messenger", "WhatsApp", "Voice", "Webchat"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 34,
      data: [
        { value: 900, itemStyle: { color: "#556CD6", borderRadius: [0, 6, 6, 0] } },
        { value: 1800, itemStyle: { color: "#62C554", borderRadius: [0, 6, 6, 0] } },
        { value: 3400, itemStyle: { color: "#E754A8", borderRadius: [0, 6, 6, 0] } },
        { value: 7200, itemStyle: { color: "#FFC857", borderRadius: [0, 6, 6, 0] } },
      ],
    },
  ],
};

const ratingsDistributionOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 28 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["1", "2", "3", "4", "5"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [{ type: "bar", barMaxWidth: 34, data: [380, 520, 760, 2600, 8400], itemStyle: { color: "#6E56CF", borderRadius: [6, 6, 0, 0] } }],
};

const positiveByChannelOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 28 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["Webchat", "Voice", "WhatsApp", "Messenger"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 100,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))", formatter: "{value}%" },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 30,
      data: [
        { value: 92, itemStyle: { color: "#FFC857", borderRadius: [6, 6, 0, 0] } },
        { value: 86, itemStyle: { color: "#E754A8", borderRadius: [6, 6, 0, 0] } },
        { value: 91, itemStyle: { color: "#62C554", borderRadius: [6, 6, 0, 0] } },
        { value: 87, itemStyle: { color: "#556CD6", borderRadius: [6, 6, 0, 0] } },
      ],
    },
  ],
};

const sessionDurationOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 28 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["0-2 min", "2-5 min", "5-10 min", "10-15 min", ">15 min"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [{ type: "bar", barMaxWidth: 30, data: [4200, 5400, 1800, 420, 160], itemStyle: { color: "#6E56CF", borderRadius: [6, 6, 0, 0] } }],
};

const stepFunnelOption: EChartsCoreOption = {
  grid: { left: 94, right: 12, top: 12, bottom: 20 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "category",
    inverse: true,
    data: ["Start Session", "Identify Issue", "Provide Info", "Verify Solution", "Complete"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "bar",
      barWidth: 12,
      data: [
        { value: 13400, itemStyle: { color: "#6E56CF", borderRadius: 6 } },
        { value: 12100, itemStyle: { color: "#7960D9", borderRadius: 6 } },
        { value: 10900, itemStyle: { color: "#8670E0", borderRadius: 6 } },
        { value: 9600, itemStyle: { color: "#9583E6", borderRadius: 6 } },
        { value: 8700, itemStyle: { color: "#C8BFF0", borderRadius: 6 } },
      ],
    },
  ],
};

const escalationsByDurationOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 28 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  legend: { bottom: 0, textStyle: { fontSize: 10 } },
  xAxis: {
    type: "category",
    data: ["0-2 min", "2-5 min", "5-10 min", "10-15 min", ">15 min"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    { name: "Non-Escalated", type: "bar", stack: "total", data: [3000, 4000, 1200, 500, 240], itemStyle: { color: "#1F9D48" } },
    { name: "Escalated", type: "bar", stack: "total", data: [180, 280, 110, 72, 32], itemStyle: { color: "#E32926" } },
  ],
};

const escalationsOverTimeCountOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 28 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [{ type: "bar", barMaxWidth: 34, data: [58, 53, 56, 50, 52, 55, 51], itemStyle: { color: "#6E56CF", borderRadius: [6, 6, 0, 0] } }],
};

const escalationsOverTimeRateOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 28 },
  tooltip: {
    trigger: "axis",
    confine: true,
    appendToBody: true,
    valueFormatter: (val: number | string) => `${val}%`,
  },
  xAxis: {
    type: "category",
    data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 3,
    interval: 0.75,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: {
      color: "hsl(var(--muted-foreground))",
      formatter: (value: number) => `${Number(value.toFixed(2)).toString()}%`,
    },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 34,
      data: [3.0, 2.55, 2.7, 2.1, 2.45, 2.4, 2.3],
      itemStyle: { color: "#6E56CF", borderRadius: [6, 6, 0, 0] },
    },
  ],
};

/** Figma node 1:7783 — Sessions to Investigate (Overview). */
type OverviewSessionsChannel = "voice" | "webchat" | "whatsapp" | "messenger";
type OverviewSessionsCategoryKind = "high_escalation" | "low_rating" | "long_duration";

type OverviewSessionInvestigateRow = {
  id: string;
  categoryLabel: string;
  categoryKind: OverviewSessionsCategoryKind;
  channel: OverviewSessionsChannel;
  rating: number;
  escalations: number;
  duration: string;
};

const sessionsToInvestigate: OverviewSessionInvestigateRow[] = [
  {
    id: "SS-2847-9A2C",
    categoryLabel: "High Escalation",
    categoryKind: "high_escalation",
    channel: "voice",
    rating: 2,
    escalations: 3,
    duration: "14m 32s",
  },
  {
    id: "SS-2846-7B1F",
    categoryLabel: "Low Rating",
    categoryKind: "low_rating",
    channel: "webchat",
    rating: 1,
    escalations: 2,
    duration: "8m 15s",
  },
  {
    id: "SS-2845-4C8D",
    categoryLabel: "Long Duration",
    categoryKind: "long_duration",
    channel: "whatsapp",
    rating: 3,
    escalations: 1,
    duration: "18m 47s",
  },
  {
    id: "SS-2844-3E5A",
    categoryLabel: "High Escalation",
    categoryKind: "high_escalation",
    channel: "voice",
    rating: 2,
    escalations: 2,
    duration: "11m 23s",
  },
  {
    id: "SS-2843-3E5A",
    categoryLabel: "Low Rating",
    categoryKind: "low_rating",
    channel: "messenger",
    rating: 1,
    escalations: 0,
    duration: "5m 42s",
  },
];

function OverviewSessionsCategoryCell({
  categoryKind,
  label,
}: {
  categoryKind: OverviewSessionsCategoryKind;
  label: string;
}) {
  if (categoryKind === "high_escalation") {
    return (
      <span className="inline-flex min-w-0 max-w-full items-center gap-3">
        <TrendingUp className="size-4 shrink-0 text-destructive" aria-hidden />
        <span className="min-w-0 truncate text-destructive">{label}</span>
      </span>
    );
  }
  if (categoryKind === "low_rating") {
    return (
      <span className="inline-flex min-w-0 max-w-full items-center gap-3">
        <TrendingDown className="size-4 shrink-0 text-warning-border" aria-hidden />
        <span className="min-w-0 truncate text-warning-border">{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-3">
      <ArrowRight className="size-4 shrink-0 text-success" aria-hidden />
      <span className="min-w-0 truncate text-success">{label}</span>
    </span>
  );
}

const OVERVIEW_SESSIONS_TOGGLEABLE_COLUMNS = [
  { id: "category", label: "Category" },
  { id: "channel", label: "Channel" },
  { id: "rating", label: "Customer Rating" },
  { id: "escalations", label: "Escalation Count" },
  { id: "duration", label: "Duration" },
] as const;

type OverviewSessionsToggleableColumnId = (typeof OVERVIEW_SESSIONS_TOGGLEABLE_COLUMNS)[number]["id"];

function OverviewSessionsChannelCell({ channel }: { channel: OverviewSessionsChannel }) {
  const cfg =
    channel === "voice"
      ? { Icon: AudioLines, label: "Voice", iconClass: "text-muted-foreground" }
      : channel === "webchat"
        ? { Icon: MessageCircleMore, label: "Webchat", iconClass: "text-primary" }
        : channel === "whatsapp"
          ? { Icon: MessageCircle, label: "WhatsApp", iconClass: "text-success" }
          : { Icon: MessagesSquare, label: "Messenger", iconClass: "text-primary" };
  const { Icon, label, iconClass } = cfg;
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-3">
      <Icon className={`size-4 shrink-0 ${iconClass}`} aria-hidden />
      <span className="min-w-0 truncate text-foreground">{label}</span>
    </span>
  );
}

const overviewChartPanels: Array<{
  title: string;
  chartType: ChartType;
  option: EChartsCoreOption;
  description?: string;
  headerExtra?: ReactNode;
  useEscalationsTimeTabs?: boolean;
}> = [
  { title: "Session Over Time", chartType: "area-gradient", option: sessionsOverTimeOption },
  { title: "Session by Channel", chartType: "bar-horizontal", option: sessionsByChannelOption },
  { title: "Ratings Distribution", chartType: "bar-vertical", option: ratingsDistributionOption },
  { title: "Positive Ratings by Channel", chartType: "bar-vertical", option: positiveByChannelOption },
  { title: "Session Duration Distribution", chartType: "bar-vertical", option: sessionDurationOption },
  {
    title: "Step Funnel (Selected Flow)",
    chartType: "funnel",
    option: stepFunnelOption,
    description: "Flow: Customer Support",
  },
  { title: "Escalations by Session Duration", chartType: "bar-stacked", option: escalationsByDurationOption },
  {
    title: "Escalations Over Time",
    chartType: "bar-vertical",
    option: escalationsOverTimeCountOption,
    useEscalationsTimeTabs: true,
  },
];

function OverviewChartCard({
  panelIndex,
  title,
  chartType,
  option,
  description,
  headerExtra,
  openAskPanelIndex,
  onOpenAskChange,
  selectedKpiLabel,
  anchorPoint,
  onDataSelect,
  showOverflowMenu,
}: {
  panelIndex: number;
  title: string;
  chartType: ChartType;
  option: EChartsCoreOption;
  description?: string;
  headerExtra?: ReactNode;
  openAskPanelIndex: number | null;
  onOpenAskChange: (open: boolean) => void;
  selectedKpiLabel: string | null;
  anchorPoint: { x: number; y: number } | null;
  onDataSelect: (info: ChartDataSelectInfo) => void;
  showOverflowMenu: boolean;
}) {
  const descriptionText = description?.trim() ?? "";

  return (
    <Card className="h-full group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="flex-1 text-base">{title}</CardTitle>
          {headerExtra}
          <WidgetAskAIAndOverflow
            widgetTitle={title}
            chartType={chartType}
            showOverflowMenu={showOverflowMenu}
            open={openAskPanelIndex === panelIndex}
            onOpenChange={(open) => {
              onOpenAskChange(open);
            }}
            selectedKpiLabel={openAskPanelIndex === panelIndex ? selectedKpiLabel : null}
            anchorPoint={openAskPanelIndex === panelIndex ? anchorPoint : null}
          />
        </div>
        {descriptionText ? <CardDescription>{descriptionText}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <EChartsCanvas option={option} onDataSelect={onDataSelect} />
        </div>
        <WidgetAIExplanation widgetTitle={title} chartType={chartType} />
      </CardContent>
    </Card>
  );
}

export function AIAgentsOverviewTab({
  isCompactDashboard,
  showWidgetOverflowMenu = true,
}: {
  isCompactDashboard: boolean;
  showWidgetOverflowMenu?: boolean;
}) {
  const [openAskPanelIndex, setOpenAskPanelIndex] = useState<number | null>(null);
  const [selectedKpiLabel, setSelectedKpiLabel] = useState<string | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [escalationsOverTimeTab, setEscalationsOverTimeTab] = useState<"count" | "rate">("count");
  const [overviewSessionsColumnVisibility, setOverviewSessionsColumnVisibility] = useState<
    Record<OverviewSessionsToggleableColumnId, boolean>
  >(
    () =>
      Object.fromEntries(OVERVIEW_SESSIONS_TOGGLEABLE_COLUMNS.map((c) => [c.id, true])) as Record<
        OverviewSessionsToggleableColumnId,
        boolean
      >,
  );

  const handleOpenAskChange = useCallback((panelIndex: number, open: boolean) => {
    if (open) {
      setOpenAskPanelIndex(panelIndex);
      setAnchorPoint(null);
      setSelectedKpiLabel(null);
    } else {
      setOpenAskPanelIndex(null);
      setAnchorPoint(null);
      setSelectedKpiLabel(null);
    }
  }, []);

  const handleChartDataSelect = useCallback((panelIndex: number) => {
    return (info: ChartDataSelectInfo) => {
      setSelectedKpiLabel(
        [info.name, info.seriesName, info.value].map(String).find((s) => s && s !== "undefined") ?? "Selected",
      );
      if (typeof info.clientX === "number" && typeof info.clientY === "number") {
        setAnchorPoint({ x: info.clientX, y: info.clientY });
      } else {
        setAnchorPoint(null);
      }
      setOpenAskPanelIndex(panelIndex);
    };
  }, []);

  const sessionsTablePanelIndex = overviewChartPanels.length;

  return (
    <div className="space-y-4">
      <h3 className="mt-8 flex items-center gap-2 tracking-tight">
        <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Key Performance Indicators
      </h3>

      <div
        className={`grid gap-4 ${
          isCompactDashboard
            ? "grid-cols-1"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        }`}
      >
        {kpis.map((kpi) => (
          (() => {
            const direction = getTrendDirection(kpi.trend);
            const TrendIcon = direction === "up" ? TrendingUp : TrendingDown;
            const badgeToneClass =
              direction === "up"
                ? "border-transparent bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white"
                : "border-transparent bg-red-600 text-white dark:bg-red-600 dark:text-white";
            return (
          <Card
            key={kpi.label}
            className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30"
          >
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <CardDescription className="flex-1">{kpi.label}</CardDescription>
                <WidgetAskAIAndOverflow
                  widgetTitle={kpi.label}
                  chartType="metric"
                  showOverflowMenu={showWidgetOverflowMenu}
                />
              </div>
              <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                <KpiMetricValueTitle value={kpi.value} />
                <Badge variant="secondary" className={`shrink-0 text-xs ${badgeToneClass}`}>
                  <span className="inline-flex items-center gap-1">
                    <TrendIcon className="h-3 w-3" />
                    {kpi.trend}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <KpiSparkline
                values={kpi.sparkline}
                formatValue={(v) => `${v}`}
                seriesName={kpi.label}
              />
            </CardContent>
          </Card>
            );
          })()
        ))}
      </div>

      <h3 className="!mt-8 flex items-center gap-2 tracking-tight">
        <LineChart className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Insights & Analysis
      </h3>

      <div className={`grid gap-4 ${isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
        {overviewChartPanels.map((panel, i) => {
          const useEscalationsTabs = panel.useEscalationsTimeTabs === true;
          const option = useEscalationsTabs
            ? escalationsOverTimeTab === "count"
              ? escalationsOverTimeCountOption
              : escalationsOverTimeRateOption
            : panel.option;
          const headerExtra = useEscalationsTabs ? (
            <ToggleGroup
              type="single"
              value={escalationsOverTimeTab}
              onValueChange={(v) => {
                if (v === "count" || v === "rate") setEscalationsOverTimeTab(v);
              }}
              variant="outline"
              size="sm"
              className="mr-1 h-8 w-fit shrink-0"
            >
              <ToggleGroupItem value="count" className="!flex-none px-3 text-xs">
                Escalations
              </ToggleGroupItem>
              <ToggleGroupItem value="rate" className="!flex-none px-3 text-xs">
                Escalations Rate
              </ToggleGroupItem>
            </ToggleGroup>
          ) : (
            panel.headerExtra
          );

          return (
            <OverviewChartCard
              key={panel.title}
              panelIndex={i}
              title={panel.title}
              chartType={panel.chartType}
              option={option}
              description={panel.description}
              headerExtra={headerExtra}
              openAskPanelIndex={openAskPanelIndex}
              onOpenAskChange={(open) => handleOpenAskChange(i, open)}
              selectedKpiLabel={selectedKpiLabel}
              anchorPoint={anchorPoint}
              onDataSelect={handleChartDataSelect(i)}
              showOverflowMenu={showWidgetOverflowMenu}
            />
          );
        })}
      </div>

      <Card className="group/widget min-w-0 transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="flex-1">Sessions to Investigate</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Sessions to Investigate"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
              open={openAskPanelIndex === sessionsTablePanelIndex}
              onOpenChange={(open) => handleOpenAskChange(sessionsTablePanelIndex, open)}
              selectedKpiLabel={openAskPanelIndex === sessionsTablePanelIndex ? selectedKpiLabel : null}
              anchorPoint={openAskPanelIndex === sessionsTablePanelIndex ? anchorPoint : null}
            />
          </div>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-8 pl-8" placeholder="Search" />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5">
                    <Columns3 className="h-3.5 w-3.5" />
                    Column Picker
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {OVERVIEW_SESSIONS_TOGGLEABLE_COLUMNS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={overviewSessionsColumnVisibility[col.id]}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(checked) =>
                        setOverviewSessionsColumnVisibility((prev) => ({
                          ...prev,
                          [col.id]: checked === true,
                        }))
                      }
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="min-w-0 w-full">
            <Table className="table-auto w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  {overviewSessionsColumnVisibility.category ? <TableHead>Category</TableHead> : null}
                  {overviewSessionsColumnVisibility.channel ? <TableHead>Channel</TableHead> : null}
                  {overviewSessionsColumnVisibility.rating ? <TableHead>Customer Rating</TableHead> : null}
                  {overviewSessionsColumnVisibility.escalations ? <TableHead>Escalation Count</TableHead> : null}
                  {overviewSessionsColumnVisibility.duration ? <TableHead>Duration</TableHead> : null}
                  <TableHead className="whitespace-nowrap pl-2 pr-4 text-right">
                    <span className="sr-only">Open transcript</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsToInvestigate.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="tabular-nums">{row.id}</TableCell>
                    {overviewSessionsColumnVisibility.category ? (
                      <TableCell>
                        <OverviewSessionsCategoryCell categoryKind={row.categoryKind} label={row.categoryLabel} />
                      </TableCell>
                    ) : null}
                    {overviewSessionsColumnVisibility.channel ? (
                      <TableCell>
                        <OverviewSessionsChannelCell channel={row.channel} />
                      </TableCell>
                    ) : null}
                    {overviewSessionsColumnVisibility.rating ? (
                      <TableCell className="tabular-nums">{row.rating}</TableCell>
                    ) : null}
                    {overviewSessionsColumnVisibility.escalations ? (
                      <TableCell className="tabular-nums">{row.escalations}</TableCell>
                    ) : null}
                    {overviewSessionsColumnVisibility.duration ? (
                      <TableCell className="tabular-nums">{row.duration}</TableCell>
                    ) : null}
                    <TableCell className="whitespace-nowrap pl-2 pr-4 text-right">
                      <Button variant="outline" size="sm">
                        <MessageSquareShare aria-hidden />
                        Open Transcript
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <WidgetAIExplanation widgetTitle="Sessions to Investigate" chartType="metric" />
        </CardContent>
      </Card>
    </div>
  );
}
