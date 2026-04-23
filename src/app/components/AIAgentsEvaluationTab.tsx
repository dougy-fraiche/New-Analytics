import type { EChartsCoreOption } from "echarts";
import { useCallback, useState } from "react";
import {
  AlertTriangle,
  Check,
  Columns3,
  Download,
  Frown,
  Info,
  CircleGauge,
  Meh,
  MessageSquare,
  Search,
  Smile,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Alert, AlertDescription } from "./ui/alert";
import { EChartsCanvas, type ChartDataSelectInfo } from "./EChartsCanvas";
import { CopilotSessionTranscriptDialog } from "./CopilotSessionTranscriptDialog";
import { TableAgentCell } from "./TableAgentCell";
import { TableBadge } from "./TableBadge";
import { TableChannelCell } from "./TableChannelCell";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import type { ChartType } from "./ChartVariants";
import { fromAIAgentsEvaluationSessionRow } from "../data/ai-agent-session-transcript";
import { aiAgentEvaluationKpis } from "../data/ai-agent-kpis";
import type { CopilotTranscriptSessionContext } from "../data/copilot-session-transcript";

const weekLabels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];

const C = {
  green: "#189E56",
  red: "rgba(229, 57, 53, 0.85)",
  contained: "rgba(85, 108, 214, 0.9)",
  escalated: "rgba(231, 84, 168, 0.9)",
  mutedTrack: "rgba(148, 163, 184, 0.35)",
};

type TrendLegendItem = { label: string; color: string };

/**
 * Legend swatches from Figma (AI Agent — For development): alpha-70 / alpha-100 tokens,
 * label typography Geist Regular text-xs, P900 #2a1b66.
 */
const COMBO_TREND_LEGENDS = {
  Sentiment: [
    { label: "Positive", color: "rgba(24, 158, 86, 0.7)" },
    { label: "Neutral", color: "#27caff" },
    { label: "Negative", color: "rgba(229, 57, 53, 0.7)" },
  ],
  Containment: [
    { label: "Contained", color: "rgba(85, 108, 214, 0.7)" },
    { label: "Escalated", color: "rgba(231, 84, 168, 0.7)" },
  ],
  Success: [
    { label: "Success", color: "rgba(24, 158, 86, 0.7)" },
    { label: "Fail", color: "rgba(229, 57, 53, 0.7)" },
  ],
  "Brand Alignment": [
    { label: "Aligned", color: "rgba(24, 158, 86, 0.7)" },
    { label: "Partially Aligned", color: "#27caff" },
    { label: "Misaligned", color: "rgba(229, 57, 53, 0.7)" },
  ],
} as const satisfies Record<string, readonly TrendLegendItem[]>;

const COMPLIANCE_TREND_LEGEND = [
  { label: "Compliant", color: "rgba(24, 158, 86, 0.7)" },
  { label: "Non-Compliant", color: "#27caff" },
  { label: "Not Applicable", color: "rgba(0, 0, 0, 0.3)" },
] as const satisfies readonly TrendLegendItem[];

const KNOWLEDGE_TOOL_GAP_LEGEND = [
  { label: "No Gap", color: "rgba(39, 202, 255, 0.7)" },
  { label: "Knowledge Gap", color: "rgba(85, 108, 214, 0.7)" },
  { label: "Tool Gap", color: "rgba(231, 84, 168, 0.7)" },
  { label: "Both", color: "rgba(26, 200, 168, 0.7)" },
] as const satisfies readonly TrendLegendItem[];

/** Figma node 1:40716 — four-part breakdown + center KPI. */
const knowledgeToolGapDonutOption: EChartsCoreOption = {
  animation: true,
  series: [
    {
      type: "pie",
      radius: ["58%", "78%"],
      center: ["50%", "50%"],
      avoidLabelOverlap: false,
      itemStyle: { borderWidth: 0 },
      label: { show: false },
      emphasis: { scale: false },
      data: [
        { value: 62, name: "No Gap", itemStyle: { color: "rgba(39, 202, 255, 0.92)" } },
        { value: 18, name: "Knowledge Gap", itemStyle: { color: "#556cd6" } },
        { value: 12, name: "Tool Gap", itemStyle: { color: "#e754a8" } },
        { value: 8, name: "Both", itemStyle: { color: "#1ac8a8" } },
      ],
    },
  ],
  graphic: [
    {
      type: "text",
      left: "center",
      top: "40%",
      style: {
        text: "62%",
        fontSize: 22,
        fontWeight: 600,
        fill: "hsl(var(--muted-foreground))",
      },
    },
    {
      type: "text",
      left: "center",
      top: "56%",
      style: {
        text: "No Gap",
        fontSize: 12,
        fill: "hsl(var(--muted-foreground))",
      },
    },
  ],
};

const knowledgeGapCorrelationRows = [
  { fillPct: 71, label: "71% escalated", barColor: "#556cd6" as const },
  { fillPct: 84, label: "84% escalated", barColor: "#e754a8" as const },
  { fillPct: 93, label: "93% escalated", barColor: "#1ac8a8" as const },
];

type TopicSuccessTone = "warn" | "risk" | "good";

type EvaluationTopicRow = {
  topic: string;
  subtopic: string;
  convos: number;
  successPct: number;
  successTone: TopicSuccessTone;
  sharePct: number;
};

/** Figma node 1:40609 — Topic performance table (sample rows). */
const evaluationTopicRows: EvaluationTopicRow[] = [
  { topic: "Billing", subtopic: "Payments › Refund", convos: 680, successPct: 71, successTone: "warn", sharePct: 24 },
  { topic: "Technical Support", subtopic: "Connectivity › Login Issues", convos: 541, successPct: 58, successTone: "risk", sharePct: 19 },
  { topic: "Account Mgmt", subtopic: "Profile › Settings", convos: 427, successPct: 74, successTone: "warn", sharePct: 15 },
  { topic: "Product Info", subtopic: "Pricing › Plans", convos: 342, successPct: 82, successTone: "good", sharePct: 12 },
  { topic: "Shipping", subtopic: "Orders › Tracking", convos: 285, successPct: 69, successTone: "warn", sharePct: 10 },
  { topic: "Returns & Refunds", subtopic: "Returns › Process", convos: 228, successPct: 65, successTone: "warn", sharePct: 8 },
  { topic: "Onboarding", subtopic: "Setup › Configuration", convos: 171, successPct: 88, successTone: "good", sharePct: 6 },
  { topic: "Complaints", subtopic: "Service › General", convos: 114, successPct: 42, successTone: "risk", sharePct: 4 },
];

function getTrendDirection(value: string): "up" | "down" | "neutral" {
  const normalized = value.trim();
  if (normalized.startsWith("+")) return "up";
  if (normalized.startsWith("-") || normalized.startsWith("−")) return "down";
  return "neutral";
}

function buildDonutGaugeOption(params: {
  percent: number;
  centerValue: string;
  centerLabel: string;
  mainColor: string;
}): EChartsCoreOption {
  const rest = Math.max(0, 100 - params.percent);
  return {
    animation: true,
    series: [
      {
        type: "pie",
        radius: ["58%", "78%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: { borderWidth: 0 },
        label: { show: false },
        emphasis: { scale: false },
        data: [
          { value: params.percent, name: params.centerLabel, itemStyle: { color: params.mainColor } },
          { value: rest, name: "Other", itemStyle: { color: C.mutedTrack } },
        ],
      },
    ],
    graphic: [
      {
        type: "text",
        left: "center",
        top: "40%",
        style: {
          text: params.centerValue,
          fontSize: 22,
          fontWeight: 600,
          fill: "hsl(var(--muted-foreground))",
        },
      },
      {
        type: "text",
        left: "center",
        top: "56%",
        style: {
          text: params.centerLabel,
          fontSize: 12,
          fill: "hsl(var(--muted-foreground))",
        },
      },
    ],
  };
}

function axisStyles(): Pick<EChartsCoreOption, "xAxis" | "yAxis"> {
  return {
    xAxis: {
      type: "category",
      data: weekLabels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
      axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10, formatter: "{value}%" },
    },
  };
}

const sentimentDonut = buildDonutGaugeOption({
  percent: 58,
  centerValue: "58%",
  centerLabel: "Good",
  mainColor: C.green,
});

const sentimentTrend: EChartsCoreOption = {
  ...axisStyles(),
  grid: { left: 36, right: 8, top: 8, bottom: 12 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  legend: { show: false },
  series: [
    {
      name: "Positive",
      type: "line",
      smooth: 0.35,
      stack: "sent",
      symbol: "none",
      lineStyle: { width: 0 },
      areaStyle: { color: "rgba(24, 158, 86, 0.35)" },
      data: [54, 56, 55, 58, 57, 59, 58],
    },
    {
      name: "Neutral",
      type: "line",
      smooth: 0.35,
      stack: "sent",
      symbol: "none",
      lineStyle: { width: 0 },
      areaStyle: { color: "rgba(39, 202, 255, 0.28)" },
      data: [30, 28, 29, 28, 29, 27, 28],
    },
    {
      name: "Negative",
      type: "line",
      smooth: 0.35,
      stack: "sent",
      symbol: "none",
      lineStyle: { width: 0 },
      areaStyle: { color: "rgba(229, 57, 53, 0.25)" },
      data: [16, 16, 16, 14, 14, 14, 14],
    },
  ],
};

const containmentDonut = buildDonutGaugeOption({
  percent: 73,
  centerValue: "73%",
  centerLabel: "Contained",
  mainColor: C.contained,
});

const containmentTrend: EChartsCoreOption = {
  ...axisStyles(),
  grid: { left: 36, right: 8, top: 8, bottom: 12 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  legend: { show: false },
  series: [
    {
      name: "Contained",
      type: "line",
      smooth: 0.35,
      symbol: "none",
      lineStyle: { width: 2, color: C.contained },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(85, 108, 214, 0.3)" },
            { offset: 1, color: "rgba(85, 108, 214, 0.02)" },
          ],
        },
      },
      data: [68, 70, 71, 72, 73, 72, 73],
    },
    {
      name: "Escalated",
      type: "line",
      smooth: 0.35,
      symbol: "none",
      lineStyle: { width: 2, color: C.escalated },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(231, 84, 168, 0.28)" },
            { offset: 1, color: "rgba(231, 84, 168, 0.02)" },
          ],
        },
      },
      data: [22, 21, 20, 19, 19, 20, 19],
    },
  ],
};

const successDonut = buildDonutGaugeOption({
  percent: 68,
  centerValue: "68%",
  centerLabel: "Success",
  mainColor: C.green,
});

const successTrend: EChartsCoreOption = {
  ...axisStyles(),
  grid: { left: 36, right: 8, top: 8, bottom: 12 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  legend: { show: false },
  series: [
    {
      name: "Success",
      type: "line",
      smooth: 0.35,
      symbol: "none",
      lineStyle: { width: 2, color: C.green },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(24, 158, 86, 0.35)" },
            { offset: 1, color: "rgba(24, 158, 86, 0.02)" },
          ],
        },
      },
      data: [64, 65, 66, 67, 67, 68, 68],
    },
    {
      name: "Fail",
      type: "line",
      smooth: 0.35,
      symbol: "none",
      lineStyle: { width: 2, color: C.red },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(229, 57, 53, 0.22)" },
            { offset: 1, color: "rgba(229, 57, 53, 0.02)" },
          ],
        },
      },
      data: [28, 27, 27, 26, 26, 25, 25],
    },
  ],
};

const brandDonut = buildDonutGaugeOption({
  percent: 71,
  centerValue: "71%",
  centerLabel: "Aligned",
  mainColor: C.green,
});

const brandTrend: EChartsCoreOption = {
  ...axisStyles(),
  grid: { left: 36, right: 8, top: 8, bottom: 12 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  legend: { show: false },
  series: [
    {
      name: "Aligned",
      type: "line",
      smooth: 0.35,
      stack: "brand",
      symbol: "none",
      lineStyle: { width: 0 },
      areaStyle: { color: "rgba(24, 158, 86, 0.35)" },
      data: [68, 69, 70, 70, 71, 71, 71],
    },
    {
      name: "Partially Aligned",
      type: "line",
      smooth: 0.35,
      stack: "brand",
      symbol: "none",
      lineStyle: { width: 0 },
      areaStyle: { color: "rgba(39, 202, 255, 0.28)" },
      data: [22, 21, 21, 20, 19, 19, 19],
    },
    {
      name: "Misaligned",
      type: "line",
      smooth: 0.35,
      stack: "brand",
      symbol: "none",
      lineStyle: { width: 0 },
      areaStyle: { color: "rgba(229, 57, 53, 0.22)" },
      data: [10, 10, 9, 10, 10, 10, 10],
    },
  ],
};

const complianceDonut = buildDonutGaugeOption({
  percent: 89,
  centerValue: "89%",
  centerLabel: "Compliant",
  mainColor: C.green,
});

const complianceTrend: EChartsCoreOption = {
  ...axisStyles(),
  grid: { left: 36, right: 8, top: 8, bottom: 12 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  legend: { show: false },
  series: [
    {
      name: "Compliant",
      type: "line",
      smooth: 0.35,
      stack: "comp",
      symbol: "none",
      lineStyle: { width: 0 },
      areaStyle: { color: "rgba(24, 158, 86, 0.35)" },
      data: [86, 87, 87, 88, 88, 89, 89],
    },
    {
      name: "Non-Compliant",
      type: "line",
      smooth: 0.35,
      stack: "comp",
      symbol: "none",
      lineStyle: { width: 0 },
      areaStyle: { color: "rgba(39, 202, 255, 0.3)" },
      data: [8, 8, 8, 7, 7, 6, 6],
    },
    {
      name: "Not Applicable",
      type: "line",
      smooth: 0.35,
      stack: "comp",
      symbol: "none",
      lineStyle: { width: 0 },
      areaStyle: { color: "rgba(0, 0, 0, 0.18)" },
      data: [6, 5, 5, 5, 5, 5, 5],
    },
  ],
};

const handoverReasonOption: EChartsCoreOption = {
  grid: { left: 128, right: 16, top: 8, bottom: 16 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  legend: { show: false },
  xAxis: {
    type: "value",
    max: 520,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
  },
  yAxis: {
    type: "category",
    data: ["Complex Issue", "User Request", "Technical Failure", "Compliance Req.", "Not Applicable"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
  },
  series: [
    { name: "W1", type: "bar", stack: "h", barWidth: 14, data: [98, 82, 44, 22, 12], itemStyle: { color: "#6E56CF" } },
    { name: "W2", type: "bar", stack: "h", barWidth: 14, data: [92, 78, 40, 18, 10], itemStyle: { color: "#7960D9" } },
    { name: "W3", type: "bar", stack: "h", barWidth: 14, data: [88, 74, 42, 16, 9], itemStyle: { color: "#8670E0" } },
    { name: "W4", type: "bar", stack: "h", barWidth: 14, data: [86, 70, 38, 14, 8], itemStyle: { color: "#9583E6" } },
    { name: "W5", type: "bar", stack: "h", barWidth: 14, data: [92, 80, 36, 12, 6], itemStyle: { color: "#C8BFF0" } },
  ],
};

/** Figma node 1:39182 — Sessions to Investigate grid (sample rows). */
type InvestigateChannel = "webchat" | "voice" | "whatsapp" | "messenger";
type InvestigateSentiment = "positive" | "neutral" | "negative";
type InvestigateContainment = "contained" | "escalated";
type InvestigateCompliance = "compliant" | "non_compliant" | "na";
type InvestigateConfidence = "high" | "medium";

type SessionToInvestigateRow = {
  conversationId: string;
  timestamp: string;
  channel: InvestigateChannel;
  agent: string;
  sentiment: InvestigateSentiment;
  containment: InvestigateContainment;
  successful: boolean;
  compliance: InvestigateCompliance;
  avgConfidence: InvestigateConfidence;
};

const sessionsToInvestigate: SessionToInvestigateRow[] = [
  {
    conversationId: "EVAL-3841-A2F1",
    timestamp: "2026-03-22 09:14",
    channel: "webchat",
    agent: "Agent-Aria",
    sentiment: "positive",
    containment: "contained",
    successful: true,
    compliance: "compliant",
    avgConfidence: "high",
  },
  {
    conversationId: "EVAL-3840-B8C3",
    timestamp: "2026-03-22 10:02",
    channel: "voice",
    agent: "Agent-Orion",
    sentiment: "negative",
    containment: "escalated",
    successful: false,
    compliance: "compliant",
    avgConfidence: "high",
  },
  {
    conversationId: "EVAL-3839-C4D7",
    timestamp: "2026-03-22 11:33",
    channel: "whatsapp",
    agent: "Agent-Nova",
    sentiment: "neutral",
    containment: "contained",
    successful: true,
    compliance: "na",
    avgConfidence: "high",
  },
  {
    conversationId: "EVAL-3838-D1E9",
    timestamp: "2026-03-22 12:08",
    channel: "voice",
    agent: "Agent-Aria",
    sentiment: "negative",
    containment: "escalated",
    successful: false,
    compliance: "compliant",
    avgConfidence: "high",
  },
  {
    conversationId: "EVAL-3837-E5F2",
    timestamp: "2026-03-22 13:47",
    channel: "messenger",
    agent: "Agent-Nova",
    sentiment: "negative",
    containment: "escalated",
    successful: false,
    compliance: "non_compliant",
    avgConfidence: "medium",
  },
];

const EVALUATION_SESSIONS_TOGGLEABLE_COLUMNS = [
  { id: "timestamp", label: "Timestamp" },
  { id: "agent", label: "Agent" },
  { id: "channel", label: "Channel" },
  { id: "sentiment", label: "Sentiment" },
  { id: "containment", label: "Containment" },
  { id: "successful", label: "Successful" },
  { id: "compliance", label: "Compliance" },
  { id: "avgConfidence", label: "Avg Conf." },
] as const;

type EvaluationSessionsToggleableColumnId = (typeof EVALUATION_SESSIONS_TOGGLEABLE_COLUMNS)[number]["id"];

function SessionsInvestigateChannelCell({ channel }: { channel: InvestigateChannel }) {
  return <TableChannelCell channel={channel} />;
}

function SessionsInvestigateSentimentPill({ sentiment }: { sentiment: InvestigateSentiment }) {
  const cfg =
    sentiment === "positive"
      ? {
          Icon: Smile,
          label: "Positive",
          cls: "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
        }
      : sentiment === "neutral"
        ? {
            Icon: Meh,
            label: "Neutral",
            cls: "border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-200",
          }
        : {
            Icon: Frown,
            label: "Negative",
            cls: "border-red-500/35 bg-red-500/10 text-red-800 dark:text-red-300",
          };
  const { Icon, label, cls } = cfg;
  return (
    <TableBadge variant="outline" className={`min-w-0 max-w-full justify-start font-normal ${cls}`}>
      <Icon className="shrink-0" aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </TableBadge>
  );
}

function SessionsInvestigateContainmentPill({ containment }: { containment: InvestigateContainment }) {
  const ok = containment === "contained";
  return (
    <TableBadge
      variant="outline"
      className={
        ok
          ? "min-w-0 max-w-full font-normal border-[rgba(85,108,214,0.4)] bg-[rgba(85,108,214,0.1)] text-[#556cd6]"
          : "min-w-0 max-w-full font-normal border-[rgba(231,84,168,0.45)] bg-[rgba(231,84,168,0.1)] text-[#b7337a]"
      }
    >
      <span className="min-w-0 truncate">{ok ? "Contained" : "Escalated"}</span>
    </TableBadge>
  );
}

function SessionsInvestigateCompliancePill({ compliance }: { compliance: InvestigateCompliance }) {
  const cls =
    compliance === "compliant"
      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
      : compliance === "non_compliant"
        ? "border-sky-400/40 bg-sky-400/15 text-sky-900 dark:text-sky-200"
        : "border-border bg-muted/60 text-muted-foreground";
  const label = compliance === "compliant" ? "Compliant" : compliance === "non_compliant" ? "Non-Compliant" : "N/A";
  return (
    <TableBadge variant="outline" className={`min-w-0 max-w-full font-normal ${cls}`}>
      <span className="min-w-0 truncate">{label}</span>
    </TableBadge>
  );
}

function SessionsInvestigateConfidencePill({ avgConfidence }: { avgConfidence: InvestigateConfidence }) {
  const high = avgConfidence === "high";
  return (
    <TableBadge
      variant="outline"
      className={
        high
          ? "min-w-0 max-w-full font-normal border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          : "min-w-0 max-w-full font-normal border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-200"
      }
    >
      <span className="min-w-0 truncate">{high ? "High" : "Medium"}</span>
    </TableBadge>
  );
}

function SessionsInvestigateSuccessIcon({ successful }: { successful: boolean }) {
  return successful ? (
    <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-label="Successful" />
  ) : (
    <X className="size-4 text-red-600 dark:text-red-400" aria-label="Not successful" />
  );
}

/** Figma legend-group: horizontal row, gap 16px, px 16px, 8px dots, Geist Regular text-xs / P900. */
function EvaluationTrendLegend({ items }: { items: readonly TrendLegendItem[] }) {
  return (
    <ul
      className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2"
      aria-label="Chart legend"
    >
      {items.map((item) => (
        <li key={item.label} className="flex h-6 items-center gap-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: item.color }}
            aria-hidden
          />
          <span className="whitespace-nowrap text-xs font-normal leading-4 tracking-[0.06px] text-[#2a1b66] dark:text-foreground">
            {item.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TopicSuccessBadge({ pct, tone }: { pct: number; tone: TopicSuccessTone }) {
  const cls =
    tone === "good"
      ? "bg-[#bff4ec] text-[#008070]"
      : tone === "risk"
        ? "bg-[#fbe6f2] text-[#b7337a]"
        : "bg-[#ffedbf] text-[#a37a00]";
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs tracking-[0.06px] ${cls}`}
    >
      {pct}%
    </span>
  );
}

function TopicShareBar({ pct }: { pct: number }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <div className="h-2 min-w-0 flex-1 rounded-full bg-[#f2f0fa]">
        <div className="h-2 max-w-full rounded-l-full bg-[#6e56cf]" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-[10px] tabular-nums tracking-[0.1px] text-[#1f2937]">
        {pct}%
      </span>
    </div>
  );
}

function EvaluationComboCard({
  panelIndex,
  title,
  chartType,
  donutOption,
  trendOption,
  trendLegendItems,
  openAskPanelIndex,
  onOpenAskChange,
  selectedKpiLabel,
  anchorPoint,
  onDataSelect,
  showOverflowMenu,
}: {
  panelIndex: number;
  title: string;
  chartType: ChartType;
  donutOption: EChartsCoreOption;
  trendOption: EChartsCoreOption;
  trendLegendItems: readonly TrendLegendItem[];
  openAskPanelIndex: number | null;
  onOpenAskChange: (open: boolean) => void;
  selectedKpiLabel: string | null;
  anchorPoint: { x: number; y: number } | null;
  onDataSelect: (info: ChartDataSelectInfo) => void;
  showOverflowMenu: boolean;
}) {
  return (
    <Card className="h-full group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="flex-1 text-base">{title}</CardTitle>
          <WidgetAskAIAndOverflow
            widgetTitle={title}
            chartType={chartType}
            showOverflowMenu={showOverflowMenu}
            open={openAskPanelIndex === panelIndex}
            onOpenChange={onOpenAskChange}
            selectedKpiLabel={openAskPanelIndex === panelIndex ? selectedKpiLabel : null}
            anchorPoint={openAskPanelIndex === panelIndex ? anchorPoint : null}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col items-stretch gap-4 md:flex-row">
          <div className="mx-auto h-[200px] w-[200px] shrink-0 md:mx-0">
            <EChartsCanvas option={donutOption} onDataSelect={onDataSelect} />
          </div>
          <div className="h-[220px] min-w-0 flex-1">
            <EChartsCanvas option={trendOption} onDataSelect={onDataSelect} />
          </div>
        </div>
        <nav className="flex w-full justify-center px-4" aria-label={`${title} legend`}>
          <EvaluationTrendLegend items={trendLegendItems} />
        </nav>
        </CardContent>
        <CardFooter className="mt-auto pt-4">
          <WidgetAIExplanation widgetTitle={title} chartType={chartType} />
        </CardFooter>
    </Card>
  );
}

export function AIAgentsEvaluationTab({
  isCompactDashboard,
  showWidgetOverflowMenu = true,
}: {
  isCompactDashboard: boolean;
  showWidgetOverflowMenu?: boolean;
}) {
  const [openAskPanelIndex, setOpenAskPanelIndex] = useState<number | null>(null);
  const [selectedKpiLabel, setSelectedKpiLabel] = useState<string | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [selectedSession, setSelectedSession] = useState<CopilotTranscriptSessionContext | null>(null);
  const [evaluationSessionsColumnVisibility, setEvaluationSessionsColumnVisibility] = useState<
    Record<EvaluationSessionsToggleableColumnId, boolean>
  >(
    () =>
      Object.fromEntries(EVALUATION_SESSIONS_TOGGLEABLE_COLUMNS.map((c) => [c.id, true])) as Record<
        EvaluationSessionsToggleableColumnId,
        boolean
      >,
  );

  const handleOpenAskChange = useCallback((panelIndex: number, open: boolean) => {
    if (open) {
      setOpenAskPanelIndex(panelIndex);
      setAnchorPoint(null);
      setSelectedKpiLabel(null);
    } else {
      setOpenAskPanelIndex(null);
      setAnchorPoint(null);
      setSelectedKpiLabel(null);
    }
  }, []);

  const handleChartDataSelect = useCallback((panelIndex: number) => {
    return (info: ChartDataSelectInfo) => {
      setSelectedKpiLabel(
        [info.name, info.seriesName, info.value].map(String).find((s) => s && s !== "undefined") ?? "Selected",
      );
      if (typeof info.clientX === "number" && typeof info.clientY === "number") {
        setAnchorPoint({ x: info.clientX, y: info.clientY });
      } else {
        setAnchorPoint(null);
      }
      setOpenAskPanelIndex(panelIndex);
    };
  }, []);

  const comboPanels: Array<{
    title: string;
    chartType: ChartType;
    donut: EChartsCoreOption;
    trend: EChartsCoreOption;
    trendLegendItems: readonly TrendLegendItem[];
  }> = [
    {
      title: "Sentiment",
      chartType: "donut",
      donut: sentimentDonut,
      trend: sentimentTrend,
      trendLegendItems: COMBO_TREND_LEGENDS.Sentiment,
    },
    {
      title: "Containment",
      chartType: "donut",
      donut: containmentDonut,
      trend: containmentTrend,
      trendLegendItems: COMBO_TREND_LEGENDS.Containment,
    },
    {
      title: "Success",
      chartType: "donut",
      donut: successDonut,
      trend: successTrend,
      trendLegendItems: COMBO_TREND_LEGENDS.Success,
    },
    {
      title: "Brand Alignment",
      chartType: "donut",
      donut: brandDonut,
      trend: brandTrend,
      trendLegendItems: COMBO_TREND_LEGENDS["Brand Alignment"],
    },
  ];

  const compliancePanelIndex = 4;
  const handoverPanelIndex = 5;
  const topicPanelIndex = 6;
  const knowledgeToolGapPanelIndex = 7;
  const tablePanelIndex = 8;

  return (
    <div className="space-y-4">
      <h3 className="mt-8 flex items-center gap-2 tracking-tight">
        <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Key Performance Indicators
      </h3>

      <div
        className={`grid gap-4 ${
          isCompactDashboard
            ? "grid-cols-1"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        }`}
      >
        {aiAgentEvaluationKpis.map((kpi) => (
          (() => {
            const direction = getTrendDirection(kpi.badge);
            const TrendIcon = direction === "up" ? TrendingUp : TrendingDown;
            const badgeToneClass =
              direction === "up"
                ? "border-transparent bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white"
                : "border-transparent bg-red-600 text-white dark:bg-red-600 dark:text-white";

            return (
          <Card
            key={kpi.label}
            className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30"
          >
            <CardHeader className="pb-0">
              <div className="flex items-center gap-2">
                <CardDescription className="flex-1">{kpi.label}</CardDescription>
                <WidgetAskAIAndOverflow
                  widgetTitle={kpi.label}
                  chartType="metric"
                  showOverflowMenu={showWidgetOverflowMenu}
                />
              </div>
              <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                <KpiMetricValueTitle value={kpi.value} />
                <Badge variant="secondary" className={`shrink-0 text-xs ${badgeToneClass}`}>
                  <span className="inline-flex items-center gap-1">
                    <TrendIcon className="h-3 w-3" />
                    {kpi.badge}
                  </span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <p className="text-xs text-muted-foreground">{kpi.caption}</p>
            </CardContent>
          </Card>
            );
          })()
        ))}
      </div>

      <div className={`grid gap-4 ${isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
        {comboPanels.map((panel, i) => (
          <EvaluationComboCard
            key={panel.title}
            panelIndex={i}
            title={panel.title}
            chartType={panel.chartType}
            donutOption={panel.donut}
            trendOption={panel.trend}
            trendLegendItems={panel.trendLegendItems}
            openAskPanelIndex={openAskPanelIndex}
            onOpenAskChange={(open) => handleOpenAskChange(i, open)}
            selectedKpiLabel={selectedKpiLabel}
            anchorPoint={anchorPoint}
            onDataSelect={handleChartDataSelect(i)}
            showOverflowMenu={showWidgetOverflowMenu}
          />
        ))}
      </div>

      <div className={`grid gap-4 ${isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
        <Card className="h-full group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1 text-base">Compliance</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Compliance"
                chartType="donut"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === compliancePanelIndex}
                onOpenChange={(open) => handleOpenAskChange(compliancePanelIndex, open)}
                selectedKpiLabel={openAskPanelIndex === compliancePanelIndex ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === compliancePanelIndex ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="border-amber-500/70 bg-amber-50 text-amber-950 dark:border-amber-500/50 dark:bg-amber-950/25 dark:text-amber-100">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-xs text-muted-foreground sm:text-sm">
                114 non-compliant conversations - SLA breaches in billing dispute flows.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-stretch gap-4 md:flex-row">
                <div className="mx-auto h-[200px] w-[200px] shrink-0 md:mx-0">
                  <EChartsCanvas option={complianceDonut} onDataSelect={handleChartDataSelect(compliancePanelIndex)} />
                </div>
                <div className="h-[220px] min-w-0 flex-1">
                  <EChartsCanvas option={complianceTrend} onDataSelect={handleChartDataSelect(compliancePanelIndex)} />
                </div>
              </div>
              <nav className="flex w-full justify-center px-4" aria-label="Compliance legend">
                <EvaluationTrendLegend items={COMPLIANCE_TREND_LEGEND} />
              </nav>
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Compliance" chartType="donut" />
            </CardFooter>
        </Card>

        <Card className="h-full group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="min-w-0 flex-1 text-base">Handover Reason</CardTitle>
              <span className="text-xs text-muted-foreground sm:text-sm">769 escalated</span>
              <WidgetAskAIAndOverflow
                widgetTitle="Handover Reason"
                chartType="bar-horizontal"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === handoverPanelIndex}
                onOpenChange={(open) => handleOpenAskChange(handoverPanelIndex, open)}
                selectedKpiLabel={openAskPanelIndex === handoverPanelIndex ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === handoverPanelIndex ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert className="border-primary/20 bg-primary/5 py-3">
              <Info className="size-4 shrink-0 text-primary" />
              <AlertDescription className="text-xs text-muted-foreground sm:text-sm">
                <span className="font-normal text-primary">530 potentially avoidable</span>
                <span> — complex issues and user requests may be automatable</span>
              </AlertDescription>
            </Alert>
            <div className="h-[280px] w-full">
              <EChartsCanvas option={handoverReasonOption} onDataSelect={handleChartDataSelect(handoverPanelIndex)} />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Handover Reason" chartType="bar-horizontal" />
            </CardFooter>
        </Card>
      </div>

      <div
        className={`grid items-start gap-4 ${
          isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"
        }`}
      >
        <Card className="group/widget min-w-0 overflow-hidden transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="min-w-0 flex-1 text-base text-[#2a1b66] dark:text-foreground">
                Topic
              </CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Topic"
                chartType="bar-vertical"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === topicPanelIndex}
                onOpenChange={(open) => handleOpenAskChange(topicPanelIndex, open)}
                selectedKpiLabel={openAskPanelIndex === topicPanelIndex ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === topicPanelIndex ? anchorPoint : null}
              />
            </div>
            <CardDescription>9 categories</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <div className="max-h-[252px] min-h-0 overflow-auto overscroll-contain">
              <Table>
                <TableHeader className="sticky top-0 z-10 border-b border-[#e5e7eb] bg-[#f3f4f6] dark:border-border dark:bg-muted/40 [&_tr]:border-0 [&_tr]:bg-transparent">
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="h-10 bg-[#f3f4f6] font-normal text-sm dark:bg-muted/40">Topic</TableHead>
                    <TableHead className="h-10 w-[88px] bg-[#f3f4f6] text-right font-normal text-sm dark:bg-muted/40">
                      Convos
                    </TableHead>
                    <TableHead className="h-10 w-[104px] bg-[#f3f4f6] text-right font-normal text-sm dark:bg-muted/40">
                      Success
                    </TableHead>
                    <TableHead className="h-10 min-w-[160px] bg-[#f3f4f6] font-normal text-sm dark:bg-muted/40">
                      Share
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluationTopicRows.map((row) => (
                    <TableRow key={row.topic} className="border-b border-[#e5e7eb] dark:border-border">
                      <TableCell className="min-w-[180px] whitespace-normal py-2 align-middle">
                        <div className="flex flex-col gap-0 text-sm leading-5">
                          <span className="text-[#1f2937] dark:text-foreground">{row.topic}</span>
                          <span className="text-[#6b7280] dark:text-muted-foreground">{row.subtopic}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right text-sm tabular-nums text-[#1f2937] dark:text-foreground">
                        {row.convos}
                      </TableCell>
                      <TableCell className="py-2 text-right align-middle">
                        <TopicSuccessBadge pct={row.successPct} tone={row.successTone} />
                      </TableCell>
                      <TableCell className="py-2 align-middle whitespace-normal">
                        <TopicShareBar pct={row.sharePct} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Topic" chartType="bar-vertical" />
            </CardFooter>
        </Card>

        <Card className="group/widget min-w-0 transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1 text-base text-[#2a1b66] dark:text-foreground">
                {"Knowledge & Tool Gap"}
              </CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Knowledge & Tool Gap"
                chartType="donut"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === knowledgeToolGapPanelIndex}
                onOpenChange={(open) => handleOpenAskChange(knowledgeToolGapPanelIndex, open)}
                selectedKpiLabel={openAskPanelIndex === knowledgeToolGapPanelIndex ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === knowledgeToolGapPanelIndex ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col items-stretch gap-6 md:flex-row md:justify-center">
              <div className="mx-auto h-[200px] w-[200px] shrink-0 md:mx-0">
                <EChartsCanvas
                  option={knowledgeToolGapDonutOption}
                  onDataSelect={handleChartDataSelect(knowledgeToolGapPanelIndex)}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-base text-[#1f2937] dark:text-foreground">Gap to Escalation Correlation</p>
                <div className="flex flex-col">
                  {knowledgeGapCorrelationRows.map((r) => (
                    <div key={r.label} className="flex min-h-8 items-center py-2 first:pt-0">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="h-3 min-w-0 flex-1 rounded-full bg-black/10 dark:bg-white/10">
                          <div
                            className="h-3 rounded-full"
                            style={{ width: `${r.fillPct}%`, backgroundColor: r.barColor }}
                          />
                        </div>
                        <span className="w-[86px] shrink-0 text-xs tracking-[0.06px] text-[#6b7280] dark:text-muted-foreground">
                          {r.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <nav className="flex w-full justify-center px-4" aria-label="Knowledge and tool gap legend">
              <EvaluationTrendLegend items={KNOWLEDGE_TOOL_GAP_LEGEND} />
            </nav>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Knowledge & Tool Gap" chartType="donut" />
            </CardFooter>
        </Card>
      </div>

      <Card className="group/widget min-w-0 transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="flex-1">Sessions to Investigate</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Sessions to Investigate"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
              open={openAskPanelIndex === tablePanelIndex}
              onOpenChange={(open) => handleOpenAskChange(tablePanelIndex, open)}
              selectedKpiLabel={openAskPanelIndex === tablePanelIndex ? selectedKpiLabel : null}
              anchorPoint={openAskPanelIndex === tablePanelIndex ? anchorPoint : null}
            />
          </div>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="h-8 pl-8" aria-label="Search sessions" placeholder="Search" />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5">
                    <Columns3 className="h-3.5 w-3.5" />
                    Column Picker
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {EVALUATION_SESSIONS_TOGGLEABLE_COLUMNS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={evaluationSessionsColumnVisibility[col.id]}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(checked) =>
                        setEvaluationSessionsColumnVisibility((prev) => ({
                          ...prev,
                          [col.id]: checked === true,
                        }))
                      }
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="min-w-0 w-full">
            <Table className="table-auto w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Conversation ID</TableHead>
                  {evaluationSessionsColumnVisibility.timestamp ? <TableHead>Timestamp</TableHead> : null}
                  {evaluationSessionsColumnVisibility.agent ? <TableHead>Agent</TableHead> : null}
                  {evaluationSessionsColumnVisibility.channel ? <TableHead>Channel</TableHead> : null}
                  {evaluationSessionsColumnVisibility.sentiment ? <TableHead>Sentiment</TableHead> : null}
                  {evaluationSessionsColumnVisibility.containment ? <TableHead>Containment</TableHead> : null}
                  {evaluationSessionsColumnVisibility.successful ? <TableHead>Successful</TableHead> : null}
                  {evaluationSessionsColumnVisibility.compliance ? <TableHead>Compliance</TableHead> : null}
                  {evaluationSessionsColumnVisibility.avgConfidence ? <TableHead>Avg Conf.</TableHead> : null}
                  <TableHead className="whitespace-nowrap pl-2 pr-4 text-right">
                    <span className="sr-only">Transcript actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsToInvestigate.map((row) => (
                  <TableRow key={row.conversationId}>
                    <TableCell className="tabular-nums">{row.conversationId}</TableCell>
                    {evaluationSessionsColumnVisibility.timestamp ? (
                      <TableCell className="tabular-nums text-muted-foreground">{row.timestamp}</TableCell>
                    ) : null}
                    {evaluationSessionsColumnVisibility.agent ? (
                      <TableCell>
                        <TableAgentCell name={row.agent} />
                      </TableCell>
                    ) : null}
                    {evaluationSessionsColumnVisibility.channel ? (
                      <TableCell>
                        <SessionsInvestigateChannelCell channel={row.channel} />
                      </TableCell>
                    ) : null}
                    {evaluationSessionsColumnVisibility.sentiment ? (
                      <TableCell>
                        <SessionsInvestigateSentimentPill sentiment={row.sentiment} />
                      </TableCell>
                    ) : null}
                    {evaluationSessionsColumnVisibility.containment ? (
                      <TableCell>
                        <SessionsInvestigateContainmentPill containment={row.containment} />
                      </TableCell>
                    ) : null}
                    {evaluationSessionsColumnVisibility.successful ? (
                      <TableCell>
                        <SessionsInvestigateSuccessIcon successful={row.successful} />
                      </TableCell>
                    ) : null}
                    {evaluationSessionsColumnVisibility.compliance ? (
                      <TableCell>
                        <SessionsInvestigateCompliancePill compliance={row.compliance} />
                      </TableCell>
                    ) : null}
                    {evaluationSessionsColumnVisibility.avgConfidence ? (
                      <TableCell>
                        <SessionsInvestigateConfidencePill avgConfidence={row.avgConfidence} />
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="View Transcript"
                              onClick={() => setSelectedSession(fromAIAgentsEvaluationSessionRow(row))}
                            >
                              <MessageSquare className="size-4" aria-hidden />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">View Transcript</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label="Download">
                              <Download className="size-4" aria-hidden />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">Download</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Sessions to Investigate" chartType="metric" />
          </CardFooter>
      </Card>

      <CopilotSessionTranscriptDialog
        open={selectedSession !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedSession(null);
        }}
        session={selectedSession}
        sourceLabel="AI Agents Evaluation"
      />
    </div>
  );
}
