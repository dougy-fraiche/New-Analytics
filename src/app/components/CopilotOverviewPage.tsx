import { CopilotOverviewTab } from "./CopilotOverviewTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotOverviewPage() {
  return (
    <CopilotShell activeTab="overview">
      {({ isCompactDashboard }) => (
        <CopilotOverviewTab isCompactDashboard={isCompactDashboard} showWidgetOverflowMenu={false} />
      )}
    </CopilotShell>
  );
}
