import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  CircleGauge,
  Download,
  LineChart,
  MessageSquare,
  Search,
  Settings2,
} from "lucide-react";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { EChartsCanvas } from "./EChartsCanvas";
import { InsetMetricTile } from "./InsetMetricTile";
import { Input } from "./ui/input";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { ScrollArea } from "./ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { CopilotSessionTranscriptDialog } from "./CopilotSessionTranscriptDialog";
import { CopilotProgressBar } from "./CopilotProgressBar";
import { TableAgentCell } from "./TableAgentCell";
import { TableBadge } from "./TableBadge";
import { TableChannelCell } from "./TableChannelCell";
import { TableStatusBadge, tableStatusToneFromSentiment } from "./TableStatusBadges";
import { cn } from "./ui/utils";
import { copilotAiInsightsIds } from "../data/copilot-ai-insights";
import {
  agentAcceptanceRows,
  autoSummarySessionColumns,
  autoSummarySessionsDataTimestamp,
  copilotAutoSummaryKpis,
  editLengthDeltaRows,
  editLengthDeltaStats,
  editRateTrendOption,
  editReasonRows,
  intentDistributionOption,
  outcomeBreakdownOption,
  outcomeDistributionCountOption,
  outcomeDistributionRateOption,
  sessionsToInvestigateRows,
  similarityScoreDistributionOption,
  skillGroupAcceptanceRows,
  summaryWordCountDistributionOption,
  timeToSaveAnalysisOption,
  timeToSaveStats,
  tokenUsageTotals,
  tokenUsageTrendOption,
  type AutoSummarySessionColumnId,
  type CopilotAutoSummaryKpi,
  type OutcomeSeriesMode,
} from "../data/copilot-auto-summary";
import {
  fromCopilotAutoSummaryRow,
  type CopilotTranscriptSessionContext,
} from "../data/copilot-session-transcript";

function trendBadgeClass(trend: string): string {
  if (trend.trim().startsWith("-")) {
    return "border-transparent bg-red-100 text-red-600";
  }
  return "border-transparent bg-emerald-100 text-emerald-700";
}

function skillBarClass(tone: "purple" | "blue" | "green" | "orange") {
  if (tone === "green") return "bg-emerald-700";
  if (tone === "orange") return "bg-amber-500";
  if (tone === "blue") return "bg-indigo-600";
  return "bg-violet-600";
}

function reasonBarClass(tone: "purple" | "red" | "orange" | "green" | "gray" | "blue") {
  if (tone === "red") return "bg-red-600";
  if (tone === "orange") return "bg-amber-500";
  if (tone === "green") return "bg-emerald-700";
  if (tone === "gray") return "bg-muted-foreground";
  if (tone === "blue") return "bg-indigo-600";
  return "bg-violet-600";
}

function KpiCard({
  kpi,
  showWidgetOverflowMenu,
}: {
  kpi: CopilotAutoSummaryKpi;
  showWidgetOverflowMenu: boolean;
}) {
  return (
    <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
      <CardHeader className="pb-0">
        <div className="flex items-center gap-2">
          <CardDescription className="flex-1">{kpi.label}</CardDescription>
          <WidgetAskAIAndOverflow widgetTitle={kpi.label} chartType="metric" showOverflowMenu={showWidgetOverflowMenu} />
        </div>

        <div className="mt-1 space-y-1">
          <KpiMetricValueTitle value={kpi.value} />
          <CardDescription>{kpi.caption}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{kpi.subcaption}</p>
          <Badge variant="secondary" className={cn("shrink-0", trendBadgeClass(kpi.trend))}>
            {kpi.trend}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export function CopilotAutoSummaryTab({
  isCompactDashboard,
  showWidgetOverflowMenu = true,
}: {
  isCompactDashboard: boolean;
  showWidgetOverflowMenu?: boolean;
}) {
  const [agentSortMode, setAgentSortMode] = useState<"acceptance" | "volume">("acceptance");
  const [outcomeSeriesMode, setOutcomeSeriesMode] = useState<OutcomeSeriesMode>("count");
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionColumnVisibility, setSessionColumnVisibility] = useState<Record<AutoSummarySessionColumnId, boolean>>(
    () =>
      Object.fromEntries(autoSummarySessionColumns.map((col) => [col.id, true])) as Record<
        AutoSummarySessionColumnId,
        boolean
      >,
  );
  const [selectedSession, setSelectedSession] = useState<CopilotTranscriptSessionContext | null>(null);

  const sortedAgentRows = useMemo(() => {
    const rows = [...agentAcceptanceRows];
    if (agentSortMode === "volume") {
      rows.sort((a, b) => b.volume - a.volume || b.acceptancePct - a.acceptancePct);
    } else {
      rows.sort((a, b) => b.acceptancePct - a.acceptancePct || b.volume - a.volume);
    }
    return rows;
  }, [agentSortMode]);

  const maxAgentVolume = useMemo(() => Math.max(...agentAcceptanceRows.map((row) => row.volume)), []);

  const filteredSessionRows = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    if (!query) return sessionsToInvestigateRows;

    return sessionsToInvestigateRows.filter((row) =>
      [
        row.contact,
        row.channel,
        row.agent,
        row.skill,
        row.duration,
        row.intent,
        row.sentiment,
        row.similarity.toFixed(3),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
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
      <HeaderAIInsightsRow dashboardId={copilotAiInsightsIds.autoSummary} />

      <h3 className="mt-8 flex items-center gap-2 tracking-tight">
        <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Key Performance Indicators
      </h3>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4")}>
        {copilotAutoSummaryKpis.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} showWidgetOverflowMenu={showWidgetOverflowMenu} />
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
              <CardTitle className="text-base flex-1">Similarity Score Distribution</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Similarity Score Distribution"
                chartType="bar-vertical"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>Click a bar to drill down</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <EChartsCanvas option={similarityScoreDistributionOption} />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Similarity Score Distribution" chartType="bar-vertical" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Acceptance Rate by Skill Group</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Acceptance Rate by Skill Group"
                chartType="bar-horizontal"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>Click a skill to drill down</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {skillGroupAcceptanceRows.map((row) => (
              <div key={row.skill} className="space-y-2">
                <div className="grid grid-cols-[minmax(0,1fr)_52px] items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{row.skill}</p>
                  <p className="text-right text-sm text-muted-foreground tabular-nums">{row.volume}</p>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_64px] items-center gap-3">
                  <CopilotProgressBar
                    value={row.ratePct}
                    className="h-3"
                    indicatorClassName={skillBarClass(row.tone)}
                  />
                  <p className="text-right text-sm font-semibold tabular-nums text-foreground">{row.ratePct.toFixed(1)}%</p>
                </div>
              </div>
            ))}
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Acceptance Rate by Skill Group" chartType="bar-horizontal" />
            </CardFooter>
        </Card>
      </div>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Acceptance Rate by Agent</CardTitle>
              <ToggleGroup
                type="single"
                value={agentSortMode}
                onValueChange={(next) => {
                  if (next === "acceptance" || next === "volume") {
                    setAgentSortMode(next);
                  }
                }}
                variant="outline"
                size="sm"
                className="mr-1 h-8 w-fit shrink-0"
              >
                <ToggleGroupItem value="acceptance" className="!flex-none px-3 text-xs">
                  By Acceptance
                </ToggleGroupItem>
                <ToggleGroupItem value="volume" className="!flex-none px-3 text-xs">
                  By Volume
                </ToggleGroupItem>
              </ToggleGroup>
              <WidgetAskAIAndOverflow widgetTitle="Acceptance Rate by Agent" chartType="metric" showOverflowMenu={showWidgetOverflowMenu} />
            </div>
            <CardDescription>Click an agent to drill down</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[304px] pr-3">
              <div className="space-y-4">
                {sortedAgentRows.map((row, index) => {
                  const width =
                    agentSortMode === "acceptance"
                      ? row.acceptancePct
                      : (row.volume / Math.max(1, maxAgentVolume)) * 100;

                  return (
                    <div
                      key={row.agent}
                      className="grid grid-cols-[26px_110px_minmax(0,1fr)_68px_34px] items-center gap-2 sm:grid-cols-[26px_148px_minmax(0,1fr)_76px_40px] sm:gap-3"
                    >
                      <div
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold",
                          index < 3
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {index + 1}
                      </div>
                      <p className="truncate text-sm text-foreground">{row.agent}</p>
                      <CopilotProgressBar
                        value={width}
                        className="h-2"
                        indicatorClassName="bg-muted-foreground/40"
                      />
                      <p className="text-right text-sm font-semibold tabular-nums text-foreground">{row.acceptancePct.toFixed(row.acceptancePct % 1 === 0 ? 0 : 1)}%</p>
                      <p className="text-right text-sm tabular-nums text-muted-foreground">{row.volume}</p>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Acceptance Rate by Agent" chartType="metric" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Edit Rate Trend</CardTitle>
              <WidgetAskAIAndOverflow widgetTitle="Edit Rate Trend" chartType="line" showOverflowMenu={showWidgetOverflowMenu} />
            </div>
            <CardDescription>Daily edit rate over the period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <EChartsCanvas option={editRateTrendOption} />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Edit Rate Trend" chartType="line" />
            </CardFooter>
        </Card>
      </div>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">Intent Distribution</CardTitle>
            <WidgetAskAIAndOverflow widgetTitle="Intent Distribution" chartType="bar-vertical" showOverflowMenu={showWidgetOverflowMenu} />
          </div>
          <CardDescription>Click a bar to drill down by intent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full">
            <EChartsCanvas option={intentDistributionOption} />
          </div>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Intent Distribution" chartType="bar-vertical" />
          </CardFooter>
      </Card>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">Edit Reason Classification</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Edit Reason Classification"
              chartType="bar-horizontal"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Reasons agents edit AI-generated summaries</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {editReasonRows.map((row) => (
            <div key={row.reason} className="space-y-2">
              <div className="grid grid-cols-[minmax(0,1fr)_52px] items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{row.reason}</p>
                <p className="text-right text-sm text-muted-foreground tabular-nums">{row.count}</p>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_64px] items-center gap-3">
                <CopilotProgressBar
                  value={row.pct}
                  className="h-2.5"
                  indicatorClassName={reasonBarClass(row.tone)}
                />
                <p className="text-right text-sm font-semibold tabular-nums text-foreground">{row.pct.toFixed(1)}%</p>
              </div>
            </div>
          ))}
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Edit Reason Classification" chartType="bar-horizontal" />
          </CardFooter>
      </Card>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Summary Word Count Distribution</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Summary Word Count Distribution"
                chartType="bar-vertical"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>Post-call summary length distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <EChartsCanvas option={summaryWordCountDistributionOption} />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Summary Word Count Distribution" chartType="bar-vertical" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Token Usage Trend</CardTitle>
              <WidgetAskAIAndOverflow widgetTitle="Token Usage Trend" chartType="line" showOverflowMenu={showWidgetOverflowMenu} />
            </div>
            <CardDescription>Daily average tokens per post-call summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <EChartsCanvas option={tokenUsageTrendOption} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <p>{tokenUsageTotals.totalTokens}</p>
              <p>{tokenUsageTotals.totalSummaries}</p>
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Token Usage Trend" chartType="line" />
            </CardFooter>
        </Card>
      </div>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">Edit Length Delta</CardTitle>
            <WidgetAskAIAndOverflow widgetTitle="Edit Length Delta" chartType="metric" showOverflowMenu={showWidgetOverflowMenu} />
          </div>
          <CardDescription>
            How much agents change summaries when editing (characters added/removed)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn("grid gap-3", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
            <InsetMetricTile
              value={editLengthDeltaStats.editedSummaries}
              label="Edited Summaries"
              className="border bg-muted/30"
              valueClassName="text-foreground"
              labelClassName="text-sm text-muted-foreground"
            />
            <InsetMetricTile
              value={`+${editLengthDeltaStats.avgCharDelta}`}
              label="Avg Char Delta"
              className="border border-emerald-200 bg-emerald-50"
              valueClassName="text-emerald-700"
              labelClassName="text-sm text-muted-foreground"
            />
            <InsetMetricTile
              value={editLengthDeltaStats.addedRemoved}
              label="Added / Removed"
              className="border bg-muted/30"
              valueClassName="text-foreground"
              labelClassName="text-sm text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            {editLengthDeltaRows.map((row) => (
              <div key={row.id} className="grid grid-cols-[110px_minmax(0,1fr)_48px_200px] items-center gap-3 text-sm">
                <p className="truncate font-mono text-muted-foreground">{row.id}</p>
                <p className="tabular-nums text-muted-foreground">
                  {row.beforeChars} chars <span aria-hidden>→</span> {row.afterChars} chars
                </p>
                <p className={cn("text-right tabular-nums font-semibold", row.delta >= 0 ? "text-emerald-700" : "text-red-600")}>
                  {row.delta >= 0 ? `+${row.delta}` : row.delta}
                </p>
                <Badge variant="secondary" className="justify-self-start">
                  {row.reason}
                </Badge>
              </div>
            ))}
          </div>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Edit Length Delta" chartType="metric" />
          </CardFooter>
      </Card>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">Outcome Distribution Over Time</CardTitle>
            <ToggleGroup
              type="single"
              value={outcomeSeriesMode}
              onValueChange={(next) => {
                if (next === "count" || next === "rate") {
                  setOutcomeSeriesMode(next);
                }
              }}
              variant="outline"
              size="sm"
              className="mr-1 h-8 w-fit shrink-0"
            >
              <ToggleGroupItem value="count" className="!flex-none px-3 text-xs">
                Show Count
              </ToggleGroupItem>
              <ToggleGroupItem value="rate" className="!flex-none px-3 text-xs">
                Show Rate
              </ToggleGroupItem>
            </ToggleGroup>
            <WidgetAskAIAndOverflow
              widgetTitle="Outcome Distribution Over Time"
              chartType="line-multi"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Weekly breakdown of summary outcomes by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <EChartsCanvas
              option={outcomeSeriesMode === "count" ? outcomeDistributionCountOption : outcomeDistributionRateOption}
            />
          </div>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Outcome Distribution Over Time" chartType="line-multi" />
          </CardFooter>
      </Card>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">Outcome Breakdown</CardTitle>
            <WidgetAskAIAndOverflow widgetTitle="Outcome Breakdown" chartType="donut" showOverflowMenu={showWidgetOverflowMenu} />
          </div>
          <CardDescription>Distribution of summary outcomes across all sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <EChartsCanvas option={outcomeBreakdownOption} />
          </div>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Outcome Breakdown" chartType="donut" />
          </CardFooter>
      </Card>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">Time-to-Save Analysis</CardTitle>
            <WidgetAskAIAndOverflow widgetTitle="Time-to-Save Analysis" chartType="bar-vertical" showOverflowMenu={showWidgetOverflowMenu} />
          </div>
          <CardDescription>Time taken from summary generation to agent action</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={cn("grid gap-3", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
            <div className="rounded-xl border bg-muted/30 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg</p>
              <p className="text-4xl font-semibold text-foreground">{timeToSaveStats.avg}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Median</p>
              <p className="text-4xl font-semibold text-foreground">{timeToSaveStats.median}</p>
            </div>
            <div className="rounded-xl border bg-muted/30 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">P90</p>
              <p className="text-4xl font-semibold text-amber-700">{timeToSaveStats.p90}</p>
            </div>
          </div>
          <div className="h-[260px] w-full">
            <EChartsCanvas option={timeToSaveAnalysisOption} />
          </div>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Time-to-Save Analysis" chartType="bar-vertical" />
          </CardFooter>
      </Card>

      <Card className="group/widget min-w-0 transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base flex-1">
              Sessions to Investigate</CardTitle>
            <p className="text-xs text-muted-foreground">{autoSummarySessionsDataTimestamp}</p>
            <WidgetAskAIAndOverflow
              widgetTitle="Sessions to Investigate"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Sessions sorted by lowest similarity score</CardDescription>
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
                  <Settings2 className="h-3.5 w-3.5" />
                  Columns
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {autoSummarySessionColumns.map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={sessionColumnVisibility[col.id]}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) => {
                      setSessionPage(1);
                      setSessionColumnVisibility((prev) => ({
                        ...prev,
                        [col.id]: checked === true,
                      }));
                    }}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Table className="table-auto w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                {sessionColumnVisibility.agent ? <TableHead>Agent</TableHead> : null}
                {sessionColumnVisibility.channel ? <TableHead>Channel</TableHead> : null}
                {sessionColumnVisibility.skill ? <TableHead>Skill</TableHead> : null}
                {sessionColumnVisibility.similarity ? <TableHead>Similarity</TableHead> : null}
                {sessionColumnVisibility.duration ? <TableHead>Duration</TableHead> : null}
                {sessionColumnVisibility.intent ? <TableHead>Intent</TableHead> : null}
                {sessionColumnVisibility.sentiment ? <TableHead>Sentiment</TableHead> : null}
                <TableHead className="w-[84px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSessionRows.map((row) => (
                <TableRow key={row.contact}>
                  <TableCell className="tabular-nums">{row.contact}</TableCell>
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
                  {sessionColumnVisibility.similarity ? (
                    <TableCell>
                      <TableBadge variant="secondary" className="border-transparent bg-amber-100 text-amber-700 tabular-nums">
                        {row.similarity.toFixed(3)}
                      </TableBadge>
                    </TableCell>
                  ) : null}
                  {sessionColumnVisibility.duration ? <TableCell className="tabular-nums">{row.duration}</TableCell> : null}
                  {sessionColumnVisibility.intent ? <TableCell>{row.intent}</TableCell> : null}
                  {sessionColumnVisibility.sentiment ? (
                    <TableCell>
                      <TableStatusBadge
                        label={row.sentiment}
                        tone={tableStatusToneFromSentiment(row.sentiment)}
                        labelClassName="capitalize"
                      />
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
                            onClick={() => setSelectedSession(fromCopilotAutoSummaryRow(row))}
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
        sourceLabel="Copilot Auto Summary"
      />
    </div>
  );
}
