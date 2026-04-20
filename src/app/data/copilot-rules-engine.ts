import type { EChartsCoreOption } from "echarts";
import {
  expandRowsForPagination,
  mutateContactId,
  shiftMinuteSecondDuration,
} from "./paginated-table-mocks";

export type CopilotRulesEngineKpiIcon = "fires" | "rules" | "completion";

export type CopilotRulesEngineKpi = {
  label: string;
  value: string;
  supportingText: string;
  detail: string;
  icon: CopilotRulesEngineKpiIcon;
};

export const copilotRulesEngineKpis: CopilotRulesEngineKpi[] = [
  {
    label: "Total Rule Fires",
    value: "88",
    supportingText: "Total Rule Fires",
    detail: "From MPower agent task trigger rules",
    icon: "fires",
  },
  {
    label: "Unique Rules",
    value: "20",
    supportingText: "Unique Rules",
    detail: "Distinct trigger rules observed",
    icon: "rules",
  },
  {
    label: "Avg Completion Rate",
    value: "57.4%",
    supportingText: "Avg Completion Rate",
    detail: "Across all trigger rules",
    icon: "completion",
  },
];

export const copilotRulesEngineSummaryParagraphs: string[] = [
  "Intent-Based KB Lookup and Data Prefetch Order have the highest effectiveness scores at 4.8 and 4.6 respectively. Billing Inquiry Router fires reliably at 15.6% rate with early timing (8s), agents receive help before they need it. KB Answer Lookup actions account for 33.8% of all rule actions, followed by Task Assist Cards at 23.3%.",
  "Custom Script Runner has the lowest effectiveness at 1.8/5 and latest timing (62 seconds), it fires too late to be useful. Coverage at 62.8% means 37.2% of interactions receive no rule-based assistance, with the largest gap in Retention skill. Recommend retiring Custom Script Runner and reallocating its compute to expand KB Lookup coverage.",
];

export const copilotRulesEngineRecommendedAction = {
  title: "Retire Custom Script Runner rule",
  description:
    "Custom Script Runner has the lowest effectiveness at 1.8/5 and fires 62 seconds into conversations, too late to be useful. Reallocating its compute budget to expand KB Lookup coverage could improve overall rule utility.",
  footerLinkLabel: "See all 4 actions",
};

export type RuleTriggerFrequencyRow = {
  rank: number;
  ruleName: string;
  fires: number;
  percentTotal: number;
  completionPct: number;
  avgDurationSec: number;
};

export const ruleTriggerFrequencyRows: RuleTriggerFrequencyRow[] = [
  { rank: 1, ruleName: "Rule-769", fires: 6, percentTotal: 0.6, completionPct: 33.3, avgDurationSec: 69.2 },
  { rank: 2, ruleName: "Rule-465", fires: 6, percentTotal: 0.6, completionPct: 50, avgDurationSec: 73 },
  { rank: 3, ruleName: "Rule-837", fires: 5, percentTotal: 0.5, completionPct: 20, avgDurationSec: 100.6 },
  { rank: 4, ruleName: "Rule-681", fires: 5, percentTotal: 0.5, completionPct: 40, avgDurationSec: 71.4 },
  { rank: 5, ruleName: "Rule-257", fires: 5, percentTotal: 0.5, completionPct: 60, avgDurationSec: 98.4 },
  { rank: 6, ruleName: "Rule-692", fires: 5, percentTotal: 0.5, completionPct: 20, avgDurationSec: 66.2 },
  { rank: 7, ruleName: "Rule-594", fires: 4, percentTotal: 0.4, completionPct: 100, avgDurationSec: 85 },
  { rank: 8, ruleName: "Rule-458", fires: 4, percentTotal: 0.4, completionPct: 75, avgDurationSec: 139.3 },
  { rank: 9, ruleName: "Rule-159", fires: 4, percentTotal: 0.4, completionPct: 75, avgDurationSec: 96.8 },
  { rank: 10, ruleName: "Rule-968", fires: 4, percentTotal: 0.4, completionPct: 25, avgDurationSec: 57.8 },
  { rank: 11, ruleName: "Rule-201", fires: 4, percentTotal: 0.4, completionPct: 50, avgDurationSec: 129.5 },
  { rank: 12, ruleName: "Rule-775", fires: 4, percentTotal: 0.4, completionPct: 25, avgDurationSec: 90.5 },
  { rank: 13, ruleName: "Rule-981", fires: 4, percentTotal: 0.4, completionPct: 75, avgDurationSec: 105 },
  { rank: 14, ruleName: "Rule-110", fires: 4, percentTotal: 0.4, completionPct: 25, avgDurationSec: 113.5 },
  { rank: 15, ruleName: "Rule-627", fires: 4, percentTotal: 0.4, completionPct: 75, avgDurationSec: 139 },
  { rank: 16, ruleName: "Rule-634", fires: 4, percentTotal: 0.4, completionPct: 75, avgDurationSec: 53.3 },
  { rank: 17, ruleName: "Rule-648", fires: 4, percentTotal: 0.4, completionPct: 75, avgDurationSec: 95.8 },
  { rank: 18, ruleName: "Rule-132", fires: 4, percentTotal: 0.4, completionPct: 75, avgDurationSec: 111 },
  { rank: 19, ruleName: "Rule-928", fires: 4, percentTotal: 0.4, completionPct: 75, avgDurationSec: 90.5 },
  { rank: 20, ruleName: "Rule-448", fires: 4, percentTotal: 0.4, completionPct: 100, avgDurationSec: 110.3 },
];

export type RuleEffectivenessRow = {
  ruleName: string;
  completed: number;
  dismissed: number;
  partial: number;
  expired: number;
};

export const ruleEffectivenessRows: RuleEffectivenessRow[] = [
  { ruleName: "Rule-769", completed: 2, dismissed: 0, partial: 2, expired: 2 },
  { ruleName: "Rule-465", completed: 3, dismissed: 2, partial: 0, expired: 1 },
  { ruleName: "Rule-837", completed: 1, dismissed: 1, partial: 1, expired: 2 },
  { ruleName: "Rule-681", completed: 2, dismissed: 1, partial: 2, expired: 0 },
  { ruleName: "Rule-257", completed: 3, dismissed: 1, partial: 0, expired: 1 },
  { ruleName: "Rule-692", completed: 1, dismissed: 2, partial: 2, expired: 0 },
  { ruleName: "Rule-594", completed: 4, dismissed: 0, partial: 0, expired: 0 },
  { ruleName: "Rule-458", completed: 3, dismissed: 0, partial: 1, expired: 0 },
  { ruleName: "Rule-159", completed: 3, dismissed: 0, partial: 1, expired: 0 },
  { ruleName: "Rule-968", completed: 1, dismissed: 2, partial: 1, expired: 0 },
  { ruleName: "Rule-201", completed: 2, dismissed: 1, partial: 0, expired: 1 },
  { ruleName: "Rule-775", completed: 1, dismissed: 3, partial: 0, expired: 0 },
  { ruleName: "Rule-981", completed: 3, dismissed: 1, partial: 0, expired: 0 },
  { ruleName: "Rule-110", completed: 1, dismissed: 0, partial: 2, expired: 1 },
  { ruleName: "Rule-627", completed: 3, dismissed: 1, partial: 0, expired: 0 },
];

export const ruleEffectivenessOption: EChartsCoreOption = {
  grid: { left: 112, right: 16, top: 10, bottom: 44 },
  legend: {
    bottom: 0,
    itemWidth: 12,
    itemHeight: 12,
    icon: "circle",
    textStyle: { color: "hsl(var(--muted-foreground))" },
  },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "value",
    min: 0,
    max: 8,
    interval: 2,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "category",
    inverse: true,
    data: ruleEffectivenessRows.map((row) => row.ruleName),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      name: "Completed",
      type: "bar",
      stack: "total",
      barWidth: 18,
      data: ruleEffectivenessRows.map((row) => row.completed),
      itemStyle: { color: "#288837" },
    },
    {
      name: "Dismissed",
      type: "bar",
      stack: "total",
      barWidth: 18,
      data: ruleEffectivenessRows.map((row) => row.dismissed),
      itemStyle: { color: "#ef2424" },
    },
    {
      name: "Partial",
      type: "bar",
      stack: "total",
      barWidth: 18,
      data: ruleEffectivenessRows.map((row) => row.partial),
      itemStyle: { color: "#f7b500" },
    },
    {
      name: "Expired",
      type: "bar",
      stack: "total",
      barWidth: 18,
      data: ruleEffectivenessRows.map((row) => row.expired),
      itemStyle: { color: "#9a9a9a" },
    },
  ],
};

export type RulesEngineSessionRow = {
  contact: string;
  channel: "Voice" | "Webchat" | "WhatsApp";
  agent: string;
  ruleFires: number;
  skill: string;
  duration: string;
  outcome: string;
  transferred: "Yes" | "No";
};

const rulesEngineSessionBaseRows: RulesEngineSessionRow[] = [
  { contact: "CNT-00852", channel: "Voice", agent: "Nicole Allen", ruleFires: 5, skill: "General", duration: "29m 54s", outcome: "Resolved", transferred: "No" },
  { contact: "CNT-00989", channel: "Voice", agent: "Andrew Lewis", ruleFires: 5, skill: "Retention", duration: "1m 24s", outcome: "Pending", transferred: "No" },
  { contact: "CNT-00597", channel: "Webchat", agent: "Lisa White", ruleFires: 5, skill: "Retention", duration: "23m 3s", outcome: "Closed - No Action", transferred: "No" },
  { contact: "CNT-01199", channel: "Voice", agent: "Robert Anderson", ruleFires: 5, skill: "Tech Support", duration: "7m 58s", outcome: "Closed - No Action", transferred: "No" },
  { contact: "CNT-01604", channel: "Voice", agent: "Sarah Johnson", ruleFires: 5, skill: "Billing", duration: "1m 16s", outcome: "Customer Satisfied", transferred: "No" },
  { contact: "CNT-00024", channel: "Webchat", agent: "David Brown", ruleFires: 5, skill: "Billing", duration: "21m 0s", outcome: "Follow-up Required", transferred: "Yes" },
  { contact: "CNT-00815", channel: "Voice", agent: "Stephanie Walker", ruleFires: 5, skill: "General", duration: "6m 56s", outcome: "Pending", transferred: "No" },
  { contact: "CNT-01871", channel: "Voice", agent: "Robert Anderson", ruleFires: 5, skill: "Tech Support", duration: "23m 42s", outcome: "Follow-up Required", transferred: "No" },
  { contact: "CNT-00386", channel: "Voice", agent: "Daniel Jackson", ruleFires: 5, skill: "Sales", duration: "5m 23s", outcome: "Customer Satisfied", transferred: "No" },
  { contact: "CNT-01776", channel: "WhatsApp", agent: "Daniel Jackson", ruleFires: 5, skill: "Sales", duration: "9m 30s", outcome: "Follow-up Required", transferred: "Yes" },
];

export const rulesEngineSessionRows: RulesEngineSessionRow[] = expandRowsForPagination(
  rulesEngineSessionBaseRows,
  ({ baseRow, cycle, baseIndex, baseLength }) => {
    if (cycle === 0) return { ...baseRow };

    const duplicateOrdinal = (cycle - 1) * baseLength + baseIndex + 1;
    const nextRuleFires = Math.max(2, Math.min(9, baseRow.ruleFires + ((duplicateOrdinal % 5) - 2)));

    return {
      ...baseRow,
      contact: mutateContactId(baseRow.contact, duplicateOrdinal),
      duration: shiftMinuteSecondDuration(baseRow.duration, (duplicateOrdinal % 7) - 3, duplicateOrdinal % 23),
      ruleFires: nextRuleFires,
      transferred: duplicateOrdinal % 4 === 0 ? "Yes" : baseRow.transferred,
    };
  },
);

export const rulesEngineSessionColumns = [
  { id: "agent", label: "Agent" },
  { id: "channel", label: "Channel" },
  { id: "ruleFires", label: "Rule Fires" },
  { id: "skill", label: "Skill" },
  { id: "duration", label: "Duration" },
  { id: "outcome", label: "Outcome" },
  { id: "transferred", label: "Transferred" },
] as const;

export type RulesEngineSessionColumnId = (typeof rulesEngineSessionColumns)[number]["id"];

export const rulesEngineSessionsDataTimestamp = "Data as of ~3:26 PM (~30 min delay)";
