import { KnowledgePerformanceImproveKnowledgeTab } from "./KnowledgePerformanceImproveKnowledgeTab";
import { KnowledgePerformanceShell } from "./KnowledgePerformanceShell";

export function KnowledgePerformanceImproveKnowledgePage() {
  return (
    <KnowledgePerformanceShell activeTab="improve-knowledge">
      <KnowledgePerformanceImproveKnowledgeTab />
    </KnowledgePerformanceShell>
  );
}
