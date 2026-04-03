import type { LegacyRef, RefObject } from "react";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ChatInputBar } from "./ChatInputBar";
import { PageContent } from "./PageChrome";
import {
  exploreHeadings,
  suggestedActions,
  topInsightsCards,
} from "../data/explore-data";

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
}: ExplorePhaseProps) {
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

  return (
    <>
      <div
        ref={exploreSurfaceRef}
        key="explore"
        className="explore-page-gradient flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        <PageContent className="flex h-full max-h-[800px] shrink-0 flex-col items-center justify-center px-4 pt-24 pb-24 md:px-8">
          <div className="relative mx-auto flex w-full max-w-[64rem] flex-col items-stretch gap-6 text-center">
            <h1
              className="animate-gradient-text w-full text-[32px] font-semibold leading-[48px] tracking-tight"
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

        <div className="mt-auto shrink-0 px-8 pb-8">
          <PageContent className="flex flex-col items-center rounded-xl border border-border/60 bg-background p-8 shadow-sm">
            <div className="mx-auto w-full">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl">Top Insights</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Anomalies, automation opportunities, and recommended actions
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {topInsightsCards.map((card) => {
                  const badgeVariant =
                    card.category === "Critical"
                      ? "destructive"
                      : card.category === "High"
                      ? "secondary"
                      : card.category === "Action"
                      ? "default"
                      : "outline";

                  return (
                    <Card
                      key={card.id}
                      className="group/widget h-full transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30"
                    >
                      <CardHeader className="pb-2">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <Badge variant={badgeVariant}>{card.category}</Badge>
                          <span className="text-xs text-muted-foreground">{card.timestamp}</span>
                        </div>
                        <CardTitle className="text-xl leading-tight">{card.title}</CardTitle>
                        <CardDescription>{card.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground">{card.detail}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </PageContent>
        </div>
      </div>
    </>
  );
}