import type { EChartsCoreOption } from "echarts";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  Columns3,
  Download,
  DollarSign,
  MessageSquare,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { EChartsCanvas, type ChartDataSelectInfo } from "./EChartsCanvas";
import { CopilotSessionTranscriptDialog } from "./CopilotSessionTranscriptDialog";
import { TableBadge } from "./TableBadge";
import { TableChannelCell } from "./TableChannelCell";
import { TableRatingStars } from "./TableRatingStars";
import { TableStatusIconBadge } from "./TableStatusBadges";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import { cn } from "./ui/utils";
import { fromAIAgentsGoalsOutcomesSessionRow } from "../data/ai-agent-session-transcript";
import type { CopilotTranscriptSessionContext } from "../data/copilot-session-transcript";

const goalsPerformanceOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 44 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  legend: {
    bottom: 0,
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { fontSize: 12, color: "hsl(var(--muted-foreground))" },
  },
  xAxis: {
    type: "category",
    data: ["Password Reset", "Order Status", "Billing Inquiry", "Account Update", "Refund Request", "Subscription Mgmt"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10, interval: 0 },
  },
  yAxis: {
    type: "value",
    max: 600,
    splitNumber: 4,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "solid", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      name: "Incomplete",
      type: "bar",
      stack: "goals",
      barMaxWidth: 60,
      itemStyle: { color: "#E32926", borderRadius: [0, 0, 0, 0] },
      data: [12, 14, 20, 12, 18, 15],
    },
    {
      name: "Partial",
      type: "bar",
      stack: "goals",
      barMaxWidth: 60,
      itemStyle: { color: "#FFB800", borderRadius: [0, 0, 0, 0] },
      data: [40, 35, 52, 35, 75, 42],
    },
    {
      name: "Complete",
      type: "bar",
      stack: "goals",
      barMaxWidth: 60,
      itemStyle: { color: "#208337", borderRadius: [4, 4, 0, 0] },
      data: [510, 430, 360, 300, 240, 255],
    },
  ],
};

const financialOutcomesOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 16, bottom: 44 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  legend: {
    bottom: 0,
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { fontSize: 12, color: "hsl(var(--muted-foreground))" },
  },
  xAxis: {
    type: "category",
    data: ["Password Reset", "Order Status", "Billing Inquiry", "Account Update", "Refund Request", "Subscription Mgmt"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))", fontSize: 10, interval: 0 },
  },
  yAxis: {
    type: "value",
    max: 600,
    splitNumber: 4,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "solid", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      name: "Cost Savings",
      type: "bar",
      barGap: "20%",
      barMaxWidth: 26,
      itemStyle: { color: "#FF620A", borderRadius: [4, 4, 0, 0] },
      data: [540, 450, 360, 330, 240, 300],
    },
    {
      name: "Revenue Earned",
      type: "bar",
      barMaxWidth: 26,
      itemStyle: { color: "#A8D61D", borderRadius: [4, 4, 0, 0] },
      data: [0, 120, 270, 60, 0, 360],
    },
  ],
};

type GoalInventoryRow = {
  goalName: string;
  project: string;
  steps: number;
  created: string;
};

const goalInventoryRows: GoalInventoryRow[] = [
  { goalName: "Password Reset", project: "Customer Support", steps: 4, created: "2024-08-15" },
  { goalName: "Order Status", project: "Customer Support", steps: 4, created: "2024-08-20" },
  { goalName: "Billing Inquiry", project: "Customer Support", steps: 5, created: "2024-09-01" },
  { goalName: "Account Update", project: "Customer Support", steps: 4, created: "2024-09-10" },
  { goalName: "Refund Request", project: "Customer Support", steps: 5, created: "2024-09-15" },
  { goalName: "Subscription Mgmt", project: "Sales", steps: 4, created: "2024-10-01" },
];

type GoalFunnelRow = {
  name: string;
  dropOffText?: string;
  value: number;
  percent: number;
};

const goalFunnelRowsByFilter: Record<string, GoalFunnelRow[]> = {
  "all-goals": [
    { name: "Session Start", value: 2088, percent: 100 },
    { name: "Goal Initiated", dropOffText: "-22% drop-off (largest)", value: 1894, percent: 78 },
    { name: "Step 1 Complete", dropOffText: "-13% drop-off", value: 1637, percent: 65 },
    { name: "Step 2 Complete", dropOffText: "-13% drop-off", value: 1310, percent: 52 },
    { name: "Goal Completed", dropOffText: "-7% drop-off", value: 1092, percent: 45 },
  ],
  "customer-support": [
    { name: "Session Start", value: 1588, percent: 100 },
    { name: "Goal Initiated", dropOffText: "-20% drop-off (largest)", value: 1268, percent: 80 },
    { name: "Step 1 Complete", dropOffText: "-12% drop-off", value: 1116, percent: 70 },
    { name: "Step 2 Complete", dropOffText: "-14% drop-off", value: 873, percent: 55 },
    { name: "Goal Completed", dropOffText: "-8% drop-off", value: 746, percent: 47 },
  ],
  sales: [
    { name: "Session Start", value: 500, percent: 100 },
    { name: "Goal Initiated", dropOffText: "-26% drop-off (largest)", value: 370, percent: 74 },
    { name: "Step 1 Complete", dropOffText: "-15% drop-off", value: 292, percent: 58 },
    { name: "Step 2 Complete", dropOffText: "-9% drop-off", value: 245, percent: 49 },
    { name: "Goal Completed", dropOffText: "-6% drop-off", value: 198, percent: 40 },
  ],
};

type AvgCycleRow = {
  name: string;
  value: number;
  widthPct: number;
};

const avgCycleRows: AvgCycleRow[] = [
  { name: "Password Reset", value: 1.2, widthPct: 30 },
  { name: "Order Status", value: 1.1, widthPct: 27 },
  { name: "Billing Inquiry", value: 1.8, widthPct: 45 },
  { name: "Account Update", value: 1.4, widthPct: 35 },
  { name: "Refund Request", value: 2.1, widthPct: 52 },
  { name: "Subscription Mgmt", value: 1.5, widthPct: 37 },
];

type TopTaskRow = {
  task: string;
  related: string[];
  share: string;
  count: string;
  widthPct: number;
};

const topTaskRows: TopTaskRow[] = [
  {
    task: "Verify Identity",
    related: ["Fetch Account", "Check Permissions"],
    share: "16.4%",
    count: "1,087",
    widthPct: 100,
  },
  {
    task: "Fetch Account",
    related: ["Verify Identity", "Update Records"],
    share: "15.8%",
    count: "1,045",
    widthPct: 99,
  },
  {
    task: "Process Payment",
    related: ["Verify Identity", "Generate Receipt"],
    share: "13.2%",
    count: "873",
    widthPct: 87,
  },
  {
    task: "Update Records",
    related: ["Fetch Account", "Verify Identity"],
    share: "10.9%",
    count: "722",
    widthPct: 72,
  },
];

type StepConfigStatus = "valid" | "invalid";
type StepConfigCheck = "ok" | "warn";

type StepConfigRow = {
  goal: string;
  steps: number;
  start: StepConfigCheck;
  end: StepConfigCheck;
  status: StepConfigStatus;
};

const stepConfigRows: StepConfigRow[] = [
  { goal: "Password Reset", steps: 4, start: "ok", end: "ok", status: "valid" },
  { goal: "Order Status", steps: 4, start: "ok", end: "ok", status: "valid" },
  { goal: "Billing Inquiry", steps: 4, start: "ok", end: "warn", status: "invalid" },
  { goal: "Account Update", steps: 4, start: "warn", end: "ok", status: "valid" },
  { goal: "Refund Request", steps: 4, start: "ok", end: "ok", status: "invalid" },
  { goal: "Subscription Mgmt", steps: 4, start: "ok", end: "ok", status: "valid" },
];

type SessionCategory =
  | "low_intent_score"
  | "high_escalation"
  | "missing_slots"
  | "low_rating"
  | "long_duration";

type SessionChannel = "webchat" | "voice" | "messenger" | "whatsapp";

type GoalOutcomeSessionRow = {
  id: string;
  category: SessionCategory;
  channel: SessionChannel;
  topIntent: string;
  intentScore: number;
  rating: number;
  escalated: boolean;
  duration: string;
};

const sessionsToInvestigate: GoalOutcomeSessionRow[] = [
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

const GOALS_SESSIONS_TOGGLEABLE_COLUMNS = [
  { id: "category", label: "Category" },
  { id: "channel", label: "Channel" },
  { id: "topIntent", label: "Top Intent" },
  { id: "intentScore", label: "Intent Score" },
  { id: "rating", label: "Rating" },
  { id: "escalated", label: "Escalated" },
  { id: "duration", label: "Duration" },
] as const;

type SessionsToggleableColumnId = (typeof GOALS_SESSIONS_TOGGLEABLE_COLUMNS)[number]["id"];

type GoalsMetricTone = "negative" | "warning" | "positive";

function GoalsMetricPill({ label, tone, icon }: { label: string; tone: GoalsMetricTone; icon: ReactNode }) {
  const cls =
    tone === "positive"
      ? "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
      : tone === "warning"
        ? "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
        : "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";

  return (
    <Badge variant="secondary" className={cn("h-5 gap-1 px-2 text-[11px] font-normal", cls)}>
      {icon}
      {label}
    </Badge>
  );
}

function SessionCategoryCell({ category }: { category: SessionCategory }) {
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

function SessionChannelCell({ channel }: { channel: SessionChannel }) {
  return <TableChannelCell channel={channel} />;
}

function IntentScoreBadge({ score }: { score: number }) {
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

function EscalatedBadge({ escalated }: { escalated: boolean }) {
  return escalated ? (
    <TableBadge className="rounded-md border-transparent bg-primary font-normal text-primary-foreground">
      Yes
    </TableBadge>
  ) : (
    <TableBadge
      variant="outline"
      className="rounded-md border-transparent bg-[#e0dbf5] font-normal text-[#2a1b66] dark:bg-primary/20 dark:text-foreground"
    >
      No
    </TableBadge>
  );
}

function StepCheckIcon({ state }: { state: StepConfigCheck }) {
  return state === "ok" ? (
    <Check className="size-4 text-success" aria-hidden />
  ) : (
    <AlertTriangle className="size-4 text-warning-default" aria-hidden />
  );
}

const PANEL = {
  goalsPerformance: 0,
  goalInventory: 1,
  goalFunnel: 2,
  avgCycles: 3,
  topTasks: 4,
  financialOutcomes: 5,
  stepConfigAudit: 6,
  sessions: 7,
} as const;

export function AIAgentsGoalsOutcomesTab({
  isCompactDashboard,
  showWidgetOverflowMenu = true,
}: {
  isCompactDashboard: boolean;
  showWidgetOverflowMenu?: boolean;
}) {
  const [openAskPanelIndex, setOpenAskPanelIndex] = useState<number | null>(null);
  const [selectedKpiLabel, setSelectedKpiLabel] = useState<string | null>(null);
  const [anchorPoint, setAnchorPoint] = useState<{ x: number; y: number } | null>(null);
  const [goalFilter, setGoalFilter] = useState("all-goals");
  const [sessionSearch, setSessionSearch] = useState("");
  const [selectedSession, setSelectedSession] = useState<CopilotTranscriptSessionContext | null>(null);
  const [sessionsColumnVisibility, setSessionsColumnVisibility] = useState<
    Record<SessionsToggleableColumnId, boolean>
  >(
    () =>
      Object.fromEntries(GOALS_SESSIONS_TOGGLEABLE_COLUMNS.map((c) => [c.id, true])) as Record<
        SessionsToggleableColumnId,
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

  const filteredSessions = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    if (!query) return sessionsToInvestigate;
    return sessionsToInvestigate.filter((row) => {
      return (
        row.id.toLowerCase().includes(query) ||
        row.category.toLowerCase().includes(query) ||
        row.channel.toLowerCase().includes(query) ||
        row.topIntent.toLowerCase().includes(query) ||
        row.duration.toLowerCase().includes(query)
      );
    });
  }, [sessionSearch]);

  const goalFunnelRowsToRender = useMemo(() => {
    return goalFunnelRowsByFilter[goalFilter] ?? goalFunnelRowsByFilter["all-goals"];
  }, [goalFilter]);

  return (
    <div className="space-y-4">
      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1 text-base">Goals Performance</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Goals Performance"
                chartType="bar-stacked"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === PANEL.goalsPerformance}
                onOpenChange={(open) => handleOpenAskChange(PANEL.goalsPerformance, open)}
                selectedKpiLabel={openAskPanelIndex === PANEL.goalsPerformance ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === PANEL.goalsPerformance ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 pb-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-normal leading-none text-[#c71d1a]">98</span>
                <GoalsMetricPill
                  label="Incomplete"
                  tone="negative"
                  icon={<AlertTriangle className="size-3" aria-hidden />}
                />
              </div>
              <div className="flex items-center justify-center gap-2 border-x border-border">
                <span className="text-4xl font-normal leading-none text-[#a37a00]">225</span>
                <GoalsMetricPill
                  label="Partial"
                  tone="warning"
                  icon={<AlertTriangle className="size-3" aria-hidden />}
                />
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-normal leading-none text-[#1c7330]">1779</span>
                <GoalsMetricPill
                  label="Complete"
                  tone="positive"
                  icon={<Check className="size-3" aria-hidden />}
                />
              </div>
            </div>

            <div className="mb-3 flex items-center gap-4">
              <p className="text-xs text-muted-foreground">Grand Total: 2,102 attempts</p>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="flex h-full w-full">
                  <span className="h-full bg-[#E32926]" style={{ width: "4.7%" }} />
                  <span className="h-full bg-[#FFB800]" style={{ width: "10.7%" }} />
                  <span className="h-full bg-[#208337]" style={{ width: "84.6%" }} />
                </div>
              </div>
              <p className="text-sm font-medium text-[#007a55]">84.6% completion rate</p>
            </div>

            <div className="h-[220px] w-full">
              <EChartsCanvas
                option={goalsPerformanceOption}
                onDataSelect={handleChartDataSelect(PANEL.goalsPerformance)}
              />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Goals Performance" chartType="bar-stacked" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1 text-base">Goal Inventory & Coverage</CardTitle>
              <Button size="sm" variant="outline" className="h-8 gap-1.5">
                <Download className="size-3.5" />
                Export
              </Button>
              <WidgetAskAIAndOverflow
                widgetTitle="Goal Inventory & Coverage"
                chartType="metric"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === PANEL.goalInventory}
                onOpenChange={(open) => handleOpenAskChange(PANEL.goalInventory, open)}
                selectedKpiLabel={openAskPanelIndex === PANEL.goalInventory ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === PANEL.goalInventory ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table className="table-auto w-full">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Goal Name</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Steps</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalInventoryRows.map((row) => (
                  <TableRow key={`${row.goalName}-${row.created}`}>
                    <TableCell>{row.goalName}</TableCell>
                    <TableCell>{row.project}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.steps}</TableCell>
                    <TableCell>{row.created}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Goal Inventory & Coverage" chartType="metric" />
            </CardFooter>
        </Card>
      </div>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1 text-base">Goal Funnel</CardTitle>
              <Select value={goalFilter} onValueChange={setGoalFilter}>
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue placeholder="All Goals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-goals">All Goals</SelectItem>
                  <SelectItem value="customer-support">Customer Support</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                </SelectContent>
              </Select>
              <WidgetAskAIAndOverflow
                widgetTitle="Goal Funnel"
                chartType="funnel"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === PANEL.goalFunnel}
                onOpenChange={(open) => handleOpenAskChange(PANEL.goalFunnel, open)}
                selectedKpiLabel={openAskPanelIndex === PANEL.goalFunnel ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === PANEL.goalFunnel ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {goalFunnelRowsToRender.map((row) => (
              <div key={row.name} className="grid grid-cols-[minmax(0,172px)_minmax(0,1fr)_84px] items-center gap-4">
                <div>
                  <p className="text-sm text-foreground">{row.name}</p>
                  {row.dropOffText ? (
                    <p className={cn("text-sm", row.name === "Goal Initiated" ? "text-destructive" : "text-muted-foreground")}>
                      {row.dropOffText}
                    </p>
                  ) : null}
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[#6E56CF]" style={{ width: `${row.percent}%` }} />
                </div>
                <div className="flex items-center justify-end gap-2 text-right text-sm tabular-nums">
                  <span className="text-muted-foreground">{row.value.toLocaleString()}</span>
                  <span className="text-foreground">{row.percent}%</span>
                </div>
              </div>
            ))}
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Goal Funnel" chartType="funnel" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">Avg Cycles by Goal</CardTitle>
                <CardDescription>Friction indicator: lower is better</CardDescription>
              </div>
              <WidgetAskAIAndOverflow
                widgetTitle="Avg Cycles by Goal"
                chartType="bar-horizontal"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === PANEL.avgCycles}
                onOpenChange={(open) => handleOpenAskChange(PANEL.avgCycles, open)}
                selectedKpiLabel={openAskPanelIndex === PANEL.avgCycles ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === PANEL.avgCycles ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {avgCycleRows.map((row) => {
              const barClass =
                row.value < 1.5 ? "bg-[#1ac8a8]" : row.value <= 2 ? "bg-[#7e97a8]" : "bg-[#e754a8]";
              return (
                <div key={row.name} className="grid grid-cols-[minmax(0,164px)_minmax(0,1fr)_33px] items-center gap-3">
                  <p className="text-sm text-foreground">{row.name}</p>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className={cn("h-full rounded-full", barClass)} style={{ width: `${row.widthPct}%` }} />
                  </div>
                  <p className="text-sm tabular-nums text-foreground">{row.value.toFixed(1)}</p>
                </div>
              );
            })}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-1">
              <span className="inline-flex items-center gap-2 text-xs text-foreground">
                <span className="size-2 rounded-full bg-[#1ac8a8]" />
                {"<1.5 (Good)"}
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-foreground">
                <span className="size-2 rounded-full bg-[#7e97a8]" />
                1.5-2.0 (Moderate)
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-foreground">
                <span className="size-2 rounded-full bg-[#e754a8]" />
                {">2.0 (High friction)"}
              </span>
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Avg Cycles by Goal" chartType="bar-horizontal" />
            </CardFooter>
        </Card>
      </div>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">Top Tasks</CardTitle>
                <CardDescription>Total tasks reached: 6,623</CardDescription>
              </div>
              <WidgetAskAIAndOverflow
                widgetTitle="Top Tasks"
                chartType="bar-horizontal"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === PANEL.topTasks}
                onOpenChange={(open) => handleOpenAskChange(PANEL.topTasks, open)}
                selectedKpiLabel={openAskPanelIndex === PANEL.topTasks ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === PANEL.topTasks ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topTaskRows.map((row) => (
              <div key={`${row.task}-${row.count}`} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-foreground">{row.task}</p>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    {row.related.map((chip) => (
                      <Badge
                        key={chip}
                        variant="outline"
                        className="h-5 border-[#6E56CF]/30 bg-[#6E56CF]/10 px-2 text-xs font-normal text-[#6E56CF]"
                      >
                        {chip}
                      </Badge>
                    ))}
                  </div>
                  <div className="ml-auto flex items-center gap-3 text-sm tabular-nums">
                    <span>{row.share}</span>
                    <span className="text-muted-foreground">{row.count}</span>
                  </div>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[#6E56CF]" style={{ width: `${row.widthPct}%` }} />
                </div>
              </div>
            ))}
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Top Tasks" chartType="bar-horizontal" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="flex-1 text-base">Financial Outcomes</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Financial Outcomes"
                chartType="bar-grouped"
                showOverflowMenu={showWidgetOverflowMenu}
                open={openAskPanelIndex === PANEL.financialOutcomes}
                onOpenChange={(open) => handleOpenAskChange(PANEL.financialOutcomes, open)}
                selectedKpiLabel={openAskPanelIndex === PANEL.financialOutcomes ? selectedKpiLabel : null}
                anchorPoint={openAskPanelIndex === PANEL.financialOutcomes ? anchorPoint : null}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 pb-4">
              <div className="space-y-1 border-r border-border pr-3">
                <p className="inline-flex items-center gap-1 text-sm text-[#3a0e74]">
                  <Clock3 className="size-3" aria-hidden />
                  Time Saved
                </p>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-normal leading-none text-[#2a1b66]">529h</h3>
                  <Badge variant="outline" className="h-5 border-[#8630e8]/35 bg-[#8630e8]/10 text-xs font-normal text-[#3a0e74]">
                    <TrendingUp className="size-3" aria-hidden />
                    +15.2%
                  </Badge>
                </div>
              </div>

              <div className="space-y-1 border-r border-border pr-3">
                <p className="inline-flex items-center gap-1 text-sm text-[#b23b00]">
                  <DollarSign className="size-3" aria-hidden />
                  Cost Savings
                </p>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-normal leading-none text-[#2a1b66]">$74.3k</h3>
                  <Badge variant="outline" className="h-5 border-[#FF620A]/35 bg-[#FF620A]/10 text-xs font-normal text-[#b23b00]">
                    <TrendingUp className="size-3" aria-hidden />
                    +12.4%
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <p className="inline-flex items-center gap-1 text-sm text-[#68850f]">
                  <DollarSign className="size-3" aria-hidden />
                  Revenue
                </p>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-normal leading-none text-[#2a1b66]">$27.9k</h3>
                  <Badge variant="outline" className="h-5 border-[#A8D61D]/35 bg-[#A8D61D]/10 text-xs font-normal text-[#68850f]">
                    <TrendingUp className="size-3" aria-hidden />
                    +8.7%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="h-[220px] w-full">
              <EChartsCanvas
                option={financialOutcomesOption}
                onDataSelect={handleChartDataSelect(PANEL.financialOutcomes)}
              />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Financial Outcomes" chartType="bar-grouped" />
            </CardFooter>
        </Card>
      </div>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="flex-1 text-base">Step Config Audit</CardTitle>
            <Badge variant="outline" className="h-5 border-red-500/35 bg-red-500/10 px-2 text-xs font-normal text-[#a0152a]">
              2 Invalid
            </Badge>
            <WidgetAskAIAndOverflow
              widgetTitle="Step Config Audit"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
              open={openAskPanelIndex === PANEL.stepConfigAudit}
              onOpenChange={(open) => handleOpenAskChange(PANEL.stepConfigAudit, open)}
              selectedKpiLabel={openAskPanelIndex === PANEL.stepConfigAudit ? selectedKpiLabel : null}
              anchorPoint={openAskPanelIndex === PANEL.stepConfigAudit ? anchorPoint : null}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table className="table-auto w-full">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Goal</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stepConfigRows.map((row, idx) => (
                <TableRow key={`${row.goal}-${idx}`}>
                  <TableCell>{row.goal}</TableCell>
                  <TableCell className="tabular-nums">{row.steps}</TableCell>
                  <TableCell>
                    <StepCheckIcon state={row.start} />
                  </TableCell>
                  <TableCell>
                    <StepCheckIcon state={row.end} />
                  </TableCell>
                  <TableCell>
                    {row.status === "valid" ? (
                      <TableBadge variant="outline" className="border-emerald-500/35 bg-emerald-500/10 font-normal text-[#10743f]">
                        Valid
                      </TableBadge>
                    ) : (
                      <TableBadge variant="outline" className="border-red-500/35 bg-red-500/10 font-normal text-[#a0152a]">
                        Invalid
                      </TableBadge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Step Config Audit" chartType="metric" />
          </CardFooter>
      </Card>

      <Card className="group/widget min-w-0 transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="flex-1 text-base">Sessions to Investigate</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Sessions to Investigate"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
              open={openAskPanelIndex === PANEL.sessions}
              onOpenChange={(open) => handleOpenAskChange(PANEL.sessions, open)}
              selectedKpiLabel={openAskPanelIndex === PANEL.sessions ? selectedKpiLabel : null}
              anchorPoint={openAskPanelIndex === PANEL.sessions ? anchorPoint : null}
            />
          </div>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8"
                aria-label="Search sessions"
                placeholder="Search"
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
              />
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
                  {GOALS_SESSIONS_TOGGLEABLE_COLUMNS.map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col.id}
                      checked={sessionsColumnVisibility[col.id]}
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={(checked) =>
                        setSessionsColumnVisibility((prev) => ({
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
                  {sessionsColumnVisibility.category ? <TableHead>Category</TableHead> : null}
                  {sessionsColumnVisibility.channel ? <TableHead>Channel</TableHead> : null}
                  {sessionsColumnVisibility.topIntent ? <TableHead>Top Intent</TableHead> : null}
                  {sessionsColumnVisibility.intentScore ? <TableHead>Intent Score</TableHead> : null}
                  {sessionsColumnVisibility.rating ? <TableHead>Rating</TableHead> : null}
                  {sessionsColumnVisibility.escalated ? <TableHead>Escalated</TableHead> : null}
                  {sessionsColumnVisibility.duration ? <TableHead>Duration</TableHead> : null}
                  <TableHead className="whitespace-nowrap pl-2 pr-4 text-right">
                    <span className="sr-only">Transcript actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.id}</TableCell>
                    {sessionsColumnVisibility.category ? (
                      <TableCell>
                        <SessionCategoryCell category={row.category} />
                      </TableCell>
                    ) : null}
                    {sessionsColumnVisibility.channel ? (
                      <TableCell>
                        <SessionChannelCell channel={row.channel} />
                      </TableCell>
                    ) : null}
                    {sessionsColumnVisibility.topIntent ? <TableCell>{row.topIntent}</TableCell> : null}
                    {sessionsColumnVisibility.intentScore ? (
                      <TableCell>
                        <IntentScoreBadge score={row.intentScore} />
                      </TableCell>
                    ) : null}
                    {sessionsColumnVisibility.rating ? (
                      <TableCell>
                        <TableRatingStars rating={row.rating} />
                      </TableCell>
                    ) : null}
                    {sessionsColumnVisibility.escalated ? (
                      <TableCell>
                        <EscalatedBadge escalated={row.escalated} />
                      </TableCell>
                    ) : null}
                    {sessionsColumnVisibility.duration ? <TableCell>{row.duration}</TableCell> : null}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="View Transcript"
                              onClick={() => setSelectedSession(fromAIAgentsGoalsOutcomesSessionRow(row))}
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
        sourceLabel="AI Agents Goals & Outcomes"
      />
    </div>
  );
}
