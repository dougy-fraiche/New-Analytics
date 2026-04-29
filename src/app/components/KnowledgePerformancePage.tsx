import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  PageHeader,
  PageHeaderPrimaryRow,
  pageHeaderTabsFooterClassName,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import { PageTransition } from "./PageTransition";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { cn } from "./ui/utils";
import { KnowledgePerformanceOverviewTab } from "./KnowledgePerformanceOverviewTab";
import {
  KnowledgePerformanceImproveKnowledgeTab,
} from "./KnowledgePerformanceImproveKnowledgeTab";

type KnowledgePerformanceTabValue =
  | "overview"
  | "agent-user-feedback"
  | "rag-evals"
  | "failed-query-patterns"
  | "improve-knowledge";

const KNOWLEDGE_PERFORMANCE_TABS: {
  value: KnowledgePerformanceTabValue;
  label: string;
  description: string;
}[] = [
  {
    value: "overview",
    label: "Overview",
    description: "High-level knowledge performance health and trend placeholders.",
  },
  {
    value: "agent-user-feedback",
    label: "Agent & User Feedback",
    description: "Placeholder for qualitative and quantitative feedback dashboards.",
  },
  {
    value: "rag-evals",
    label: "RAG Evals",
    description: "Placeholder for retrieval quality, answer quality, and eval tracking.",
  },
  {
    value: "failed-query-patterns",
    label: "Failed Query Patterns",
    description: "Placeholder for recurring failed intents and unresolved query clusters.",
  },
  {
    value: "improve-knowledge",
    label: "Improve Knowledge",
    description: "Placeholder for prioritized knowledge gaps and improvement workflows.",
  },
];

function KnowledgePerformanceTabPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="text-xl tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        Placeholder content is in place. Dashboard widgets and detailed insights will be added in a follow-up pass.
      </p>
    </section>
  );
}

function KnowledgeOverviewRecommendedActions() {
  return (
    <div className="grid grid-cols-1 items-start gap-4">
      <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-primary/40 bg-primary/[0.03] p-4 transition-[box-shadow,border-color,background-color] hover:border-primary/55 hover:bg-primary/[0.05] hover:shadow-md">
        <div className="flex min-w-0 flex-col gap-2.5">
          <p className="text-base font-medium leading-6 text-foreground">Rewrite bottom 5 articles</p>
          <p className="text-sm leading-snug text-foreground/80">
            Articles scoring below <span className="font-semibold text-foreground">0.50 relevancy</span> are actively harming resolution rates.
            Rewriting with better keyword coverage and chunking could lift retrieval success by{" "}
            <span className="font-semibold text-foreground">3-5pp.</span>
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-primary/40 bg-primary/[0.03] p-4 transition-[box-shadow,border-color,background-color] hover:border-primary/55 hover:bg-primary/[0.05] hover:shadow-md">
        <div className="flex min-w-0 flex-col gap-2.5">
          <p className="text-base font-medium leading-6 text-foreground">Create articles for international topics</p>
          <p className="text-sm leading-snug text-foreground/80">
            ~340 queries/week on international topics find no matches. Creating 5-7 articles covering shipping, roaming, and currency
            could close this gap and reduce handoffs by <span className="font-semibold text-foreground">~120/week.</span>
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-primary/40 bg-primary/[0.03] p-4 transition-[box-shadow,border-color,background-color] hover:border-primary/55 hover:bg-primary/[0.05] hover:shadow-md">
        <div className="flex min-w-0 flex-col gap-2.5">
          <p className="text-base font-medium leading-6 text-foreground">Enable article freshness monitoring</p>
          <p className="text-sm leading-snug text-foreground/80">
            23 articles haven&apos;t been updated in 90+ days. Setting up automated freshness alerts would prevent content staleness
            from degrading answer quality.
          </p>
        </div>
      </div>
    </div>
  );
}

export function KnowledgePerformancePage() {
  const [activeTab, setActiveTab] = useState<KnowledgePerformanceTabValue>("overview");
  const activeTabMeta = useMemo(
    () =>
      KNOWLEDGE_PERFORMANCE_TABS.find((tab) => tab.value === activeTab) ??
      KNOWLEDGE_PERFORMANCE_TABS[0]!,
    [activeTab],
  );

  const activeDashboardData = useMemo(
    () => ({
      id: `knowledge-performance-${activeTabMeta.value}`,
      title: `Knowledge Performance — ${activeTabMeta.label}`,
      description: activeTabMeta.description,
    }),
    [activeTabMeta],
  );
  const isOverviewTab = activeTab === "overview";

  return (
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId="knowledge-performance">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as KnowledgePerformanceTabValue)}
        className="flex flex-col h-full min-h-0"
      >
        <div className="flex flex-col h-full min-h-0">
          <PageHeader className={pageHeaderTabsFooterClassName}>
            <PageHeaderPrimaryRow
              title={<h1 className="text-3xl tracking-tight">Knowledge Performance</h1>}
              tabs={(
                <TabsList variant="line">
                  {KNOWLEDGE_PERFORMANCE_TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              )}
            />
          </PageHeader>

          <div className="flex-1 min-h-0 overflow-auto">
            <div className={cn(pageRootListScrollGutterClassName, "pb-4 md:pb-8")}>
              <PageTransition className={pageMainColumnClassName}>
                <div className="space-y-4">
                  <HeaderAIInsightsRow
                    dashboardId={activeDashboardData.id}
                    dashboardData={activeDashboardData}
                    recommendedActionsTitle={isOverviewTab ? "RECOMMENDED ACTIONS" : undefined}
                    hideDismissAll={isOverviewTab}
                    recommendedActionsContent={
                      isOverviewTab ? <KnowledgeOverviewRecommendedActions /> : undefined
                    }
                  />

                  {KNOWLEDGE_PERFORMANCE_TABS.map((tab) => (
                    <TabsContent
                      key={tab.value}
                      value={tab.value}
                      className="mt-0 data-[state=inactive]:hidden"
                    >
                      {tab.value === "overview" ? (
                        <KnowledgePerformanceOverviewTab />
                      ) : tab.value === "improve-knowledge" ? (
                        <KnowledgePerformanceImproveKnowledgeTab />
                      ) : (
                        <KnowledgePerformanceTabPlaceholder
                          title={tab.label}
                          description={tab.description}
                        />
                      )}
                    </TabsContent>
                  ))}
                </div>
              </PageTransition>
            </div>
          </div>
        </div>
      </Tabs>
    </WidgetAIProvider>
  );
}
