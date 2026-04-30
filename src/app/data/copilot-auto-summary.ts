import type { EChartsCoreOption } from "echarts";
import {
  buildTrendSparklineSeries,
  type KpiSparklinePattern,
} from "../lib/kpi-trend-sparkline";
import {
  expandRowsForPagination,
  mutateContactId,
  shiftMinuteSecondDuration,
} from "./paginated-table-mocks";

export type CopilotAutoSummaryKpi = {
  label: string;
  value: string;
  trend: string;
  caption: string;
  subcaption: string;
  sparklinePattern: KpiSparklinePattern;
  sparkline: number[];
};

function createAutoSummaryKpi(
  kpi: Omit<CopilotAutoSummaryKpi, "sparkline">,
): CopilotAutoSummaryKpi {
  return {
    ...kpi,
    sparkline: buildTrendSparklineSeries({
      value: kpi.value,
      trend: kpi.trend,
      pattern: kpi.sparklinePattern,
      seedKey: `copilot-auto-summary:${kpi.label}`,
    }),
  };
}

export const copilotAutoSummaryKpis: CopilotAutoSummaryKpi[] = [
  createAutoSummaryKpi({
    label: "Acceptance Rate",
    value: "85%",
    trend: "+2.4%",
    caption: "Acceptance Rate",
    subcaption: "420 of 494",
    sparklinePattern: "steadyUp",
  }),
  createAutoSummaryKpi({
    label: "Edit Rate",
    value: "15.2%",
    trend: "-1.1%",
    caption: "Edit Rate",
    subcaption: "75 edited summaries",
    sparklinePattern: "steadyDown",
  }),
  createAutoSummaryKpi({
    label: "Average Similarity Score",
    value: "0.854",
    trend: "+0.03",
    caption: "Average Similarity Score",
    subcaption: "494 scored interactions",
    sparklinePattern: "smallDipRecovery",
  }),
  createAutoSummaryKpi({
    label: "Time Saved",
    value: "63.9 hrs",
    trend: "+6.8%",
    caption: "Time Saved",
    subcaption: "420 accepted summaries",
    sparklinePattern: "bigDipRecovery",
  }),
];

export const autoSummaryInsightParagraphs: string[] = [
  "Your AutoSummary system is performing above target. Acceptance rate of 78.4% exceeds the 75% goal, with 3,842 summaries accepted out of 4,900 generated. Billing skill leads at 84.2% acceptance with 0.91 similarity, the highest-quality summaries in the system. The V3 engine improved average similarity by +0.04 vs V2, reducing rejection-rewrite cycles by 23%.",
  "Edit rate of 14.2% shows room for improvement. Most edits are tone adjustments (62%) rather than factual errors (18%). Retention skill has the lowest similarity score at 0.81, contributing disproportionately to the edit workload. Fine-tuning on Retention data could reduce the overall edit rate by about 2pp and save agents approximately 8 minutes per shift.",
];

export const autoSummaryRecommendedAction = {
  title: "Fine-tune model on Retention skill data",
  description:
    "Retention has the lowest similarity score at 0.82 and 18.9% edit rate, the worst of all skills. Targeted fine-tuning could reduce overall edit rate by about 2pp and save agents 8 minutes per shift.",
  footerLinkLabel: "See all 3 actions",
};

export const drilldownMessage =
  "Click on chart bars, skill groups, or agents to drill down into individual summary records.";

export const similarityScoreDistributionOption: EChartsCoreOption = {
  grid: { left: 48, right: 24, top: 16, bottom: 36 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["0.0-0.5", "0.5-0.6", "0.6-0.7", "0.7-0.8", "0.8-0.9", "0.9-1.0"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 56,
      data: [0, 0, 14, 108, 228, 146],
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "#8165da" },
            { offset: 1, color: "#6653cc" },
          ],
        },
      },
    },
  ],
};

export type SkillGroupAcceptanceRow = {
  skill: string;
  volume: number;
  ratePct: number;
  tone: "purple" | "blue" | "green" | "orange";
};

export const skillGroupAcceptanceRows: SkillGroupAcceptanceRow[] = [
  { skill: "Billing", volume: 126, ratePct: 84.9, tone: "purple" },
  { skill: "Sales", volume: 117, ratePct: 84.6, tone: "purple" },
  { skill: "Tech Support", volume: 92, ratePct: 91.3, tone: "green" },
  { skill: "General", volume: 81, ratePct: 81.5, tone: "orange" },
  { skill: "Retention", volume: 78, ratePct: 82.1, tone: "blue" },
];

export type AgentAcceptanceRow = {
  rank: number;
  agent: string;
  acceptancePct: number;
  volume: number;
};

export const agentAcceptanceRows: AgentAcceptanceRow[] = [
  { rank: 1, agent: "Robert Anderson", acceptancePct: 100, volume: 24 },
  { rank: 2, agent: "David Brown", acceptancePct: 93.9, volume: 33 },
  { rank: 3, agent: "Michael Chen", acceptancePct: 92.9, volume: 28 },
  { rank: 4, agent: "Rachel Clark", acceptancePct: 91.7, volume: 24 },
  { rank: 5, agent: "Daniel Jackson", acceptancePct: 90.5, volume: 21 },
  { rank: 6, agent: "Emily Davis", acceptancePct: 89.3, volume: 28 },
  { rank: 7, agent: "Brian Hall", acceptancePct: 88.9, volume: 18 },
  { rank: 8, agent: "Amanda Taylor", acceptancePct: 87.5, volume: 24 },
  { rank: 9, agent: "Stephanie Walker", acceptancePct: 87.5, volume: 24 },
  { rank: 10, agent: "James Wilson", acceptancePct: 86.7, volume: 30 },
  { rank: 11, agent: "Kevin Harris", acceptancePct: 84.6, volume: 26 },
  { rank: 12, agent: "Jennifer Martinez", acceptancePct: 84.6, volume: 26 },
  { rank: 13, agent: "Michelle Thomas", acceptancePct: 81.8, volume: 22 },
  { rank: 14, agent: "Christopher Lee", acceptancePct: 81.3, volume: 32 },
  { rank: 15, agent: "Lisa White", acceptancePct: 80.0, volume: 20 },
  { rank: 16, agent: "Andrew Lewis", acceptancePct: 77.8, volume: 18 },
  { rank: 17, agent: "Mark Young", acceptancePct: 77.3, volume: 22 },
  { rank: 18, agent: "Jessica Williams", acceptancePct: 76.7, volume: 30 },
  { rank: 19, agent: "Sarah Johnson", acceptancePct: 72.0, volume: 25 },
  { rank: 20, agent: "Nicole Allen", acceptancePct: 68.4, volume: 19 },
];

export const editRateTrendOption: EChartsCoreOption = {
  grid: { left: 46, right: 24, top: 18, bottom: 38 },
  tooltip: {
    trigger: "axis",
    confine: true,
    appendToBody: true,
    valueFormatter: (value: number | string) => `${value}%`,
  },
  xAxis: {
    type: "category",
    data: ["2026-03-17", "2026-03-22", "2026-03-27", "2026-04-01", "2026-04-06", "2026-04-11", "2026-04-15"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 40,
    interval: 10,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "line",
      smooth: 0.3,
      symbol: "circle",
      symbolSize: 5,
      lineStyle: { width: 2.5, color: "#6555cf" },
      data: [18.4, 17.8, 17.1, 16.5, 16.2, 15.7, 15.2],
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(101, 85, 207, 0.22)" },
            { offset: 1, color: "rgba(101, 85, 207, 0.02)" },
          ],
        },
      },
    },
  ],
};

export const intentDistributionOption: EChartsCoreOption = {
  grid: { left: 44, right: 24, top: 18, bottom: 56 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: [
      "billing_inquiry",
      "plan_upgrade",
      "payment_issue",
      "product_info",
      "account_access",
      "password_reset",
      "order_status",
      "pricing_question",
      "cancel_service",
      "feature_request",
      "general_question",
    ],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { rotate: 20, color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 16,
    interval: 4,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 42,
      data: [14, 11, 9, 7, 8, 10, 6, 5, 4, 3, 8],
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: "#6956d3",
      },
    },
  ],
};

export type EditReasonRow = {
  reason: string;
  count: number;
  pct: number;
  tone: "purple" | "red" | "orange" | "green" | "gray" | "blue";
};

export const editReasonRows: EditReasonRow[] = [
  { reason: "Added resolution steps", count: 15, pct: 15.6, tone: "purple" },
  { reason: "Removed sensitive info", count: 15, pct: 15.6, tone: "red" },
  { reason: "Corrected factual error", count: 14, pct: 14.6, tone: "orange" },
  { reason: "Improved clarity", count: 13, pct: 13.5, tone: "blue" },
  { reason: "Updated outcome", count: 12, pct: 12.5, tone: "green" },
  { reason: "Simplified language", count: 11, pct: 11.5, tone: "gray" },
  { reason: "Added missing details", count: 8, pct: 8.3, tone: "purple" },
  { reason: "Added follow-up notes", count: 8, pct: 8.3, tone: "red" },
];

export const summaryWordCountDistributionOption: EChartsCoreOption = {
  grid: { left: 48, right: 24, top: 18, bottom: 36 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["1-25", "26-50", "51-75", "76-100", "101-150", "151+"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 600,
    interval: 150,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 56,
      data: [456, 40, 0, 0, 0, 0],
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: "#735ad5",
      },
    },
  ],
};

export const tokenUsageTrendOption: EChartsCoreOption = {
  grid: { left: 46, right: 24, top: 18, bottom: 38 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["2026-03-17", "2026-03-22", "2026-03-27", "2026-04-01", "2026-04-06", "2026-04-11", "2026-04-15"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 1600,
    interval: 400,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "line",
      smooth: 0.25,
      symbol: "circle",
      symbolSize: 5,
      lineStyle: { width: 2.5, color: "#6555cf" },
      data: [1110, 1094, 1007, 918, 942, 970, 963],
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(101, 85, 207, 0.2)" },
            { offset: 1, color: "rgba(101, 85, 207, 0.03)" },
          ],
        },
      },
    },
  ],
};

export const tokenUsageTotals = {
  totalTokens: "669,014 total tokens",
  totalSummaries: "494 summaries",
};

export type EditLengthDeltaRow = {
  id: string;
  beforeChars: number;
  afterChars: number;
  delta: number;
  reason: string;
};

export const editLengthDeltaStats = {
  editedSummaries: 96,
  avgCharDelta: 6,
  addedRemoved: "66 / 28",
};

export const editLengthDeltaRows: EditLengthDeltaRow[] = [
  { id: "6565ca79-4", beforeChars: 45, afterChars: 53, delta: 8, reason: "Added resolution steps" },
  { id: "081915be-3", beforeChars: 60, afterChars: 62, delta: 2, reason: "Corrected factual error" },
  { id: "f5f37b41-a", beforeChars: 60, afterChars: 71, delta: 11, reason: "Simplified language" },
  { id: "7f26eaa3-2", beforeChars: 47, afterChars: 57, delta: 10, reason: "Improved clarity" },
  { id: "16b57e57-2", beforeChars: 52, afterChars: 70, delta: 18, reason: "Added missing details" },
  { id: "e195af99-3", beforeChars: 57, afterChars: 47, delta: -10, reason: "Simplified language" },
  { id: "6fc79193-0", beforeChars: 60, afterChars: 62, delta: 2, reason: "Removed sensitive info" },
  { id: "ce562c8b-f", beforeChars: 47, afterChars: 71, delta: 24, reason: "Removed sensitive info" },
];

export type OutcomeSeriesMode = "count" | "rate";

const outcomeDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const outcomeDistributionCountOption: EChartsCoreOption = {
  grid: { left: 46, right: 24, top: 18, bottom: 46 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  legend: { bottom: 0, icon: "circle", textStyle: { fontSize: 11, color: "hsl(var(--muted-foreground))" } },
  xAxis: {
    type: "category",
    data: outcomeDays,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 640,
    interval: 200,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    { name: "As Is", type: "line", smooth: 0.2, symbol: "circle", symbolSize: 5, lineStyle: { width: 2, color: "#3b82f6" }, data: [426, 412, 405, 390, 388, 356, 340] },
    { name: "Revised", type: "line", smooth: 0.2, symbol: "circle", symbolSize: 5, lineStyle: { width: 2, color: "#f59e0b" }, data: [118, 122, 121, 114, 113, 102, 96] },
    { name: "Minor", type: "line", smooth: 0.2, symbol: "circle", symbolSize: 5, lineStyle: { width: 2, color: "#8b5cf6" }, data: [44, 47, 48, 46, 43, 39, 37] },
    { name: "Ignored", type: "line", smooth: 0.2, symbol: "circle", symbolSize: 5, lineStyle: { width: 2, color: "#ef4444" }, data: [24, 23, 21, 20, 19, 16, 15] },
  ],
};

export const outcomeDistributionRateOption: EChartsCoreOption = {
  grid: { left: 46, right: 24, top: 18, bottom: 46 },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    confine: true,
    appendToBody: true,
    valueFormatter: (value: number | string) => `${value}%`,
  },
  legend: { bottom: 0, icon: "circle", textStyle: { fontSize: 11, color: "hsl(var(--muted-foreground))" } },
  xAxis: {
    type: "category",
    data: outcomeDays,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 100,
    interval: 25,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))", formatter: "{value}%" },
  },
  series: [
    { name: "As Is", type: "line", smooth: 0.2, symbol: "circle", symbolSize: 5, lineStyle: { width: 2, color: "#3b82f6" }, data: [69.8, 68.4, 68.2, 68.0, 68.3, 69.3, 69.8] },
    { name: "Revised", type: "line", smooth: 0.2, symbol: "circle", symbolSize: 5, lineStyle: { width: 2, color: "#f59e0b" }, data: [19.4, 20.2, 20.3, 19.9, 19.8, 19.9, 19.7] },
    { name: "Minor", type: "line", smooth: 0.2, symbol: "circle", symbolSize: 5, lineStyle: { width: 2, color: "#8b5cf6" }, data: [7.2, 7.8, 8.1, 8.0, 7.6, 7.6, 7.6] },
    { name: "Ignored", type: "line", smooth: 0.2, symbol: "circle", symbolSize: 5, lineStyle: { width: 2, color: "#ef4444" }, data: [3.6, 3.6, 3.4, 3.5, 3.3, 3.2, 2.9] },
  ],
};

export const outcomeBreakdownOption: EChartsCoreOption = {
  tooltip: { trigger: "item", confine: true, appendToBody: true },
  legend: {
    show: false,
    bottom: 0,
    icon: "circle",
    textStyle: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "pie",
      radius: ["50%", "78%"],
      center: ["50%", "50%"],
      itemStyle: { borderRadius: 6, borderColor: "#FFFFFF", borderWidth: 2 },
      label: { formatter: "{b}: {d}%", color: "hsl(var(--muted-foreground))" },
      data: [
        { value: 3432, name: "As Is", itemStyle: { color: "#3b82f6" } },
        { value: 964, name: "Revised", itemStyle: { color: "#f59e0b" } },
        { value: 381, name: "Minor", itemStyle: { color: "#8b5cf6" } },
        { value: 123, name: "Ignored", itemStyle: { color: "#ef4444" } },
      ],
    },
  ],
};

export const timeToSaveAnalysisOption: EChartsCoreOption = {
  grid: { left: 48, right: 24, top: 18, bottom: 36 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["0-5s", "5-15s", "15-30s", "30-60s", "60s+"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 6000,
    interval: 1500,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 160,
      data: [2800, 3500, 3000, 1600, 980],
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: "#6068df",
      },
    },
  ],
};

export const timeToSaveStats = {
  avg: "18.4s",
  median: "12s",
  p90: "42s",
};

export type SessionInvestigateRow = {
  contact: string;
  channel: "Voice" | "Messenger" | "Webchat";
  agent: string;
  skill: string;
  similarity: number;
  duration: string;
  intent: string;
  sentiment: "positive" | "neutral" | "mixed" | "negative";
};

const sessionsToInvestigateBaseRows: SessionInvestigateRow[] = [
  { contact: "CNT-01195", channel: "Voice", agent: "Brian Hall", skill: "General", similarity: 0.61, duration: "9m 21s", intent: "plan_upgrade", sentiment: "mixed" },
  { contact: "CNT-01880", channel: "Messenger", agent: "Rachel Clark", skill: "Retention", similarity: 0.622, duration: "1m 26s", intent: "billing_inquiry", sentiment: "mixed" },
  { contact: "CNT-00421", channel: "Webchat", agent: "Emily Davis", skill: "Tech Support", similarity: 0.653, duration: "27m 41s", intent: "billing_inquiry", sentiment: "neutral" },
  { contact: "CNT-01099", channel: "Voice", agent: "Jessica Williams", skill: "Billing", similarity: 0.657, duration: "16m 35s", intent: "account_access", sentiment: "negative" },
  { contact: "CNT-01554", channel: "Webchat", agent: "Kevin Harris", skill: "Retention", similarity: 0.659, duration: "15m 4s", intent: "billing_inquiry", sentiment: "positive" },
  { contact: "CNT-00365", channel: "Webchat", agent: "Michael Chen", skill: "Retention", similarity: 0.664, duration: "6m 18s", intent: "pricing_question", sentiment: "neutral" },
  { contact: "CNT-00602", channel: "Voice", agent: "Emily Davis", skill: "Tech Support", similarity: 0.667, duration: "27m 52s", intent: "account_access", sentiment: "positive" },
  { contact: "CNT-00758", channel: "Webchat", agent: "Michael Chen", skill: "Tech Support", similarity: 0.67, duration: "19m 39s", intent: "product_info", sentiment: "neutral" },
  { contact: "CNT-01854", channel: "Messenger", agent: "Michael Chen", skill: "Billing", similarity: 0.671, duration: "17m 18s", intent: "payment_issue", sentiment: "neutral" },
  { contact: "CNT-00673", channel: "Webchat", agent: "Kevin Harris", skill: "General", similarity: 0.673, duration: "6m 13s", intent: "account_access", sentiment: "positive" },
];

export const sessionsToInvestigateRows: SessionInvestigateRow[] = expandRowsForPagination(
  sessionsToInvestigateBaseRows,
  ({ baseRow, cycle, baseIndex, baseLength }) => {
    if (cycle === 0) return { ...baseRow };

    const duplicateOrdinal = (cycle - 1) * baseLength + baseIndex + 1;
    const similarityDelta = ((duplicateOrdinal % 11) - 5) * 0.003;

    return {
      ...baseRow,
      contact: mutateContactId(baseRow.contact, duplicateOrdinal),
      duration: shiftMinuteSecondDuration(baseRow.duration, (duplicateOrdinal % 6) - 2, duplicateOrdinal % 19),
      similarity: Number(Math.min(0.995, Math.max(0.5, baseRow.similarity + similarityDelta)).toFixed(3)),
    };
  },
);

export const autoSummarySessionColumns = [
  { id: "agent", label: "Agent" },
  { id: "channel", label: "Channel" },
  { id: "skill", label: "Skill" },
  { id: "similarity", label: "Similarity" },
  { id: "duration", label: "Duration" },
  { id: "intent", label: "Intent" },
  { id: "sentiment", label: "Sentiment" },
] as const;

export type AutoSummarySessionColumnId = (typeof autoSummarySessionColumns)[number]["id"];

export const autoSummarySessionsDataTimestamp = "Data as of ~3:26 PM (~30 min delay)";
