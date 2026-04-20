import type { EChartsCoreOption } from "echarts";
import {
  expandRowsForPagination,
  mutateContactId,
  shiftMinuteSecondDuration,
} from "./paginated-table-mocks";

export interface CopilotRealTimeSummaryKpi {
  label: string;
  value: string;
  supportingText: string;
}

export const copilotRealTimeSummaryKpis: CopilotRealTimeSummaryKpi[] = [
  {
    label: "P95 Latency",
    value: "9.8s",
    supportingText: "18% below 12-second SLA threshold",
  },
  {
    label: "Agent View Rate",
    value: "73.4%",
    supportingText: "Agents actively consult real-time summaries",
  },
  {
    label: "Scroll Interaction Rate",
    value: "42.8%",
    supportingText: "Agents read beyond the initial viewport",
  },
];

export const copilotRealTimeSummaryNarrative = {
  title: "AI-GENERATED SUMMARY",
  paragraphOne:
    "P95 latency at 9.8 seconds is 18% below the 12-second SLA threshold, providing consistent sub-10s refreshes. Agent view rate of 73.4% shows strong engagement - agents are actively consulting real-time summaries during conversations. Scroll interaction rate of 42.8% indicates agents read beyond the initial viewport.",
  paragraphTwo:
    "287 interactions (5.9%) produced summaries below the 0.70 quality threshold-these may be actively misleading agents mid-conversation. Retention skill is the worst offender at 16.1% low-score rate with the lowest proxy accuracy of 0.812. Recommend implementing a confidence threshold that withholds display for summaries scoring under 0.65.",
};

export const copilotRealTimeRecommendedAction = {
  title: "RECOMMENDED ACTIONS",
  callToAction: "Expand",
  cardTitle: "Implement confidence threshold for low-score summaries",
  cardBody:
    "287 interactions (5.9%) produced summaries below the 0.70 quality threshold-these may actively mislead agents. Withholding display for scores under 0.65 would prevent low-quality guidance.",
  footerLinkText: "See all 3 actions ->",
};

export interface CopilotProxyMetricTile {
  label: string;
  value: string;
  tone: "neutral" | "primary" | "warning";
}

export const copilotProxyMetricTiles: CopilotProxyMetricTile[] = [
  { label: "Interactions With Both", value: "245", tone: "neutral" },
  { label: "Avg Similarity", value: "0.856", tone: "primary" },
  { label: "Low Score Count (<0.6)", value: "0", tone: "warning" },
];

export interface CopilotProxySkillRow {
  skill: string;
  score: number;
  contacts: number;
  barColor: string;
}

export const copilotProxySkillRows: CopilotProxySkillRow[] = [
  { skill: "Retention", score: 0.863, contacts: 42, barColor: "#6a53c8" },
  { skill: "Billing", score: 0.861, contacts: 77, barColor: "#6f5ad1" },
  { skill: "Sales", score: 0.861, contacts: 71, barColor: "#248b3d" },
  { skill: "Tech Support", score: 0.846, contacts: 52, barColor: "#f5af00" },
  { skill: "General", score: 0.846, contacts: 44, barColor: "#3e4aaa" },
];

export interface CopilotStreamingLatencySkillRow {
  skill: string;
  p50Ms: number;
  p95Ms: number;
  avgMs: number;
  count: number;
  dotColor: string;
}

export const copilotStreamingLatencySkillRows: CopilotStreamingLatencySkillRow[] = [
  { skill: "General", p50Ms: 217, p95Ms: 458, avgMs: 243, count: 66, dotColor: "#6f5ad1" },
  { skill: "Sales", p50Ms: 241, p95Ms: 473, avgMs: 261, count: 98, dotColor: "#7b63d8" },
  { skill: "Billing", p50Ms: 278, p95Ms: 453, avgMs: 269, count: 107, dotColor: "#248b3d" },
  { skill: "Retention", p50Ms: 300, p95Ms: 484, avgMs: 280, count: 60, dotColor: "#f5af00" },
  { skill: "Tech Support", p50Ms: 290, p95Ms: 487, avgMs: 283, count: 72, dotColor: "#3e4aaa" },
];

const realTimeDates = Array.from({ length: 31 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 2, 16 + index));
  return date.toISOString().slice(0, 10);
});

export const realTimeVolumeTotals = {
  totalSummaries: "Total: 403 summaries",
  rangeLabel: "31 days",
};

export const realTimeVolumeTrendOption: EChartsCoreOption = {
  grid: { left: 48, right: 18, top: 14, bottom: 38 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: realTimeDates,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 24,
    interval: 6,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "line",
      smooth: 0.3,
      symbol: "none",
      lineStyle: { width: 2.8, color: "#6f5ad1" },
      data: [1, 23, 12, 14, 8, 9, 10, 7, 15, 21, 8, 10, 13, 17, 11, 16, 16, 20, 17, 15, 13, 9, 13, 10, 12, 12, 17, 12, 14, 9, 19],
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(111, 90, 209, 0.20)" },
            { offset: 1, color: "rgba(111, 90, 209, 0.03)" },
          ],
        },
      },
    },
  ],
};

export const realTimeTokenTotals = {
  totalTokens: "188,841 total tokens",
  totalSummaries: "403 real-time summaries",
};

export const realTimeTokenUsageTrendOption: EChartsCoreOption = {
  grid: { left: 48, right: 18, top: 14, bottom: 38 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: realTimeDates,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 800,
    interval: 200,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "line",
      smooth: 0.3,
      symbol: "none",
      lineStyle: { width: 2.8, color: "#6f5ad1" },
      data: [650, 520, 470, 455, 500, 380, 580, 390, 400, 410, 430, 470, 550, 440, 545, 450, 540, 425, 470, 410, 370, 530, 320, 430, 500, 500, 495, 497, 490, 655, 510],
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(111, 90, 209, 0.20)" },
            { offset: 1, color: "rgba(111, 90, 209, 0.03)" },
          ],
        },
      },
    },
  ],
};

export interface CopilotRealTimeComparisonRow {
  skill: string;
  rtSimilarity: number;
  finalSimilarity: number;
  rtWordCount: number;
  finalWordCount: number;
  rtLatencyMs: number;
  finalLatencyMs: number;
  contacts: number;
  dotColor: string;
}

export const copilotRealTimeComparisonRows: CopilotRealTimeComparisonRow[] = [
  {
    skill: "Billing",
    rtSimilarity: 0.861,
    finalSimilarity: 0.861,
    rtWordCount: 4,
    finalWordCount: 17,
    rtLatencyMs: 280,
    finalLatencyMs: 1865,
    contacts: 77,
    dotColor: "#6f5ad1",
  },
  {
    skill: "Sales",
    rtSimilarity: 0.861,
    finalSimilarity: 0.861,
    rtWordCount: 4,
    finalWordCount: 17,
    rtLatencyMs: 260,
    finalLatencyMs: 1713,
    contacts: 71,
    dotColor: "#7b63d8",
  },
  {
    skill: "Tech Support",
    rtSimilarity: 0.846,
    finalSimilarity: 0.846,
    rtWordCount: 4,
    finalWordCount: 16,
    rtLatencyMs: 287,
    finalLatencyMs: 1764,
    contacts: 52,
    dotColor: "#248b3d",
  },
  {
    skill: "General",
    rtSimilarity: 0.846,
    finalSimilarity: 0.846,
    rtWordCount: 4,
    finalWordCount: 17,
    rtLatencyMs: 242,
    finalLatencyMs: 1807,
    contacts: 44,
    dotColor: "#f5af00",
  },
  {
    skill: "Retention",
    rtSimilarity: 0.863,
    finalSimilarity: 0.863,
    rtWordCount: 4,
    finalWordCount: 18,
    rtLatencyMs: 285,
    finalLatencyMs: 1704,
    contacts: 42,
    dotColor: "#3e4aaa",
  },
];

export interface CopilotRealTimeSessionRow {
  contact: string;
  channel: "Voice" | "Messenger" | "Webchat" | "WhatsApp";
  agent: string;
  skill: string;
  similarity: number;
  duration: string;
  intent: string;
  sentiment: "positive" | "neutral" | "mixed" | "negative";
}

const copilotRealTimeSessionBaseRows: CopilotRealTimeSessionRow[] = [
  { contact: "CNT-01195", channel: "Voice", agent: "Brian Hall", skill: "General", similarity: 0.61, duration: "9m 21s", intent: "plan_upgrade", sentiment: "mixed" },
  { contact: "CNT-01880", channel: "Messenger", agent: "Rachel Clark", skill: "Retention", similarity: 0.622, duration: "1m 26s", intent: "billing_inquiry", sentiment: "mixed" },
  { contact: "CNT-01554", channel: "Webchat", agent: "Kevin Harris", skill: "Retention", similarity: 0.659, duration: "15m 4s", intent: "billing_inquiry", sentiment: "positive" },
  { contact: "CNT-00108", channel: "Webchat", agent: "Jennifer Martinez", skill: "General", similarity: 0.662, duration: "4m 52s", intent: "password_reset", sentiment: "negative" },
  { contact: "CNT-01854", channel: "Messenger", agent: "Michael Chen", skill: "Billing", similarity: 0.671, duration: "17m 18s", intent: "payment_issue", sentiment: "neutral" },
  { contact: "CNT-00673", channel: "Webchat", agent: "Kevin Harris", skill: "General", similarity: 0.673, duration: "6m 13s", intent: "account_access", sentiment: "positive" },
  { contact: "CNT-01353", channel: "WhatsApp", agent: "Lisa White", skill: "Retention", similarity: 0.674, duration: "4m 44s", intent: "cancel_service", sentiment: "positive" },
  { contact: "CNT-00870", channel: "Messenger", agent: "Amanda Taylor", skill: "Tech Support", similarity: 0.675, duration: "20m 46s", intent: "password_reset", sentiment: "positive" },
  { contact: "CNT-01945", channel: "Webchat", agent: "Mark Young", skill: "Retention", similarity: 0.679, duration: "2m 35s", intent: "technical_troubleshoot", sentiment: "neutral" },
  { contact: "CNT-00372", channel: "Webchat", agent: "Michelle Thomas", skill: "Tech Support", similarity: 0.691, duration: "7m 37s", intent: "plan_upgrade", sentiment: "mixed" },
];

export const copilotRealTimeSessionRows: CopilotRealTimeSessionRow[] = expandRowsForPagination(
  copilotRealTimeSessionBaseRows,
  ({ baseRow, cycle, baseIndex, baseLength }) => {
    if (cycle === 0) return { ...baseRow };

    const duplicateOrdinal = (cycle - 1) * baseLength + baseIndex + 1;
    const similarityDelta = ((duplicateOrdinal % 9) - 4) * 0.004;

    return {
      ...baseRow,
      contact: mutateContactId(baseRow.contact, duplicateOrdinal),
      duration: shiftMinuteSecondDuration(baseRow.duration, (duplicateOrdinal % 4) - 1, duplicateOrdinal % 13),
      similarity: Number(Math.min(0.995, Math.max(0.5, baseRow.similarity + similarityDelta)).toFixed(3)),
    };
  },
);

export const copilotRealTimeSessionsDataTimestamp = "Data as of ~3:26 PM (~30 min delay)";

export const copilotRealTimeSessionColumnOptions = [
  { id: "agent", label: "Agent" },
  { id: "channel", label: "Channel" },
  { id: "skill", label: "Skill" },
  { id: "similarity", label: "Similarity" },
  { id: "duration", label: "Duration" },
  { id: "intent", label: "Intent" },
  { id: "sentiment", label: "Sentiment" },
] as const;

export type CopilotRealTimeSessionColumnId = (typeof copilotRealTimeSessionColumnOptions)[number]["id"];
