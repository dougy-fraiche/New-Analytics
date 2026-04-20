import { useMemo, useState } from "react";
import type { EChartsCoreOption } from "echarts";
import { CircleGauge, LineChart } from "lucide-react";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { EChartsCanvas } from "./EChartsCanvas";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import { cn } from "./ui/utils";
import { copilotAiInsightsIds } from "../data/copilot-ai-insights";

const STATUS_COLORS = {
  asIs: "#0f8b73",
  minorRevision: "#3f49ad",
  revised: "#f5aa09",
  ignored: "#d41f45",
} as const;

const CATEGORY_ANALYSIS_LEGEND_KEYS = ["As Is", "Minor Revision", "Revised", "Ignored"] as const;
type CategoryAnalysisLegendKey = (typeof CATEGORY_ANALYSIS_LEGEND_KEYS)[number];
type CategoryAnalysisLegendSelection = Record<CategoryAnalysisLegendKey, boolean>;

function buildCategoryAnalysisLegendOption(selected: CategoryAnalysisLegendSelection): EChartsCoreOption {
  return {
    animation: false,
    tooltip: { show: false },
    legend: {
      selectedMode: true,
      selected,
      left: "center",
      top: "middle",
      orient: "horizontal",
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 24,
      icon: "circle",
      textStyle: { color: "hsl(var(--muted-foreground))", fontSize: 12 },
      data: [...CATEGORY_ANALYSIS_LEGEND_KEYS],
    },
    series: [
      {
        type: "pie",
        radius: 0,
        center: [-999, -999],
        silent: true,
        label: { show: false },
        labelLine: { show: false },
        data: [
          { name: "As Is", value: 1, itemStyle: { color: STATUS_COLORS.asIs } },
          { name: "Minor Revision", value: 1, itemStyle: { color: STATUS_COLORS.minorRevision } },
          { name: "Revised", value: 1, itemStyle: { color: STATUS_COLORS.revised } },
          { name: "Ignored", value: 1, itemStyle: { color: STATUS_COLORS.ignored } },
        ],
      },
    ],
  };
}

const KPI_VALUES = [
  { label: "Total KB Answers", value: "6,072" },
  { label: "As Is", value: "6.5%" },
  { label: "Minor Revisions", value: "49.6%" },
];

const STATUS_DATES = [
  "2026-01-18",
  "2026-01-22",
  "2026-01-26",
  "2026-01-30",
  "2026-02-03",
  "2026-02-07",
  "2026-02-11",
  "2026-02-15",
  "2026-02-19",
  "2026-02-23",
  "2026-02-27",
  "2026-03-03",
  "2026-03-07",
  "2026-03-11",
  "2026-03-15",
  "2026-03-19",
  "2026-03-23",
  "2026-03-27",
  "2026-03-31",
  "2026-04-04",
  "2026-04-08",
  "2026-04-12",
  "2026-04-15",
];

const answerStatusOverTimeOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 18, bottom: 52 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  legend: {
    left: "center",
    bottom: 0,
    itemWidth: 10,
    itemHeight: 10,
    icon: "circle",
    textStyle: { color: "hsl(var(--muted-foreground))", fontSize: 12 },
    data: ["As Is", "Minor Revision", "Revised", "Ignored"],
  },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: STATUS_DATES,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", interval: 5 },
    splitLine: { show: true, lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 80,
    interval: 20,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      name: "As Is",
      type: "line",
      symbol: "none",
      smooth: 0.24,
      lineStyle: { width: 2.5, color: STATUS_COLORS.asIs },
      data: [0, 6, 2, 12, 4, 3, 7, 2, 1, 6, 4, 8, 2, 3, 5, 1, 6, 2, 7, 3, 6, 5, 5],
    },
    {
      name: "Minor Revision",
      type: "line",
      symbol: "none",
      smooth: 0.24,
      lineStyle: { width: 2.5, color: STATUS_COLORS.minorRevision },
      data: [24, 48, 28, 52, 34, 21, 37, 47, 22, 31, 41, 56, 18, 46, 79, 14, 48, 24, 55, 20, 47, 22, 46],
    },
    {
      name: "Revised",
      type: "line",
      symbol: "none",
      smooth: 0.24,
      lineStyle: { width: 2.5, color: STATUS_COLORS.revised },
      data: [18, 36, 11, 44, 21, 27, 19, 41, 16, 47, 23, 48, 14, 18, 56, 20, 36, 17, 50, 15, 44, 19, 29],
    },
    {
      name: "Ignored",
      type: "line",
      symbol: "none",
      smooth: 0.24,
      lineStyle: { width: 2.5, color: STATUS_COLORS.ignored },
      data: [0, 1, 0, 2, 1, 3, 1, 2, 1, 1, 5, 0, 0, 2, 1, 0, 3, 1, 2, 0, 1, 2, 2],
    },
  ],
};

const avgKbPerInteractionOption: EChartsCoreOption = {
  grid: { left: 40, right: 12, top: 18, bottom: 34 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: STATUS_DATES,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", interval: 5 },
    splitLine: { show: true, lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 8,
    interval: 2,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "bar",
      barWidth: "46%",
      data: [4.9, 4.2, 4.6, 4.0, 3.8, 3.5, 3.7, 4.1, 4.0, 4.8, 3.2, 4.6, 4.1, 4.9, 4.0, 3.9, 2.8, 3.6, 4.2, 5.4, 3.2, 4.1, 4.2],
      itemStyle: { color: STATUS_COLORS.minorRevision, borderRadius: [4, 4, 0, 0] },
    },
  ],
};

const CATEGORY_ROWS = [
  { category: "Technical", kbAnswers: "1,050", avgAdherence: "71.6", kbScore: "80.0", asIs: 6, minorRevision: 50, revised: 42, ignored: 2 },
  { category: "Product", kbAnswers: "1,047", avgAdherence: "72.3", kbScore: "79.6", asIs: 6, minorRevision: 52, revised: 40, ignored: 2 },
  { category: "Account", kbAnswers: "1,023", avgAdherence: "72.1", kbScore: "79.8", asIs: 8, minorRevision: 50, revised: 40, ignored: 2 },
  { category: "Security", kbAnswers: "1,011", avgAdherence: "71.8", kbScore: "80.2", asIs: 7, minorRevision: 48, revised: 43, ignored: 2 },
  { category: "Policy", kbAnswers: "976", avgAdherence: "72.2", kbScore: "79.6", asIs: 8, minorRevision: 49, revised: 41, ignored: 2 },
  { category: "Billing", kbAnswers: "965", avgAdherence: "72.0", kbScore: "80.1", asIs: 7, minorRevision: 49, revised: 42, ignored: 2 },
];

const adherenceByCategoryOption: EChartsCoreOption = {
  grid: { left: 86, right: 14, top: 20, bottom: 54 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  legend: {
    left: "center",
    bottom: 0,
    itemWidth: 12,
    itemHeight: 12,
    icon: "circle",
    textStyle: { color: "hsl(var(--muted-foreground))", fontSize: 12 },
    data: ["As Is", "Minor Revision", "Revised", "Ignored"],
  },
  xAxis: {
    type: "value",
    min: 0,
    max: 100,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))", formatter: "{value}%" },
  },
  yAxis: {
    type: "category",
    data: CATEGORY_ROWS.map((row) => row.category),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      name: "As Is",
      type: "bar",
      stack: "adherence",
      barWidth: 16,
      itemStyle: { color: STATUS_COLORS.asIs, borderRadius: [6, 0, 0, 6] },
      data: CATEGORY_ROWS.map((row) => row.asIs),
    },
    {
      name: "Minor Revision",
      type: "bar",
      stack: "adherence",
      barWidth: 16,
      itemStyle: { color: STATUS_COLORS.minorRevision },
      data: CATEGORY_ROWS.map((row) => row.minorRevision),
    },
    {
      name: "Revised",
      type: "bar",
      stack: "adherence",
      barWidth: 16,
      itemStyle: { color: STATUS_COLORS.revised },
      data: CATEGORY_ROWS.map((row) => row.revised),
    },
    {
      name: "Ignored",
      type: "bar",
      stack: "adherence",
      barWidth: 16,
      itemStyle: { color: STATUS_COLORS.ignored, borderRadius: [0, 6, 6, 0] },
      data: CATEGORY_ROWS.map((row) => row.ignored),
    },
  ],
};

function AdherenceSplitBar({
  asIs,
  minorRevision,
  revised,
  ignored,
  selected,
}: {
  asIs: number;
  minorRevision: number;
  revised: number;
  ignored: number;
  selected: CategoryAnalysisLegendSelection;
}) {
  const segments = [
    { key: "As Is" as const, width: asIs, color: STATUS_COLORS.asIs },
    { key: "Minor Revision" as const, width: minorRevision, color: STATUS_COLORS.minorRevision },
    { key: "Revised" as const, width: revised, color: STATUS_COLORS.revised },
    { key: "Ignored" as const, width: ignored, color: STATUS_COLORS.ignored },
  ].filter((segment) => selected[segment.key]);

  return (
    <div className="flex h-4 w-36 overflow-hidden rounded-full bg-muted">
      {segments.map((segment) => (
        <div
          key={segment.key}
          className="h-full"
          style={{ width: `${segment.width}%`, backgroundColor: segment.color }}
        />
      ))}
    </div>
  );
}

export function CopilotGenerativeResponsesTab({
  isCompactDashboard,
  showWidgetOverflowMenu = true,
}: {
  isCompactDashboard: boolean;
  showWidgetOverflowMenu?: boolean;
}) {
  const [categoryAnalysisLegendSelection, setCategoryAnalysisLegendSelection] = useState<CategoryAnalysisLegendSelection>({
    "As Is": true,
    "Minor Revision": true,
    Revised: true,
    Ignored: true,
  });
  const categoryAnalysisLegendOption = useMemo(
    () => buildCategoryAnalysisLegendOption(categoryAnalysisLegendSelection),
    [categoryAnalysisLegendSelection],
  );

  return (
    <div className="space-y-4">
      <HeaderAIInsightsRow dashboardId={copilotAiInsightsIds.generativeResponses} />

      <h3 className="mt-8 flex items-center gap-2 tracking-tight">
        <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Key Performance Indicators
      </h3>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
        {KPI_VALUES.map((kpi) => (
          <Card
            key={kpi.label}
            className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30"
          >
            <CardHeader className="p-4">
              <div className="flex items-center gap-2">
                <CardDescription className="flex-1">{kpi.label}</CardDescription>
                <WidgetAskAIAndOverflow
                  widgetTitle={kpi.label}
                  chartType="metric"
                  showOverflowMenu={showWidgetOverflowMenu}
                />
              </div>
              <div className="mt-1">
                <KpiMetricValueTitle value={kpi.value} />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <h3 className="!mt-8 flex items-center gap-2 tracking-tight">
        <LineChart className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Insights & Analysis
      </h3>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Answer Status Over Time</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Answer Status Over Time"
                chartType="line-multi"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <EChartsCanvas option={answerStatusOverTimeOption} />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Answer Status Over Time" chartType="line-multi" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Avg KB / Interaction</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Avg KB / Interaction"
                chartType="bar-vertical"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <EChartsCanvas option={avgKbPerInteractionOption} />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Avg KB / Interaction" chartType="bar-vertical" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Category Analysis</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Category Analysis"
                chartType="metric"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>Knowledge base adherence and answer quality by category</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table className="table-auto w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">KB Answers</TableHead>
                  <TableHead className="text-right">Avg Adherence</TableHead>
                  <TableHead className="text-right">KB Score</TableHead>
                  <TableHead className="text-right">Adherence Split</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CATEGORY_ROWS.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell>{row.category}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.kbAnswers}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.avgAdherence}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.kbScore}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex justify-end">
                        <AdherenceSplitBar
                          asIs={row.asIs}
                          minorRevision={row.minorRevision}
                          revised={row.revised}
                          ignored={row.ignored}
                          selected={categoryAnalysisLegendSelection}
                        />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="h-12 w-full">
              <EChartsCanvas
                option={categoryAnalysisLegendOption}
                onLegendSelectChange={(info) => {
                  if (!info.selected) return;
                  setCategoryAnalysisLegendSelection((current) => ({
                    "As Is": info.selected?.["As Is"] ?? current["As Is"],
                    "Minor Revision": info.selected?.["Minor Revision"] ?? current["Minor Revision"],
                    Revised: info.selected?.Revised ?? current.Revised,
                    Ignored: info.selected?.Ignored ?? current.Ignored,
                  }));
                }}
              />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Category Analysis" chartType="metric" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Adherence by Category</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Adherence by Category"
                chartType="bar-stacked"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <EChartsCanvas option={adherenceByCategoryOption} />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Adherence by Category" chartType="bar-stacked" />
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}
