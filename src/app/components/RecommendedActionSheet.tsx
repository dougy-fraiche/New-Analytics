import { Sparkles, Bot, BellOff } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { toast } from "sonner";
import type { RecommendedAction } from "../data/recommended-actions";
import { typeColors, actionIconMap, defaultActionIcon } from "../data/recommended-actions";

interface RecommendedActionSheetProps {
  action: RecommendedAction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDismiss?: (id: number) => void;
}

export function RecommendedActionSheet({
  action,
  open,
  onOpenChange,
  onDismiss,
}: RecommendedActionSheetProps) {
  if (!action) return null;

  const IconComp = actionIconMap[action.id] ?? defaultActionIcon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] w-full flex flex-col overflow-y-auto max-h-[calc(100vh-2rem)] p-0 gap-0">
        <DialogHeader className="pb-0 px-4 pt-4 gap-0">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <IconComp className="h-6 w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-tight">{action.title}</DialogTitle>
              <DialogDescription className="text-destructive mt-0.5">
                Causing {action.handoffsPerDay.toLocaleString()} human handoffs/day
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 space-y-5 px-4 pb-4">
          {/* Description block */}
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm text-foreground leading-relaxed">
              {action.description}.{" "}
              <span className="text-muted-foreground">{action.note}</span>
            </p>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] tracking-wider text-muted-foreground uppercase mb-1">
                Affected Intent
              </p>
              <p className="text-sm font-medium">{action.affectedIntent}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] tracking-wider text-muted-foreground uppercase mb-1">
                Escalations Today
              </p>
              <p className="text-sm font-medium">
                {action.escalationsToday.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] tracking-wider text-muted-foreground uppercase mb-1">
                CSAT Impact
              </p>
              <p className="text-sm font-medium">{action.csatImpact}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] tracking-wider text-muted-foreground uppercase mb-1">
                Est. Fix Time
              </p>
              <p className="text-sm font-medium">{action.estFixTime}</p>
            </div>
          </div>

          {/* Additional info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] tracking-wider text-muted-foreground uppercase mb-1">
                Type
              </p>
              <span
                className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${typeColors[action.type]}`}
              >
                {action.type}
              </span>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-[11px] tracking-wider text-muted-foreground uppercase mb-1">
                Projected ROI
              </p>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                {action.projectedROI}
              </p>
            </div>
          </div>

          {/* What will happen */}
          <div className="rounded-lg border border-border bg-primary/5 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="text-xs tracking-wider text-primary uppercase font-medium">
                What Will Happen
              </p>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {action.whatWillHappen}
            </p>
          </div>

          {/* Impact summary */}
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-[11px] tracking-wider text-muted-foreground uppercase mb-1">
              Projected Impact
            </p>
            <p className="text-sm font-medium text-green-700 dark:text-green-400">
              {action.impactValue}
            </p>
            <p className="text-xs text-muted-foreground">
              {action.impactLabel}
            </p>
          </div>
        </div>

        {/* Stacked footer buttons */}
        <div className="flex flex-col gap-2 px-4 pb-6 pt-2 border-t border-border mt-auto sm:flex-col">
          <Button
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              toast.success(`"${action.title}" queued for deployment`, {
                description:
                  "You'll be notified when the deployment is complete.",
              });
            }}
          >
            <Bot className="h-4 w-4 mr-2" />
            Deploy Agent Now
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              toast.info("Configuration preview coming soon");
            }}
          >
            Preview Configuration
          </Button>
          {onDismiss && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                onOpenChange(false);
                onDismiss(action.id);
              }}
            >
              <BellOff className="h-4 w-4 mr-2" />
              Dismiss Action
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}