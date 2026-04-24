import { useMemo } from "react";
import type { EChartsCoreOption } from "echarts";
import { EChartsCanvas } from "./EChartsCanvas";
import { cn } from "./ui/utils";

const gridLine = "hsl(var(--muted-foreground))";

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

function getTransparentColorStop(lineColor: string): string {
  // Resolve the runtime color first (including CSS vars), then set alpha to 0.
  if (typeof document === "undefined") return "rgba(0, 0, 0, 0)";

  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.left = "-99999px";
  span.style.top = "-99999px";
  span.style.color = lineColor;
  document.body.appendChild(span);
  const resolved = getComputedStyle(span).color;
  span.remove();

  // rgb(r, g, b) -> rgba(r, g, b, 0)
  const rgb = resolved.match(/^rgb\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/i);
  if (rgb) {
    return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, 0)`;
  }

  // rgba(r, g, b, a) -> rgba(r, g, b, 0)
  const rgba = resolved.match(
    /^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*[\d.]+\s*\)$/i,
  );
  if (rgba) {
    return `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, 0)`;
  }

  return "rgba(0, 0, 0, 0)";
}

/**
 * Compact area chart for KPI cards: filled area, axis hover tooltip (no grid or axis chrome).
 */
export function KpiSparkline({
  values,
  className,
  /** Figma P500; gradient fade resolved in-document via `getTransparentColorStop`. */
  lineColor = "var(--kpi-line)",
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

    const transparentStop = getTransparentColorStop(lineColor);

    return {
      backgroundColor: "transparent",
      animation: true,
      animationDuration: 380,
      grid: {
        left: 0,
        right: 2,
        top: 0,
        bottom: 0,
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
          // Keep hover/tooltips via axis pointer, but hide point markers.
          symbol: "none",
          symbolSize: 0,
          showSymbol: false,
          showAllSymbol: false,
          lineStyle: {
            width: 1.5,
            color: lineColor,
          },
          itemStyle: {
            color: lineColor,
            borderWidth: 0,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: lineColor },
                { offset: 1, color: transparentStop },
              ],
            },
            opacity: 0.3,
          },
          // `emphasis.focus: "series"` (and related blur) can incorrectly dim the only
          // series on hover; keep default emphasis so line + area stay visible.
          emphasis: {
            focus: "none",
            scale: false,
            lineStyle: { width: 1.5, color: lineColor },
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: lineColor },
                  { offset: 1, color: transparentStop },
                ],
              },
              opacity: 0.3,
            },
            itemStyle: { color: lineColor, borderWidth: 0 },
          },
        },
      ],
    };
  }, [values, lineColor, categories, seriesName, formatValue]);

  return (
    <EChartsCanvas
      option={option}
      className={cn("h-6 min-h-6 w-full min-w-0", className)}
    />
  );
}
