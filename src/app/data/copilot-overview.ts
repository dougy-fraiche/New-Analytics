import type { EChartsCoreOption } from "echarts";
import {
  expandRowsForPagination,
  mutateContactId,
  shiftMinuteSecondDuration,
} from "./paginated-table-mocks";

export type CopilotOverviewKpiIcon = "feature" | "time" | "coverage" | "quality";

export interface CopilotOverviewKpi {
  label: string;
  value: string;
  supportingText: string;
  detail: string;
  icon: CopilotOverviewKpiIcon;
}

export const copilotOverviewKpis: CopilotOverviewKpi[] = [
  {
    label: "Feature Adoption Rate",
    value: "64.1%",
    supportingText: "691 of 694 interactions",
    detail: "Healthy usage across enabled workflows",
    icon: "feature",
  },
  {
    label: "Agent Time Saved",
    value: "63.9 hrs",
    supportingText: "0.36 FTE equivalent - 5.5 min/contact",
    detail: "Estimated productivity gain",
    icon: "time",
  },
  {
    label: "AI Automation Coverage",
    value: "99.6%",
    supportingText: "691 automated interactions",
    detail: "Copilot-assisted contacts",
    icon: "coverage",
  },
  {
    label: "Summary Quality",
    value: "0.853",
    supportingText: "611 scored - Threshold: 0.80",
    detail: "Average quality score",
    icon: "quality",
  },
];

export interface CopilotHandleTimeRow {
  feature: string;
  enabledTime: string;
  enabledContacts: string;
  disabledTime: string;
  disabledContacts: string;
  delta: string;
  improvement: boolean;
}

export const copilotHandleTimeRows: CopilotHandleTimeRow[] = [
  {
    feature: "Any Copilot Feature",
    enabledTime: "12m 8s",
    enabledContacts: "Enabled (691)",
    disabledTime: "18m 3s",
    disabledContacts: "Disabled (3)",
    delta: "-5m 55s",
    improvement: true,
  },
  {
    feature: "KB Answers",
    enabledTime: "12m 19s",
    enabledContacts: "Enabled (516)",
    disabledTime: "11m 41s",
    disabledContacts: "Disabled (178)",
    delta: "+38s",
    improvement: false,
  },
  {
    feature: "Final Summary",
    enabledTime: "12m 14s",
    enabledContacts: "Enabled (494)",
    disabledTime: "11m 58s",
    disabledContacts: "Disabled (200)",
    delta: "+16s",
    improvement: false,
  },
  {
    feature: "Task Assist",
    enabledTime: "12m 4s",
    enabledContacts: "Enabled (353)",
    disabledTime: "12m 15s",
    disabledContacts: "Disabled (341)",
    delta: "-12s",
    improvement: true,
  },
];

export interface CopilotTransferEscalationData {
  transferRate: string;
  transferCountText: string;
  escalationRate: string;
  escalationCountText: string;
  enabledTransfer: string;
  disabledTransfer: string;
  enabledEscalation: string;
  disabledEscalation: string;
}

export const copilotTransferEscalation: CopilotTransferEscalationData = {
  transferRate: "16.3%",
  transferCountText: "113 of 694",
  escalationRate: "9.1%",
  escalationCountText: "63 of 694",
  enabledTransfer: "16.1%",
  disabledTransfer: "25%",
  enabledEscalation: "9.1%",
  disabledEscalation: "6.3%",
};

export interface CopilotAgentFeedbackBucket {
  label: string;
  value: number;
  color: string;
}

export const copilotAgentFeedbackBuckets: CopilotAgentFeedbackBucket[] = [
  { label: "Very Poor", value: 34, color: "#ef2424" },
  { label: "Poor", value: 57, color: "#f7b500" },
  { label: "Neutral", value: 95, color: "#f8b400" },
  { label: "Good", value: 91, color: "#288837" },
  { label: "Excellent", value: 140, color: "#6a53c8" },
];

export const copilotAgentFeedbackTotalRatings = 417;
export const copilotAgentFeedbackAverage = "3.6/5";

export const copilotAgentFeedbackDistributionOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 8, bottom: 36 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: copilotAgentFeedbackBuckets.map((bucket) => bucket.label),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    max: 140,
    interval: 35,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 44,
      data: copilotAgentFeedbackBuckets.map((bucket) => ({
        value: bucket.value,
        itemStyle: { color: bucket.color, borderRadius: [6, 6, 0, 0] },
      })),
    },
  ],
};

export interface CopilotTeamPerformanceRow {
  team: string;
  contacts: number;
  adoption: string;
  quality: string;
}

export const copilotTeamPerformanceRows: CopilotTeamPerformanceRow[] = [
  { team: "Technical Support", contacts: 140, adoption: "100%", quality: "0.854" },
  { team: "General Inquiries", contacts: 123, adoption: "100%", quality: "0.852" },
  { team: "Billing Support", contacts: 168, adoption: "99.4%", quality: "0.861" },
  { team: "Sales", contacts: 144, adoption: "99.3%", quality: "0.848" },
  { team: "Retention", contacts: 119, adoption: "99.2%", quality: "0.849" },
];

export interface CopilotInboundOutboundRow {
  label: "Inbound" | "Outbound";
  contactsText: string;
  adoptionRate: number;
}

export const copilotInboundOutboundRows: CopilotInboundOutboundRow[] = [
  { label: "Inbound", contactsText: "514 contacts (74.1%)", adoptionRate: 99.4 },
  { label: "Outbound", contactsText: "180 contacts (25.9%)", adoptionRate: 100 },
];

export const copilotFeatureCooccurrenceAxes = [
  "KB Answers",
  "Final Summary",
  "Task Assist",
  "Real-Time Summary",
] as const;

export type CopilotFeatureAxis = (typeof copilotFeatureCooccurrenceAxes)[number];

const copilotFeatureCooccurrenceMatrix: Array<Array<number | null>> = [
  [null, 52.2, 36.3, 42.8],
  [52.2, null, 35.3, 41.2],
  [36.3, 35.3, null, 29.5],
  [42.8, 41.2, 29.5, null],
];

export const copilotFeatureCooccurrenceMatrixRows = copilotFeatureCooccurrenceMatrix;

const copilotFeatureCooccurrenceData = copilotFeatureCooccurrenceMatrix.flatMap((row, y) =>
  row.map((value, x) => {
    if (value === null) return [x, y, 0] as const;
    return [x, y, value] as const;
  }),
);

export const copilotFeatureCooccurrenceOption: EChartsCoreOption = {
  grid: { left: 148, right: 16, top: 44, bottom: 18 },
  visualMap: {
    show: false,
    min: 0,
    max: 52.2,
    inRange: {
      color: ["#d2d6de", "#cdc7f0", "#c3bbec", "#b8afe8", "#b0a5e5"],
    },
  },
  tooltip: {
    trigger: "item",
    confine: true,
    appendToBody: true,
    formatter: (params: { value?: [number, number, number] | number[] }) => {
      const entry = params.value;
      if (!entry) return "";
      const [x, y, v] = entry;
      const xLabel = copilotFeatureCooccurrenceAxes[x] ?? "";
      const yLabel = copilotFeatureCooccurrenceAxes[y] ?? "";
      if (x === y) return `${yLabel} x ${xLabel}: N/A`;
      return `${yLabel} x ${xLabel}: ${v.toFixed(1)}%`;
    },
  },
  xAxis: {
    type: "category",
    data: [...copilotFeatureCooccurrenceAxes],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--foreground))", fontSize: 12 },
    splitArea: { show: false },
  },
  yAxis: {
    type: "category",
    data: [...copilotFeatureCooccurrenceAxes],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--foreground))", fontSize: 12 },
    splitArea: { show: false },
  },
  series: [
    {
      type: "heatmap",
      data: copilotFeatureCooccurrenceData,
      itemStyle: {
        borderColor: "#ffffff",
        borderWidth: 2,
        borderRadius: 8,
      },
      emphasis: {
        itemStyle: { borderColor: "#ffffff", borderRadius: 8, shadowBlur: 6, shadowColor: "rgba(67,56,202,0.25)" },
      },
      label: {
        show: true,
        fontSize: 14,
        formatter: (params: { value?: [number, number, number] | number[] }) => {
          const value = params.value?.[2] ?? 0;
          if (!Number.isFinite(value) || value <= 0) return "-";
          return `${value.toFixed(1)}%`;
        },
        color: "#4338ca",
      },
    },
  ],
};

export interface CopilotTopInteractionIntent {
  intent: string;
  volume: number;
  color: string;
}

export const copilotTopInteractionIntents: CopilotTopInteractionIntent[] = [
  { intent: "billing_inquiry", volume: 112, color: "#6a53c8" },
  { intent: "plan_upgrade", volume: 88, color: "#7561d0" },
  { intent: "technical_troubleshoot", volume: 85, color: "#9687d5" },
  { intent: "payment_issue", volume: 78, color: "#b3abdc" },
  { intent: "product_info", volume: 63, color: "#6a53c8" },
  { intent: "account_access", volume: 55, color: "#6752be" },
  { intent: "password_reset", volume: 53, color: "#7f69cf" },
  { intent: "order_status", volume: 47, color: "#6a53c8" },
  { intent: "pricing_question", volume: 37, color: "#5d49b4" },
  { intent: "cancel_service", volume: 27, color: "#c9c4de" },
];

export const copilotTopInteractionIntentsOption: EChartsCoreOption = {
  grid: { left: 182, right: 16, top: 8, bottom: 24 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "value",
    min: 0,
    max: 120,
    interval: 30,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--border))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "category",
    inverse: true,
    data: copilotTopInteractionIntents.map((entry) => entry.intent),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 12 },
  },
  series: [
    {
      type: "bar",
      barWidth: 16,
      data: copilotTopInteractionIntents.map((entry) => ({
        value: entry.volume,
        itemStyle: { color: entry.color, borderRadius: [0, 6, 6, 0] },
      })),
    },
  ],
};

export interface CopilotSessionRow {
  contact: string;
  channel: string;
  agent: string;
  skill: string;
  duration: string;
  handleTime: string;
  features: string;
  sentiment: "positive" | "neutral" | "mixed";
  disposition: string;
  rating: string;
}

const copilotSessionBaseRows: CopilotSessionRow[] = [
  {
    contact: "CNT-00852",
    channel: "Voice",
    agent: "Nicole Allen",
    skill: "General",
    duration: "29m 54s",
    handleTime: "28m 27s",
    features: "KB, Summary, Tasks, Sentiment",
    sentiment: "positive",
    disposition: "Resolved",
    rating: "-",
  },
  {
    contact: "CNT-01157",
    channel: "Voice",
    agent: "Mark Young",
    skill: "General",
    duration: "29m 8s",
    handleTime: "27m 25s",
    features: "KB, Summary, Tasks",
    sentiment: "positive",
    disposition: "Resolved",
    rating: "5/5",
  },
  {
    contact: "CNT-01993",
    channel: "Webchat",
    agent: "Rachel Clark",
    skill: "Retention",
    duration: "29m 29s",
    handleTime: "27m 12s",
    features: "KB, Summary, Sentiment",
    sentiment: "positive",
    disposition: "Resolved",
    rating: "2/5",
  },
  {
    contact: "CNT-00602",
    channel: "Voice",
    agent: "Emily Davis",
    skill: "Tech Support",
    duration: "27m 52s",
    handleTime: "27m 1s",
    features: "KB, Summary, Sentiment",
    sentiment: "positive",
    disposition: "Customer Satisfied",
    rating: "2/5",
  },
  {
    contact: "CNT-00557",
    channel: "Voice",
    agent: "Stephanie Walker",
    skill: "General",
    duration: "28m 36s",
    handleTime: "26m 58s",
    features: "KB, Summary, Tasks, Sentiment",
    sentiment: "neutral",
    disposition: "Follow-up Required",
    rating: "5/5",
  },
  {
    contact: "CNT-01387",
    channel: "Voice",
    agent: "Kevin Harris",
    skill: "Tech Support",
    duration: "29m 55s",
    handleTime: "26m 48s",
    features: "KB, Tasks, Sentiment",
    sentiment: "positive",
    disposition: "Customer Satisfied",
    rating: "5/5",
  },
  {
    contact: "CNT-01335",
    channel: "Webchat",
    agent: "Emily Davis",
    skill: "Tech Support",
    duration: "27m 27s",
    handleTime: "26m 36s",
    features: "KB, Summary, Tasks, Sentiment",
    sentiment: "mixed",
    disposition: "Follow-up Required",
    rating: "5/5",
  },
  {
    contact: "CNT-01739",
    channel: "WhatsApp",
    agent: "Christopher Lee",
    skill: "Sales",
    duration: "29m 25s",
    handleTime: "25m 38s",
    features: "Summary, Tasks, Sentiment",
    sentiment: "positive",
    disposition: "Customer Satisfied",
    rating: "-",
  },
  {
    contact: "CNT-01072",
    channel: "WhatsApp",
    agent: "Michael Chen",
    skill: "Billing",
    duration: "29m 55s",
    handleTime: "25m 36s",
    features: "Summary, Tasks, Sentiment",
    sentiment: "mixed",
    disposition: "Customer Satisfied",
    rating: "3/5",
  },
  {
    contact: "CNT-00489",
    channel: "Voice",
    agent: "David Brown",
    skill: "Billing",
    duration: "27m 2s",
    handleTime: "25m 33s",
    features: "KB, Summary, Tasks, Sentiment",
    sentiment: "neutral",
    disposition: "Resolved",
    rating: "4/5",
  },
];

export const copilotSessionRows: CopilotSessionRow[] = expandRowsForPagination(
  copilotSessionBaseRows,
  ({ baseRow, cycle, baseIndex, baseLength }) => {
    if (cycle === 0) return { ...baseRow };

    const duplicateOrdinal = (cycle - 1) * baseLength + baseIndex + 1;
    const durationOffsetMinutes = (duplicateOrdinal % 5) - 2;
    const handleTimeOffsetMinutes = (duplicateOrdinal % 4) - 1;

    return {
      ...baseRow,
      contact: mutateContactId(baseRow.contact, duplicateOrdinal),
      duration: shiftMinuteSecondDuration(baseRow.duration, durationOffsetMinutes, duplicateOrdinal % 17),
      handleTime: shiftMinuteSecondDuration(baseRow.handleTime, handleTimeOffsetMinutes, duplicateOrdinal % 11),
      rating: baseRow.rating === "-" && duplicateOrdinal % 3 === 0 ? "4/5" : baseRow.rating,
    };
  },
);

export const copilotSessionsDataTimestamp = "Data as of ~3:26 PM (~30 min delay)";

export const copilotSessionColumnOptions = [
  { id: "channel", label: "Channel" },
  { id: "agent", label: "Agent" },
  { id: "skill", label: "Skill" },
  { id: "duration", label: "Duration" },
  { id: "handleTime", label: "Handle Time" },
  { id: "features", label: "Features" },
  { id: "sentiment", label: "Sentiment" },
  { id: "disposition", label: "Disposition" },
  { id: "rating", label: "Rating" },
] as const;

export type CopilotSessionColumnId = (typeof copilotSessionColumnOptions)[number]["id"];
