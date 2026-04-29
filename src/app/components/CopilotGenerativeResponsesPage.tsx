import { CopilotGenerativeResponsesTab } from "./CopilotGenerativeResponsesTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotGenerativeResponsesPage() {
  return (
    <CopilotShell activeTab="generative-responses">
      {({ isCompactDashboard, copilotFilters }) => (
        <CopilotGenerativeResponsesTab
          isCompactDashboard={isCompactDashboard}
          showWidgetOverflowMenu={false}
          copilotFilters={copilotFilters}
        />
      )}
    </CopilotShell>
  );
}
