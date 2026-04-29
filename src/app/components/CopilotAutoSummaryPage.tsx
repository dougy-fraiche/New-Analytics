import { CopilotAutoSummaryTab } from "./CopilotAutoSummaryTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotAutoSummaryPage() {
  return (
    <CopilotShell activeTab="auto-summary">
      {({ isCompactDashboard, copilotFilters }) => (
        <CopilotAutoSummaryTab
          isCompactDashboard={isCompactDashboard}
          showWidgetOverflowMenu={false}
          copilotFilters={copilotFilters}
        />
      )}
    </CopilotShell>
  );
}
