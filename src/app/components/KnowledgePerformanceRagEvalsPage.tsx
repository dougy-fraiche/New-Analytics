import {
  KNOWLEDGE_PERFORMANCE_TAB_META,
  KnowledgePerformanceShell,
  KnowledgePerformanceTabPlaceholder,
} from "./KnowledgePerformanceShell";

const tabMeta = KNOWLEDGE_PERFORMANCE_TAB_META.find((tab) => tab.value === "rag-evals")!;

export function KnowledgePerformanceRagEvalsPage() {
  return (
    <KnowledgePerformanceShell activeTab="rag-evals">
      <KnowledgePerformanceTabPlaceholder title={tabMeta.label} description={tabMeta.description} />
    </KnowledgePerformanceShell>
  );
}
