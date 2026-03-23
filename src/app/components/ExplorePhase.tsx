import type { RefObject } from "react";
import { useMemo, useState } from "react";
import { ArrowRight, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ChatInputBar } from "./ChatInputBar";
import { RecommendedActionSheet } from "./RecommendedActionSheet";
import {
  exploreHeadings,
  suggestedActions,
  insights,
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
  const [exploreSheetAction, setExploreSheetAction] = useState<RecommendedAction | null>(null);

  const heroHeading = useMemo(
    () => exploreHeadings[Math.floor(Math.random() * exploreHeadings.length)],
    [],
  );

  return (
    <>
      <motion.div
        key="explore"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.97 }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="flex-1 overflow-auto px-8 pt-8 space-y-14 flex flex-col items-center"
      >
        {/* Hero: heading + prompt + suggestion pills */}
        <div className="w-full mx-auto bg-accent border rounded-xl px-[32px] py-[96px]">
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