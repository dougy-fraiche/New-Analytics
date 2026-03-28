import type * as echarts from "echarts";
import type { ChartType } from "./ChartVariants";

const axisMuted = "hsl(var(--muted-foreground) / 0.85)";
const gridLine = "hsl(var(--border) / 0.5)";

function baseGrid(): echarts.GridComponentOption {
  return {
    left: 44,
    right: 16,
    top: 20,
    bottom: 28,
    containLabel: false,
  };
}

function cartesianTooltip(): echarts.TooltipComponentOption {
  return {
    trigger: "axis",
    confine: true,
    appendToBody: true,
  };
}

export function buildUniversalEChartsOption(params: {
  type: ChartType;
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
  y2Key?: string;
  colSpan: 1 | 2 | 3;
}): echarts.EChartsCoreOption {
  const { type, data, xKey, yKey, y2Key, colSpan } = params;
  const categories = data.map((d) => String(d[xKey] ?? ""));
  const y1 = data.map((d) => Number(d[yKey]) || 0);

  switch (type) {
    case "scatter":
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "scatter",
            data: y1,
            symbolSize: colSpan === 1 ? 8 : 10,
            itemStyle: { opacity: 0.85 },
          },
        ],
      };
    case "area":
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "line",
            data: y1,
            smooth: false,
            symbol: "circle",
            symbolSize: 6,
            showSymbol: true,
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.15 },
          },
        ],
      };

    case "area-gradient":
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "line",
            data: y1,
            smooth: false,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.3 },
          },
        ],
      };

    case "line":
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "line",
            data: y1,
            smooth: false,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { width: 2 },
          },
        ],
      };

    case "line-curved":
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "line",
            data: y1,
            smooth: 0.35,
            symbol: "none",
            lineStyle: { width: 2.5 },
            emphasis: { focus: "series" },
          },
        ],
      };

    case "bar-vertical":
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "bar",
            data: y1,
            barMaxWidth: 40,
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
            },
          },
        ],
      };

    case "bar-gradient":
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "bar",
            data: y1,
            barMaxWidth: 40,
            itemStyle: {
              opacity: 0.75,
              borderRadius: [8, 8, 0, 0],
            },
          },
        ],
      };

    case "bar-horizontal":
      return {
        tooltip: cartesianTooltip(),
        grid: { ...baseGrid(), left: 96, right: 24 },
        xAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 11, width: 88 },
        },
        series: [
          {
            type: "bar",
            data: y1,
            barMaxWidth: 28,
            itemStyle: {
              borderRadius: [0, 8, 8, 0],
            },
          },
        ],
      };

    case "pie":
    case "donut": {
      const inner = type === "donut" ? "42%" : "0%";
      const outer = colSpan === 1 ? "62%" : "72%";
      const showLabel = colSpan >= 2;
      return {
        tooltip: { trigger: "item", confine: true, appendToBody: true },
        series: [
          {
            type: "pie",
            radius: [inner, outer],
            center: ["50%", "50%"],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 4,
              borderWidth: 0,
            },
            label: {
              show: showLabel,
              formatter: showLabel ? "{b}: {d}%" : "{d}%",
              color: axisMuted,
              fontSize: 11,
            },
            labelLine: { show: showLabel },
            data: data.map((d) => ({
              name: String(d[xKey] ?? ""),
              value: Number(d[yKey]) || 0,
            })),
          },
        ],
      };
    }

    case "funnel": {
      const sorted = data
        .map((d) => ({
          name: String(d[xKey] ?? ""),
          value: Number(d[yKey]) || 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, colSpan === 1 ? 6 : 8);
      return {
        tooltip: { trigger: "item", confine: true, appendToBody: true },
        series: [
          {
            type: "funnel",
            left: "6%",
            right: "6%",
            top: 12,
            bottom: 12,
            min: 0,
            max: Math.max(...sorted.map((s) => s.value), 1),
            minSize: "0%",
            maxSize: "100%",
            sort: "descending",
            gap: 2,
            label: {
              show: true,
              position: "inside",
              color: "hsl(var(--foreground))",
              fontSize: 11,
              formatter: "{b}",
            },
            labelLine: { show: false },
            itemStyle: { borderWidth: 0, opacity: 0.9 },
            data: sorted,
          },
        ],
      };
    }

    case "treemap": {
      const items = data
        .map((d) => ({
          name: String(d[xKey] ?? ""),
          value: Number(d[yKey]) || 0,
        }))
        .filter((d) => d.value > 0);
      return {
        tooltip: { trigger: "item", confine: true, appendToBody: true },
        series: [
          {
            type: "treemap",
            roam: false,
            nodeClick: false,
            breadcrumb: { show: false },
            label: {
              show: true,
              color: "hsl(var(--foreground))",
              fontSize: 11,
              overflow: "truncate",
            },
            upperLabel: { show: false },
            itemStyle: {
              borderColor: "hsl(var(--background))",
              borderWidth: 2,
              gapWidth: 2,
            },
            data: items,
          },
        ],
      };
    }

    case "radar":
    case "radar-filled": {
      const maxVal = Math.max(
        ...data.map((d) => Number(d[yKey]) || 0),
        1,
      );
      const indicator = data.map((d) => ({
        name: String(d[xKey] ?? ""),
        max: maxVal * 1.15,
      }));
      return {
        tooltip: { trigger: "item", confine: true, appendToBody: true },
        radar: {
          indicator,
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          splitArea: { show: false },
          axisName: { color: axisMuted, fontSize: 11 },
        },
        series: [
          {
            type: "radar",
            data: [
              {
                value: data.map((d) => Number(d[yKey]) || 0),
                name: yKey,
                symbol: "circle",
                symbolSize: 6,
                areaStyle:
                  type === "radar-filled"
                    ? { opacity: 0.25 }
                    : undefined,
              },
            ],
          },
        ],
      };
    }

    case "radial": {
      const sorted = [...data].sort(
        (a, b) => (Number(a[yKey]) || 0) - (Number(b[yKey]) || 0),
      );
      const names = sorted.map((d) => String(d[xKey] ?? ""));
      const vals = sorted.map((d) => Number(d[yKey]) || 0);
      const maxV = Math.max(...vals, 1);
      const barSize = colSpan === 1 ? 10 : 14;
      return {
        tooltip: { trigger: "item", confine: true, appendToBody: true },
        polar: { radius: ["22%", "82%"] },
        angleAxis: {
          type: "category",
          data: names,
          clockwise: true,
          startAngle: 90,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        radiusAxis: {
          min: 0,
          max: maxV * 1.05,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
        },
        series: [
          {
            type: "bar",
            coordinateSystem: "polar",
            data: vals,
            barWidth: barSize,
            roundCap: true,
            itemStyle: {
              borderRadius: barSize / 2,
            },
          },
        ],
      };
    }

    case "bar-grouped": {
      const y2 = data.map((d) => Number(d[y2Key!]) || 0);
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "bar",
            name: yKey,
            data: y1,
            barMaxWidth: 32,
            itemStyle: { borderRadius: [8, 8, 0, 0] },
          },
          {
            type: "bar",
            name: y2Key!,
            data: y2,
            barMaxWidth: 32,
            itemStyle: { borderRadius: [8, 8, 0, 0] },
          },
        ],
      };
    }

    case "bar-stacked": {
      const y2 = data.map((d) => Number(d[y2Key!]) || 0);
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "bar",
            name: yKey,
            stack: "total",
            data: y1,
            barMaxWidth: 36,
            itemStyle: {},
          },
          {
            type: "bar",
            name: y2Key!,
            stack: "total",
            data: y2,
            barMaxWidth: 36,
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
            },
          },
        ],
      };
    }

    case "line-multi": {
      const y2 = data.map((d) => Number(d[y2Key!]) || 0);
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "line",
            name: yKey,
            data: y1,
            smooth: false,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { width: 2 },
          },
          {
            type: "line",
            name: y2Key!,
            data: y2,
            smooth: false,
            symbol: "circle",
            symbolSize: 6,
            lineStyle: { width: 2, type: "dashed" },
          },
        ],
      };
    }

    case "area-stacked": {
      const y2 = data.map((d) => Number(d[y2Key!]) || 0);
      return {
        tooltip: cartesianTooltip(),
        grid: baseGrid(),
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        yAxis: {
          type: "value",
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { lineStyle: { type: "dashed", color: gridLine } },
          axisLabel: { color: axisMuted, fontSize: 12, margin: 8 },
        },
        series: [
          {
            type: "line",
            name: yKey,
            data: y1,
            smooth: false,
            z: 1,
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.2 },
          },
          {
            type: "line",
            name: y2Key!,
            data: y2,
            smooth: false,
            z: 2,
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.2 },
          },
        ],
      };
    }

    default:
      return {};
  }
}

/** Compact charts for inline widgets */
export function buildInlineEChartsOption(params: {
  chartType: "area" | "bar" | "line" | "donut";
  data: Array<Record<string, unknown>>;
  xKey: string;
  yKey: string;
}): echarts.EChartsCoreOption {
  const { chartType, data, xKey, yKey } = params;
  const categories = data.map((d) => String(d[xKey] ?? ""));
  const y1 = data.map((d) => Number(d[yKey]) || 0);
  const compactGrid = {
    left: 4,
    right: 8,
    top: 8,
    bottom: 20,
  };
  const tip = {
    trigger: "axis" as const,
    confine: true,
    appendToBody: true,
  };

  switch (chartType) {
    case "area":
      return {
        tooltip: tip,
        grid: compactGrid,
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { fontSize: 11, color: axisMuted },
        },
        yAxis: {
          type: "value",
          show: false,
          splitLine: { show: false },
        },
        series: [
          {
            type: "line",
            data: y1,
            smooth: false,
            symbol: "none",
            lineStyle: { width: 2 },
            areaStyle: { opacity: 0.15 },
          },
        ],
      };
    case "bar":
      return {
        tooltip: tip,
        grid: compactGrid,
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { fontSize: 11, color: axisMuted },
        },
        yAxis: {
          type: "value",
          show: false,
          splitLine: { show: false },
        },
        series: [
          {
            type: "bar",
            data: y1,
            barMaxWidth: 24,
            itemStyle: { borderRadius: [4, 4, 0, 0] },
          },
        ],
      };
    case "line":
      return {
        tooltip: tip,
        grid: compactGrid,
        xAxis: {
          type: "category",
          data: categories,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { fontSize: 11, color: axisMuted },
        },
        yAxis: {
          type: "value",
          show: false,
          splitLine: { show: false },
        },
        series: [
          {
            type: "line",
            data: y1,
            smooth: false,
            symbol: "circle",
            symbolSize: 5,
            lineStyle: { width: 2 },
          },
        ],
      };
    case "donut":
      return {
        tooltip: { trigger: "item", confine: true, appendToBody: true },
        series: [
          {
            type: "pie",
            radius: ["38%", "58%"],
            center: ["50%", "50%"],
            padAngle: 3,
            itemStyle: {
              borderRadius: 4,
              borderWidth: 0,
            },
            label: { show: false },
            data: data.map((d) => ({
              name: String(d[xKey] ?? ""),
              value: Number(d[yKey]) || 0,
            })),
          },
        ],
      };
    default:
      return {};
  }
}
