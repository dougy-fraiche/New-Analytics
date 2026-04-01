import { useCallback, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChartConfig, ChartContainer } from "./ui/chart";
import { EChartsCanvas } from "./EChartsCanvas";
import { buildUniversalEChartsOption } from "./echartsChartOptions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import { cn } from "./ui/utils";
import { useContainerBreakpoint } from "../hooks/useContainerBreakpoint";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  type LucideIcon,
} from "lucide-react";
import type { ChartRow } from "../types/conversation-types";

// ═══════════════════════════════════════════════════════════════════════════
// PRNG
// ═══════════════════════════════════════════════════════════════════════════

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(options: T[], rng: () => number): T {
  return options[Math.floor(rng() * options.length)];
}

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export type ChartType =
  | "area"
  | "area-gradient"
  | "line"
  | "line-curved"
  | "scatter"
  | "bar-vertical"
  | "bar-gradient"
  | "bar-horizontal"
  | "pie"
  | "donut"
  | "funnel"
  | "treemap"
  | "radar"
  | "radar-filled"
  | "radial"
  | "bar-grouped"
  | "bar-stacked"
  | "line-multi"
  | "area-stacked";

/** All valid `ChartType` literals (for runtime validation). */
export const CHART_TYPES: ChartType[] = [
  "area",
  "area-gradient",
  "line",
  "line-curved",
  "scatter",
  "bar-vertical",
  "bar-gradient",
  "bar-horizontal",
  "pie",
  "donut",
  "funnel",
  "treemap",
  "radar",
  "radar-filled",
  "radial",
  "bar-grouped",
  "bar-stacked",
  "line-multi",
  "area-stacked",
];

const CHART_TYPE_SET = new Set<string>(CHART_TYPES);

export function isChartType(value: unknown): value is ChartType {
  return typeof value === "string" && CHART_TYPE_SET.has(value);
}

/** Icon for a widget badge; unknown strings fall back to `BarChart3`. */
export function getChartIconForWidgetType(type: string | undefined): LucideIcon {
  if (type !== undefined && isChartType(type)) {
    return getChartIcon(type);
  }
  return BarChart3;
}

type DataSource = "trend" | "category" | "comparison";

export interface PanelConfig {
  colSpan: 1 | 2 | 3;
  chartType: ChartType;
  dataSource: DataSource;
  title: string;
  description: string;
}

export interface DatasetConfig {
  data: ChartRow[];
  xKey: string;
  yKey: string;
  y2Key?: string;
}

export interface DashboardChartGridProps {
  dashboardId: string;
  trend: DatasetConfig;
  category: DatasetConfig;
  comparison?: DatasetConfig;
  animated?: boolean;
  highlightedPanelIndices?: Set<number> | number[];
  anomalyClassName?: string;
  stackedBelowWidth?: number;
  /** Set false on Observability OOTB dashboards; default true (saved / conversation dashboards). */
  showWidgetOverflowMenu?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const COL_SPAN_CLASSES: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
};

// Each template is a flat list of col-spans; consecutive spans summing to 3 form rows
const LAYOUT_TEMPLATES: (1 | 2 | 3)[][] = [
  // 1 chart
  [3],
  [2],
  [1],
  // 2 charts
  [2, 1],
  [1, 2],
  [1, 1],
  // 3 charts
  [3, 2, 1],
  [3, 1, 2],
  [2, 1, 3],
  [1, 2, 3],
  // 4 charts
  [3, 1, 1, 1],
  [1, 1, 1, 3],
  [2, 1, 1, 2],
  [2, 1, 2, 1],
  [1, 2, 2, 1],
  [1, 2, 1, 2],
  // 5 charts
  [2, 1, 1, 1, 1],
  [1, 1, 1, 2, 1],
  [1, 1, 1, 1, 2],
  [1, 2, 1, 1, 1],
  // 6 charts
  [3, 1, 1, 1, 1, 1],
  [2, 1, 2, 1, 1, 2],
  [1, 1, 1, 1, 1, 1],
  // 7 charts
  [3, 2, 1, 1, 1, 1, 1],
  [2, 1, 1, 2, 1, 1, 1],
  // 8 charts
  [3, 2, 1, 1, 1, 1, 1, 1],
  [2, 1, 2, 1, 1, 1, 1, 1],
  // 9 charts
  [3, 2, 1, 1, 1, 1, 1, 1, 1],
  [2, 1, 2, 1, 1, 1, 1, 1, 1],
  // 10 charts
  [3, 2, 1, 1, 1, 1, 1, 1, 1, 1],
  [2, 1, 2, 1, 1, 1, 1, 1, 1, 1],
];

const TREND_CHART_TYPES: ChartType[] = [
  "area",
  "area-gradient",
  "line",
  "line-curved",
  "scatter",
  "bar-vertical",
  "bar-gradient",
];
const CATEGORY_CHART_TYPES: ChartType[] = [
  "bar-vertical",
  "bar-gradient",
  "bar-horizontal",
  "pie",
  "donut",
  "funnel",
  "treemap",
  "radar",
  "radar-filled",
];
const SMALL_CATEGORY_TYPES: ChartType[] = [
  "pie",
  "donut",
  "funnel",
  "bar-vertical",
  "bar-gradient",
];
const COMPARISON_CHART_TYPES: ChartType[] = [
  "bar-grouped",
  "bar-stacked",
  "line-multi",
  "area-stacked",
];

const TREND_LABELS = [
  { title: "Performance Trend", desc: "Activity and engagement over time" },
  { title: "Volume Timeline", desc: "Daily volume patterns and movement" },
  { title: "Growth Trajectory", desc: "Tracking changes period over period" },
  { title: "Activity Stream", desc: "Real-time activity patterns" },
  { title: "Trend Analysis", desc: "Historical trend data and direction" },
];

const CATEGORY_LABELS = [
  { title: "Category Breakdown", desc: "Distribution by category" },
  { title: "Segment Distribution", desc: "Analysis across segments" },
  { title: "Composition Analysis", desc: "Category proportions" },
  { title: "Distribution Overview", desc: "Proportional breakdown" },
  { title: "Segment Insights", desc: "Key segment metrics" },
];

const COMPARISON_LABELS = [
  { title: "Period Comparison", desc: "Current vs previous period" },
  { title: "Comparative Analysis", desc: "Side-by-side performance" },
  { title: "Progress Tracker", desc: "Period-over-period changes" },
];

// ═══════════════════════════════════════════════════════════════════════════
// Layout Generator
// ═══════════════════════════════════════════════════════════════════════════

export function generateGridLayout(
  dashboardId: string,
  hasComparison: boolean
): { panels: PanelConfig[] } {
  const rng = mulberry32(hashString(dashboardId));

  // 1. Pick a layout template
  const spans = pick(LAYOUT_TEMPLATES, rng);
  const panelCount = spans.length;

  // 2. Assign data sources
  const sources = assignDataSources(panelCount, spans, hasComparison, rng);

  // 3. Assign chart types
  const types = assignChartTypes(
    spans.map((s, i) => ({ colSpan: s, dataSource: sources[i] })),
    rng
  );

  // 4. Assign titles
  const usedTrend = new Set<number>();
  const usedCat = new Set<number>();
  const usedComp = new Set<number>();

  const panels: PanelConfig[] = spans.map((colSpan, i) => {
    const ds = sources[i];
    let label: { title: string; desc: string };

    if (ds === "trend") {
      let idx: number;
      do { idx = Math.floor(rng() * TREND_LABELS.length); } while (usedTrend.has(idx) && usedTrend.size < TREND_LABELS.length);
      usedTrend.add(idx);
      label = TREND_LABELS[idx];
    } else if (ds === "comparison") {
      let idx: number;
      do { idx = Math.floor(rng() * COMPARISON_LABELS.length); } while (usedComp.has(idx) && usedComp.size < COMPARISON_LABELS.length);
      usedComp.add(idx);
      label = COMPARISON_LABELS[idx];
    } else {
      let idx: number;
      do { idx = Math.floor(rng() * CATEGORY_LABELS.length); } while (usedCat.has(idx) && usedCat.size < CATEGORY_LABELS.length);
      usedCat.add(idx);
      label = CATEGORY_LABELS[idx];
    }

    return {
      colSpan: colSpan as 1 | 2 | 3,
      chartType: types[i],
      dataSource: ds,
      title: label.title,
      description: label.desc,
    };
  });

  return { panels };
}

function assignDataSources(
  panelCount: number,
  spans: number[],
  hasComparison: boolean,
  rng: () => number
): DataSource[] {
  const sources: (DataSource | undefined)[] = new Array(panelCount).fill(undefined);
  const indices = Array.from({ length: panelCount }, (_, i) => i);

  if (panelCount <= 0) return [];
  if (panelCount === 1) return ["trend"];

  // Put trend on a large panel
  const large = indices.filter((i) => spans[i] >= 2);
  const trendIdx = large.length > 0 ? pick(large, rng) : pick(indices, rng);
  sources[trendIdx] = "trend";

  // Put category on a different panel
  const remaining = indices.filter((i) => sources[i] === undefined);
  if (remaining.length === 0) return sources as DataSource[];
  const categoryIdx = pick(remaining, rng);
  sources[categoryIdx] = "category";

  // Optionally add comparison
  if (hasComparison && panelCount >= 3) {
    const remaining2 = indices.filter((i) => sources[i] === undefined);
    if (remaining2.length > 0 && rng() > 0.25) {
      const compIdx = pick(remaining2, rng);
      sources[compIdx] = "comparison";
    }
  }

  // Fill remaining
  for (let i = 0; i < panelCount; i++) {
    if (sources[i] === undefined) {
      if (spans[i] === 1) {
        sources[i] = rng() > 0.35 ? "category" : "trend";
      } else {
        sources[i] = rng() > 0.5 ? "trend" : "category";
      }
    }
  }

  return sources as DataSource[];
}

function assignChartTypes(
  panels: { colSpan: number; dataSource: DataSource }[],
  rng: () => number
): ChartType[] {
  const usedTypes = new Set<ChartType>();

  return panels.map((panel) => {
    let pool: ChartType[];

    switch (panel.dataSource) {
      case "trend":
        pool = [...TREND_CHART_TYPES];
        break;
      case "category":
        pool =
          panel.colSpan === 1
            ? [...SMALL_CATEGORY_TYPES]
            : [...CATEGORY_CHART_TYPES];
        break;
      case "comparison":
        pool = [...COMPARISON_CHART_TYPES];
        break;
    }

    // Prefer unused types for variety
    const unused = pool.filter((t) => !usedTypes.has(t));
    const type = pick(unused.length > 0 ? unused : pool, rng);
    const safeType = type === "radial" ? "donut" : type;
    usedTypes.add(safeType);
    return safeType;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Config Builder
// ═══════════════════════════════════════════════════════════════════════════

const PER_ITEM_TYPES = new Set<ChartType>([
  "pie",
  "donut",
  "radar",
  "radar-filled",
  "radial",
]);

function capitalize(s: string): string {
  // Handle camelCase keys like "thisMonth" → "This Month"
  const spaced = s.replace(/([a-z])([A-Z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function buildChartConfig(
  chartType: ChartType,
  data: ChartRow[],
  xKey: string,
  yKey: string,
  y2Key: string | undefined,
  panelIndex: number
): ChartConfig {
  // Per-item colored charts (pie, donut, radar, radial)
  if (PER_ITEM_TYPES.has(chartType)) {
    const config: Record<string, { label: string; color: string }> = {};
    data.forEach((item, i) => {
      const name = String(item[xKey]);
      config[name] = {
        label: name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    });
    // Also include the yKey for stroke/fill references
    config[yKey] = {
      label: capitalize(yKey),
      color: CHART_COLORS[panelIndex % CHART_COLORS.length],
    };
    return config;
  }

  // Comparison (two series)
  if (y2Key) {
    return {
      [yKey]: { label: capitalize(yKey), color: "var(--chart-1)" },
      [y2Key]: { label: capitalize(y2Key), color: "var(--chart-3)" },
    };
  }

  // Single-series — rotate through colors by panel index
  return {
    [yKey]: {
      label: capitalize(yKey),
      color: CHART_COLORS[panelIndex % CHART_COLORS.length],
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════════════════

export function getChartIcon(type: ChartType) {
  switch (type) {
    case "area":
    case "area-gradient":
    case "line":
    case "line-curved":
    case "scatter":
    case "area-stacked":
    case "line-multi":
      return TrendingUp;
    case "bar-vertical":
    case "bar-gradient":
    case "bar-horizontal":
    case "bar-grouped":
    case "bar-stacked":
      return BarChart3;
    case "pie":
    case "donut":
      return PieChartIcon;
    case "funnel":
    case "treemap":
      return Target;
    case "radar":
    case "radar-filled":
      return Activity;
    case "radial":
      return Target;
    default:
      return BarChart3;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Universal Chart Renderer
// ═══════════════════════════════════════════════════════════════════════════

export type ChartDataSelectInfo = import("./EChartsCanvas").ChartDataSelectInfo;

interface UniversalChartProps {
  type: ChartType;
  data: ChartRow[];
  xKey: string;
  yKey: string;
  y2Key?: string;
  config: ChartConfig;
  panelId: string;
  colSpan: 1 | 2 | 3;
  /** Called when user clicks a data point (bar, pie slice, etc.). */
  onDataSelect?: (info: ChartDataSelectInfo) => void;
}

export function UniversalChart({
  type,
  data,
  xKey,
  yKey,
  y2Key,
  config,
  panelId,
  colSpan,
  onDataSelect,
}: UniversalChartProps) {
  const cls = "!aspect-auto h-[300px] w-full";

  const dataForChart = useMemo(() => {
    if (type === "radial") {
      return [...data].sort(
        (a, b) => (Number(a[yKey]) || 0) - (Number(b[yKey]) || 0),
      );
    }
    return data;
  }, [type, data, yKey]);

  const option = useMemo(
    () =>
      buildUniversalEChartsOption({
        type,
        data: dataForChart,
        xKey,
        yKey,
        y2Key,
        colSpan,
      }),
    [
      type,
      dataForChart,
      xKey,
      yKey,
      y2Key,
      colSpan,
    ],
  );

  return (
    <ChartContainer config={config} className={cls} id={panelId}>
      <EChartsCanvas option={option} onDataSelect={onDataSelect} />
    </ChartContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Dashboard Chart Grid (exported)
// ═══════════════════════════════════════════════════════════════════════════

export function DashboardChartGrid({
  dashboardId,
  trend,
  category,
  comparison,
  animated = false,
  highlightedPanelIndices,
  anomalyClassName,
  stackedBelowWidth = 768,
  showWidgetOverflowMenu = true,
}: DashboardChartGridProps) {
  const { ref: containerRef, isBelowBreakpoint: isStacked } =
    useContainerBreakpoint<HTMLDivElement>(stackedBelowWidth);
  const hasComparison = !!comparison;
  const layout = useMemo(
    () => generateGridLayout(dashboardId, hasComparison),
    [dashboardId, hasComparison]
  );

  const highlightedSet = useMemo(() => {
    if (!highlightedPanelIndices) return null;
    return highlightedPanelIndices instanceof Set
      ? highlightedPanelIndices
      : new Set(highlightedPanelIndices);
  }, [highlightedPanelIndices]);

  // Memoize chart configs to avoid recalculating on every render
  // (e.g. when chat panel toggles or unrelated state changes)
  const panelConfigs = useMemo(() => {
    return layout.panels.map((panel, i) => {
      const dataset =
        panel.dataSource === "trend"
          ? trend
          : panel.dataSource === "comparison" && comparison
          ? comparison
          : category;

      const config = buildChartConfig(
        panel.chartType,
        dataset.data,
        dataset.xKey,
        dataset.yKey,
        dataset.y2Key,
        i
      );

      return { panel, dataset, config };
    });
  }, [layout, trend, category, comparison]);

  const [openAskPanelIndex, setOpenAskPanelIndex] = useState<number | null>(null);
  const [selectedKpiLabel, setSelectedKpiLabel] = useState<string | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(
    null,
  );

  const handleChartDataSelect = useCallback((panelIndex: number) => {
    return (info: ChartDataSelectInfo) => {
      setSelectedKpiLabel(
        [info.name, info.seriesName, info.value].map(String).find((s) => s && s !== "undefined") ??
          "Selected",
      );
      if (typeof info.clientX === "number" && typeof info.clientY === "number") {
        setAnchorPoint({ x: info.clientX, y: info.clientY });
      } else {
        setAnchorPoint(null);
      }
      setOpenAskPanelIndex(panelIndex);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("grid gap-4", isStacked ? "grid-cols-1" : "grid-cols-3")}
    >
      {panelConfigs.map(({ panel, dataset, config }, i) => {
        const isHighlighted = !!highlightedSet?.has(i);
        const chartContent = (
          <Card
            className={cn(
              "h-full group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30",
              isHighlighted && anomalyClassName,
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base flex-1">{panel.title}</CardTitle>
                <WidgetAskAIAndOverflow
                  widgetTitle={panel.title}
                  chartType={panel.chartType}
                  showOverflowMenu={showWidgetOverflowMenu}
                  open={openAskPanelIndex === i}
                  onOpenChange={(open) => {
                    if (open) {
                      setOpenAskPanelIndex(i);
                      // If opened via the icon, don't pin to a stale click location.
                      setAnchorPoint(null);
                      setSelectedKpiLabel(null);
                    } else {
                      setOpenAskPanelIndex(null);
                      setAnchorPoint(null);
                      setSelectedKpiLabel(null);
                    }
                  }}
                  selectedKpiLabel={openAskPanelIndex === i ? selectedKpiLabel : null}
                  anchorPoint={openAskPanelIndex === i ? anchorPoint : null}
                />
              </div>
              {panel.description?.trim() ? (
                <CardDescription>{panel.description}</CardDescription>
              ) : null}
            </CardHeader>
            <CardContent>
              <UniversalChart
                type={panel.chartType}
                data={dataset.data}
                xKey={dataset.xKey}
                yKey={dataset.yKey}
                y2Key={dataset.y2Key}
                config={config}
                panelId={`${dashboardId}-${i}`}
                colSpan={panel.colSpan}
                onDataSelect={handleChartDataSelect(i)}
              />
              <WidgetAIExplanation widgetTitle={panel.title} chartType={panel.chartType} />
            </CardContent>
          </Card>
        );

        const spanClass = isStacked ? "col-span-1" : COL_SPAN_CLASSES[panel.colSpan];

        if (animated) {
          return (
            <motion.div
              key={`panel-${i}`}
              className={spanClass}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
            >
              {chartContent}
            </motion.div>
          );
        }

        return (
          <div key={`panel-${i}`} className={spanClass}>
            {chartContent}
          </div>
        );
      })}
    </div>
  );
}