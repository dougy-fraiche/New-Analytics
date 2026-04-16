import type { EChartsCoreOption } from "echarts";

export type KnowledgePerformanceKpiTone = "positive" | "negative";

export interface KnowledgePerformanceKpiTile {
  label: string;
  value: string;
  supportingText: string;
  tone: KnowledgePerformanceKpiTone;
}

export interface KnowledgePerformanceArticleRow {
  title: string;
  retrievals: number;
  relevancyScore: number;
  helpfulRatePct: number;
}

export interface KnowledgePerformanceTrendPoint {
  date: string;
  retrievalSuccessPct: number;
}

const trendPoints: KnowledgePerformanceTrendPoint[] = (() => {
  const points: KnowledgePerformanceTrendPoint[] = [];
  for (let i = 0; i < 88; i++) {
    const date = new Date(Date.UTC(2026, 0, 18 + i));
    const isoDate = date.toISOString().slice(0, 10);
    const wave =
      99.1 +
      Math.sin(i * 0.33) * 0.7 +
      Math.cos(i * 0.21) * 0.45 +
      Math.sin(i * 0.88) * 0.25;
    let value = wave;
    if (i === 3 || i === 4) value -= 7.5;
    if (i === 21) value -= 1.8;
    if (i === 29) value -= 2.4;
    if (i === 42 || i === 43) value -= 3.2;
    if (i === 54) value -= 5.1;
    if (i === 78) value -= 1.6;
    const retrievalSuccessPct = Math.max(90.6, Math.min(100, Number(value.toFixed(2))));
    points.push({ date: isoDate, retrievalSuccessPct });
  }
  return points;
})();

export const knowledgeOverviewTrendPoints = trendPoints;

export const knowledgeOverviewKpiTiles: KnowledgePerformanceKpiTile[] = [
  {
    label: "Total Articles",
    value: "—",
    supportingText: "no article inventory in schema",
    tone: "negative",
  },
  {
    label: "Retrieval Success Rate",
    value: "98.1%",
    supportingText: "ILLUM kbqueries",
    tone: "positive",
  },
  {
    label: "Avg Relevancy Score",
    value: "0.72",
    supportingText: "ILLUM kbqueries",
    tone: "positive",
  },
  {
    label: "Feedback Ratio",
    value: "4.3:1",
    supportingText: "positive to negative",
    tone: "positive",
  },
  {
    label: "Coverage Score",
    value: "—",
    supportingText: "not available in schema",
    tone: "negative",
  },
];

export const topPerformingKnowledgeArticles: KnowledgePerformanceArticleRow[] = [
  { title: "API Documentation", retrievals: 439, relevancyScore: 0.71, helpfulRatePct: 62 },
  { title: "Compliance Requirements", retrievals: 438, relevancyScore: 0.72, helpfulRatePct: 66 },
  { title: "Mobile App Setup", retrievals: 431, relevancyScore: 0.72, helpfulRatePct: 61 },
  { title: "Refund Policy", retrievals: 417, relevancyScore: 0.72, helpfulRatePct: 62 },
  { title: "Upgrading Your Plan", retrievals: 416, relevancyScore: 0.73, helpfulRatePct: 63 },
];

export const underperformingKnowledgeArticles: KnowledgePerformanceArticleRow[] = [
  { title: "Service Cancellation Policy", retrievals: 398, relevancyScore: 0.71, helpfulRatePct: 61 },
  { title: "Account Security Best Practices", retrievals: 414, relevancyScore: 0.71, helpfulRatePct: 51 },
  { title: "API Documentation", retrievals: 439, relevancyScore: 0.71, helpfulRatePct: 62 },
  { title: "Getting Started Guide", retrievals: 382, relevancyScore: 0.71, helpfulRatePct: 62 },
  { title: "Troubleshooting Connection Issues", retrievals: 367, relevancyScore: 0.72, helpfulRatePct: 68 },
];

export const knowledgeRetrievalSuccessTrendOption: EChartsCoreOption = {
  grid: { left: 58, right: 16, top: 22, bottom: 42 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true, valueFormatter: (value) => `${Number(value).toFixed(2)}%` },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: knowledgeOverviewTrendPoints.map((point) => point.date),
    axisLine: { lineStyle: { color: "hsl(var(--border))" } },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", hideOverlap: true },
    splitLine: { show: true, lineStyle: { type: "dashed", color: "hsl(var(--border) / 0.4)" } },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 100,
    interval: 25,
    axisLine: { lineStyle: { color: "hsl(var(--border))" } },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", formatter: "{value}%" },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border) / 0.55)" } },
  },
  series: [
    {
      type: "line",
      smooth: 0.25,
      symbol: "none",
      data: knowledgeOverviewTrendPoints.map((point) => point.retrievalSuccessPct),
      lineStyle: { width: 2.25, color: "#4f56b8" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(79, 86, 184, 0.20)" },
            { offset: 1, color: "rgba(79, 86, 184, 0.04)" },
          ],
        },
      },
    },
  ],
};
