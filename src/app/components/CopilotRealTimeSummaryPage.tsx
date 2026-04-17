import { CopilotRealTimeSummaryTab } from "./CopilotRealTimeSummaryTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotRealTimeSummaryPage() {
  return (
    <CopilotShell activeTab="real-time-summary">
      {({ isCompactDashboard }) => (
        <CopilotRealTimeSummaryTab isCompactDashboard={isCompactDashboard} showWidgetOverflowMenu={false} />
      )}
    </CopilotShell>
  );
}
