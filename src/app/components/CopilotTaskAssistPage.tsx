import { CopilotTaskAssistTab } from "./CopilotTaskAssistTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotTaskAssistPage() {
  return (
    <CopilotShell activeTab="task-assist">
      {({ isCompactDashboard, copilotFilters }) => (
        <CopilotTaskAssistTab
          isCompactDashboard={isCompactDashboard}
          showWidgetOverflowMenu={false}
          copilotFilters={copilotFilters}
        />
      )}
    </CopilotShell>
  );
}
