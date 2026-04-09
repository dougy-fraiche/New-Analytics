import { AlertTriangle, Bot, Lightbulb, CircleAlert, Zap } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import type { TopInsightCard } from "../data/explore-data";

interface ExploreInsightDialogProps {
  insight: TopInsightCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismissInsight: (insight: TopInsightCard) => void;
  onInvestigateInsight: (insight: TopInsightCard) => void;
}

export function ExploreInsightDialog({
  insight,
  open,
  onOpenChange,
  onDismissInsight,
  onInvestigateInsight,
}: ExploreInsightDialogProps) {
  if (!insight) return null;

  if (insight.segment === "anomaly") {
    const isCritical = insight.severity === "Critical";
    const severityBadgeVariant = isCritical ? "destructive" : "secondary";
    const severityBadgeClassName = isCritical
      ? undefined
      : "border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300";
    const headingDescription = isCritical
      ? "Critical anomaly requiring immediate response."
      : "High-priority anomaly to investigate.";

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-h-[calc(100vh-2rem)] max-w-[520px] overflow-y-auto">
          <DialogHeader>
            <div className="mb-2 flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-destructive/10 p-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="leading-tight">{insight.title}</DialogTitle>
                <DialogDescription>{headingDescription}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-sm leading-relaxed">{insight.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">{insight.detail}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Insight Type
                </p>
                <Badge variant="outline" className="mt-1 gap-1">
                  <CircleAlert className="h-3 w-3" />
                  Anomaly
                </Badge>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Severity
                </p>
                <Badge
                  variant={severityBadgeVariant}
                  className={severityBadgeClassName ? `mt-1 ${severityBadgeClassName}` : "mt-1"}
                >
                  {insight.severity}
                </Badge>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Last Updated
                </p>
                <p className="mt-1 text-sm">{insight.timestamp}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Suggested Track
                </p>
                <p className="mt-1 text-sm">
                  {isCritical ? "Immediate mitigation" : "Root-cause review"}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2 sm:justify-end">
            <Button
              onClick={() => {
                onInvestigateInsight(insight);
              }}
            >
              Investigate further
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onDismissInsight(insight);
              }}
            >
              Dismiss insight
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const isActionOpportunity = insight.showActionPill;
  const description = isActionOpportunity
    ? "Action-ready opportunity identified from operations data."
    : "Opportunity identified for potential improvement.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-h-[calc(100vh-2rem)] max-w-[520px] overflow-y-auto">
        <DialogHeader>
          <div className="mb-2 flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-primary/10 p-2">
              {isActionOpportunity ? (
                <Bot className="h-5 w-5 text-primary" />
              ) : (
                <Lightbulb className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="leading-tight">{insight.title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-sm leading-relaxed">{insight.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">{insight.detail}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Insight Type
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {isActionOpportunity ? (
                  <Badge variant="default" className="gap-1">
                    <Zap className="h-3 w-3" />
                    Action
                  </Badge>
                ) : null}
                <Badge variant="outline">Opportunity</Badge>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Readiness
              </p>
              <p className="mt-1 text-sm">
                {isActionOpportunity ? "Ready to build" : "Needs validation"}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Last Updated
              </p>
              <p className="mt-1 text-sm">{insight.timestamp}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Suggested Track
              </p>
              <p className="mt-1 text-sm">
                {isActionOpportunity ? "Automation rollout" : "Opportunity analysis"}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2 gap-2 sm:justify-end">
          <Button
            onClick={() => {
              onInvestigateInsight(insight);
            }}
          >
            Investigate further
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onDismissInsight(insight);
            }}
          >
            Dismiss insight
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
