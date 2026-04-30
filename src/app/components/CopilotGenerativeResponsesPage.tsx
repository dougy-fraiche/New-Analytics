import { CopilotGenerativeResponsesTab } from "./CopilotGenerativeResponsesTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotGenerativeResponsesPage() {
  return (
    <CopilotShell activeTab="generative-responses">
      {({ isCompactDashboard }) => (
        <CopilotGenerativeResponsesTab
          isCompactDashboard={isCompactDashboard}
          showWidgetOverflowMenu={false}
        />
      )}
    </CopilotShell>
  );
}
