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
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "./ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { EChartsCanvas } from "./EChartsCanvas";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { InsetMetricTile } from "./InsetMetricTile";
import { WidgetAskAIAndOverflow } from "./WidgetAskAIAndOverflow";
import { WidgetAIExplanation } from "./WidgetAIExplanation";
import { CopilotSessionTranscriptDialog } from "./CopilotSessionTranscriptDialog";
import { CopilotProgressBar } from "./CopilotProgressBar";
import { cn } from "./ui/utils";
import {
  copilotAgentFeedbackAverage,
  copilotAgentFeedbackDistributionOption,
  copilotAgentFeedbackTotalRatings,
  copilotFeatureCooccurrenceOption,
  copilotHandleTimeRows,
  copilotInboundOutboundRows,
  copilotOverviewKpis,
  copilotSessionColumnOptions,
  copilotSessionRows,
  copilotSessionsDataTimestamp,
  type CopilotSessionColumnId,
  copilotTopInteractionIntentsOption,
  copilotTeamPerformanceRows,
  copilotTransferEscalation,
} from "../data/copilot-overview";
import { copilotAiInsightsIds } from "../data/copilot-ai-insights";
import {
  fromCopilotOverviewRow,
  type CopilotTranscriptSessionContext,
} from "../data/copilot-session-transcript";

function sentimentClassName(sentiment: "positive" | "neutral" | "mixed") {
  if (sentiment === "positive") return "text-emerald-700";
  if (sentiment === "mixed") return "text-amber-700";
  return "text-muted-foreground";
}

export function CopilotOverviewTab({
  isCompactDashboard,
  showWidgetOverflowMenu = true,
}: {
  isCompactDashboard: boolean;
  showWidgetOverflowMenu?: boolean;
}) {
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionPage, setSessionPage] = useState(1);
  const [sessionColumnVisibility, setSessionColumnVisibility] = useState<Record<CopilotSessionColumnId, boolean>>(
    () =>
      Object.fromEntries(copilotSessionColumnOptions.map((col) => [col.id, true])) as Record<
        CopilotSessionColumnId,
        boolean
      >,
  );
  const [selectedSession, setSelectedSession] = useState<CopilotTranscriptSessionContext | null>(null);

  const filteredSessionRows = useMemo(() => {
    const query = sessionSearch.trim().toLowerCase();
    if (!query) return copilotSessionRows;

    return copilotSessionRows.filter((row) =>
      [
        row.contact,
        row.channel,
        row.agent,
        row.skill,
        row.duration,
        row.handleTime,
        row.features,
        row.sentiment,
        row.disposition,
        row.rating,
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
      <HeaderAIInsightsRow dashboardId={copilotAiInsightsIds.overview} />

      <h3 className="mt-8 flex items-center gap-2 tracking-tight">
        <CircleGauge className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        Key Performance Indicators
      </h3>

      <div
        className={cn(
          "grid gap-4",
          isCompactDashboard ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {copilotOverviewKpis.map((kpi) => (
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
            <CardTitle className="text-base flex-1">Handle Time Impact</CardTitle>
            <WidgetAskAIAndOverflow
              widgetTitle="Handle Time Impact"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>
            Average handle time comparison: Copilot-enabled vs non-enabled contacts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {copilotHandleTimeRows.map((row) => (
              <div
                key={row.feature}
                className={cn(
                  "grid items-center gap-3",
                  isCompactDashboard
                    ? "grid-cols-1"
                    : "grid-cols-[180px_minmax(0,1fr)_minmax(0,1fr)_88px]",
                )}
              >
                <p className="text-sm font-medium text-foreground">{row.feature}</p>

                <div className="rounded-xl border border-emerald-200/50 bg-emerald-50 px-4 py-2 text-center">
                  <p className="text-[15px] font-semibold text-emerald-700">{row.enabledTime}</p>
                  <p className="text-[12px] text-muted-foreground">{row.enabledContacts}</p>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 px-4 py-2 text-center">
                  <p className="text-[15px] font-semibold text-foreground">{row.disabledTime}</p>
                  <p className="text-[12px] text-muted-foreground">{row.disabledContacts}</p>
                </div>

                <p
                  className={cn(
                    "text-right text-[15px] font-semibold",
                    row.improvement ? "text-emerald-700" : "text-red-600",
                  )}
                >
                  {row.delta}
                </p>
              </div>
            ))}
          </div>
          </CardContent>
          <CardFooter className="mt-auto pt-4">
            <WidgetAIExplanation widgetTitle="Handle Time Impact" chartType="metric" />
          </CardFooter>
      </Card>

      <div className={cn("grid gap-4", isCompactDashboard ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2")}>
        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Transfer & Escalation Rate</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Transfer & Escalation Rate"
                chartType="metric"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InsetMetricTile
                value={copilotTransferEscalation.transferRate}
                label="Transfer Rate"
                supportingText={copilotTransferEscalation.transferCountText}
                className="border border-amber-200/60 bg-amber-50"
                valueClassName="text-amber-700"
              />
              <InsetMetricTile
                value={copilotTransferEscalation.escalationRate}
                label="Escalation Rate"
                supportingText={copilotTransferEscalation.escalationCountText}
                className="border border-red-200/60 bg-red-50"
                valueClassName="text-red-600"
              />
            </div>

            <div className="mt-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">Copilot Impact</p>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-foreground sm:grid-cols-2">
                <p>
                  Enabled transfer: <span className="font-semibold">{copilotTransferEscalation.enabledTransfer}</span>
                </p>
                <p>
                  Disabled transfer: <span className="font-semibold">{copilotTransferEscalation.disabledTransfer}</span>
                </p>
                <p>
                  Enabled escalation: <span className="font-semibold">{copilotTransferEscalation.enabledEscalation}</span>
                </p>
                <p>
                  Disabled escalation: <span className="font-semibold">{copilotTransferEscalation.disabledEscalation}</span>
                </p>
              </div>
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Transfer & Escalation Rate" chartType="metric" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Agent Feedback Distribution</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Agent Feedback Distribution"
                chartType="bar-vertical"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <EChartsCanvas option={copilotAgentFeedbackDistributionOption} />
            </div>
            <div className="mt-4 flex items-center justify-between text-muted-foreground">
              <p>{copilotAgentFeedbackTotalRatings} total ratings</p>
              <p>Avg: {copilotAgentFeedbackAverage}</p>
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Agent Feedback Distribution" chartType="bar-vertical" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Team Performance</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Team Performance"
                chartType="metric"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table className="table-auto w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">Contacts</TableHead>
                  <TableHead className="text-right">Adoption</TableHead>
                  <TableHead className="text-right">Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {copilotTeamPerformanceRows.map((row) => (
                  <TableRow key={row.team}>
                    <TableCell>{row.team}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.contacts}</TableCell>
                    <TableCell className="text-right tabular-nums text-emerald-700">{row.adoption}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right tabular-nums",
                        Number.parseFloat(row.quality) >= 0.85 ? "text-emerald-700" : "text-amber-700",
                      )}
                    >
                      {row.quality}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Team Performance" chartType="metric" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Inbound vs Outbound</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Inbound vs Outbound"
                chartType="metric"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {copilotInboundOutboundRows.map((row) => (
              <div key={row.label} className="rounded-xl border bg-muted/25 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xl font-semibold text-foreground">{row.label}</p>
                  <p className="text-sm text-muted-foreground">{row.contactsText}</p>
                </div>
                <CopilotProgressBar
                  value={row.adoptionRate}
                  className="h-3"
                  indicatorColor="#9fa7b3"
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Copilot adoption rate</p>
                  <p className="text-3xl font-semibold text-[#5d49b4]">{row.adoptionRate.toFixed(1).replace(/\.0$/, "")}%</p>
                </div>
              </div>
            ))}
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Inbound vs Outbound" chartType="metric" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Feature Co-Occurrence Heatmap</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Feature Co-Occurrence Heatmap"
                chartType="heatmap"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>
              Percentage of interactions where feature pairs are used together
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <EChartsCanvas option={copilotFeatureCooccurrenceOption} />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Feature Co-Occurrence Heatmap" chartType="heatmap" />
            </CardFooter>
        </Card>

        <Card className="group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex-1">Top 10 Interaction Intents</CardTitle>
              <WidgetAskAIAndOverflow
                widgetTitle="Top 10 Interaction Intents"
                chartType="bar-horizontal"
                showOverflowMenu={showWidgetOverflowMenu}
              />
            </div>
            <CardDescription>Most common customer intents by volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <EChartsCanvas option={copilotTopInteractionIntentsOption} />
            </div>
            </CardContent>
            <CardFooter className="mt-auto pt-4">
              <WidgetAIExplanation widgetTitle="Top 10 Interaction Intents" chartType="bar-horizontal" />
            </CardFooter>
        </Card>
      </div>

      <Card className="group/widget min-w-0 transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base flex-1">Sessions to Investigate</CardTitle>
            <p className="text-xs text-muted-foreground">{copilotSessionsDataTimestamp}</p>
            <WidgetAskAIAndOverflow
              widgetTitle="Sessions to Investigate"
              chartType="metric"
              showOverflowMenu={showWidgetOverflowMenu}
            />
          </div>
          <CardDescription>Recent sessions for detailed investigation</CardDescription>
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
                {copilotSessionColumnOptions.map((col) => (
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
                {sessionColumnVisibility.skill ? <TableHead>Skill</TableHead> : null}
                {sessionColumnVisibility.duration ? <TableHead>Duration</TableHead> : null}
                {sessionColumnVisibility.handleTime ? <TableHead>Handle Time</TableHead> : null}
                {sessionColumnVisibility.features ? <TableHead>Features</TableHead> : null}
                {sessionColumnVisibility.sentiment ? <TableHead>Sentiment</TableHead> : null}
                {sessionColumnVisibility.disposition ? <TableHead>Disposition</TableHead> : null}
                {sessionColumnVisibility.rating ? <TableHead>Rating</TableHead> : null}
                <TableHead className="w-[84px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedSessionRows.map((row) => (
                <TableRow key={row.contact}>
                  <TableCell className="tabular-nums">{row.contact}</TableCell>
                  {sessionColumnVisibility.channel ? <TableCell>{row.channel}</TableCell> : null}
                  {sessionColumnVisibility.agent ? <TableCell>{row.agent}</TableCell> : null}
                  {sessionColumnVisibility.skill ? <TableCell>{row.skill}</TableCell> : null}
                  {sessionColumnVisibility.duration ? <TableCell className="tabular-nums">{row.duration}</TableCell> : null}
                  {sessionColumnVisibility.handleTime ? <TableCell className="tabular-nums">{row.handleTime}</TableCell> : null}
                  {sessionColumnVisibility.features ? (
                    <TableCell className="max-w-[260px] truncate" title={row.features}>
                      {row.features}
                    </TableCell>
                  ) : null}
                  {sessionColumnVisibility.sentiment ? (
                    <TableCell className={cn("capitalize", sentimentClassName(row.sentiment))}>{row.sentiment}</TableCell>
                  ) : null}
                  {sessionColumnVisibility.disposition ? <TableCell>{row.disposition}</TableCell> : null}
                  {sessionColumnVisibility.rating ? <TableCell className="tabular-nums">{row.rating}</TableCell> : null}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            aria-label="View Transcript"
                            onClick={() => setSelectedSession(fromCopilotOverviewRow(row))}
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
        sourceLabel="Copilot Overview"
      />
    </div>
  );
}
