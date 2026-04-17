import { CopilotRulesEngineTab } from "./CopilotRulesEngineTab";
import { CopilotShell } from "./CopilotShell";

export function CopilotRulesEnginePage() {
  return (
    <CopilotShell activeTab="rules-engine">
      {({ isCompactDashboard }) => (
        <CopilotRulesEngineTab isCompactDashboard={isCompactDashboard} showWidgetOverflowMenu={false} />
      )}
    </CopilotShell>
  );
}
