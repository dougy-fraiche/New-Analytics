import type { LegacyRef, RefObject } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Activity, BellOff, Bot, CircleAlert, MoreVertical, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./ui/empty";
import { ChatInputBar } from "./ChatInputBar";
import { KpiMetricValueTitle } from "./KpiMetricValueTitle";
import { KpiSparkline } from "./KpiSparkline";
import { cn } from "./ui/utils";
import {
  type TopInsightCard,
  exploreHeadings,
  topInsightsCards,
} from "../data/explore-data";
import { aiAgentEvaluationKpis, aiAgentOverviewKpis } from "../data/ai-agent-kpis";
import { currentUserProfile, getFirstName } from "../data/user-profile";

const exploreMainContentClassName = "mx-auto w-full min-w-0 max-w-[1366px]";
const exploreFooterChatContainerClassName = "mx-auto w-full min-w-0 max-w-[1440px]";
const footerPromptChips = [
  "What are my AI agents struggling with today?",
  "What’s causing repeat calls?",
  "How can I improve my CSAT?",
  "What tasks are my human agents spending extra time on?",
];
const KPI_SPARKLINE_POINTS = 14;

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseMetricTarget(value: string): { target: number; isPercent: boolean } | null {
  const match = value.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number.parseFloat(match[0]);
  if (!Number.isFinite(parsed)) return null;
  return { target: parsed, isPercent: value.includes("%") };
}

function clampMetricValue(value: number, isPercent: boolean): number {
  if (isPercent) return Math.max(0, Math.min(100, value));
  return Math.max(0, value);
}

function normalizeMetricValue(value: number, isPercent: boolean): number {
  if (isPercent) return Number(value.toFixed(1));
  return Math.round(value);
}

function buildDeterministicSparkline(
  target: number,
  isPercent: boolean,
  seedKey: string,
  profileIndex: number,
): number[] {
  const random = createSeededRandom(hashSeed(seedKey));
  const normalizedTarget = normalizeMetricValue(clampMetricValue(target, isPercent), isPercent);
  const values: number[] = [];
  const profile = profileIndex % 3;
  const phase = random() * Math.PI * 2;
  const volatilityBase = isPercent
    ? 1.25 + random() * 0.75
    : Math.max(normalizedTarget * 0.02, 6) * (0.8 + random() * 0.6);
  const anchorSpan = isPercent
    ? 8 + random() * 10
    : Math.max(normalizedTarget * 0.3, 40) * (0.65 + random() * 0.5);
  let current = clampMetricValue(
    normalizedTarget - anchorSpan * (0.55 + random() * 0.45),
    isPercent,
  );

  for (let point = 0; point < KPI_SPARKLINE_POINTS - 1; point += 1) {
    const t = point / (KPI_SPARKLINE_POINTS - 1);
    const towardTarget = (normalizedTarget - current) * (0.16 + random() * 0.14);
    const jitter = (random() - 0.5) * volatilityBase * 0.7;
    const wave =
      profile === 0
        ? Math.sin((t * 2.25 + phase) * Math.PI) * volatilityBase * 0.45 + t * volatilityBase * 0.18
        : profile === 1
          ? Math.cos((t * 2.9 + phase) * Math.PI) * volatilityBase * 0.55 - t * volatilityBase * 0.12
          : Math.sin((t * 1.45 + phase) * Math.PI) * volatilityBase * 0.62 + (t < 0.6 ? -volatilityBase * 0.16 : volatilityBase * 0.22);
    current = clampMetricValue(current + towardTarget + jitter + wave, isPercent);
    values.push(normalizeMetricValue(current, isPercent));
  }

  values.push(normalizedTarget);
  return values;
}

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
  const [dismissedTopInsightIds, setDismissedTopInsightIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [exploreContentNode, setExploreContentNode] = useState<HTMLDivElement | null>(null);
  const [exploreContentWidth, setExploreContentWidth] = useState<number>(() =>
    typeof window === "undefined" ? 0 : window.innerWidth,
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
  const setExploreContentRef = useCallback((node: HTMLDivElement | null) => {
    setExploreContentNode(node);
  }, []);

  useLayoutEffect(() => {
    if (!exploreContentNode) return;

    const update = () => {
      setExploreContentWidth(exploreContentNode.clientWidth);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(exploreContentNode);
    return () => observer.disconnect();
  }, [exploreContentNode]);

  const isNarrowExploreContainer = exploreContentWidth < 768;
  const topInsightGridColumnsClassName = isNarrowExploreContainer
    ? "grid-cols-1"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  const aiProductivityGridColumnsClassName = isNarrowExploreContainer
    ? "grid-cols-1"
    : "grid-cols-1 md:grid-cols-3";
  const aiAgentProductivityMetrics = useMemo(
    () => {
      const baseMetrics = [
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
      ];

      return baseMetrics.map((metric, index) => {
        const parsed = parseMetricTarget(metric.value);
        const isPercent = parsed?.isPercent ?? false;
        const sparkline = parsed
          ? buildDeterministicSparkline(parsed.target, isPercent, `${metric.label}-${index}`, index)
          : buildDeterministicSparkline(index * 20 + 60, false, `${metric.label}-${index}-fallback`, index);

        return {
          ...metric,
          sparkline,
          formatValue: isPercent
            ? (value: number) => `${value.toFixed(1)}%`
            : (value: number) => Math.round(value).toLocaleString("en-US"),
        };
      });
    },
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

  const visibleTopInsights = useMemo(
    () => eligibleTopInsights.filter((card) => !dismissedTopInsightIds.has(card.id)),
    [dismissedTopInsightIds, eligibleTopInsights],
  );

  const anomalyInsights = useMemo(
    () => visibleTopInsights.filter((card) => card.segment === "anomaly"),
    [visibleTopInsights],
  );

  const recommendedActionInsights = useMemo(
    () =>
      visibleTopInsights.filter(
        (card) => card.segment === "opportunity" && card.showActionPill,
      ),
    [visibleTopInsights],
  );

  const allAnomalyInsightsDismissed = useMemo(
    () =>
      eligibleTopInsights.some((card) => card.segment === "anomaly") &&
      eligibleTopInsights
        .filter((card) => card.segment === "anomaly")
        .every((card) => dismissedTopInsightIds.has(card.id)),
    [dismissedTopInsightIds, eligibleTopInsights],
  );

  const allRecommendedActionInsightsDismissed = useMemo(
    () =>
      eligibleTopInsights.some(
        (card) => card.segment === "opportunity" && card.showActionPill,
      ) &&
      eligibleTopInsights
        .filter((card) => card.segment === "opportunity" && card.showActionPill)
        .every((card) => dismissedTopInsightIds.has(card.id)),
    [dismissedTopInsightIds, eligibleTopInsights],
  );

  const handleDismissTopInsight = useCallback((insight: TopInsightCard) => {
    setDismissedTopInsightIds((prev) => {
      const next = new Set(prev);
      next.add(insight.id);
      return next;
    });
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

  const renderTopInsightCard = (card: TopInsightCard) => (
    <Card
      key={card.id}
      className="group/widget relative flex h-auto min-h-[8rem] shrink-0 flex-col overflow-hidden transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-md sm:h-[8rem]"
    >
      {card.segment === "anomaly" ? (
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
      ) : null}
      <div
        role="button"
        tabIndex={0}
        aria-label={`View details: ${card.title}`}
        className="flex min-h-0 w-full flex-1 cursor-pointer flex-col rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => onTopInsightInvestigate(card)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onTopInsightInvestigate(card);
          }
        }}
      >
        <CardHeader
          className={`shrink-0 gap-1 space-y-0 px-4 pb-1.5 pt-3 ${
            card.segment === "anomaly" ? "pr-12" : "pr-4"
          }`}
        >
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
                <Badge
                  variant={card.severity === "Critical" ? "destructive" : "secondary"}
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
                <Badge variant="outline" className="gap-1">
                  <Bot className="h-3 w-3" />
                  Automation Opportunity
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <>
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

            <div className="w-full min-w-0 px-8 pt-8">
              <div ref={setExploreContentRef} className={exploreMainContentClassName}>
                {!allAnomalyInsightsDismissed && (
                  <section className="mb-8 flex flex-col items-center">
                    <div className="mx-auto w-full">
                      <div className="mb-4">
                        <h2 className="flex items-center gap-2 text-xl">
                          <Activity className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                          Anomalies
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Active anomalies surfaced from your operations data, updated every 24 hours
                        </p>
                      </div>
                      <div className={cn("grid auto-rows-max gap-4", topInsightGridColumnsClassName)}>
                        {anomalyInsights.length === 0 ? (
                          <Empty variant="solid" className="col-span-full min-h-[180px] bg-white">
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <CircleAlert />
                              </EmptyMedia>
                              <EmptyTitle>No anomalies available</EmptyTitle>
                              <EmptyDescription>
                                Anomaly signals will appear here when detected.
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        ) : (
                          anomalyInsights.map(renderTopInsightCard)
                        )}
                      </div>
                    </div>
                  </section>
                )}

                <section className="mb-8 flex flex-col items-center">
                  <div className="mx-auto w-full">
                    <div className="mb-4">
                      <h2 className="flex items-center gap-2 text-xl">
                        <Zap className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                        Top Recommended Actions
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Priority opportunities with action-ready recommendations
                      </p>
                    </div>
                    <div className={cn("grid auto-rows-max gap-4", topInsightGridColumnsClassName)}>
                      {recommendedActionInsights.length === 0 ? (
                        <Empty variant="solid" className="col-span-full min-h-[180px] bg-white">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Zap />
                            </EmptyMedia>
                            <EmptyTitle>
                              {allRecommendedActionInsightsDismissed
                                ? "No recommended actions right now"
                                : "No recommended actions available"}
                            </EmptyTitle>
                            <EmptyDescription>
                              {allRecommendedActionInsightsDismissed
                                ? "Check back later to see more recommended actions as new opportunities are generated."
                                : "Recommended actions will appear here when opportunities are identified."}
                            </EmptyDescription>
                          </EmptyHeader>
                        </Empty>
                      ) : (
                        recommendedActionInsights.map(renderTopInsightCard)
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <div className="mb-4">
                    <h2 className="flex items-center gap-2 text-xl">
                      <Bot className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                      AI Agent Productivity
                    </h2>
                  </div>
                  <div className={cn("grid gap-4", aiProductivityGridColumnsClassName)}>
                    {aiAgentProductivityMetrics.map((metric) => (
                      <Card
                        key={metric.label}
                        className="transition-[box-shadow,border-color] hover:border-primary/30 hover:shadow-md"
                      >
                        <CardHeader className="pb-0">
                          <CardDescription className="text-sm">{metric.label}</CardDescription>
                          <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
                            <KpiMetricValueTitle value={metric.value} />
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <KpiSparkline
                            values={metric.sparkline}
                            seriesName={metric.label}
                            formatValue={metric.formatValue}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
          <div className="w-full min-w-0 px-8 pt-0 pb-8">
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
