import type { LegacyRef, RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { BellOff, CircleAlert, MoreVertical, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ChatInputBar } from "./ChatInputBar";
import { pageRootListScrollGutterClassName } from "./PageChrome";
import { ExploreInsightDialog } from "./ExploreInsightDialog";
import {
  type TopInsightCard,
  exploreHeadings,
  topInsightsCards,
} from "../data/explore-data";
import { aiAgentEvaluationKpis, aiAgentOverviewKpis, aiAgentProductivityRows } from "../data/ai-agent-kpis";
import { currentUserProfile, getFirstName } from "../data/user-profile";

type TopInsightsFilter = "all" | "anomalies" | "actions";
const exploreMainContentClassName = "mx-auto w-full min-w-0 max-w-[1366px]";
const exploreFooterChatContainerClassName = "mx-auto w-full min-w-0 max-w-[1440px]";
const footerPromptChips = [
  "What are my AI agents struggling with today?",
  "What’s causing repeat calls?",
  "How can I improve my CSAT?",
  "What tasks are my human agents spending extra time on?",
];

interface ExplorePhaseProps {
  query: string;
  onQueryChange: (value: string) => void;
  voice: {
    isListening: boolean;
    isSupported: boolean;
    interimText: string;
    toggle: () => void;
    stop: () => void;
  };
  inputRef: RefObject<HTMLTextAreaElement | null>;
  heroInputBarRef: RefObject<HTMLDivElement | null>;
  isInputAnimating: boolean;
  showTypeahead: boolean;
  onShowTypeahead: (show: boolean) => void;
  forcedSuggestions: string[];
  onForcedSuggestionsChange: (s: string[]) => void;
  onActionClick: (prompt: string) => void;
  onSend: () => void;
  onTopInsightInvestigate: (insight: TopInsightCard) => void;
  /** Hero typeahead row selected — used to seed a dashboard on first send. */
  onTypeaheadSuggestionPicked?: () => void;
}

export function ExplorePhase({
  query,
  onQueryChange,
  voice,
  inputRef,
  heroInputBarRef,
  isInputAnimating,
  showTypeahead,
  onShowTypeahead,
  forcedSuggestions,
  onForcedSuggestionsChange,
  onActionClick,
  onSend,
  onTopInsightInvestigate,
  onTypeaheadSuggestionPicked,
}: ExplorePhaseProps) {
  const [topInsightsFilter, setTopInsightsFilter] = useState<TopInsightsFilter>("all");
  const [topInsightDialogCard, setTopInsightDialogCard] = useState<TopInsightCard | null>(
    null,
  );
  const [dismissedTopInsightIds, setDismissedTopInsightIds] = useState<Set<number>>(
    () => new Set(),
  );
  const exploreSurfaceRef = useRef<HTMLDivElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const contentBodyRef = useRef<HTMLDivElement>(null);
  const [showFooterFade, setShowFooterFade] = useState(false);
  const heroHeading = useMemo(
    () => exploreHeadings[Math.floor(Math.random() * exploreHeadings.length)],
    [],
  );
  const firstName = useMemo(
    () => getFirstName(currentUserProfile.displayName),
    [],
  );
  const aiAgentProductivityMetrics = useMemo(
    () => [
      {
        label: "Total Sessions",
        value: aiAgentOverviewKpis.find((kpi) => kpi.label === "Total Sessions")?.value ?? "—",
      },
      {
        label: "Sentiment",
        value: aiAgentEvaluationKpis.find((kpi) => kpi.label === "Positive Sent")?.value ?? "—",
      },
      {
        label: "Brand Alignment",
        value: aiAgentEvaluationKpis.find((kpi) => kpi.label === "Brand Aligned")?.value ?? "—",
      },
    ],
    [],
  );
  const aiAgentProductivityComparisonRows = useMemo(
    () =>
      [...aiAgentProductivityRows]
        .sort((a, b) => b.totalSessions - a.totalSessions)
        .slice(0, 10),
    [],
  );

  useLayoutEffect(() => {
    const root = exploreSurfaceRef.current;
    const barWrap = heroInputBarRef.current;
    if (!root) return;

    const applyGradientOrigin = () => {
      const r = root.getBoundingClientRect();
      const b = barWrap?.getBoundingClientRect();
      if (!b || r.width <= 0 || r.height <= 0 || b.width <= 0 || b.height <= 0) {
        root.style.setProperty("--explore-gradient-x", "50%");
        root.style.setProperty("--explore-gradient-y", "28%");
        return;
      }
      const cx = ((b.left + b.width / 2 - r.left) / r.width) * 100;
      const cy = ((b.top + b.height / 2 - r.top) / r.height) * 100;
      root.style.setProperty(
        "--explore-gradient-x",
        `${Math.max(0, Math.min(100, cx)).toFixed(2)}%`,
      );
      root.style.setProperty(
        "--explore-gradient-y",
        `${Math.max(0, Math.min(100, cy)).toFixed(2)}%`,
      );
    };

    applyGradientOrigin();
    const ro = new ResizeObserver(applyGradientOrigin);
    ro.observe(root);
    if (barWrap) ro.observe(barWrap);
    window.addEventListener("resize", applyGradientOrigin);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", applyGradientOrigin);
    };
  }, [heroInputBarRef]);

  const eligibleTopInsights = useMemo(
    () =>
      topInsightsCards.filter(
        (card) => card.segment === "anomaly" || (card.segment === "opportunity" && Boolean(card.automationTarget.id)),
      ),
    [],
  );

  const allTopInsightsDismissed = useMemo(
    () =>
      eligibleTopInsights.length > 0 &&
      eligibleTopInsights.every((card) => dismissedTopInsightIds.has(card.id)),
    [dismissedTopInsightIds, eligibleTopInsights],
  );

  const filteredTopInsights = useMemo(() => {
    const visibleCards = eligibleTopInsights.filter((card) => !dismissedTopInsightIds.has(card.id));
    switch (topInsightsFilter) {
      case "anomalies":
        return visibleCards.filter((c) => c.segment === "anomaly");
      case "actions":
        return visibleCards.filter(
          (c) => c.segment === "opportunity" && c.showActionPill,
        );
      default:
        return visibleCards;
    }
  }, [dismissedTopInsightIds, eligibleTopInsights, topInsightsFilter]);

  const handleDismissTopInsight = useCallback((insight: TopInsightCard) => {
    setDismissedTopInsightIds((prev) => {
      const next = new Set(prev);
      next.add(insight.id);
      return next;
    });
    setTopInsightDialogCard(null);
    toast.success("Insight dismissed", {
      description: `"${insight.title}" was hidden for this session.`,
      action: {
        label: "Undo",
        onClick: () => {
          setDismissedTopInsightIds((prev) => {
            const next = new Set(prev);
            next.delete(insight.id);
            return next;
          });
          toast.success("Insight restored");
        },
      },
    });
  }, []);

  const handleInvestigateTopInsight = useCallback((insight: TopInsightCard) => {
    setTopInsightDialogCard(null);
    onTopInsightInvestigate(insight);
  }, [onTopInsightInvestigate]);

  const updateFooterFadeVisibility = useCallback(() => {
    const scrollEl = contentScrollRef.current;
    if (!scrollEl) {
      setShowFooterFade(false);
      return;
    }
    const shouldShow = scrollEl.scrollTop + scrollEl.clientHeight < scrollEl.scrollHeight - 1;
    setShowFooterFade((prev) => (prev === shouldShow ? prev : shouldShow));
  }, []);

  useEffect(() => {
    const scrollEl = contentScrollRef.current;
    const contentEl = contentBodyRef.current;
    if (!scrollEl) return;

    const onScroll = () => updateFooterFadeVisibility();
    updateFooterFadeVisibility();
    scrollEl.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(updateFooterFadeVisibility);
    ro.observe(scrollEl);
    if (contentEl) ro.observe(contentEl);
    window.addEventListener("resize", updateFooterFadeVisibility);
    const rafId = window.requestAnimationFrame(updateFooterFadeVisibility);

    return () => {
      window.cancelAnimationFrame(rafId);
      scrollEl.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.removeEventListener("resize", updateFooterFadeVisibility);
    };
  }, [updateFooterFadeVisibility]);

  return (
    <>
      <ExploreInsightDialog
        insight={topInsightDialogCard}
        open={!!topInsightDialogCard}
        onOpenChange={(open) => {
          if (!open) setTopInsightDialogCard(null);
        }}
        onDismissInsight={handleDismissTopInsight}
        onInvestigateInsight={handleInvestigateTopInsight}
      />
      <div
        ref={exploreSurfaceRef}
        key="explore"
        className="explore-page-gradient flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div ref={contentScrollRef} className="flex-1 min-h-0 overflow-y-auto pb-6">
          <div ref={contentBodyRef} className="min-h-full">
            <div className="w-full min-w-0 px-8">
              <div className={`${exploreMainContentClassName} shrink-0 pb-6 pt-[6rem]`}>
                <div className="w-full text-left">
                  <h4 className="text-xl font-normal leading-7 text-neutral-300">
                    Hello, {firstName}!
                  </h4>
                  <h1
                    className="mt-2 text-3xl tracking-tight text-primary-900"
                  >
                    {heroHeading}
                  </h1>
                </div>
              </div>
            </div>

            <div className={pageRootListScrollGutterClassName}>
              <div className={exploreMainContentClassName}>
                <section className="mb-8 flex flex-col items-center">
                  <div className="mx-auto w-full">
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <section className="min-w-0">
                        <h2 className="text-xl">Top Insights</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Anomalies and opportunities surfaced from your operations data
                        </p>
                      </section>
                      <ToggleGroup
                        type="single"
                        value={topInsightsFilter}
                        onValueChange={(v) => {
                          if (v === "all" || v === "anomalies" || v === "actions") {
                            setTopInsightsFilter(v);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="w-fit shrink-0 justify-end sm:justify-start"
                        aria-label="Filter insights"
                      >
                        <ToggleGroupItem
                          value="all"
                          aria-label="Show all insights"
                          className="flex-none px-3"
                        >
                          All
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="anomalies"
                          aria-label="Show anomalies only"
                          className="flex-none px-3"
                        >
                          Anomalies
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="actions"
                          aria-label="Show actions only"
                          className="flex-none px-3"
                        >
                          Actions
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <div className="grid auto-rows-max grid-cols-[repeat(auto-fit,minmax(18rem,1fr))] gap-4">
                      {filteredTopInsights.length === 0 ? (
                        <Empty variant="solid" className="col-span-full min-h-[180px] bg-white">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <CircleAlert />
                            </EmptyMedia>
                            <EmptyTitle>
                              {allTopInsightsDismissed
                                ? "No insights right now"
                                : "No Top Insights match this filter"}
                            </EmptyTitle>
                            <EmptyDescription>
                              {allTopInsightsDismissed
                                ? "Check back later to see more insights as new signals are generated."
                                : "Try a different filter or check back later to see more insights."}
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        filteredTopInsights.map((card) => {
                          return (
                            <Card
                              key={card.id}
                              className="group/widget relative flex h-[8rem] shrink-0 flex-col overflow-hidden transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30"
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label={`Open actions for ${card.title}`}
                                    className="absolute right-2 top-2 z-20"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onSelect={(event) => {
                                      event.preventDefault();
                                      handleDismissTopInsight(card);
                                    }}
                                  >
                                    <BellOff className="h-4 w-4" />
                                    Dismiss
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <div
                                role="button"
                                tabIndex={0}
                                aria-label={`View details: ${card.title}`}
                                className="flex min-h-0 w-full flex-1 cursor-pointer flex-col rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                onClick={() => setTopInsightDialogCard(card)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setTopInsightDialogCard(card);
                                  }
                                }}
                              >
                                <CardHeader className="shrink-0 gap-1 space-y-0 px-4 pb-1.5 pt-3 pr-12">
                                  <CardTitle className="line-clamp-2 text-base font-semibold leading-snug">
                                    {card.title}
                                  </CardTitle>
                                  <CardDescription className="line-clamp-2 text-xs leading-snug">
                                    {card.description}
                                  </CardDescription>
                                </CardHeader>
                                <div className="mt-auto flex w-full min-w-0 shrink-0 flex-wrap items-center gap-2 px-4 pb-3 pt-2">
                                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                                    {card.segment === "anomaly" ? (
                                      <>
                                        <Badge variant="secondary" className="gap-1">
                                          <CircleAlert className="h-3 w-3" />
                                          Anomaly
                                        </Badge>
                                        <Badge
                                          variant={
                                            card.severity === "Critical" ? "destructive" : "secondary"
                                          }
                                          className={
                                            card.severity === "High"
                                              ? "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
                                              : undefined
                                          }
                                        >
                                          {card.severity}
                                        </Badge>
                                      </>
                                    ) : (
                                      <>
                                        {card.showActionPill ? (
                                          <Badge variant="secondary" className="gap-1">
                                            <Zap className="h-3 w-3" />
                                            Action
                                          </Badge>
                                        ) : null}
                                        <Badge variant="outline">Opportunity</Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          );
                        })
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-4">
                    <h2 className="text-xl">AI Agent Productivity</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {aiAgentProductivityMetrics.map((metric) => (
                      <Card
                        key={metric.label}
                        className="transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-md"
                      >
                        <CardHeader className="space-y-1 py-5">
                          <CardDescription className="text-sm">{metric.label}</CardDescription>
                          <CardTitle className="text-2xl">{metric.value}</CardTitle>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                  <Card className="mt-4 mb-8 transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">By AI Agent</CardTitle>
                      <CardDescription>
                        Compare sessions, sentiment, and brand alignment across your top 10 AI agents
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="min-w-0 overflow-x-auto">
                        <Table className="min-w-[36rem] table-auto">
                          <TableHeader>
                            <TableRow>
                              <TableHead>AI Agent</TableHead>
                              <TableHead className="text-right">Total Sessions</TableHead>
                              <TableHead className="text-right">Sentiment</TableHead>
                              <TableHead className="text-right">Brand Alignment</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {aiAgentProductivityComparisonRows.map((row) => (
                              <TableRow key={row.agentName}>
                                <TableCell>{row.agentName}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {row.totalSessions.toLocaleString("en-US")}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {`${row.sentimentPct}%`}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {`${row.brandAlignmentPct}%`}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`sticky bottom-0 z-30 shrink-0 border-t relative transition-colors ${
            showFooterFade ? "border-border/60 bg-primary-25" : "border-transparent bg-transparent"
          }`}
        >
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 -top-8 h-8 explore-footer-fade transition-opacity duration-200 ${
              showFooterFade ? "opacity-100" : "opacity-0"
            }`}
          />
          <div className="w-full min-w-0 px-8 py-8">
            <div className={`${exploreFooterChatContainerClassName} flex w-full flex-col gap-3 rounded-[1rem] border border-border/60 bg-neutral-0 p-8 shadow-md`}>
              <div className="flex flex-wrap items-center justify-start gap-2">
                {footerPromptChips.map((prompt) => {
                  return (
                    <Badge
                      key={prompt}
                      asChild
                      variant="secondary"
                      size="sm"
                      className="cursor-pointer px-2 py-1 text-xs hover:bg-secondary/90"
                    >
                      <button type="button" onClick={() => onActionClick(prompt)}>
                        <Sparkles className="h-3 w-3 shrink-0" />
                        {prompt}
                      </button>
                    </Badge>
                  );
                })}
              </div>
              <div
                ref={heroInputBarRef as LegacyRef<HTMLDivElement>}
                className="w-full"
                style={{ visibility: isInputAnimating ? "hidden" : "visible" }}
              >
                <ChatInputBar
                  variant="hero"
                  query={query}
                  voice={voice}
                  inputRef={inputRef}
                  onQueryChange={onQueryChange}
                  onSend={() => {
                    onShowTypeahead(false);
                    onSend();
                  }}
                  showTypeahead={showTypeahead}
                  onShowTypeahead={onShowTypeahead}
                  forcedSuggestions={forcedSuggestions}
                  onForcedSuggestionsChange={onForcedSuggestionsChange}
                  onTypeaheadSuggestionPicked={onTypeaheadSuggestionPicked}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
