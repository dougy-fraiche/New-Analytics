import { KnowledgePerformanceOverviewTab } from "./KnowledgePerformanceOverviewTab";
import { KnowledgePerformanceShell } from "./KnowledgePerformanceShell";

export function KnowledgePerformanceOverviewPage() {
  return (
    <KnowledgePerformanceShell activeTab="overview">
      <KnowledgePerformanceOverviewTab />
    </KnowledgePerformanceShell>
  );
}
