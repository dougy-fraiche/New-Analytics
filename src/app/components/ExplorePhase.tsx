import type { LegacyRef, RefObject } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { ChatInputBar } from "./ChatInputBar";
import { PageContent, pageMainColumnClassName, pageRootListScrollGutterClassName } from "./PageChrome";
import { RecommendedActionSheet } from "./RecommendedActionSheet";
import { WidgetAIPromptButton } from "./WidgetAIPromptButton";
import type { RecommendedAction } from "../data/recommended-actions";
import { topInsightCardToRecommendedAction } from "../lib/top-insight-to-recommended-action";
import {
  exploreHeadings,
  suggestedActions,
  topInsightsCards,
} from "../data/explore-data";

type TopInsightsFilter = "all" | "anomalies" | "actions";

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
  onActionClick: (label: string, prompts: string[]) => void;
  onSend: () => void;
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
  onTypeaheadSuggestionPicked,
}: ExplorePhaseProps) {
  const [topInsightsFilter, setTopInsightsFilter] = useState<TopInsightsFilter>("all");
  const [topInsightSheetAction, setTopInsightSheetAction] = useState<RecommendedAction | null>(
    null,
  );
  const exploreSurfaceRef = useRef<HTMLDivElement>(null);
  const heroHeading = useMemo(
    () => exploreHeadings[Math.floor(Math.random() * exploreHeadings.length)],
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

  const filteredTopInsights = useMemo(() => {
    switch (topInsightsFilter) {
      case "anomalies":
        return topInsightsCards.filter((c) => c.segment === "anomaly");
      case "actions":
        return topInsightsCards.filter(
          (c) => c.segment === "opportunity" && c.showActionPill,
        );
      default:
        return topInsightsCards;
    }
  }, [topInsightsFilter]);

  return (
    <>
      <RecommendedActionSheet
        action={topInsightSheetAction}
        open={!!topInsightSheetAction}
        onOpenChange={(open) => {
          if (!open) setTopInsightSheetAction(null);
        }}
        onDismiss={() => setTopInsightSheetAction(null)}
      />
      <div
        ref={exploreSurfaceRef}
        key="explore"
        className="explore-page-gradient flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <PageContent className="flex h-full max-h-[800px] shrink-0 flex-col items-center justify-center pb-24">
          <div className="relative mx-auto flex w-full max-w-[64rem] flex-col items-stretch gap-8 text-center">
            <h1
              className="animate-gradient-text w-full text-[36px] font-normal leading-[44px] tracking-tight sm:text-[40px] sm:leading-[48px]"
              style={{ fontWeight: 600 }}
            >
              {heroHeading}
            </h1>

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

            <div className="flex flex-wrap items-center justify-center gap-2">
              {suggestedActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onActionClick(action.label, action.prompts)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {action.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </PageContent>

        <div className={pageRootListScrollGutterClassName}>
          <div className={pageMainColumnClassName}>
            <section className="mt-auto mb-8 flex flex-col items-center rounded-xl border border-border/60 bg-background p-8 shadow-sm">
              <div className="mx-auto w-full">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <section className="min-w-0">
                <h2 className="text-xl">Top Insights</h2>
                <p className="text-sm text-muted-foreground mt-1">
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
            <div className="grid min-h-[calc(180px*2+1rem)] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {filteredTopInsights.map((card) => {
                return (
                  <Card
                    key={card.id}
                    className="group/widget relative flex h-[180px] shrink-0 flex-col overflow-hidden transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30"
                  >
                    <div className="absolute right-2 top-2 z-10">
                      <WidgetAIPromptButton
                        widgetTitle={card.title}
                        chartType="insight"
                        widgetAnchorId={`explore-top-insight-${card.id}`}
                        tooltipLabel="Ask AI about this insight"
                        tooltipSide="bottom"
                      />
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`View details: ${card.title}`}
                      className="flex min-h-0 w-full flex-1 cursor-pointer flex-col rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() =>
                        setTopInsightSheetAction(topInsightCardToRecommendedAction(card))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setTopInsightSheetAction(topInsightCardToRecommendedAction(card));
                        }
                      }}
                    >
                      <CardHeader className="shrink-0 gap-1 space-y-0 px-4 pb-1.5 pr-11 pt-3">
                        <CardTitle className="line-clamp-2 text-base font-semibold leading-snug">
                          {card.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-xs leading-snug">
                          {card.description}
                        </CardDescription>
                      </CardHeader>
                      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pr-11">
                        <p className="min-h-0 flex-1 overflow-y-auto text-xs leading-snug text-muted-foreground">
                          {card.detail}
                        </p>
                      </div>
                      <div className="mt-auto flex w-full min-w-0 shrink-0 flex-wrap items-center justify-between gap-2 px-4 pb-3 pt-2">
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                          {card.segment === "anomaly" ? (
                            <>
                              <Badge variant="outline">Anomaly</Badge>
                              <Badge
                                variant={
                                  card.severity === "Critical" ? "destructive" : "secondary"
                                }
                              >
                                {card.severity}
                              </Badge>
                            </>
                          ) : (
                            <>
                              {card.showActionPill ? (
                                <Badge variant="default">Action</Badge>
                              ) : null}
                              <Badge variant="outline">Opportunity</Badge>
                            </>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {card.timestamp}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
