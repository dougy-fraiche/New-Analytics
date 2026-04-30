import type { EChartsCoreOption } from "echarts";
import { useCallback, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BarChart3,
  Columns3,
  Download,
  LayoutGrid,
  MessageSquare,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { cn } from "./ui/utils";
import { EChartsCanvas, type ChartDataSelectInfo } from "./EChartsCanvas";
import { CopilotSessionTranscriptDialog } from "./CopilotSessionTranscriptDialog";
import { TableBadge } from "./TableBadge";
import { TableChannelCell } from "./TableChannelCell";
import { TableRatingStars } from "./TableRatingStars";
import { TableStatusIconBadge } from "./TableStatusBadges";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import type { ChartType } from "./ChartVariants";
import { fromAIAgentsIntentNluSessionRow } from "../data/ai-agent-session-transcript";
import type { CopilotTranscriptSessionContext } from "../data/copilot-session-transcript";

const weekLabels = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];

const localeNames = ["en-US", "de-DE", "fr-FR", "es-ES", "ja-JP", "Other"];
const localeColors = ["#126BCE", "#308FF8", "#5EA9FD", "#A7D0FE", "#62C554", "#94A3B8"];

const CONF = {
  excellent: "#00BFA6",
  good: "#556CD6",
  attention: "#FFC857",
  poor: "#E754A8",
};

const intentScoreTrend: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 28 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: weekLabels,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
  },
  yAxis: {
    type: "value",
    min: 0.4,
    max: 1,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10, formatter: (v: number) => v.toFixed(1) },
  },
  series: [
    {
      type: "line",
      smooth: 0.35,
      symbol: "none",
      lineStyle: { width: 2.5, color: "#126BCE" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(18, 107, 206, 0.24)" },
            { offset: 1, color: "rgba(18, 107, 206, 0.02)" },
          ],
        },
      },
      data: [0.82, 0.83, 0.85, 0.86, 0.87, 0.89, 0.9],
    },
  ],
};

const usersByLocaleStacked: EChartsCoreOption = {
  grid: { left: 48, right: 8, top: 12, bottom: 36 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  legend: { bottom: 0, itemWidth: 8, itemHeight: 8, textStyle: { fontSize: 10, color: "hsl(var(--muted-foreground))" } },
  xAxis: {
    type: "category",
    data: weekLabels,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
  },
  yAxis: {
    type: "value",
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
  },
  series: localeNames.map((name, i) => ({
    name,
    type: "line" as const,
    smooth: 0.35,
    stack: "loc",
    symbol: "none",
    lineStyle: { width: 0 },
    areaStyle: { color: localeColors[i % localeColors.length] + "99" },
    data: [
      1200 + i * 80 + 50,
      1180 + i * 90 + 40,
      1250 + i * 70 + 60,
      1300 + i * 85 + 55,
      1280 + i * 75 + 45,
      1320 + i * 95 + 50,
      1290 + i * 88 + 48,
    ],
  })),
};

function buildDonutCenterOption(params: {
  parts: { value: number; name: string; color: string }[];
  centerLine1: string;
  centerLine2: string;
}): EChartsCoreOption {
  return {
    animation: true,
    series: [
      {
        type: "pie",
        radius: ["55%", "78%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: { borderWidth: 0 },
        label: { show: false },
        data: params.parts.map((p) => ({ value: p.value, name: p.name, itemStyle: { color: p.color } })),
      },
    ],
    graphic: [
      {
        type: "text",
        left: "center",
        top: "40%",
        style: {
          text: params.centerLine1,
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
          text: params.centerLine2,
          fontSize: 12,
          fill: "hsl(var(--muted-foreground))",
        },
      },
    ],
  };
}

const usersLocaleDonut = buildDonutCenterOption({
  parts: localeNames.map((n, i) => ({ name: n, value: [42, 18, 14, 12, 9, 5][i] ?? 5, color: localeColors[i] })),
  centerLine1: "36.1k",
  centerLine2: "users",
});

const intentConfidenceBars: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 28 },
  tooltip: { trigger: "axis", confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["Excellent", "Good", "Needs Attention", "Poor"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
  },
  yAxis: {
    type: "value",
    max: 8,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 48,
      data: [
        { value: 8, itemStyle: { color: CONF.excellent, borderRadius: [6, 6, 0, 0] } },
        { value: 7, itemStyle: { color: CONF.good, borderRadius: [6, 6, 0, 0] } },
        { value: 4, itemStyle: { color: CONF.attention, borderRadius: [6, 6, 0, 0] } },
        { value: 1, itemStyle: { color: CONF.poor, borderRadius: [6, 6, 0, 0] } },
      ],
    },
  ],
};

const intentConfidenceDonut = buildDonutCenterOption({
  parts: [
    { name: "Excellent", value: 40, color: CONF.excellent },
    { name: "Good", value: 35, color: CONF.good },
    { name: "Needs Attention", value: 20, color: CONF.attention },
    { name: "Poor", value: 5, color: CONF.poor },
  ],
  centerLine1: "20",
  centerLine2: "intents",
});

const LATENCY = {
  fast: "#27CAFF",
  mid: "#E754A8",
  slow: "#FFC857",
};

const nluExecutionTimeTrend: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 28 },
  tooltip: {
    trigger: "axis",
    confine: true,
    appendToBody: true,
    valueFormatter: (v: number | string) => `${v} ms`,
  },
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
    max: 2200,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
  },
  series: [
    {
      type: "line",
      smooth: 0.35,
      symbol: "none",
      lineStyle: { width: 2.5, color: "#126BCE" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(18, 107, 206, 0.22)" },
            { offset: 1, color: "rgba(18, 107, 206, 0.02)" },
          ],
        },
      },
      data: [1920, 1880, 1860, 1830, 1855, 1820, 1842],
    },
  ],
};

/** Figma 116:35318 — one bar per endpoint; fill color = median latency tier (<400 / 400–700 / >700 ms). */
function execTimeLatencyTierColor(ms: number) {
  if (ms < 400) return LATENCY.fast;
  if (ms <= 700) return LATENCY.mid;
  return LATENCY.slow;
}

const execTimeByEndpointCategories = [
  "check_order_status",
  "billing_inquiry",
  "password_reset",
  "product_info",
  "cancel_subscription",
  "shipping_eta",
] as const;

/** Sample medians (ms) aligned with Figma chart proportions. */
const execTimeByEndpointMedians = [920, 680, 520, 450, 340, 280];

const execTimeByEndpointOption: EChartsCoreOption = {
  grid: { left: 148, right: 16, top: 8, bottom: 28 },
  tooltip: {
    trigger: "axis",
    axisPointer: { type: "shadow" },
    confine: true,
    appendToBody: true,
    valueFormatter: (v: number | string) => `${v} ms`,
  },
  xAxis: {
    type: "value",
    min: 0,
    max: 1000,
    interval: 250,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: {
      show: true,
      lineStyle: { type: "solid", color: "hsl(var(--muted-foreground))" },
    },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 12 },
  },
  yAxis: {
    type: "category",
    inverse: true,
    data: [...execTimeByEndpointCategories],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: "hsl(var(--muted-foreground))",
      fontSize: 12,
      width: 132,
      overflow: "truncate",
    },
  },
  series: [
    {
      type: "bar",
      barWidth: 14,
      data: execTimeByEndpointMedians.map((ms) => ({
        value: ms,
        itemStyle: {
          color: execTimeLatencyTierColor(ms),
          borderRadius: [0, 8, 8, 0],
        },
      })),
    },
  ],
};

const EXEC_TIME_ENDPOINT_LEGEND: { label: string; color: string }[] = [
  { label: "<400ms", color: LATENCY.fast },
  { label: "400-700ms", color: LATENCY.mid },
  { label: ">700ms", color: LATENCY.slow },
];

const topSlotsBarOption: EChartsCoreOption = {
  grid: { left: 148, right: 48, top: 8, bottom: 28 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "value",
    max: 4000,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
  },
  yAxis: {
    type: "category",
    data: [
      "general_greeting",
      "tech_support",
      "account_update",
      "refund_request",
      "shipping_eta",
      "cancel_subscription",
      "product_info",
      "password_reset",
      "billing_inquiry",
      "check_order_status",
    ].reverse(),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10 },
  },
  series: [
    {
      type: "bar",
      barWidth: 14,
      data: [1545, 1738, 1825, 2003, 2116, 2381, 2660, 2870, 3406, 3949].reverse(),
      itemStyle: { color: "#126BCE", borderRadius: [0, 6, 6, 0] },
    },
  ],
};

type TopIntentRow = { name: string; matches: string; category: string; tone: "excellent" | "good" | "attention" | "poor" };

const topIntentRows: TopIntentRow[] = [
  { name: "check_order_status", matches: "3,949", category: "Excellent (0.85–1.00)", tone: "excellent" },
  { name: "billing_inquiry", matches: "3,406", category: "Good (0.70–0.85)", tone: "good" },
  { name: "password_reset", matches: "2,870", category: "Good (0.70–0.85)", tone: "good" },
  { name: "product_info", matches: "2,660", category: "Needs Attention (0.50–0.70)", tone: "attention" },
  { name: "cancel_subscription", matches: "2,381", category: "Good (0.70–0.85)", tone: "good" },
  { name: "shipping_eta", matches: "2,116", category: "Good (0.70–0.85)", tone: "good" },
  { name: "refund_request", matches: "2,003", category: "Poor (0–0.50)", tone: "poor" },
  { name: "account_update", matches: "1,825", category: "Good (0.70–0.85)", tone: "good" },
  { name: "tech_support", matches: "1,738", category: "Poor (0–0.50)", tone: "poor" },
  { name: "general_greeting", matches: "1,545", category: "Good (0.70–0.85)", tone: "good" },
];

/** Figma 1:19160 — horizontal bars colored by score category, x-axis 0–4000, mini legend below chart. */
function buildTopIntentsBarChartOption(): EChartsCoreOption {
  const toneColor = (tone: TopIntentRow["tone"]) =>
    tone === "excellent"
      ? CONF.excellent
      : tone === "good"
        ? CONF.good
        : tone === "attention"
          ? CONF.attention
          : CONF.poor;
  const rows = topIntentRows;
  const values = rows.map((r) => Number(r.matches.replace(/,/g, "")));
  return {
    grid: { left: 148, right: 24, top: 8, bottom: 8 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
    xAxis: {
      type: "value",
      min: 0,
      max: 4000,
      interval: 1000,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        show: true,
        lineStyle: { type: "solid", color: "hsl(var(--muted-foreground))" },
      },
      axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 12 },
    },
    yAxis: {
      type: "category",
      inverse: true,
      data: rows.map((r) => r.name),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: "hsl(var(--muted-foreground))",
        fontSize: 12,
        width: 132,
        overflow: "truncate",
      },
    },
    series: [
      {
        type: "bar",
        barWidth: 14,
        data: rows.map((r, i) => ({
          value: values[i]!,
          itemStyle: {
            color: toneColor(r.tone),
            borderRadius: [0, 6, 6, 0],
          },
        })),
      },
    ],
  };
}

const topIntentsBarChartOption = buildTopIntentsBarChartOption();

type TopSlotByIntentRow = {
  intentName: string;
  slotName: string;
  slotVolume: string;
  intentTotalVolume: string;
};

/** Figma 1:19159 — By Intent breakdown (intent × slot × volumes). */
const topSlotsByIntentRows: TopSlotByIntentRow[] = [
  {
    intentName: "check_order_status",
    slotName: "order_id",
    slotVolume: "4,745",
    intentTotalVolume: "4,745",
  },
  {
    intentName: "password_reset",
    slotName: "email_address",
    slotVolume: "4,285",
    intentTotalVolume: "4,285",
  },
  {
    intentName: "billing_inquiry",
    slotName: "account_number",
    slotVolume: "3,822",
    intentTotalVolume: "6,724",
  },
  {
    intentName: "billing_inquiry",
    slotName: "date_range",
    slotVolume: "2,902",
    intentTotalVolume: "6,724",
  },
  {
    intentName: "product_info",
    slotName: "product_name",
    slotVolume: "3,551",
    intentTotalVolume: "3,551",
  },
  {
    intentName: "account_update",
    slotName: "phone_number",
    slotVolume: "3,278",
    intentTotalVolume: "3,278",
  },
  {
    intentName: "cancel_subscription",
    slotName: "subscription_type",
    slotVolume: "2,621",
    intentTotalVolume: "2,621",
  },
  {
    intentName: "store_locator",
    slotName: "zip_code",
    slotVolume: "2,336",
    intentTotalVolume: "2,336",
  },
  {
    intentName: "issue_handling",
    slotName: "issue_category",
    slotVolume: "1,980",
    intentTotalVolume: "1,980",
  },
  {
    intentName: "payment_flow",
    slotName: "payment_method",
    slotVolume: "1,745",
    intentTotalVolume: "1,745",
  },
];

const INTENT_SCORE_LEGEND: { label: string; color: string }[] = [
  { label: "Excellent", color: CONF.excellent },
  { label: "Good", color: CONF.good },
  { label: "Needs Attention", color: CONF.attention },
  { label: "Poor", color: CONF.poor },
];

const slotExtractionRows = [
  { slot: "DATE", widthPct: 89, share: "89%", count: "1,087" },
  { slot: "EMAIL", widthPct: 89, share: "89%", count: "1,087" },
  { slot: "MONEY", widthPct: 92, share: "92%", count: "1,087" },
  { slot: "PRODUCT", widthPct: 76, share: "76%", count: "1,087" },
  { slot: "LOCATION", widthPct: 16.4, share: "16.4%", count: "1,087" },
];

function getTrendDirection(value: string): "up" | "down" | "neutral" {
  const normalized = value.trim();
  if (normalized.startsWith("+")) return "up";
  if (normalized.startsWith("-") || normalized.startsWith("−")) return "down";
  return "neutral";
}

function ScoreCategoryBadge({ tone, children }: { tone: TopIntentRow["tone"]; children: ReactNode }) {
  return (
    <TableBadge
      variant="secondary"
      className={cn(
        "whitespace-normal text-left text-xs font-normal",
        tone === "excellent" && "border-transparent bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-100",
        tone === "good" && "border-transparent bg-indigo-100 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-100",
        tone === "attention" && "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
        tone === "poor" && "border-transparent bg-pink-100 text-pink-900 dark:bg-pink-950/40 dark:text-pink-100",
      )}
    >
      {children}
    </TableBadge>
  );
}

/** Figma 116:35167 — Sessions to Investigate (Intent & NLU). */
type NluSessionCategory =
  | "low_intent_score"
  | "high_escalation"
  | "missing_slots"
  | "low_rating"
  | "long_duration";

type NluSessionChannel = "webchat" | "voice" | "messenger" | "whatsapp";

type NluSessionInvestigateRow = {
  id: string;
  category: NluSessionCategory;
  channel: NluSessionChannel;
  topIntent: string;
  intentScore: number;
  rating: number;
  escalated: boolean;
  duration: string;
};

const sessionsToInvestigate: NluSessionInvestigateRow[] = [
  {
    id: "NLU-001234",
    category: "low_intent_score",
    channel: "webchat",
    topIntent: "transfer_agent",
    intentScore: 0.42,
    rating: 2,
    escalated: true,
    duration: "4:23",
  },
  {
    id: "NLU-001235",
    category: "high_escalation",
    channel: "voice",
    topIntent: "billing_inquiry",
    intentScore: 0.78,
    rating: 3,
    escalated: true,
    duration: "5:12",
  },
  {
    id: "NLU-001236",
    category: "missing_slots",
    channel: "messenger",
    topIntent: "refund_request",
    intentScore: 0.86,
    rating: 4,
    escalated: false,
    duration: "3:45",
  },
  {
    id: "NLU-001237",
    category: "low_rating",
    channel: "whatsapp",
    topIntent: "tech_support",
    intentScore: 0.71,
    rating: 1,
    escalated: true,
    duration: "8:45",
  },
  {
    id: "NLU-001238",
    category: "long_duration",
    channel: "webchat",
    topIntent: "password_reset",
    intentScore: 0.94,
    rating: 5,
    escalated: false,
    duration: "2:08",
  },
];

function NluSessionCategoryCell({ category }: { category: NluSessionCategory }) {
  if (category === "low_intent_score") {
    return (
      <TableStatusIconBadge label="Low Intent Score" tone="negative" Icon={TrendingDown} />
    );
  }
  if (category === "high_escalation") {
    return (
      <TableStatusIconBadge label="High Escalation" tone="negative" Icon={TrendingDown} />
    );
  }
  if (category === "missing_slots") {
    return (
      <TableStatusIconBadge label="Missing Slots" tone="primary" Icon={X} />
    );
  }
  if (category === "low_rating") {
    return (
      <TableStatusIconBadge label="Low Rating" tone="warning" Icon={TrendingDown} />
    );
  }
  return <TableStatusIconBadge label="Long Duration" tone="positive" Icon={ArrowRight} />;
}

function NluSessionChannelCell({ channel }: { channel: NluSessionChannel }) {
  return <TableChannelCell channel={channel} />;
}

function NluIntentScoreBadge({ score }: { score: number }) {
  const tone = score < 0.5 ? "low" : score < 0.85 ? "medium" : "high";
  const cls =
    tone === "low"
      ? "border border-red-500/40 bg-red-500/10 text-[#a0152a]"
      : tone === "medium"
        ? "border border-[rgba(85,108,214,0.4)] bg-[rgba(85,108,214,0.1)] text-[#3b439f]"
        : "border border-emerald-500/40 bg-emerald-500/10 text-[#10743f]";
  return (
    <TableBadge variant="outline" className={cn("w-fit border font-normal", cls)}>
      {score.toFixed(2)}
    </TableBadge>
  );
}

function NluEscalatedBadge({ escalated }: { escalated: boolean }) {
  return escalated ? (
    <TableBadge className="rounded-md border-transparent bg-primary font-normal text-primary-foreground">
      Yes
    </TableBadge>
  ) : (
    <TableBadge
      variant="outline"
      className="rounded-md border-transparent bg-[#E5F2FF] font-normal text-[#0B233D] dark:bg-primary/20 dark:text-foreground"
    >
      No
    </TableBadge>
  );
}

const NLU_SESSIONS_TOGGLEABLE_COLUMNS = [
  { id: "category", label: "Category" },
  { id: "channel", label: "Channel" },
  { id: "topIntent", label: "Top Intent" },
  { id: "intentScore", label: "Intent Score" },
  { id: "rating", label: "Rating" },
  { id: "escalated", label: "Escalated" },
  { id: "duration", label: "Duration" },
] as const;

type NluSessionsToggleableColumnId = (typeof NLU_SESSIONS_TOGGLEABLE_COLUMNS)[number]["id"];

export function AIAgentsIntentNluTab({
  isCompactDashboard,
  showWidgetOverflowMenu = true,
}: {
  isCompactDashboard: boolean;
  showWidgetOverflowMenu?: boolean;
}) {
  const [openAskPanelIndex, setOpenAskPanelIndex] = useState<number | null>(null);
  const [selectedKpiLabel, setSelectedKpiLabel] = useState<string | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [topIntentView, setTopIntentView] = useState<"table" | "chart">("table");
  const [slotGroupMode, setSlotGroupMode] = useState<"frequency" | "intent">("frequency");
  const [selectedSession, setSelectedSession] = useState<CopilotTranscriptSessionContext | null>(null);
  const [nluSessionsColumnVisibility, setNluSessionsColumnVisibility] = useState<
    Record<NluSessionsToggleableColumnId, boolean>
  >(
    () =>
      Object.fromEntries(NLU_SESSIONS_TOGGLEABLE_COLUMNS.map((c) => [c.id, true])) as Record<
        NluSessionsToggleableColumnId,
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

  const IX = {
    intentScore: 0,
    slotExtraction: 1,
    usersLocale: 2,
    confidence: 3,
    topIntents: 4,
    topSlots: 5,
    nluExecutionTime: 6,
    execTimeByEndpoint: 7,
    sessions: 8,
  };

  const slotsBarChartOption = topSlotsBarOption;

  const slotExtractionTrend = "+2.1%";
  const slotExtractionTrendDirection = getTrendDirection(slotExtractionTrend);
  const SlotExtractionTrendIcon =
    slotExtractionTrendDirection === "up" ? TrendingUp : TrendingDown;
  const slotExtractionBadgeToneClass =
    slotExtractionTrendDirection === "up"
      ? "border-transparent bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white"
      : "border-transparent bg-red-600 text-white dark:bg-red-600 dark:text-white";

  const nluExecutionTrend = "−3.4% vs prior";
  const nluExecutionTrendDirection = getTrendDirection(nluExecutionTrend);
  const NluExecutionTrendIcon = nluExecutionTrendDirection === "up" ? TrendingUp : TrendingDown;
  const nluExecutionBadgeToneClass =
    nluExecutionTrendDirection === "up"
      ? "border-transparent bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white"
      : "border-transparent bg-red-600 text-white dark:bg-red-600 dark:text-white";

  return (
    <div className="space-y-4">
      <div className={`grid gap-4 ${isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
        <Card className="group/widget h-full transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1 text-base">Intent Score</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Intent Score"
                chartType="line-multi"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === IX.intentScore}
                onOpenChange={(open) => handleOpenAskChange(IX.intentScore, open)}
                selectedKpiLabel={openAskPanelIndex === IX.intentScore ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === IX.intentScore ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-2xl font-normal tabular-nums tracking-tight">0.90</p>
                <p className="text-xs text-muted-foreground">+0.03 vs prior</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Max Score Intents</p>
                <p className="text-xl font-normal tabular-nums">8</p>
                <p className="text-xs text-muted-foreground">40% of total +2</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Total Intents</p>
                <p className="text-xl font-normal tabular-nums">20</p>
              </div>
            </div>
            <div className="h-[220px] w-full">
              <EChartsCanvas option={intentScoreTrend} onDataSelect={handleChartDataSelect(IX.intentScore)} />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Intent Score" chartType="line-multi" />
            </CardFooter>
        </Card>

        <Card className="group/widget h-full transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1 text-base">Slot Extraction Rate</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Slot Extraction Rate"
                chartType="bar-vertical"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === IX.slotExtraction}
                onOpenChange={(open) => handleOpenAskChange(IX.slotExtraction, open)}
                selectedKpiLabel={openAskPanelIndex === IX.slotExtraction ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === IX.slotExtraction ? anchorPoint : null}
              />
            </div>
            <div className="mt-1 flex flex-wrap items-end gap-2">
              <span className="text-3xl font-normal tabular-nums leading-none">34%</span>
              <Badge variant="secondary" className={`text-xs ${slotExtractionBadgeToneClass}`}>
                <span className="inline-flex items-center gap-1">
                  <SlotExtractionTrendIcon className="h-3 w-3" />
                  {slotExtractionTrend}
                </span>
              </Badge>
            </div>
            <CardDescription>By Slot Type</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Slot</TableHead>
                  <TableHead>Fill rate</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slotExtractionRows.map((row) => (
                  <TableRow key={row.slot}>
                    <TableCell>{row.slot}</TableCell>
                    <TableCell>
                      <div className="h-3 w-full max-w-[280px] overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${row.widthPct}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.share} {row.count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Slot Extraction Rate" chartType="bar-vertical" />
            </CardFooter>
        </Card>
      </div>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="flex-1 text-base">Intent Confidence Distribution</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Intent Confidence Distribution"
              chartType="bar-vertical"
              showOverflowMenu={showWidgetOverflowMenu}
              open={openAskPanelIndex === IX.confidence}
              onOpenChange={(open) => handleOpenAskChange(IX.confidence, open)}
              selectedKpiLabel={openAskPanelIndex === IX.confidence ? selectedKpiLabel : null}
              anchorPoint={openAskPanelIndex === IX.confidence ? anchorPoint : null}
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="min-h-[260px] min-w-0 flex-[2]">
              <EChartsCanvas option={intentConfidenceBars} onDataSelect={handleChartDataSelect(IX.confidence)} />
            </div>
            <div className="mx-auto h-[240px] w-[240px] shrink-0 lg:mx-0">
              <EChartsCanvas option={intentConfidenceDonut} onDataSelect={handleChartDataSelect(IX.confidence)} />
            </div>
          </div>
          <ul
            className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2"
            aria-label="Intent confidence categories"
          >
            <li className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ background: CONF.excellent }} aria-hidden />
              Excellent
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ background: CONF.good }} aria-hidden />
              Good
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ background: CONF.attention }} aria-hidden />
              Needs Attention
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-full" style={{ background: CONF.poor }} aria-hidden />
              Poor
            </li>
          </ul>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Intent Confidence Distribution" chartType="bar-vertical" />
          </CardFooter>
      </Card>

      <div className={`grid gap-4 ${isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
        <Card className="group/widget h-full transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-normal text-[#0B233D] dark:text-foreground">
                  Top Intents
                </CardTitle>
                <Select defaultValue="10">
                  <SelectTrigger size="sm" className="h-8 w-[100px]">
                    <SelectValue placeholder="Top N" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Top 5</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                    <SelectItem value="20">Top 20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={topIntentView}
                  onValueChange={(v) => {
                    if (v === "table" || v === "chart") setTopIntentView(v);
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0"
                >
                  <ToggleGroupItem value="table" className="gap-1.5 px-2.5 text-xs">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    Table
                  </ToggleGroupItem>
                  <ToggleGroupItem value="chart" className="gap-1.5 px-2.5 text-xs">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Chart
                  </ToggleGroupItem>
                </ToggleGroup>
                <WidgetAskAIAndOverflow
                  widgetTitle="Top Intents"
                  chartType={topIntentView === "table" ? "metric" : ("bar-horizontal" as ChartType)}
                  showOverflowMenu={showWidgetOverflowMenu}
                  open={openAskPanelIndex === IX.topIntents}
                  onOpenChange={(open) => handleOpenAskChange(IX.topIntents, open)}
                  selectedKpiLabel={openAskPanelIndex === IX.topIntents ? selectedKpiLabel : null}
                  anchorPoint={openAskPanelIndex === IX.topIntents ? anchorPoint : null}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {topIntentView === "table" ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intent Name</TableHead>
                      <TableHead className="text-right">Matches</TableHead>
                      <TableHead>Score Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topIntentRows.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.matches}</TableCell>
                        <TableCell>
                          <ScoreCategoryBadge tone={row.tone}>{row.category}</ScoreCategoryBadge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="h-[360px] w-full pr-4">
                  <EChartsCanvas
                    option={topIntentsBarChartOption}
                    onDataSelect={handleChartDataSelect(IX.topIntents)}
                  />
                </div>
                <ul
                  className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4"
                  aria-label="Intent score category legend"
                >
                  {INTENT_SCORE_LEGEND.map((item) => (
                    <li key={item.label} className="flex h-6 items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                        aria-hidden
                      />
                      <span className="whitespace-nowrap text-xs leading-4 tracking-[0.06px] text-[#0B233D] dark:text-foreground">
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Top Intents" chartType={topIntentView === "table" ? "metric" : "bar-horizontal"} />
            </CardFooter>
        </Card>

        <Card className="group/widget h-full transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base font-normal text-[#0B233D] dark:text-foreground">Top Slots</CardTitle>
                <Select defaultValue="10">
                  <SelectTrigger size="sm" className="h-8 w-[100px]">
                    <SelectValue placeholder="Top N" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Top 5</SelectItem>
                    <SelectItem value="10">Top 10</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={slotGroupMode}
                  onValueChange={(v) => {
                    if (v === "frequency" || v === "intent") setSlotGroupMode(v);
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0"
                >
                  <ToggleGroupItem value="frequency" className="px-2.5 text-xs">
                    Frequency
                  </ToggleGroupItem>
                  <ToggleGroupItem value="intent" className="px-2.5 text-xs">
                    By Intent
                  </ToggleGroupItem>
                </ToggleGroup>
                <WidgetAskAIAndOverflow
                  widgetTitle="Top Slots"
                  chartType={slotGroupMode === "intent" ? "metric" : "bar-horizontal"}
                  showOverflowMenu={showWidgetOverflowMenu}
                  open={openAskPanelIndex === IX.topSlots}
                  onOpenChange={(open) => handleOpenAskChange(IX.topSlots, open)}
                  selectedKpiLabel={openAskPanelIndex === IX.topSlots ? selectedKpiLabel : null}
                  anchorPoint={openAskPanelIndex === IX.topSlots ? anchorPoint : null}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {slotGroupMode === "frequency" ? (
              <div className="h-[360px] w-full">
                <EChartsCanvas
                  option={slotsBarChartOption}
                  onDataSelect={handleChartDataSelect(IX.topSlots)}
                />
              </div>
            ) : (
              <div className="min-h-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intent Name</TableHead>
                      <TableHead>Slot Name</TableHead>
                      <TableHead className="text-right">Slot Volume</TableHead>
                      <TableHead className="text-right">Intent Total Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSlotsByIntentRows.map((row, i) => (
                      <TableRow key={`${row.intentName}-${row.slotName}-${i}`}>
                        <TableCell>{row.intentName}</TableCell>
                        <TableCell>{row.slotName}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.slotVolume}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.intentTotalVolume}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation
              widgetTitle="Top Slots"
              chartType={slotGroupMode === "intent" ? "metric" : "bar-horizontal"}
            />
            </CardFooter>
        </Card>
      </div>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="flex-1 text-base">Users by Locale</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Users by Locale"
              chartType="area-stacked"
              showOverflowMenu={showWidgetOverflowMenu}
              open={openAskPanelIndex === IX.usersLocale}
              onOpenChange={(open) => handleOpenAskChange(IX.usersLocale, open)}
              selectedKpiLabel={openAskPanelIndex === IX.usersLocale ? selectedKpiLabel : null}
              anchorPoint={openAskPanelIndex === IX.usersLocale ? anchorPoint : null}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="min-h-[280px] min-w-0 flex-[2]">
              <EChartsCanvas option={usersByLocaleStacked} onDataSelect={handleChartDataSelect(IX.usersLocale)} />
            </div>
            <div className="mx-auto h-[260px] w-[260px] shrink-0 lg:mx-0">
              <EChartsCanvas option={usersLocaleDonut} onDataSelect={handleChartDataSelect(IX.usersLocale)} />
            </div>
          </div>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Users by Locale" chartType="area-stacked" />
          </CardFooter>
      </Card>

      <div className={`grid gap-4 ${isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
        <Card className="group/widget h-full transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1 text-base">NLU Execution Time</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="NLU Execution Time"
                chartType="line-multi"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === IX.nluExecutionTime}
                onOpenChange={(open) => handleOpenAskChange(IX.nluExecutionTime, open)}
                selectedKpiLabel={openAskPanelIndex === IX.nluExecutionTime ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === IX.nluExecutionTime ? anchorPoint : null}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <span className="text-3xl font-normal tabular-nums leading-none tracking-tight">1,842ms</span>
              <Badge variant="secondary" className={`text-xs ${nluExecutionBadgeToneClass}`}>
                <span className="inline-flex items-center gap-1">
                  <NluExecutionTrendIcon className="h-3 w-3" />
                  {nluExecutionTrend}
                </span>
              </Badge>
            </div>
            <CardDescription className="pt-1">Average NLU engine processing time per request</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <EChartsCanvas
                option={nluExecutionTimeTrend}
                onDataSelect={handleChartDataSelect(IX.nluExecutionTime)}
              />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="NLU Execution Time" chartType="line-multi" />
            </CardFooter>
        </Card>

        <Card className="group/widget h-full transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-1">
                <CardTitle className="text-base font-normal text-[#0B233D] dark:text-foreground">
                  Exec Time by Endpoint
                </CardTitle>
                <CardDescription>Median ms per endpoint</CardDescription>
              </div>
              <WidgetAskAIAndOverflow
                widgetTitle="Exec Time by Endpoint"
                chartType="bar-horizontal"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === IX.execTimeByEndpoint}
                onOpenChange={(open) => handleOpenAskChange(IX.execTimeByEndpoint, open)}
                selectedKpiLabel={openAskPanelIndex === IX.execTimeByEndpoint ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === IX.execTimeByEndpoint ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="h-[260px] w-full pr-4">
              <EChartsCanvas
                option={execTimeByEndpointOption}
                onDataSelect={handleChartDataSelect(IX.execTimeByEndpoint)}
              />
            </div>
            <ul
              className="flex flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4"
              aria-label="Latency tier legend"
            >
              {EXEC_TIME_ENDPOINT_LEGEND.map((item) => (
                <li key={item.label} className="flex h-6 items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden
                  />
                  <span className="whitespace-nowrap text-xs leading-4 tracking-[0.06px] text-[#0B233D] dark:text-foreground">
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Exec Time by Endpoint" chartType="bar-horizontal" />
            </CardFooter>
        </Card>
      </div>

      <Card className="group/widget min-w-0 transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="flex-1 text-base">Sessions to Investigate</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Sessions to Investigate"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
              open={openAskPanelIndex === IX.sessions}
              onOpenChange={(open) => handleOpenAskChange(IX.sessions, open)}
              selectedKpiLabel={openAskPanelIndex === IX.sessions ? selectedKpiLabel : null}
              anchorPoint={openAskPanelIndex === IX.sessions ? anchorPoint : null}
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
                  {NLU_SESSIONS_TOGGLEABLE_COLUMNS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={nluSessionsColumnVisibility[col.id]}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(checked) =>
                        setNluSessionsColumnVisibility((prev) => ({
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
                  <TableHead>Session ID</TableHead>
                  {nluSessionsColumnVisibility.category ? <TableHead>Category</TableHead> : null}
                  {nluSessionsColumnVisibility.channel ? <TableHead>Channel</TableHead> : null}
                  {nluSessionsColumnVisibility.topIntent ? <TableHead>Top Intent</TableHead> : null}
                  {nluSessionsColumnVisibility.intentScore ? <TableHead>Intent Score</TableHead> : null}
                  {nluSessionsColumnVisibility.rating ? <TableHead>Rating</TableHead> : null}
                  {nluSessionsColumnVisibility.escalated ? <TableHead>Escalated</TableHead> : null}
                  {nluSessionsColumnVisibility.duration ? <TableHead>Duration</TableHead> : null}
                  <TableHead className="whitespace-nowrap pl-2 pr-4 text-right">
                    <span className="sr-only">Transcript actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionsToInvestigate.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    {nluSessionsColumnVisibility.category ? (
                      <TableCell>
                        <NluSessionCategoryCell category={row.category} />
                      </TableCell>
                    ) : null}
                    {nluSessionsColumnVisibility.channel ? (
                      <TableCell>
                        <NluSessionChannelCell channel={row.channel} />
                      </TableCell>
                    ) : null}
                    {nluSessionsColumnVisibility.topIntent ? (
                      <TableCell className="min-w-0">
                        <span className="min-w-0 truncate">{row.topIntent}</span>
                      </TableCell>
                    ) : null}
                    {nluSessionsColumnVisibility.intentScore ? (
                      <TableCell>
                        <NluIntentScoreBadge score={row.intentScore} />
                      </TableCell>
                    ) : null}
                    {nluSessionsColumnVisibility.rating ? (
                      <TableCell>
                        <TableRatingStars rating={row.rating} />
                      </TableCell>
                    ) : null}
                    {nluSessionsColumnVisibility.escalated ? (
                      <TableCell>
                        <NluEscalatedBadge escalated={row.escalated} />
                      </TableCell>
                    ) : null}
                    {nluSessionsColumnVisibility.duration ? <TableCell>{row.duration}</TableCell> : null}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="View Transcript"
                              onClick={() => setSelectedSession(fromAIAgentsIntentNluSessionRow(row))}
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
        sourceLabel="AI Agents Intent & NLU"
      />
    </div>
  );
}
