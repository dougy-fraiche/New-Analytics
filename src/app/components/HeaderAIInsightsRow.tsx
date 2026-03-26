import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

import type { DashboardData } from "../contexts/ConversationContext";
import { DashboardAISummary } from "./DashboardAISummary";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { cn } from "./ui/utils";

interface HeaderAIInsightsRowProps {
  dashboardId: string;
  dashboardData?: DashboardData;
  className?: string;
  defaultOpen?: boolean;
}

export function HeaderAIInsightsRow({
  dashboardId,
  dashboardData,
  className,
  defaultOpen = false,
}: HeaderAIInsightsRowProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("mt-4 pt-3", className)}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/40"
          aria-label="Toggle AI Insights"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Insights
          </span>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <DashboardAISummary
          dashboardId={dashboardId}
          dashboardData={dashboardData}
          hideSectionHeader
        />
      </CollapsibleContent>
    </Collapsible>
  );
}
