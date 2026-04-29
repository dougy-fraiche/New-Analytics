import { CopilotOverviewTab } from "./CopilotOverviewTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotOverviewPage() {
  return (
    <CopilotShell activeTab="overview">
      {({ isCompactDashboard, copilotFilters }) => (
        <CopilotOverviewTab
          isCompactDashboard={isCompactDashboard}
          showWidgetOverflowMenu={false}
          copilotFilters={copilotFilters}
        />
      )}
    </CopilotShell>
  );
}
