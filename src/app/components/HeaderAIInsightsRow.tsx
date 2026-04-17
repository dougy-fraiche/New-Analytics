import type { ReactNode } from "react";

import type { DashboardData } from "../contexts/ConversationContext";
import { DashboardAISummary, type DashboardSuggestedAction } from "./DashboardAISummary";
import { cn } from "./ui/utils";

interface HeaderAIInsightsRowProps {
  dashboardId: string;
  dashboardData?: DashboardData;
  className?: string;
  defaultOpen?: boolean;
  children?: ReactNode;
  recommendedActionsTitle?: string;
  hideDismissAll?: boolean;
  recommendedActionsContent?: ReactNode;
  suggestedActionsOverride?: DashboardSuggestedAction[];
}

export function HeaderAIInsightsRow({
  dashboardId,
  dashboardData,
  className,
  defaultOpen = false,
  children,
  recommendedActionsTitle,
  hideDismissAll,
  recommendedActionsContent,
  suggestedActionsOverride,
}: HeaderAIInsightsRowProps) {
  return (
    <section aria-label="AI Insights" className={cn("w-full", className)}>
      {children ?? (
        <DashboardAISummary
          dashboardId={dashboardId}
          dashboardData={dashboardData}
          hideSectionHeader
          defaultInsightsOpen={defaultOpen}
          recommendedActionsTitle={recommendedActionsTitle}
          hideDismissAll={hideDismissAll}
          recommendedActionsContent={recommendedActionsContent}
          suggestedActionsOverride={suggestedActionsOverride}
        />
      )}
    </section>
  );
}
