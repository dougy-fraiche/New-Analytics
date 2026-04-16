import { useEffect, useMemo, useState } from "react";
import {
  CircleGauge,
  Columns3,
  Download,
  LineChart,
  MessageSquare,
  Search,
} from "lucide-react";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { EChartsCanvas } from "./EChartsCanvas";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import { CopilotSessionTranscriptDialog } from "./CopilotSessionTranscriptDialog";
import { CopilotProgressBar } from "./CopilotProgressBar";
import { cn } from "./ui/utils";
import { copilotAiInsightsIds } from "../data/copilot-ai-insights";
import {
  copilotProxyMetricTiles,
  copilotProxySkillRows,
  copilotRealTimeComparisonRows,
  copilotRealTimeSessionColumnOptions,
  copilotRealTimeSessionRows,
  copilotRealTimeSessionsDataTimestamp,
  copilotRealTimeSummaryKpis,
  copilotStreamingLatencySkillRows,
  realTimeTokenTotals,
  realTimeTokenUsageTrendOption,
  realTimeVolumeTotals,
  realTimeVolumeTrendOption,
  type CopilotRealTimeSessionColumnId,
} from "../data/copilot-real-time-summary";
import {
  fromCopilotRealTimeSummaryRow,
  type CopilotTranscriptSessionContext,
} from "../data/copilot-session-transcript";

function metricTileClassName(tone: "neutral" | "primary" | "warning") {
  if (tone === "primary") return "border-[#c8c2eb] bg-[#f4f2fc]";
  if (tone === "warning") return "border-[#ece2bf] bg-[#f4edd6]";
  return "border-border bg-muted/40";
}

function sentimentClassName(sentiment: "positive" | "neutral" | "mixed" | "negative") {
  if (sentiment === "positive") return "text-emerald-700";
  if (sentiment === "negative") return "text-red-600";
  if (sentiment === "mixed") return "text-amber-700";
  return "text-muted-foreground";
}

export function CopilotRealTimeSummaryTab({
  isCompactDashboard,
  showWidgetOverflowMenu = true,
}: {
  isCompactDashboard: boolean;
  showWidgetOverflowMenu?: boolean;
}) {
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionColumnVisibility, setSessionColumnVisibility] = useState<
    Record<CopilotRealTimeSessionColumnId, boolean>
  >(
    () =>
      Object.fromEntries(copilotRealTimeSessionColumnOptions.map((column) => [column.id, true])) as Record<
        CopilotRealTimeSessionColumnId,
        boolean
      >,
  );
  const [selectedSession, setSelectedSession] = useState<CopilotTranscriptSessionContext | null>(null);

  const filteredSessionRows = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    if (!query) return copilotRealTimeSessionRows;

    return copilotRealTimeSessionRows.filter((row) =>
      [row.contact, row.channel, row.agent, row.skill, row.similarity.toFixed(3), row.duration, row.intent, row.sentiment]
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
      <HeaderAIInsightsRow dashboardId={copilotAiInsightsIds.realTimeSummary} />

      <h3 className="mt-8 flex items-center gap-2 tracking-tight">
        <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Key Performance Indicators
      </h3>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
        {copilotRealTimeSummaryKpis.map((kpi) => (
          <Card
            key={kpi.label}
            className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CardDescription className="flex-1">{kpi.label}</CardDescription>
                <WidgetAskAIAndOverflow
                  widgetTitle={kpi.label}
                  chartType="metric"
                  showOverflowMenu={showWidgetOverflowMenu}
                />
              </div>
              <KpiMetricValueTitle value={kpi.value} />
              <p className="text-sm text-muted-foreground">{kpi.supportingText}</p>
            </CardHeader>
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
            <CardTitle className="text-base flex-1">
              Proxy Accuracy Indicator</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Proxy Accuracy Indicator"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>
            Summary quality proxy using AutoSummary similarity scores for interactions with both features active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3")}>
            {copilotProxyMetricTiles.map((tile) => (
              <div
                key={tile.label}
                className={cn("rounded-2xl border p-5 text-center", metricTileClassName(tile.tone))}
              >
                <p
                  className={cn(
                    "text-3xl font-semibold tracking-tight",
                    tile.tone === "primary"
                      ? "text-[#5d49b4]"
                      : tile.tone === "warning"
                        ? "text-[#a47d00]"
                        : "text-foreground",
                  )}
                >
                  {tile.value}
                </p>
                <p className="mt-2 text-base text-muted-foreground">{tile.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {copilotProxySkillRows.map((row) => (
              <div key={row.skill} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <p className="font-medium text-foreground">{row.skill}</p>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{row.score.toFixed(3)}</span>
                    {"  "}
                    {row.contacts} contacts
                  </p>
                </div>
                <CopilotProgressBar
                  value={row.score * 100}
                  className="h-3"
                  indicatorColor={row.barColor}
                />
              </div>
            ))}
          </div>

          </CardContent>

          <CardFooter className="mt-auto pt-4">

            <WidgetAIExplanation widgetTitle="Proxy Accuracy Indicator" chartType="metric" />

          </CardFooter>
      </Card>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">
                Streaming Latency By Skill</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Streaming Latency By Skill"
                chartType="metric"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>P50, P95, and average latency (ms) for real-time summaries</CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="table-auto w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead className="text-right">P50</TableHead>
                  <TableHead className="text-right">P95</TableHead>
                  <TableHead className="text-right">Avg</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {copilotStreamingLatencySkillRows.map((row) => (
                  <TableRow key={row.skill}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: row.dotColor }} aria-hidden />
                        {row.skill}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.p50Ms}ms</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-[#a47d00]">{row.p95Ms}ms</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{row.avgMs}ms</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{row.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Streaming Latency By Skill" chartType="metric" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">
                Real-Time Volume Trend</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Real-Time Volume Trend"
                chartType="line"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>Daily count of real-time summary generations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] w-full">
              <EChartsCanvas option={realTimeVolumeTrendOption} />
            </div>
            <div className="mt-4 flex items-center justify-between text-muted-foreground">
              <p>{realTimeVolumeTotals.totalSummaries}</p>
              <p>{realTimeVolumeTotals.rangeLabel}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">
              Real-Time Token Usage</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Real-Time Token Usage"
              chartType="line"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Daily average tokens per real-time summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <EChartsCanvas option={realTimeTokenUsageTrendOption} />
          </div>
          <div className="mt-4 flex items-center justify-between text-muted-foreground">
            <p>{realTimeTokenTotals.totalTokens}</p>
            <p>{realTimeTokenTotals.totalSummaries}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex-1">
              Real-Time vs Final Comparison</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Real-Time vs Final Comparison"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Side-by-side metrics for contacts with both summary types</CardDescription>
        </CardHeader>
        <CardContent>
          <Table className="table-auto w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Skill</TableHead>
                <TableHead className="text-center" colSpan={2}>
                  Avg Similarity
                </TableHead>
                <TableHead className="text-center" colSpan={2}>
                  Avg Word Count
                </TableHead>
                <TableHead className="text-center" colSpan={2}>
                  Avg Latency (ms)
                </TableHead>
                <TableHead className="text-right">Contacts</TableHead>
              </TableRow>
              <TableRow>
                <TableHead />
                <TableHead className="text-right">RT</TableHead>
                <TableHead className="text-right">Final</TableHead>
                <TableHead className="text-right">RT</TableHead>
                <TableHead className="text-right">Final</TableHead>
                <TableHead className="text-right">RT</TableHead>
                <TableHead className="text-right">Final</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {copilotRealTimeComparisonRows.map((row) => (
                <TableRow key={row.skill}>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: row.dotColor }} aria-hidden />
                      {row.skill}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-[#5d49b4]">{row.rtSimilarity.toFixed(3)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{row.finalSimilarity.toFixed(3)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-[#5d49b4]">{row.rtWordCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.finalWordCount}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-emerald-700">{row.rtLatencyMs}</TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">{row.finalLatencyMs}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.contacts}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Real-Time vs Final Comparison" chartType="metric" />
          </CardFooter>
      </Card>

      <Card className="group/widget min-w-0 transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base flex-1">
              Sessions to Investigate</CardTitle>
            <p className="text-xs text-muted-foreground">{copilotRealTimeSessionsDataTimestamp}</p>
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
                  <Columns3 className="h-3.5 w-3.5" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {copilotRealTimeSessionColumnOptions.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={sessionColumnVisibility[column.id]}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={(checked) => {
                      setSessionPage(1);
                      setSessionColumnVisibility((previous) => ({
                        ...previous,
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

          <Table className="table-auto w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                {sessionColumnVisibility.channel ? <TableHead>Channel</TableHead> : null}
                {sessionColumnVisibility.agent ? <TableHead>Agent</TableHead> : null}
                {sessionColumnVisibility.skill ? <TableHead>Skill</TableHead> : null}
                {sessionColumnVisibility.similarity ? <TableHead>Similarity</TableHead> : null}
                {sessionColumnVisibility.duration ? <TableHead>Duration</TableHead> : null}
                {sessionColumnVisibility.intent ? <TableHead>Intent</TableHead> : null}
                {sessionColumnVisibility.sentiment ? <TableHead>Sentiment</TableHead> : null}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSessionRows.map((row) => (
                <TableRow key={row.contact}>
                  <TableCell className="tabular-nums">{row.contact}</TableCell>
                  {sessionColumnVisibility.channel ? <TableCell>{row.channel}</TableCell> : null}
                  {sessionColumnVisibility.agent ? <TableCell>{row.agent}</TableCell> : null}
                  {sessionColumnVisibility.skill ? <TableCell>{row.skill}</TableCell> : null}
                  {sessionColumnVisibility.similarity ? (
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="border-transparent bg-amber-100 font-semibold tabular-nums text-amber-700"
                      >
                        {row.similarity.toFixed(3)}
                      </Badge>
                    </TableCell>
                  ) : null}
                  {sessionColumnVisibility.duration ? <TableCell className="tabular-nums">{row.duration}</TableCell> : null}
                  {sessionColumnVisibility.intent ? <TableCell>{row.intent}</TableCell> : null}
                  {sessionColumnVisibility.sentiment ? (
                    <TableCell className={cn("capitalize", sentimentClassName(row.sentiment))}>{row.sentiment}</TableCell>
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
                            onClick={() => setSelectedSession(fromCopilotRealTimeSummaryRow(row))}
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

          <div>
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
        sourceLabel="Copilot Real-Time Summary"
      />
    </div>
  );
}
