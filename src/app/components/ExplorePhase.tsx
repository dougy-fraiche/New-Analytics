import type { RefObject } from "react";
import { useMemo, useState } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Zap, Bot, ShieldCheck, RotateCcw, CalendarClock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ChatInputBar } from "./ChatInputBar";
import { RecommendedActionSheet } from "./RecommendedActionSheet";
import { PageContent } from "./PageChrome";
import {
  PAGE_ENTER_ANIMATE,
  PAGE_ENTER_INITIAL,
  PAGE_EXIT,
  PAGE_TRANSITION,
} from "./page-transition-presets";
import {
  exploreHeadings,
  suggestedActions,
  insights,
  topAutomationOpportunities,
} from "../data/explore-data";
import {
  recommendedActionsData,
  actionIconMap,
  actionIconColors,
  defaultActionIcon,
  defaultActionIconColors,
  type RecommendedAction,
} from "../data/recommended-actions";

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
  shouldSkipAnimation?: boolean;
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
  shouldSkipAnimation = false,
}: ExplorePhaseProps) {
  const [exploreSheetAction, setExploreSheetAction] = useState<RecommendedAction | null>(null);
  const opportunityIconMap = {
    1: ShieldCheck,
    2: Bot,
    3: RotateCcw,
    4: CalendarClock,
  } as const;

  const heroHeading = useMemo(
    () => exploreHeadings[Math.floor(Math.random() * exploreHeadings.length)],
    [],
  );

  return (
    <>
      <motion.div
        key="explore"
        initial={shouldSkipAnimation ? false : PAGE_ENTER_INITIAL}
        animate={PAGE_ENTER_ANIMATE}
        exit={shouldSkipAnimation ? { opacity: 1 } : PAGE_EXIT}
        transition={shouldSkipAnimation ? { duration: 0 } : PAGE_TRANSITION}
        className="flex-1 overflow-auto"
      >
        <PageContent className="px-4 pt-8 pb-8 md:px-8 space-y-14 flex flex-col items-center">
          {/* Hero: heading + prompt + suggestion pills */}
          <div className="explore-hero-gradient w-full mx-auto rounded-xl px-[32px] py-[96px]">
            <div className="mx-auto w-full max-w-[50rem] text-center space-y-6">
              <h1
                className="tracking-tight animate-gradient-text text-[32px]"
                style={{ fontWeight: 600 }}
              >
                {heroHeading}
              </h1>

              {/* Main Input Card */}
              <div ref={heroInputBarRef} style={{ visibility: isInputAnimating ? "hidden" : "visible" }}>
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

              {/* Suggested Actions */}
              <div className="flex gap-2 justify-center flex-wrap">
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
          </div>

          {/* Key Insights + Linked Recommended Actions */}
          <div className="w-full mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl">Key Insights</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  AI-detected patterns with recommended actions
                </p>
              </div>
              <Button variant="link" className="gap-1 text-muted-foreground shrink-0" asChild>
                <Link to="/recommended-actions">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {insights.map((insight) => {
                const linkedAction = recommendedActionsData.find(
                  (a) => a.id === insight.linkedActionId,
                );
                const ActionIcon = linkedAction
                  ? (actionIconMap[linkedAction.id] ?? defaultActionIcon)
                  : null;
                const actionColors = linkedAction
                  ? (actionIconColors[linkedAction.id] ?? defaultActionIconColors)
                  : null;
                return (
                  <Card
                    key={insight.id}
                    className="flex flex-col transition-[box-shadow,border-color] hover:shadow-md hover:border-primary/30"
                  >
                    <button
                      type="button"
                      className="text-left cursor-pointer"
                      onClick={() => {
                        onQueryChange(`Tell me about ${insight.title.toLowerCase()}`);
                        setTimeout(() => inputRef.current?.focus(), 0);
                      }}
                    >
                      <CardHeader className="pb-3">
                        <CardDescription>{insight.title}</CardDescription>
                        <div className="flex items-baseline gap-2">
                          <CardTitle className="text-3xl">{insight.value}</CardTitle>
                          <Badge
                            variant={
                              insight.trend === "up"
                                ? "default"
                                : insight.trend === "down"
                                ? "destructive"
                                : "secondary"
                            }
                            className="flex items-center gap-1"
                          >
                            {insight.trend === "up" && <TrendingUp className="h-3 w-3" />}
                            {insight.trend === "down" && <TrendingDown className="h-3 w-3" />}
                            {insight.change}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-0">
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </CardContent>
                    </button>

                    {linkedAction && ActionIcon && actionColors && (
                      <div className="mt-auto px-6 pb-4 pt-3">
                        <Separator className="mb-3" />
                        <button
                          type="button"
                          className="w-full text-left group/action cursor-pointer rounded-lg p-2 -mx-2 transition-colors hover:bg-muted/60"
                          onClick={() => setExploreSheetAction(linkedAction)}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${actionColors.bg}`}
                            >
                              <ActionIcon className={`h-3.5 w-3.5 ${actionColors.text}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Zap className="h-3 w-3 text-amber-500 shrink-0" />
                                <span className="text-xs text-muted-foreground">Recommended</span>
                              </div>
                              <p
                                className="text-sm truncate group-hover/action:text-primary transition-colors"
                                style={{ fontWeight: 500 }}
                              >
                                {linkedAction.title}
                              </p>
                              <span
                                className="text-xs text-green-700 dark:text-green-400"
                                style={{ fontWeight: 500 }}
                              >
                                {linkedAction.impactValue}
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          <div className="w-full mx-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl">Top Automation Opportunities</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  AI-identified processes with the highest automation potential
                </p>
              </div>
              <Button variant="link" className="gap-1 text-muted-foreground shrink-0">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {topAutomationOpportunities.map((opportunity) => {
                const Icon = opportunityIconMap[opportunity.id as keyof typeof opportunityIconMap] ?? Bot;
                return (
                  <Card key={opportunity.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base leading-tight">{opportunity.title}</CardTitle>
                          <CardDescription className="mt-1">{opportunity.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Badge variant={opportunity.priority === "Critical" ? "destructive" : "secondary"}>
                            {opportunity.priority}
                          </Badge>
                          <Badge variant="outline">AI Agent</Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{opportunity.weeklyVolume}</span>
                          <span className="text-green-600 dark:text-green-400">{opportunity.impactValue}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Details
                        </Button>
                        <Button size="sm">Create AI Agent</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </PageContent>
      </motion.div>

      {/* Recommended Action Detail Sheet */}
      <RecommendedActionSheet
        action={exploreSheetAction}
        open={!!exploreSheetAction}
        onOpenChange={(open) => {
          if (!open) setExploreSheetAction(null);
        }}
      />
    </>
  );
}