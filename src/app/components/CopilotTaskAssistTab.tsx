import type { EChartsCoreOption } from "echarts";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  CircleGauge,
  Columns3,
  Download,
  LineChart,
  MessageSquare,
  Search,
} from "lucide-react";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { EChartsCanvas } from "./EChartsCanvas";
import { InsetMetricTile } from "./InsetMetricTile";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import { CopilotSessionTranscriptDialog } from "./CopilotSessionTranscriptDialog";
import { CopilotProgressBar } from "./CopilotProgressBar";
import { TableAgentCell } from "./TableAgentCell";
import { TableChannelCell } from "./TableChannelCell";
import { TableStatusBadge, tableStatusToneFromOutcome } from "./TableStatusBadges";
import { cn } from "./ui/utils";
import { copilotAiInsightsIds } from "../data/copilot-ai-insights";
import {
  fromCopilotTaskAssistRow,
  type CopilotTranscriptSessionContext,
} from "../data/copilot-session-transcript";
import {
  expandRowsForPagination,
  mutateContactId,
  shiftMinuteSecondDuration,
} from "../data/paginated-table-mocks";

export interface CopilotTaskAssistTabProps {
  isCompactDashboard: boolean;
  showWidgetOverflowMenu?: boolean;
}

type SessionColumnId =
  | "contact"
  | "channel"
  | "agent"
  | "skill"
  | "tasks"
  | "duration"
  | "intent"
  | "outcome"
  | "actions";

type SessionRow = {
  contact: string;
  channel: string;
  agent: string;
  skill: string;
  tasks: number;
  duration: string;
  intent: string;
  outcome: string;
};

const taskAssistKpis: Array<{
  label: string;
  value: string;
  detail: string;
  supportingText: string;
}> = [
  {
    label: "Task Card Trigger Rate",
    value: "100%",
    detail: "353 of 353 enabled",
    supportingText: "Current trigger coverage",
  },
  {
    label: "Total Task Fires",
    value: "1,020",
    detail: "From MPower agent tasks",
    supportingText: "Triggered task cards",
  },
  {
    label: "Interactions Covered",
    value: "353",
    detail: "of 694 total (50.9%)",
    supportingText: "Coverage penetration",
  },
];

const triggerRateBySkillRows = [
  { skill: "Billing", fires: 272, rate: 26.7, barClassName: "bg-[#6E56CF]" },
  { skill: "Sales", fires: 262, rate: 25.7, barClassName: "bg-[#6E56CF]" },
  { skill: "Tech Support", fires: 191, rate: 18.7, barClassName: "bg-[#208337]" },
  { skill: "General", fires: 148, rate: 14.5, barClassName: "bg-[#FFB800]" },
  { skill: "Retention", fires: 147, rate: 14.4, barClassName: "bg-[#434BA3]" },
] as const;

const topTaskCardRules = [
  { rank: 1, rule: "Send Confirmation Email", fires: 78, rate: 7.6, done: 51.3 },
  { rank: 2, rule: "Generate Quote", fires: 76, rate: 7.5, done: 64.5 },
  { rank: 3, rule: "Schedule Callback", fires: 74, rate: 7.3, done: 51.4 },
  { rank: 4, rule: "Check Warranty Status", fires: 73, rate: 7.2, done: 53.4 },
  { rank: 5, rule: "Apply Discount Code", fires: 72, rate: 7.1, done: 54.2 },
  { rank: 6, rule: "Escalate to Supervisor", fires: 71, rate: 7.0, done: 49.3 },
  { rank: 7, rule: "Process Return", fires: 70, rate: 6.9, done: 58.6 },
  { rank: 8, rule: "Transfer to Department", fires: 70, rate: 6.9, done: 60.0 },
  { rank: 9, rule: "Activate Service", fires: 69, rate: 6.8, done: 49.3 },
  { rank: 10, rule: "Process Refund", fires: 65, rate: 6.4, done: 52.3 },
] as const;

const taskDurationDistributionOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 12, bottom: 28 },
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, appendToBody: true },
  xAxis: {
    type: "category",
    data: ["0-15s", "16-30s", "31-60s", "1-2m", "2-3m", "3m+"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  yAxis: {
    type: "value",
    min: 0,
    max: 380,
    interval: 95,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 34,
      data: [52, 87, 132, 365, 332, 33],
      itemStyle: {
        color: (params: { dataIndex: number }) =>
          ["#208337", "#434BA3", "#6E56CF", "#FFB800", "#E32926", "#208337"][params.dataIndex] ?? "#6E56CF",
        borderRadius: [6, 6, 0, 0],
      },
    },
  ],
};

const taskConfidenceDistributionOption: EChartsCoreOption = {
  grid: { left: 44, right: 12, top: 12, bottom: 28 },
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
    min: 0,
    max: 380,
    interval: 95,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { type: "dashed", color: "hsl(var(--muted-foreground))" } },
    axisLabel: { color: "hsl(var(--muted-foreground))" },
  },
  series: [
    {
      type: "bar",
      barMaxWidth: 34,
      data: [2, 21, 124, 368, 328, 156],
      itemStyle: { color: "#6E56CF", borderRadius: [6, 6, 0, 0] },
    },
  ],
};

const taskErrorSummary = [
  { label: "Total Tasks", value: "1,020", className: "bg-muted/70 text-foreground" },
  { label: "Errors", value: "27", className: "bg-red-100 text-red-700" },
  { label: "Error Rate", value: "2.6%", className: "bg-emerald-100 text-emerald-700" },
] as const;

const topErrorCodes = [
  { code: "TASK-ERR-105", count: 2, rate: 7.4 },
  { code: "TASK-ERR-408", count: 1, rate: 3.7 },
  { code: "TASK-ERR-507", count: 1, rate: 3.7 },
  { code: "TASK-ERR-695", count: 1, rate: 3.7 },
  { code: "TASK-ERR-783", count: 1, rate: 3.7 },
  { code: "TASK-ERR-628", count: 1, rate: 3.7 },
  { code: "TASK-ERR-759", count: 1, rate: 3.7 },
  { code: "TASK-ERR-905", count: 1, rate: 3.7 },
  { code: "TASK-ERR-376", count: 1, rate: 3.7 },
  { code: "TASK-ERR-351", count: 1, rate: 3.7 },
] as const;

const triggerEventBreakdownRows = [
  { event: "Policy Trigger", count: 186, rate: 18.2, barClassName: "bg-[#6E56CF]" },
  { event: "Customer Request", count: 172, rate: 16.9, barClassName: "bg-[#6E56CF]" },
  { event: "Time Based", count: 171, rate: 16.8, barClassName: "bg-[#208337]" },
  { event: "System Detection", count: 168, rate: 16.5, barClassName: "bg-[#FFB800]" },
  { event: "Escalation Rule", count: 163, rate: 16.0, barClassName: "bg-[#434BA3]" },
  { event: "Sentiment Change", count: 160, rate: 15.7, barClassName: "bg-[#E32926]" },
] as const;

const actionComplexityDistributionRows = [
  { label: "1 action", count: 265, rate: 26.0 },
  { label: "2 actions", count: 243, rate: 23.8 },
  { label: "3 actions", count: 263, rate: 25.8 },
  { label: "4 actions", count: 249, rate: 24.4 },
] as const;

const topActionsRows = [
  { rank: 1, action: "Approve", count: 441, rate: 17.4 },
  { rank: 2, action: "Validate", count: 429, rate: 16.9 },
  { rank: 3, action: "Lookup", count: 426, rate: 16.8 },
  { rank: 4, action: "Update", count: 420, rate: 16.6 },
  { rank: 5, action: "Notify", count: 412, rate: 16.2 },
  { rank: 6, action: "Create", count: 408, rate: 16.1 },
] as const;

const sessionColumnOptions: Array<{ id: SessionColumnId; label: string }> = [
  { id: "contact", label: "Contact" },
  { id: "agent", label: "Agent" },
  { id: "channel", label: "Channel" },
  { id: "skill", label: "Skill" },
  { id: "tasks", label: "Tasks" },
  { id: "duration", label: "Duration" },
  { id: "intent", label: "Intent" },
  { id: "outcome", label: "Outcome" },
  { id: "actions", label: "Actions" },
];

const sessionBaseRows: SessionRow[] = [
  {
    contact: "CNT-00852",
    channel: "Voice",
    agent: "Nicole Allen",
    skill: "General",
    tasks: 5,
    duration: "29m 54s",
    intent: "plan_upgrade",
    outcome: "Resolved",
  },
  {
    contact: "CNT-00989",
    channel: "Voice",
    agent: "Andrew Lewis",
    skill: "Retention",
    tasks: 5,
    duration: "1m 24s",
    intent: "feature_request",
    outcome: "Pending",
  },
  {
    contact: "CNT-00597",
    channel: "Webchat",
    agent: "Lisa White",
    skill: "Retention",
    tasks: 5,
    duration: "23m 3s",
    intent: "product_info",
    outcome: "Closed - No Action",
  },
  {
    contact: "CNT-01199",
    channel: "Voice",
    agent: "Robert Anderson",
    skill: "Tech Support",
    tasks: 5,
    duration: "7m 58s",
    intent: "billing_inquiry",
    outcome: "Closed - No Action",
  },
  {
    contact: "CNT-01604",
    channel: "Voice",
    agent: "Sarah Johnson",
    skill: "Billing",
    tasks: 5,
    duration: "1m 16s",
    intent: "billing_inquiry",
    outcome: "Customer Satisfied",
  },
  {
    contact: "CNT-00024",
    channel: "Webchat",
    agent: "David Brown",
    skill: "Billing",
    tasks: 5,
    duration: "21m 0s",
    intent: "billing_inquiry",
    outcome: "Follow-up Required",
  },
  {
    contact: "CNT-00815",
    channel: "Voice",
    agent: "Stephanie Walker",
    skill: "General",
    tasks: 5,
    duration: "6m 56s",
    intent: "billing_inquiry",
    outcome: "Pending",
  },
  {
    contact: "CNT-01871",
    channel: "Voice",
    agent: "Robert Anderson",
    skill: "Tech Support",
    tasks: 5,
    duration: "23m 42s",
    intent: "order_status",
    outcome: "Follow-up Required",
  },
  {
    contact: "CNT-00386",
    channel: "Voice",
    agent: "Daniel Jackson",
    skill: "Sales",
    tasks: 5,
    duration: "5m 23s",
    intent: "product_info",
    outcome: "Customer Satisfied",
  },
  {
    contact: "CNT-01776",
    channel: "WhatsApp",
    agent: "Daniel Jackson",
    skill: "Sales",
    tasks: 5,
    duration: "9m 30s",
    intent: "password_reset",
    outcome: "Follow-up Required",
  },
];

const sessionRows: SessionRow[] = expandRowsForPagination(
  sessionBaseRows,
  ({ baseRow, cycle, baseIndex, baseLength }) => {
    if (cycle === 0) return { ...baseRow };

    const duplicateOrdinal = (cycle - 1) * baseLength + baseIndex + 1;
    return {
      ...baseRow,
      contact: mutateContactId(baseRow.contact, duplicateOrdinal),
      duration: shiftMinuteSecondDuration(baseRow.duration, (duplicateOrdinal % 6) - 2, duplicateOrdinal % 17),
      tasks: Math.max(2, Math.min(8, baseRow.tasks + ((duplicateOrdinal % 5) - 2))),
    };
  },
);
const taskAssistSessionsDataTimestamp = "Data as of ~3:26 PM (~30 min delay)";

function rankRate(rate: number) {
  return `${rate.toFixed(1).replace(/\.0$/, "")}%`;
}

export function CopilotTaskAssistTab({
  isCompactDashboard,
  showWidgetOverflowMenu = true,
}: CopilotTaskAssistTabProps) {
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionPage, setSessionPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState<CopilotTranscriptSessionContext | null>(null);
  const [sessionColumnVisibility, setSessionColumnVisibility] = useState<Record<SessionColumnId, boolean>>(
    () =>
      Object.fromEntries(sessionColumnOptions.map((column) => [column.id, true])) as Record<
        SessionColumnId,
        boolean
      >,
  );

  const filteredSessionRows = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    if (!query) return sessionRows;

    return sessionRows.filter((row) => {
      return (
        row.contact.toLowerCase().includes(query) ||
        row.channel.toLowerCase().includes(query) ||
        row.agent.toLowerCase().includes(query) ||
        row.skill.toLowerCase().includes(query) ||
        row.intent.toLowerCase().includes(query) ||
        row.outcome.toLowerCase().includes(query)
      );
    });
  }, [sessionSearch]);

  const sessionPageSize = 10;
  const sessionTotalPages = Math.max(1, Math.ceil(filteredSessionRows.length / sessionPageSize));
  const paginatedSessionRows = useMemo(() => {
    const start = (sessionPage - 1) * sessionPageSize;
    return filteredSessionRows.slice(start, start + sessionPageSize);
  }, [filteredSessionRows, sessionPage]);

  useEffect(() => {
    setSessionPage((currentPage) => Math.min(Math.max(currentPage, 1), sessionTotalPages));
  }, [sessionTotalPages]);

  return (
    <div className="space-y-4">
      <HeaderAIInsightsRow dashboardId={copilotAiInsightsIds.taskAssist} />

      <h3 className="mt-8 flex items-center gap-2 tracking-tight">
        <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Key Performance Indicators
      </h3>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
        {taskAssistKpis.map((kpi) => (
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
              <div className="mt-1 space-y-1">
                <KpiMetricValueTitle value={kpi.value} />
                <CardDescription>{kpi.detail}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{kpi.supportingText}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="!mt-8 flex items-center gap-2 tracking-tight">
        <LineChart className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Insights & Analysis
      </h3>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Trigger Rate by Skill</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Trigger Rate by Skill"
                chartType="bar-horizontal"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>Click a skill to drill down</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {triggerRateBySkillRows.map((row) => (
              <div key={row.skill} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">{row.skill}</span>
                  <span className="text-muted-foreground">{row.fires} fires</span>
                </div>
                <div className="flex items-center gap-3">
                  <CopilotProgressBar
                    value={row.rate}
                    className="h-3 flex-1"
                    indicatorClassName={row.barClassName}
                  />
                  <span className="w-14 text-right text-sm font-semibold tabular-nums">{rankRate(row.rate)}</span>
                </div>
              </div>
            ))}
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Trigger Rate by Skill" chartType="bar-horizontal" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Top Task Card Rules</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Top Task Card Rules"
                chartType="metric"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>Click a rule to drill down</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topTaskCardRules.map((row) => (
              <div
                key={row.rank}
                className="grid grid-cols-[30px_minmax(0,1fr)_45px_55px_84px] items-center gap-2 text-sm"
              >
                <Badge variant="secondary" className="rounded-full bg-muted text-primary tabular-nums">
                  {row.rank}
                </Badge>
                <span className="truncate text-foreground">{row.rule}</span>
                <span className="text-right tabular-nums text-muted-foreground">{row.fires}</span>
                <span className="text-right tabular-nums font-semibold text-primary">{rankRate(row.rate)}</span>
                <span className="text-right tabular-nums text-muted-foreground">{rankRate(row.done)} done</span>
              </div>
            ))}
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Top Task Card Rules" chartType="metric" />
            </CardFooter>
        </Card>
      </div>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Task Duration Distribution</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Task Duration Distribution"
                chartType="bar-vertical"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>How long tasks take from trigger to completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <EChartsCanvas option={taskDurationDistributionOption} />
            </div>
          </CardContent>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">
                Task Confidence Distribution</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Task Confidence Distribution"
                chartType="bar-vertical"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>Confidence scores of triggered task cards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <EChartsCanvas option={taskConfidenceDistributionOption} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Task Error Analysis</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Task Error Analysis"
                chartType="metric"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>Tasks that failed or encountered errors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {taskErrorSummary.map((item) => (
                <InsetMetricTile
                  key={item.label}
                  value={item.value}
                  label={item.label}
                  className={item.className}
                  labelClassName="text-sm text-muted-foreground"
                />
              ))}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Top Error Codes</p>
              {topErrorCodes.map((row, index) => (
                <div key={row.code} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_38px_52px] items-center gap-3">
                  <p className="truncate text-red-700">{row.code}</p>
                  <CopilotProgressBar
                    value={Math.max(row.rate * 6, index === 0 ? 24 : 12)}
                    className="h-2"
                    indicatorClassName="bg-red-500"
                  />
                  <p className="text-right tabular-nums text-muted-foreground">{row.count}</p>
                  <p className="text-right tabular-nums text-muted-foreground">{rankRate(row.rate)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">
                Trigger Event Breakdown</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Trigger Event Breakdown"
                chartType="bar-horizontal"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>What events triggered task cards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {triggerEventBreakdownRows.map((row) => (
              <div key={row.event} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">{row.event}</span>
                  <span className="tabular-nums text-muted-foreground">{row.count}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CopilotProgressBar
                    value={row.rate * 3.6}
                    className="h-3 flex-1"
                    indicatorClassName={row.barClassName}
                  />
                  <span className="w-14 text-right text-sm font-semibold tabular-nums">{rankRate(row.rate)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">Action Complexity</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Action Complexity"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Number of actions per task and most common actions</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 xl:grid-cols-2">
          <section className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Actions per Task Distribution</p>
            <InsetMetricTile
              value="2.5"
              label="Avg Actions per Task"
              className="w-full border border-primary/20 bg-primary/[0.04]"
              valueClassName="text-primary"
              labelClassName="text-sm text-muted-foreground"
            />
            <div className="space-y-2">
              {actionComplexityDistributionRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[88px_minmax(0,1fr)_72px_64px] items-center gap-3 text-sm"
                >
                  <span className="text-foreground">{row.label}</span>
                  <CopilotProgressBar
                    value={row.rate * 3.6}
                    className="h-2"
                    indicatorClassName="bg-muted-foreground/45"
                  />
                  <span className="text-right tabular-nums text-muted-foreground">{row.count}</span>
                  <span className="text-right tabular-nums text-muted-foreground">{rankRate(row.rate)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <p className="text-sm font-medium text-muted-foreground">Top Actions</p>
            <div className="space-y-2">
              {topActionsRows.map((row) => (
                <div
                  key={row.rank}
                  className="grid grid-cols-[30px_minmax(0,1fr)_58px_58px] items-center gap-3 text-sm"
                >
                  <Badge variant="secondary" className="rounded-full bg-muted text-primary tabular-nums">
                    {row.rank}
                  </Badge>
                  <span className="truncate text-foreground">{row.action}</span>
                  <span className="text-right tabular-nums text-muted-foreground">{row.count}</span>
                  <span className="text-right tabular-nums font-semibold text-foreground">{rankRate(row.rate)}</span>
                </div>
              ))}
            </div>
          </section>
        </CardContent>
      </Card>

      <Card className="group/widget min-w-0 transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base flex-1">Sessions to Investigate</CardTitle>
            <p className="text-xs text-muted-foreground">{taskAssistSessionsDataTimestamp}</p>
            <WidgetAskAIAndOverflow
              widgetTitle="Sessions to Investigate"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Sessions with task card triggers, sorted by task count</CardDescription>
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-8 pl-8"
                placeholder="Search sessions..."
                value={sessionSearch}
                onChange={(event) => {
                  setSessionSearch(event.target.value);
                  setSessionPage(1);
                }}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1.5">
                  <Columns3 className="h-3.5 w-3.5" />
                  Columns
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {sessionColumnOptions.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={sessionColumnVisibility[column.id]}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) => {
                      setSessionPage(1);
                      setSessionColumnVisibility((prev) => ({
                        ...prev,
                        [column.id]: checked === true,
                      }));
                    }}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="min-w-0 w-full">
            <Table className="table-auto w-full">
              <TableHeader>
                <TableRow>
                  {sessionColumnVisibility.contact ? <TableHead>Contact</TableHead> : null}
                  {sessionColumnVisibility.agent ? <TableHead>Agent</TableHead> : null}
                  {sessionColumnVisibility.channel ? <TableHead>Channel</TableHead> : null}
                  {sessionColumnVisibility.skill ? <TableHead>Skill</TableHead> : null}
                  {sessionColumnVisibility.tasks ? <TableHead>Tasks</TableHead> : null}
                  {sessionColumnVisibility.duration ? <TableHead>Duration</TableHead> : null}
                  {sessionColumnVisibility.intent ? <TableHead>Intent</TableHead> : null}
                  {sessionColumnVisibility.outcome ? <TableHead>Outcome</TableHead> : null}
                  {sessionColumnVisibility.actions ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessionRows.map((row) => (
                  <TableRow key={row.contact}>
                    {sessionColumnVisibility.contact ? <TableCell>{row.contact}</TableCell> : null}
                    {sessionColumnVisibility.agent ? (
                      <TableCell>
                        <TableAgentCell name={row.agent} />
                      </TableCell>
                    ) : null}
                    {sessionColumnVisibility.channel ? (
                      <TableCell>
                        <TableChannelCell channel={row.channel} />
                      </TableCell>
                    ) : null}
                    {sessionColumnVisibility.skill ? <TableCell>{row.skill}</TableCell> : null}
                    {sessionColumnVisibility.tasks ? (
                      <TableCell className="text-primary tabular-nums">{row.tasks}</TableCell>
                    ) : null}
                    {sessionColumnVisibility.duration ? <TableCell className="tabular-nums">{row.duration}</TableCell> : null}
                    {sessionColumnVisibility.intent ? <TableCell>{row.intent}</TableCell> : null}
                    {sessionColumnVisibility.outcome ? (
                      <TableCell>
                        <TableStatusBadge
                          label={row.outcome}
                          tone={tableStatusToneFromOutcome(row.outcome)}
                        />
                      </TableCell>
                    ) : null}
                    {sessionColumnVisibility.actions ? (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="View Transcript"
                                onClick={() => setSelectedSession(fromCopilotTaskAssistRow(row))}
                              >
                                <MessageSquare className="h-4 w-4" aria-hidden />
                                <span className="sr-only">View Transcript</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">View Transcript</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Download">
                                <Download className="h-4 w-4" aria-hidden />
                                <span className="sr-only">Download</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Download</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setSessionPage((currentPage) => Math.max(1, currentPage - 1));
                    }}
                    aria-disabled={sessionPage <= 1}
                    className={sessionPage <= 1 ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                {Array.from({ length: sessionTotalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        isActive={pageNumber === sessionPage}
                        onClick={(event) => {
                          event.preventDefault();
                          setSessionPage(pageNumber);
                        }}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setSessionPage((currentPage) => Math.min(sessionTotalPages, currentPage + 1));
                    }}
                    aria-disabled={sessionPage >= sessionTotalPages}
                    className={sessionPage >= sessionTotalPages ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      <CopilotSessionTranscriptDialog
        open={selectedSession !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedSession(null);
        }}
        session={selectedSession}
        sourceLabel="Copilot Task Assist"
      />
    </div>
  );
}
