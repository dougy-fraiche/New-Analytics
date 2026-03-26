import { useMemo } from "react";
import type { EChartsCoreOption } from "echarts";
import { EChartsCanvas } from "./EChartsCanvas";
import { cn } from "./ui/utils";

const gridLine = "hsl(var(--border) / 0.5)";

/** Human-readable labels matching other area charts ("Mon, Jan 13"). */
function buildKpiAxisDateLabels(length: number): string[] {
  if (length <= 0) return [];
  const fmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  // Decorative trailing window — last index is the newest day.
  const end = new Date(2026, 0, 14);
  return Array.from({ length }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (length - 1 - i));
    return fmt.format(d);
  });
}

export interface KpiSparklineProps {
  values: number[];
  className?: string;
  /** ECharts line + area color (CSS `var(--token)` works; resolved in `EChartsCanvas`). */
  lineColor?: string;
  /** Shown in the tooltip (e.g. "Escalations"). */
  seriesName?: string;
  /** Format the numeric value in the tooltip. */
  formatValue?: (value: number) => string;
}

function defaultFormatValue(value: number): string {
  return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
}

/**
 * Compact area chart for KPI cards: filled area, axis hover tooltip (no grid or axis chrome).
 */
export function KpiSparkline({
  values,
  className,
  lineColor = "var(--primary)",
  seriesName = "Value",
  formatValue = defaultFormatValue,
}: KpiSparklineProps) {
  const categories = useMemo(
    () => buildKpiAxisDateLabels(values.length),
    [values.length],
  );

  const option = useMemo((): EChartsCoreOption => {
    const vmin = Math.min(...values);
    const vmax = Math.max(...values);
    const span = vmax - vmin;
    const pad = span > 0 ? span * 0.12 : Math.max(Math.abs(vmin) * 0.02, 1);

    return {
      backgroundColor: "transparent",
      animation: true,
      animationDuration: 380,
      grid: {
        left: 0,
        right: 2,
        top: 2,
        bottom: 2,
        containLabel: false,
      },
      tooltip: {
        trigger: "axis",
        confine: true,
        appendToBody: true,
        axisPointer: {
          type: "line",
          z: 0,
          lineStyle: {
            color: gridLine,
            width: 1,
            type: "dashed",
          },
        },
        formatter: (params: unknown) => {
          const list = Array.isArray(params) ? params : [params];
          const first = list[0] as {
            axisValue?: string;
            value?: number;
            marker?: string;
          };
          const title = String(first?.axisValue ?? "");
          const v = first?.value;
          const num = typeof v === "number" ? v : Number(v);
          const row = `${first?.marker ?? ""} ${seriesName}: ${formatValue(num)}`;
          return title ? `${title}<br/>${row}` : row;
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: "value",
        min: vmin - pad,
        max: vmax + pad,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          name: seriesName,
          type: "line",
          data: [...values],
          smooth: 0.35,
          symbol: "circle",
          symbolSize: 5,
          showSymbol: true,
          showAllSymbol: true,
          lineStyle: {
            width: 2,
            color: lineColor,
          },
          itemStyle: {
            color: lineColor,
            borderWidth: 0,
          },
          areaStyle: {
            color: lineColor,
            opacity: 0.22,
          },
          // `emphasis.focus: "series"` (and related blur) can incorrectly dim the only
          // series on hover; keep default emphasis so line + area stay visible.
          emphasis: {
            focus: "none",
            scale: false,
            lineStyle: { width: 2, color: lineColor },
            areaStyle: { color: lineColor, opacity: 0.22 },
            itemStyle: { color: lineColor, borderWidth: 0 },
          },
        },
      ],
    };
  }, [values, lineColor, categories, seriesName, formatValue]);

  return (
    <EChartsCanvas
      option={option}
      className={cn("h-14 min-h-14 w-full min-w-0", className)}
    />
  );
}

/** Mock trend data for each dashboard KPI (deterministic, decorative). */
export const KPI_SPARKLINE_SERIES = {
  totalEscalations: [
    208, 212, 215, 219, 222, 226, 230, 233, 237, 241, 245, 250, 255, 260,
  ],
  avgResolutionHours: [
    5.15, 5.05, 4.95, 4.88, 4.8, 4.72, 4.65, 4.58, 4.52, 4.47, 4.42, 4.38,
    4.34, 4.3,
  ],
  customerSatisfactionPct: [
    87.2, 87.8, 88.4, 89.0, 89.6, 90.1, 90.6, 91.0, 91.5, 92.0, 92.6, 93.0,
    93.5, 94.0,
  ],
  resolutionRatePct: [
    81.5, 82.0, 82.6, 83.2, 83.8, 84.2, 84.8, 85.2, 85.6, 86.0, 86.4, 86.6,
    86.8, 87.0,
  ],
} as const;
