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
import { Input } from "./ui/input";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { CopilotSessionTranscriptDialog } from "./CopilotSessionTranscriptDialog";
import { cn } from "./ui/utils";
import { copilotAiInsightsIds } from "../data/copilot-ai-insights";
import {
  copilotRulesEngineKpis,
  ruleEffectivenessOption,
  rulesEngineSessionColumns,
  rulesEngineSessionRows,
  rulesEngineSessionsDataTimestamp,
  ruleTriggerFrequencyRows,
  type RulesEngineSessionColumnId,
} from "../data/copilot-rules-engine";
import {
  fromCopilotRulesEngineRow,
  type CopilotTranscriptSessionContext,
} from "../data/copilot-session-transcript";

function completionBadgeClass(completionPct: number): string {
  if (completionPct >= 70) {
    return "border-transparent bg-emerald-100 text-emerald-700";
  }
  if (completionPct >= 40) {
    return "border-transparent bg-amber-100 text-amber-700";
  }
  return "border-transparent bg-red-100 text-red-600";
}

function outcomeToneClass(outcome: string): string {
  const normalized = outcome.toLowerCase();
  if (normalized.includes("satisfied") || normalized.includes("resolved")) return "text-emerald-700";
  if (normalized.includes("pending") || normalized.includes("follow-up")) return "text-amber-700";
  return "text-muted-foreground";
}

function transferredToneClass(transferred: "Yes" | "No"): string {
  return transferred === "Yes" ? "text-red-600" : "text-foreground";
}

export function CopilotRulesEngineTab({
  isCompactDashboard,
  showWidgetOverflowMenu = true,
}: {
  isCompactDashboard: boolean;
  showWidgetOverflowMenu?: boolean;
}) {
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionColumnVisibility, setSessionColumnVisibility] = useState<Record<RulesEngineSessionColumnId, boolean>>(
    () =>
      Object.fromEntries(rulesEngineSessionColumns.map((col) => [col.id, true])) as Record<
        RulesEngineSessionColumnId,
        boolean
      >,
  );
  const [selectedSession, setSelectedSession] = useState<CopilotTranscriptSessionContext | null>(null);

  const filteredSessionRows = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    if (!query) return rulesEngineSessionRows;

    return rulesEngineSessionRows.filter((row) =>
      [
        row.contact,
        row.channel,
        row.agent,
        String(row.ruleFires),
        row.skill,
        row.duration,
        row.outcome,
        row.transferred,
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
      <HeaderAIInsightsRow dashboardId={copilotAiInsightsIds.rulesEngine} />

      <h3 className="mt-8 flex items-center gap-2 tracking-tight">
        <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Key Performance Indicators
      </h3>

      <div
        className={cn(
          "grid gap-4",
          isCompactDashboard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {copilotRulesEngineKpis.map((kpi) => (
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
                <CardDescription>{kpi.supportingText}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{kpi.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="!mt-8 flex items-center gap-2 tracking-tight">
        <LineChart className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Insights & Analysis
      </h3>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">Rule Trigger Frequency</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Rule Trigger Frequency"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Top rules by fire count with completion rate and avg duration</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="table-auto w-full">
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Rule Name</TableHead>
                <TableHead className="text-right">Fires</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
                <TableHead className="text-right">Completion</TableHead>
                <TableHead className="text-right">Avg Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ruleTriggerFrequencyRows.map((row) => (
                <TableRow key={row.ruleName}>
                  <TableCell className="font-semibold tabular-nums text-muted-foreground">{row.rank}</TableCell>
                  <TableCell className="font-medium">{row.ruleName}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.fires}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.percentTotal.toFixed(1)}%</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <Badge variant="secondary" className={completionBadgeClass(row.completionPct)}>
                      {Number.isInteger(row.completionPct) ? row.completionPct.toFixed(0) : row.completionPct.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {Number.isInteger(row.avgDurationSec) ? row.avgDurationSec.toFixed(0) : row.avgDurationSec.toFixed(1)}s
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Rule Trigger Frequency" chartType="metric" />
          </CardFooter>
      </Card>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">Rule Effectiveness</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Rule Effectiveness"
              chartType="bar-stacked"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Outcome breakdown by rule (completed vs dismissed vs partial vs expired)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[520px] w-full">
            <EChartsCanvas option={ruleEffectivenessOption} />
          </div>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Rule Effectiveness" chartType="bar-stacked" />
          </CardFooter>
      </Card>

      <Card className="group/widget min-w-0 transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base flex-1">Sessions to Investigate</CardTitle>
            <p className="text-xs text-muted-foreground">{rulesEngineSessionsDataTimestamp}</p>
            <WidgetAskAIAndOverflow
              widgetTitle="Sessions to Investigate"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Sessions with rule fires, sorted by fire count</CardDescription>
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
                {rulesEngineSessionColumns.map((col) => (
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
                {sessionColumnVisibility.channel ? <TableHead>Channel</TableHead> : null}
                {sessionColumnVisibility.agent ? <TableHead>Agent</TableHead> : null}
                {sessionColumnVisibility.ruleFires ? <TableHead>Rule Fires</TableHead> : null}
                {sessionColumnVisibility.skill ? <TableHead>Skill</TableHead> : null}
                {sessionColumnVisibility.duration ? <TableHead>Duration</TableHead> : null}
                {sessionColumnVisibility.outcome ? <TableHead>Outcome</TableHead> : null}
                {sessionColumnVisibility.transferred ? <TableHead>Transferred</TableHead> : null}
                <TableHead className="w-[84px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSessionRows.map((row) => (
                <TableRow key={row.contact}>
                  <TableCell className="tabular-nums">{row.contact}</TableCell>
                  {sessionColumnVisibility.channel ? <TableCell>{row.channel}</TableCell> : null}
                  {sessionColumnVisibility.agent ? <TableCell>{row.agent}</TableCell> : null}
                  {sessionColumnVisibility.ruleFires ? (
                    <TableCell className="tabular-nums font-semibold text-[#6752be]">{row.ruleFires}</TableCell>
                  ) : null}
                  {sessionColumnVisibility.skill ? <TableCell>{row.skill}</TableCell> : null}
                  {sessionColumnVisibility.duration ? <TableCell className="tabular-nums">{row.duration}</TableCell> : null}
                  {sessionColumnVisibility.outcome ? (
                    <TableCell className={outcomeToneClass(row.outcome)}>{row.outcome}</TableCell>
                  ) : null}
                  {sessionColumnVisibility.transferred ? (
                    <TableCell className={transferredToneClass(row.transferred)}>{row.transferred}</TableCell>
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
                            onClick={() => setSelectedSession(fromCopilotRulesEngineRow(row))}
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
        sourceLabel="Copilot Rules Engine"
      />
    </div>
  );
}
