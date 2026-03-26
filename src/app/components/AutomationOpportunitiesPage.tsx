import { useMemo, useState } from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { createPortal } from "react-dom";
import type { DateRange } from "react-day-picker";

import { Button } from "./ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar } from "./ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "./ui/select";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { DashboardChatPanel } from "./DashboardChatPanel";
import { PageContent, PageHeader } from "./PageChrome";
import { PageTransition } from "./PageTransition";
import { useChatPanelSlot } from "../contexts/ChatPanelSlotContext";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { WidgetAIPromptButton } from "./WidgetAIPromptButton";
import {
  automationAnalyzedPeriodStats,
  automationAnalysisPeriodSubtitle,
  automationImpactProjectionSubtitle,
  automationOpportunitiesByScope,
  type AutomationOpportunityRow,
  type AutomationScopeTab,
} from "../data/automation-opportunities-page";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  DATE_RANGE_CUSTOM_OPTION,
  DATE_RANGE_LABELS,
  DATE_RANGE_PRIMARY_OPTIONS,
  DATE_RANGE_SECONDARY_OPTIONS,
  type DateRangeOption,
} from "../data/date-ranges";
import { LabeledSelectValue } from "./HeaderFilters";

const DASHBOARD_ID = "automation-opportunities";

const DEFAULT_FILTERS = {
  dateRange: "last-7-days",
  team: "all",
  skill: "all",
  channel: "all",
  category: "all",
  direction: "all",
} as const;

function formatShortDateRange(range: DateRange): string {
  // M/DD/YY - M/DD/YY
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "numeric", day: "2-digit", year: "2-digit" });
  if (!range.from || !range.to) return "Custom range";
  return `${fmt(range.from)} - ${fmt(range.to)}`;
}

function OpportunityCard({
  row,
  scope,
}: {
  row: AutomationOpportunityRow;
  scope: AutomationScopeTab;
}) {
  const [open, setOpen] = useState(false);
  const anchorId = `automation-opp-${scope}-${row.id}`;

  return (
    <Card id={anchorId}>
      <CardHeader>
        <CardTitle className="text-lg font-medium tracking-tight">{row.title}</CardTitle>
        <CardDescription className="leading-relaxed">{row.description}</CardDescription>
        <CardAction>
          <div className="flex items-center gap-1">
            <WidgetAIPromptButton
              widgetTitle={`Opportunity: ${row.title}`}
              chartType="metric"
              widgetAnchorId={anchorId}
              tooltipLabel="Ask AI about this opportunity"
              tooltipSide="bottom"
              triggerClassName="h-9 w-9"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-expanded={open}
                  onClick={() => setOpen((o) => !o)}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{open ? "Show less" : "Show more detail"}</TooltipContent>
            </Tooltip>
          </div>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {(open ? row.metrics : row.metrics.slice(0, 5)).map((m) => (
            <div
              key={`${row.id}-${m.label}`}
              className="bg-muted text-muted-foreground flex min-w-[100px] flex-col gap-0.5 rounded-md px-3 py-2 text-xs"
            >
              <span className="font-medium">{m.label}</span>
              <span className="text-foreground text-sm font-medium">{m.value}</span>
            </div>
          ))}
          {!open && row.metrics.length > 5 ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
              +{row.metrics.length - 5} more
            </Button>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button type="button" size="sm">
          Create AI Agent
        </Button>
        <Button type="button" variant="outline" size="sm">
          View playbook
        </Button>
      </CardFooter>
    </Card>
  );
}

export function AutomationOpportunitiesPage() {
  const chatPanelSlot = useChatPanelSlot();
  const [scope, setScope] = useState<AutomationScopeTab>("categories");

  const [dateRange, setDateRange] = useState<DateRangeOption>(DEFAULT_FILTERS.dateRange);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [team, setTeam] = useState<(typeof DEFAULT_FILTERS)["team"]>(DEFAULT_FILTERS.team);
  const [skill, setSkill] = useState<(typeof DEFAULT_FILTERS)["skill"]>(DEFAULT_FILTERS.skill);
  const [channel, setChannel] = useState<(typeof DEFAULT_FILTERS)["channel"]>(DEFAULT_FILTERS.channel);
  const [category, setCategory] = useState<(typeof DEFAULT_FILTERS)["category"]>(DEFAULT_FILTERS.category);
  const [direction, setDirection] = useState<(typeof DEFAULT_FILTERS)["direction"]>(DEFAULT_FILTERS.direction);

  const hasFilterChanges = useMemo(() => {
    return (
      dateRange !== DEFAULT_FILTERS.dateRange ||
      team !== DEFAULT_FILTERS.team ||
      skill !== DEFAULT_FILTERS.skill ||
      channel !== DEFAULT_FILTERS.channel ||
      category !== DEFAULT_FILTERS.category ||
      direction !== DEFAULT_FILTERS.direction
    );
  }, [category, channel, dateRange, direction, skill, team]);

  return (
    <WidgetAIProvider persistKey={DASHBOARD_ID}>
      <Tabs
        value={scope}
        onValueChange={(v) => setScope(v as AutomationScopeTab)}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="flex flex-col flex-1 min-h-0">
          <PageHeader>
            <div>
              <h1 className="text-3xl tracking-tight">Automation Opportunities</h1>
              <p className="text-muted-foreground mt-1">
                Dashboard view of high-impact opportunities to improve efficiency and customer outcomes.
              </p>
            </div>

            <div className="mt-4 flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap pb-1">
              <Select
                value={dateRange}
                onValueChange={(v) => {
                  const next = v as DateRangeOption;
                  setDateRange(next);
                  if (next === DATE_RANGE_CUSTOM_OPTION) {
                    setCustomRangeOpen(true);
                  }
                }}
              >
                <SelectTrigger className="h-8 w-auto shrink-0">
                  <span className="flex min-w-0 items-center gap-1">
                    <span className="shrink-0 text-muted-foreground">Date range:</span>
                    <span className="min-w-0 truncate">
                      {dateRange === DATE_RANGE_CUSTOM_OPTION && customRange?.from && customRange?.to
                        ? formatShortDateRange(customRange)
                        : DATE_RANGE_LABELS[dateRange]}
                    </span>
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_PRIMARY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {DATE_RANGE_LABELS[opt]}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  {DATE_RANGE_SECONDARY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {DATE_RANGE_LABELS[opt]}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={DATE_RANGE_CUSTOM_OPTION}>
                    {DATE_RANGE_LABELS[DATE_RANGE_CUSTOM_OPTION]}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={team} onValueChange={(v) => setTeam(v as typeof team)}>
                <SelectTrigger className="h-8 w-auto shrink-0">
                  <LabeledSelectValue label="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="t1">Tier 1</SelectItem>
                  <SelectItem value="t2">Tier 2</SelectItem>
                </SelectContent>
              </Select>

              <Select value={skill} onValueChange={(v) => setSkill(v as typeof skill)}>
                <SelectTrigger className="h-8 w-auto shrink-0">
                  <LabeledSelectValue label="Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="card">Card services</SelectItem>
                </SelectContent>
              </Select>

              <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                <SelectTrigger className="h-8 w-auto shrink-0">
                  <LabeledSelectValue label="Chanel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="voice">Voice</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>

              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger className="h-8 w-auto shrink-0">
                  <LabeledSelectValue label="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="billing-payments">Billing &amp; Payment</SelectItem>
                  <SelectItem value="card-services">Card Services</SelectItem>
                  <SelectItem value="account-management">Account Management</SelectItem>
                </SelectContent>
              </Select>

              <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
                <SelectTrigger className="h-8 w-auto shrink-0">
                  <LabeledSelectValue label="Direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>

              {hasFilterChanges ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    setDateRange(DEFAULT_FILTERS.dateRange);
                    setCustomRange(undefined);
                    setTeam(DEFAULT_FILTERS.team);
                    setSkill(DEFAULT_FILTERS.skill);
                    setChannel(DEFAULT_FILTERS.channel);
                    setCategory(DEFAULT_FILTERS.category);
                    setDirection(DEFAULT_FILTERS.direction);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              ) : null}
            </div>

            <TabsList className="mt-4 h-auto w-full justify-start rounded-none border-0 bg-transparent p-0">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
              <TabsTrigger value="subtopics">Sub-topics</TabsTrigger>
            </TabsList>
            <HeaderAIInsightsRow
              dashboardId={DASHBOARD_ID}
              dashboardData={{
                id: DASHBOARD_ID,
                title: "Automation Opportunities",
                description:
                  "High-impact automation opportunities across categories, topics, and sub-topics.",
              }}
            />
          </PageHeader>

          <Dialog open={customRangeOpen} onOpenChange={setCustomRangeOpen}>
            <DialogContent className="sm:max-w-[720px]">
              <DialogHeader>
                <DialogTitle>Custom range</DialogTitle>
                <DialogDescription>Select a start and end date.</DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <Calendar
                  mode="range"
                  selected={customRange}
                  defaultMonth={customRange?.from}
                  onSelect={(range) => {
                    setCustomRange(range);
                    setDateRange(DATE_RANGE_CUSTOM_OPTION);
                  }}
                  numberOfMonths={2}
                  className="[--cell-size:2.25rem]"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCustomRangeOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex-1 min-h-0 overflow-auto">
            <PageContent className="space-y-8 p-4 md:p-8">
              <PageTransition className="space-y-8">
                <section className="space-y-3">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h2 className="text-lg font-medium tracking-tight">Analyzed Period</h2>
                    <span className="text-sm text-muted-foreground">
                      / {automationAnalysisPeriodSubtitle}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    {automationAnalyzedPeriodStats.map((stat) => (
                      <Card key={stat.label}>
                        <CardContent className="space-y-1.5 pt-6">
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className="text-xl font-semibold tracking-tight tabular-nums">{stat.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>

                {( ["categories", "topics", "subtopics"] as const).map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-0 space-y-4 outline-none">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <h2 className="text-lg font-medium tracking-tight">Top Opportunities</h2>
                      <span className="text-sm text-muted-foreground">
                        / {automationImpactProjectionSubtitle}
                      </span>
                    </div>
                    <div className="flex flex-col gap-4">
                      {automationOpportunitiesByScope[tab].map((row) => (
                        <OpportunityCard key={row.id} row={row} scope={tab} />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </PageTransition>
            </PageContent>
          </div>
        </div>
      </Tabs>

      {chatPanelSlot &&
        createPortal(
          <DashboardChatPanel dashboardId={DASHBOARD_ID} sourceOotbId={DASHBOARD_ID} />,
          chatPanelSlot,
        )}
    </WidgetAIProvider>
  );
}
