import { CopilotAutoSummaryTab } from "./CopilotAutoSummaryTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotAutoSummaryPage() {
  return (
    <CopilotShell activeTab="auto-summary">
      {({ isCompactDashboard }) => (
        <CopilotAutoSummaryTab
          isCompactDashboard={isCompactDashboard}
          showWidgetOverflowMenu={false}
        />
      )}
    </CopilotShell>
  );
}
