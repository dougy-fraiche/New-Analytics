import { CopilotRulesEngineTab } from "./CopilotRulesEngineTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotRulesEnginePage() {
  return (
    <CopilotShell activeTab="rules-engine">
      {({ isCompactDashboard, copilotFilters }) => (
        <CopilotRulesEngineTab
          isCompactDashboard={isCompactDashboard}
          showWidgetOverflowMenu={false}
          copilotFilters={copilotFilters}
        />
      )}
    </CopilotShell>
  );
}
