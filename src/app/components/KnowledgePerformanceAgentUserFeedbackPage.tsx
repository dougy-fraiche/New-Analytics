import {
  KNOWLEDGE_PERFORMANCE_TAB_META,
  KnowledgePerformanceShell,
  KnowledgePerformanceTabPlaceholder,
} from "./KnowledgePerformanceShell";

const tabMeta = KNOWLEDGE_PERFORMANCE_TAB_META.find((tab) => tab.value === "agent-user-feedback")!;

export function KnowledgePerformanceAgentUserFeedbackPage() {
  return (
    <KnowledgePerformanceShell activeTab="agent-user-feedback">
      <KnowledgePerformanceTabPlaceholder title={tabMeta.label} description={tabMeta.description} />
    </KnowledgePerformanceShell>
  );
}
