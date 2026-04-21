import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarRange,
  ChevronDown,
  Download,
  Loader2,
  Mail,
  Settings,
  Play,
  MoreVertical,
  RotateCcw,
  Trophy,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useLocation, useNavigate } from "react-router";

import { Button } from "./ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Calendar } from "./ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "./ui/select";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import {
  PageHeader,
  pageHeaderTabsFooterClassName,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { PageTransition } from "./PageTransition";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import {
  automationAnalyzedPeriodStats,
  automationSubtopicsTabPeriodStats,
  automationSubtopicsTabTopicRows,
  automationTopicsTabPeriodStats,
  automationTopicsTabTopicRows,
  type AutomationPeriodStat,
  type AutomationScopeTab,
  topOpportunitiesByScope,
  type TopicsTabTopicRow,
  type TopOpportunityBarItem,
  type TopOpportunityCategory,
  type TopOpportunityMetric,
  type TopOpportunityTopic,
} from "../data/automation-opportunities-page";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  DATE_RANGE_CUSTOM_OPTION,
  DATE_RANGE_LABELS,
  DATE_RANGE_PRIMARY_OPTIONS,
  DATE_RANGE_SECONDARY_OPTIONS,
  type DateRangeOption,
} from "../data/date-ranges";
import { LabeledFilterInline, LabeledSelectValue } from "./HeaderFilters";
import { SampleInteractionsDialog } from "./SampleInteractionsDialog";
import { CreateAIAgentPopoverButton } from "./CreateAIAgentPopoverButton";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { cn } from "./ui/utils";

const DASHBOARD_ID = "automation-opportunities";

const SUBTOPICS_OPPORTUNITIES_PAGE_SIZE = 20;

/** Matches dashboard KPI / chart widget cards (DashboardPage, ChartVariants). */
const AUTOMATION_CARD_HOVER =
  "group/widget transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30";

/** 1rem vertical rhythm between header, body, and footer on Top Opportunities cards. */
const TOP_OPPORTUNITY_CARD_GAP = "gap-4";
const TOP_OPPORTUNITIES_HASH = "#top-opportunities";
const TOP_OPPORTUNITIES_SECTION_ID = "top-opportunities";
const TOP_OPPORTUNITY_HIGHLIGHT_MS = 2600;

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

function toMax(items: TopOpportunityBarItem[]): number {
  return items.reduce((max, it) => (it.value > max ? it.value : max), 0) || 1;
}

function isAutomationScopeTab(value: string | null): value is AutomationScopeTab {
  return value === "categories" || value === "topics" || value === "subtopics";
}

function buildTopOpportunityHighlightKey(scope: AutomationScopeTab, id: string): string {
  return `${scope}:${id}`;
}

function TopOpportunitiesSectionHeading() {
  return (
    <h3 className="mt-8 flex items-center gap-2 text-lg font-medium tracking-tight">
      <Trophy className="size-4 shrink-0 text-primary" aria-hidden />
      <span>Top Opportunities</span>
      <span className="text-sm font-normal text-muted-foreground">Yearly Prediction</span>
    </h3>
  );
}

function AnalyzedPeriodSection({
  stats,
  subtitle,
  showStatGrid = true,
}: {
  stats: AutomationPeriodStat[];
  subtitle?: string;
  showStatGrid?: boolean;
}) {
  return (
    <section className="space-y-3">
      <header>
        <h3 className="!mt-8 flex items-center gap-2 text-lg font-medium tracking-tight">
          <CalendarRange className="size-4 shrink-0 text-primary" aria-hidden />
          <span>Analyzed Period</span>
          <span className="text-sm font-normal text-muted-foreground">Previous 30 Days</span>
        </h3>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </header>
      {showStatGrid ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat) => (
            <Card key={stat.label} className={cn(AUTOMATION_CARD_HOVER)}>
              <CardContent className="space-y-1.5 p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <KpiMetricValueTitle value={stat.value} className="flex-none" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function MetricStrip({
  metrics,
  rightSlot,
  className,
}: {
  metrics: TopOpportunityMetric[];
  rightSlot?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full min-w-0 items-start gap-x-4 gap-y-3", className)}>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-3">
        {metrics.map((m) => (
          <div key={m.key} className="flex flex-col gap-0.5 pr-6 border-r last:border-r-0 last:pr-0">
            <div
              className={`text-base font-medium tabular-nums ${
                m.tone === "positive" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
              }`}
            >
              {m.value}
            </div>
            <div className="text-xs text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>
      {rightSlot ? <div className="flex shrink-0 items-center self-center">{rightSlot}</div> : null}
    </div>
  );
}

function ActionBarList({
  title,
  items,
  variant = "standalone",
  maxScale,
  embeddedDivider = false,
}: {
  title: string;
  items: TopOpportunityBarItem[];
  variant?: "standalone" | "embedded";
  /** When set, bar fill uses this denominator (e.g. 100 for percentage rows). */
  maxScale?: number;
  /** Adds a divider below embedded bars when more content follows in the same container. */
  embeddedDivider?: boolean;
}) {
  const max = maxScale ?? toMax(items);
  const wrapperClassName = cn(
    variant === "embedded" ? "bg-neutral-25" : "rounded-lg border bg-muted",
    variant === "embedded" && embeddedDivider && "border-b",
  );
  return (
    <div className={wrapperClassName}>
      <div className="px-4 py-3">
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="p-4 space-y-3">
        {items.map((it) => {
          const pct = Math.max(0, Math.min(1, it.value / max));
          return (
            <div key={it.label} className="flex items-center gap-4">
              <div className="w-[200px] shrink-0 text-xs text-muted-foreground truncate">
                {it.label}
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Progress
                  value={pct * 100}
                  className="h-2 min-w-0 flex-1 border border-border/60 bg-muted mr-3"
                  indicatorClassName="rounded-full"
                />
                <div className="shrink-0 text-xs text-muted-foreground tabular-nums text-right">
                  {it.display ?? it.value.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OverflowActionsMenu({
  categoryTitle,
  onOpenSampleInteractions,
}: {
  categoryTitle: string;
  onOpenSampleInteractions: (categoryTitle: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => onOpenSampleInteractions(categoryTitle)}>
          <Play className="h-4 w-4" />
          View Sample interactions
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Mail className="h-4 w-4" />
          Share by Email
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Download className="h-4 w-4" />
          Export to Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TopicRow({
  topic,
  open,
  onToggle,
  rightSlot,
  isFirst = false,
  categoryTitle,
  agentSourceKey,
  agentScopeTitle,
  onOpenSampleInteractions,
}: {
  topic: TopOpportunityTopic;
  open: boolean;
  onToggle: () => void;
  rightSlot?: React.ReactNode;
  isFirst?: boolean;
  categoryTitle: string;
  agentSourceKey: string;
  agentScopeTitle: string;
  onOpenSampleInteractions: (categoryTitle: string) => void;
}) {
  const canExpand = (topic.subTopics && topic.subTopics.length > 0) || !!topic.bars || !!topic.secondaryCta;
  return (
    <div className={isFirst ? "" : "border-t"}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-3 gap-y-3 px-4 py-3">
        <button
          type="button"
          className="row-span-2 mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-md hover:bg-muted disabled:opacity-50"
          onClick={onToggle}
          disabled={!canExpand}
          aria-label={open ? "Collapse" : "Expand"}
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <div className="col-start-2 row-start-1 min-w-0">
          <div className="text-sm font-medium">{topic.title}</div>
          {topic.subtitle ? (
            <div className="mt-0.5 text-xs text-muted-foreground">{topic.subtitle}</div>
          ) : null}
        </div>
        <div className="col-start-3 row-start-1 flex justify-end self-start">
          <div className="flex items-center gap-2">
            <CreateAIAgentPopoverButton sourceKey={agentSourceKey} scopeTitle={agentScopeTitle} />
            <div className="flex items-center gap-0">
              {rightSlot}
              <OverflowActionsMenu
                categoryTitle={categoryTitle}
                onOpenSampleInteractions={onOpenSampleInteractions}
              />
            </div>
          </div>
        </div>
        <div className="col-start-2 row-start-2 min-w-0">
          <MetricStrip metrics={topic.metrics} />
        </div>
      </div>

      {open && (topic.bars || topic.secondaryCta) ? (
        <div className="px-4 pb-4 space-y-4">
          {topic.bars ? <ActionBarList title={topic.bars.title} items={topic.bars.items} /> : null}
          {topic.secondaryCta ? (
            <Button variant="outline" size="sm">
              {topic.secondaryCta.label}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SubTopicSection({
  index,
  topic,
  categoryTitle,
  onOpenSampleInteractions,
}: {
  index: number;
  topic: TopOpportunityTopic;
  categoryTitle: string;
  onOpenSampleInteractions: (categoryTitle: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 py-3 pl-12 pr-4">
      <div className="mt-0.5 flex w-6 shrink-0 justify-center">
        <div className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
          {index}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{topic.title}</div>
        {topic.subtitle ? (
          <div className="mt-0.5 text-xs text-muted-foreground">{topic.subtitle}</div>
        ) : null}
        <div className="mt-3">
          <MetricStrip metrics={topic.metrics} />
        </div>
        {topic.bars ? (
          <div className="mt-4 space-y-4">
            <div className="text-sm font-medium">{topic.bars.title}</div>
            <div className="space-y-3">
              {topic.bars.items.map((it) => (
                <div key={it.label} className="flex items-center gap-4">
                  <div className="w-[200px] shrink-0 text-xs text-muted-foreground truncate">
                    {it.label}
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <Progress
                      value={(it.value / toMax(topic.bars!.items)) * 100}
                      className="h-2 min-w-0 flex-1 border border-border/60 bg-muted mr-3"
                      indicatorClassName="rounded-full"
                    />
                    <div className="shrink-0 text-xs text-muted-foreground tabular-nums text-right">
                      {it.value.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {topic.secondaryCta ? (
              <Button variant="outline" size="sm">
                {topic.secondaryCta.label}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="shrink-0">
        <OverflowActionsMenu
          categoryTitle={categoryTitle}
          onOpenSampleInteractions={onOpenSampleInteractions}
        />
      </div>
    </div>
  );
}

function AutomationTopicsTabTopicCard({
  row,
  targetScope,
  isHighlighted,
  expanded,
  onToggleExpanded,
  onOpenSampleInteractions,
  agentTabKey,
}: {
  row: TopicsTabTopicRow;
  targetScope: "topics" | "subtopics";
  isHighlighted: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  onOpenSampleInteractions: (categoryTitle: string) => void;
  /** Disambiguates source keys between Topics vs Sub-topics tabs. */
  agentTabKey: string;
}) {
  const canExpand = !!row.bars;
  return (
    <Card
      data-top-opportunity-scope={targetScope}
      data-top-opportunity-id={row.id}
      className={cn(
        AUTOMATION_CARD_HOVER,
        TOP_OPPORTUNITY_CARD_GAP,
        isHighlighted && "ring-2 ring-primary/60 bg-primary/5 shadow-lg",
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-medium tracking-tight">{row.title}</CardTitle>
            <CardDescription className="mt-1.5 text-sm leading-relaxed">{row.description}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CreateAIAgentPopoverButton
              sourceKey={`${agentTabKey}:${row.id}`}
              scopeTitle={row.title}
            />
            <OverflowActionsMenu
              categoryTitle={row.sampleInteractionsLabel}
              onOpenSampleInteractions={onOpenSampleInteractions}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <MetricStrip metrics={row.chipMetrics} />
        {expanded && row.bars ? (
          <div className="rounded-lg border overflow-hidden">
            <ActionBarList
              title={row.bars.title}
              items={row.bars.items}
              maxScale={100}
              variant="embedded"
            />
          </div>
        ) : null}
      </CardContent>

      <CardFooter>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canExpand}
          onClick={onToggleExpanded}
          className="px-0"
        >
          <ChevronDown className={`mr-2 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Hide Breakdown & Related Opportunities" : "Explore Breakdown & Related Opportunities"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function TopOpportunityCard({
  category,
  targetId,
  isHighlighted,
  expanded,
  onToggleExpanded,
  expandedTopicIds,
  toggleTopic,
  expandedSubTopicIds,
  toggleSubTopic,
  onOpenSampleInteractions,
}: {
  category: TopOpportunityCategory;
  targetId: string;
  isHighlighted: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
  expandedTopicIds: Set<string>;
  toggleTopic: (id: string) => void;
  expandedSubTopicIds: Set<string>;
  toggleSubTopic: (id: string) => void;
  onOpenSampleInteractions: (categoryTitle: string) => void;
}) {
  return (
    <Card
      data-top-opportunity-scope="categories"
      data-top-opportunity-id={targetId}
      className={cn(
        AUTOMATION_CARD_HOVER,
        TOP_OPPORTUNITY_CARD_GAP,
        isHighlighted && "ring-2 ring-primary/60 bg-primary/5 shadow-lg",
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-lg font-medium tracking-tight">{category.title}</CardTitle>
            <CardDescription>{category.subtitle}</CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <CreateAIAgentPopoverButton
              sourceKey={`category:${category.id}`}
              scopeTitle={category.title}
            />
            <OverflowActionsMenu
              categoryTitle={category.title}
              onOpenSampleInteractions={onOpenSampleInteractions}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <MetricStrip metrics={category.metrics} />

        {expanded ? (
          <div className="rounded-lg border overflow-hidden">
            {category.bars ? (
              <ActionBarList
                title={category.bars.title}
                items={category.bars.items}
                variant="embedded"
                embeddedDivider={category.topics.length > 0}
              />
            ) : null}

            {category.topics.length > 0
              ? category.topics.map((t, idx) => {
                  const topicKey = `${category.id}:${t.id}`;
                  const topicOpen = expandedTopicIds.has(topicKey);
                  return (
                    <section key={t.id}>
                      <TopicRow
                        topic={t}
                        open={topicOpen}
                        onToggle={() => toggleTopic(topicKey)}
                        isFirst={idx === 0}
                        categoryTitle={category.title}
                        agentSourceKey={`${category.id}:${t.id}`}
                        agentScopeTitle={t.title}
                        onOpenSampleInteractions={onOpenSampleInteractions}
                      />
                      {topicOpen && t.subTopics && t.subTopics.length > 0 ? (
                        <div className="bg-muted/10 pb-4">
                          <div className="pt-3 pl-12 pr-4">
                            <Separator className="mb-3" />
                          </div>
                          {(t.subTopics ?? []).map((st, sIdx, arr) => (
                            <section key={st.id}>
                              <SubTopicSection
                                index={sIdx + 1}
                                topic={st}
                                categoryTitle={category.title}
                                onOpenSampleInteractions={onOpenSampleInteractions}
                              />
                              {sIdx < arr.length - 1 ? (
                                <div className="pl-12 pr-4">
                                  <Separator />
                                </div>
                              ) : null}
                            </section>
                          ))}
                        </div>
                      ) : null}
                    </section>
                  );
                })
              : null}
          </div>
        ) : null}
      </CardContent>

      <CardFooter>
        <Button type="button" variant="ghost" size="sm" onClick={onToggleExpanded} className="px-0">
          <ChevronDown className={`mr-2 h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          {expanded ? "Hide Breakdown & Related Opportunities" : "Explore Breakdown & Related Opportunities"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function AutomationOpportunitiesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const deepLinkedTarget = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const target = params.get("target");
    const scopeParam = params.get("scope");
    if (!target || !isAutomationScopeTab(scopeParam)) return null;
    return { scope: scopeParam, id: target };
  }, [location.search]);
  const [scope, setScope] = useState<AutomationScopeTab>("categories");
  const [highlightedCardKey, setHighlightedCardKey] = useState<string | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(() => new Set());
  const [expandedTopicIds, setExpandedTopicIds] = useState<Set<string>>(() => new Set());
  const [expandedSubTopicIds, setExpandedSubTopicIds] = useState<Set<string>>(() => new Set());
  const [expandedTopicsTabRowIds, setExpandedTopicsTabRowIds] = useState<Set<string>>(() => new Set());
  const [expandedSubtopicsTabRowIds, setExpandedSubtopicsTabRowIds] = useState<Set<string>>(() => new Set());

  const [dateRange, setDateRange] = useState<DateRangeOption>(DEFAULT_FILTERS.dateRange);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [team, setTeam] = useState<(typeof DEFAULT_FILTERS)["team"]>(DEFAULT_FILTERS.team);
  const [skill, setSkill] = useState<(typeof DEFAULT_FILTERS)["skill"]>(DEFAULT_FILTERS.skill);
  const [channel, setChannel] = useState<(typeof DEFAULT_FILTERS)["channel"]>(DEFAULT_FILTERS.channel);
  const [category, setCategory] = useState<(typeof DEFAULT_FILTERS)["category"]>(DEFAULT_FILTERS.category);
  const [direction, setDirection] = useState<(typeof DEFAULT_FILTERS)["direction"]>(DEFAULT_FILTERS.direction);

  const [sampleInteractionsOpen, setSampleInteractionsOpen] = useState(false);
  const [sampleInteractionsCategory, setSampleInteractionsCategory] = useState("");

  const automationMainScrollRef = useRef<HTMLDivElement>(null);
  const topOpportunitiesSectionRef = useRef<HTMLElement | null>(null);
  const [subtopicsLoadedCount, setSubtopicsLoadedCount] = useState(() =>
    Math.min(SUBTOPICS_OPPORTUNITIES_PAGE_SIZE, automationSubtopicsTabTopicRows.length),
  );
  const [subtopicsLoadingMore, setSubtopicsLoadingMore] = useState(false);
  const subtopicsLoadedCountRef = useRef(subtopicsLoadedCount);
  const subtopicsLoadingMoreRef = useRef(subtopicsLoadingMore);
  subtopicsLoadedCountRef.current = subtopicsLoadedCount;
  subtopicsLoadingMoreRef.current = subtopicsLoadingMore;
  const subtopicsLoadInFlightRef = useRef(false);

  const visibleSubtopicsTabRows = useMemo(
    () => automationSubtopicsTabTopicRows.slice(0, subtopicsLoadedCount),
    [subtopicsLoadedCount],
  );

  useEffect(() => {
    if (scope !== "subtopics") return;
    const el = automationMainScrollRef.current;
    if (!el) return;

    const BOTTOM_SLACK_PX = 140;

    const tryLoadMore = () => {
      if (subtopicsLoadInFlightRef.current) return;
      if (subtopicsLoadedCountRef.current >= automationSubtopicsTabTopicRows.length) return;
      if (subtopicsLoadingMoreRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = el;
      const noOverflow = scrollHeight <= clientHeight + 2;
      const nearBottom = scrollTop + clientHeight >= scrollHeight - BOTTOM_SLACK_PX;
      if (!noOverflow && !nearBottom) return;

      subtopicsLoadInFlightRef.current = true;
      setSubtopicsLoadingMore(true);
      window.setTimeout(() => {
        setSubtopicsLoadedCount((c) =>
          Math.min(c + SUBTOPICS_OPPORTUNITIES_PAGE_SIZE, automationSubtopicsTabTopicRows.length),
        );
        setSubtopicsLoadingMore(false);
        subtopicsLoadInFlightRef.current = false;
      }, 800);
    };

    el.addEventListener("scroll", tryLoadMore, { passive: true });
    requestAnimationFrame(() => tryLoadMore());
    return () => el.removeEventListener("scroll", tryLoadMore);
  }, [scope]);

  useEffect(() => {
    if (location.hash !== TOP_OPPORTUNITIES_HASH) return;
    const requestedScope = deepLinkedTarget?.scope ?? "categories";
    setScope((current) => (current === requestedScope ? current : requestedScope));
  }, [deepLinkedTarget?.scope, location.hash]);

  useEffect(() => {
    if (location.hash !== TOP_OPPORTUNITIES_HASH) return;
    if (!deepLinkedTarget) return;

    if (deepLinkedTarget.scope === "categories") {
      setExpandedCategoryIds((prev) => {
        if (prev.has(deepLinkedTarget.id)) return prev;
        const next = new Set(prev);
        next.add(deepLinkedTarget.id);
        return next;
      });
      return;
    }

    if (deepLinkedTarget.scope === "topics") {
      setExpandedTopicsTabRowIds((prev) => {
        if (prev.has(deepLinkedTarget.id)) return prev;
        const next = new Set(prev);
        next.add(deepLinkedTarget.id);
        return next;
      });
      return;
    }

    if (deepLinkedTarget.scope === "subtopics") {
      setExpandedSubtopicsTabRowIds((prev) => {
        if (prev.has(deepLinkedTarget.id)) return prev;
        const next = new Set(prev);
        next.add(deepLinkedTarget.id);
        return next;
      });
    }
  }, [deepLinkedTarget, location.hash]);

  useEffect(() => {
    if (location.hash !== TOP_OPPORTUNITIES_HASH) return;
    if (!deepLinkedTarget || deepLinkedTarget.scope !== "subtopics") return;

    const targetIndex = automationSubtopicsTabTopicRows.findIndex((row) => row.id === deepLinkedTarget.id);
    if (targetIndex < 0) return;

    setSubtopicsLoadedCount((count) =>
      Math.max(count, Math.min(targetIndex + 1, automationSubtopicsTabTopicRows.length)),
    );
  }, [deepLinkedTarget, location.hash]);

  useEffect(() => {
    if (location.hash !== TOP_OPPORTUNITIES_HASH) return;
    if (!deepLinkedTarget) return;
    if (scope !== deepLinkedTarget.scope) return;

    const scrollRoot = automationMainScrollRef.current;
    if (!scrollRoot) return;

    const highlightKey = buildTopOpportunityHighlightKey(deepLinkedTarget.scope, deepLinkedTarget.id);
    const selector = `[data-top-opportunity-scope="${deepLinkedTarget.scope}"][data-top-opportunity-id="${deepLinkedTarget.id}"]`;
    let rafId: number | null = null;
    let retryTimer: number | null = null;
    let clearTimer: number | null = null;
    let attempts = 0;
    let cancelled = false;

    const tryHighlightTarget = () => {
      if (cancelled) return;
      const targetCard = scrollRoot.querySelector<HTMLElement>(selector);
      if (!targetCard) {
        if (attempts < 20) {
          attempts += 1;
          retryTimer = window.setTimeout(tryHighlightTarget, 80);
        }
        return;
      }

      rafId = window.requestAnimationFrame(() => {
        const rootRect = scrollRoot.getBoundingClientRect();
        const targetRect = targetCard.getBoundingClientRect();
        const nextTop = scrollRoot.scrollTop + (targetRect.top - rootRect.top) - 12;
        scrollRoot.scrollTo({ top: Math.max(0, nextTop), behavior: "auto" });
        setHighlightedCardKey(highlightKey);
      });

      clearTimer = window.setTimeout(() => {
        setHighlightedCardKey((current) => (current === highlightKey ? null : current));
      }, TOP_OPPORTUNITY_HIGHLIGHT_MS);
    };

    tryHighlightTarget();

    return () => {
      cancelled = true;
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      if (clearTimer !== null) window.clearTimeout(clearTimer);
    };
  }, [deepLinkedTarget, location.hash, scope, subtopicsLoadedCount]);

  useEffect(() => {
    if (location.hash !== TOP_OPPORTUNITIES_HASH) return;
    if (deepLinkedTarget) return;
    if (scope !== "categories") return;

    const scrollRoot = automationMainScrollRef.current;
    const target = topOpportunitiesSectionRef.current;
    if (!scrollRoot || !target) return;

    const rafId = window.requestAnimationFrame(() => {
      const rootRect = scrollRoot.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const nextTop = scrollRoot.scrollTop + (targetRect.top - rootRect.top) - 12;
      scrollRoot.scrollTo({ top: Math.max(0, nextTop), behavior: "auto" });
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [deepLinkedTarget, location.hash, scope]);

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
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId={DASHBOARD_ID}>
      <Tabs
        value={scope}
        onValueChange={(v) => setScope(v as AutomationScopeTab)}
        className="flex flex-col flex-1 min-h-0"
      >
        <div className="flex flex-col flex-1 min-h-0">
          <PageHeader className={pageHeaderTabsFooterClassName}>
            <section className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-3xl tracking-tight">Automation Opportunities</h1>
                <p className="text-muted-foreground mt-1">
                  Dashboard view of high-impact opportunities to improve efficiency and customer outcomes.
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 shrink-0 p-0"
                    onClick={() => navigate("settings")}
                    aria-label="Open automation settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Settings</TooltipContent>
              </Tooltip>
            </section>

            <div className="mt-4 flex flex-wrap items-center gap-2">
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
                  <LabeledFilterInline label="Date range">
                    {dateRange === DATE_RANGE_CUSTOM_OPTION && customRange?.from && customRange?.to
                      ? formatShortDateRange(customRange)
                      : DATE_RANGE_LABELS[dateRange]}
                  </LabeledFilterInline>
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
                  <LabeledSelectValue label="Channel" />
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

            <TabsList variant="line" className="mt-4">
              <TabsTrigger value="categories">Categories</TabsTrigger>
              <TabsTrigger value="topics">Topics</TabsTrigger>
              <TabsTrigger value="subtopics">Sub-topics</TabsTrigger>
            </TabsList>
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

          <SampleInteractionsDialog
            open={sampleInteractionsOpen}
            onOpenChange={setSampleInteractionsOpen}
            categoryTitle={sampleInteractionsCategory}
          />

          <div ref={automationMainScrollRef} className="flex-1 min-h-0 overflow-auto">
            <div className={cn(pageRootListScrollGutterClassName, "pb-4 md:pb-8")}>
              <PageTransition className={cn(pageMainColumnClassName, "space-y-8")}>
                <HeaderAIInsightsRow
                  dashboardId={DASHBOARD_ID}
                  dashboardData={{
                    id: DASHBOARD_ID,
                    title: "Automation Opportunities",
                    description:
                      "High-impact automation opportunities across categories, topics, and sub-topics.",
                  }}
                />
                <TabsContent value="categories" className="mt-0 space-y-8 outline-none">
                  <AnalyzedPeriodSection stats={automationAnalyzedPeriodStats} />
                  <section
                    id={TOP_OPPORTUNITIES_SECTION_ID}
                    ref={topOpportunitiesSectionRef}
                    className="space-y-4"
                  >
                    <TopOpportunitiesSectionHeading />
                    <div className="flex flex-col gap-4">
                      {topOpportunitiesByScope.categories.map((cat) => (
                        <TopOpportunityCard
                          key={cat.id}
                          category={cat}
                          targetId={cat.id}
                          isHighlighted={
                            highlightedCardKey === buildTopOpportunityHighlightKey("categories", cat.id)
                          }
                          expanded={expandedCategoryIds.has(cat.id)}
                          onToggleExpanded={() => {
                            setExpandedCategoryIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(cat.id)) next.delete(cat.id);
                              else next.add(cat.id);
                              return next;
                            });
                          }}
                          expandedTopicIds={expandedTopicIds}
                          expandedSubTopicIds={expandedSubTopicIds}
                          toggleTopic={(id) => {
                            setExpandedTopicIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              return next;
                            });
                          }}
                          toggleSubTopic={(id) => {
                            setExpandedSubTopicIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(id)) next.delete(id);
                              else next.add(id);
                              return next;
                            });
                          }}
                          onOpenSampleInteractions={(title) => {
                            setSampleInteractionsCategory(title);
                            setSampleInteractionsOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="topics" className="mt-0 space-y-8 outline-none">
                  <AnalyzedPeriodSection stats={automationTopicsTabPeriodStats} />
                  <section className="space-y-4">
                    <TopOpportunitiesSectionHeading />
                    <div className="flex flex-col gap-4">
                      {automationTopicsTabTopicRows.map((row) => (
                        <AutomationTopicsTabTopicCard
                          key={row.id}
                          row={row}
                          targetScope="topics"
                          isHighlighted={
                            highlightedCardKey === buildTopOpportunityHighlightKey("topics", row.id)
                          }
                          agentTabKey="topics-tab"
                          expanded={expandedTopicsTabRowIds.has(row.id)}
                          onToggleExpanded={() => {
                            setExpandedTopicsTabRowIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(row.id)) next.delete(row.id);
                              else next.add(row.id);
                              return next;
                            });
                          }}
                          onOpenSampleInteractions={(title) => {
                            setSampleInteractionsCategory(title);
                            setSampleInteractionsOpen(true);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="subtopics" className="mt-0 space-y-8 outline-none">
                  <AnalyzedPeriodSection stats={automationSubtopicsTabPeriodStats} />
                  <section className="space-y-4">
                    <TopOpportunitiesSectionHeading />
                    <div className="flex flex-col gap-4">
                      {visibleSubtopicsTabRows.map((row) => (
                        <AutomationTopicsTabTopicCard
                          key={row.id}
                          row={row}
                          targetScope="subtopics"
                          isHighlighted={
                            highlightedCardKey === buildTopOpportunityHighlightKey("subtopics", row.id)
                          }
                          agentTabKey="subtopics-tab"
                          expanded={expandedSubtopicsTabRowIds.has(row.id)}
                          onToggleExpanded={() => {
                            setExpandedSubtopicsTabRowIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(row.id)) next.delete(row.id);
                              else next.add(row.id);
                              return next;
                            });
                          }}
                          onOpenSampleInteractions={(title) => {
                            setSampleInteractionsCategory(title);
                            setSampleInteractionsOpen(true);
                          }}
                        />
                      ))}
                      {subtopicsLoadingMore ? (
                        <div
                          className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground"
                          aria-live="polite"
                        >
                          <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                          Loading more Opportunities…
                        </div>
                      ) : null}
                    </div>
                  </section>
                </TabsContent>
              </PageTransition>
            </div>
          </div>
        </div>
      </Tabs>

    </WidgetAIProvider>
  );
}
