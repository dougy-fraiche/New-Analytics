import { CopilotTaskAssistTab } from "./CopilotTaskAssistTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotTaskAssistPage() {
  return (
    <CopilotShell activeTab="task-assist">
      {({ isCompactDashboard }) => (
        <CopilotTaskAssistTab
          isCompactDashboard={isCompactDashboard}
          showWidgetOverflowMenu={false}
        />
      )}
    </CopilotShell>
  );
}
