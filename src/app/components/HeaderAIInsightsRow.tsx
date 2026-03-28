import type { ReactNode } from "react";

import type { DashboardData } from "../contexts/ConversationContext";
import { DashboardAISummary } from "./DashboardAISummary";
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
        />
      )}
    </section>
  );
}
