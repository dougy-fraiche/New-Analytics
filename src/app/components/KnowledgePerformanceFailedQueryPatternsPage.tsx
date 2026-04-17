import {
  KNOWLEDGE_PERFORMANCE_TAB_META,
  KnowledgePerformanceShell,
  KnowledgePerformanceTabPlaceholder,
} from "./KnowledgePerformanceShell";

const tabMeta = KNOWLEDGE_PERFORMANCE_TAB_META.find((tab) => tab.value === "failed-query-patterns")!;

export function KnowledgePerformanceFailedQueryPatternsPage() {
  return (
    <KnowledgePerformanceShell activeTab="failed-query-patterns">
      <KnowledgePerformanceTabPlaceholder title={tabMeta.label} description={tabMeta.description} />
    </KnowledgePerformanceShell>
  );
}
