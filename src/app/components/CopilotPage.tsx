import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  PageHeader,
  pageHeaderTabsFooterClassName,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import { ootbCategories } from "../data/ootb-dashboards";
import { PageTransition } from "./PageTransition";
import { cn } from "./ui/utils";
import { CopilotOverviewTab } from "./CopilotOverviewTab";
import { CopilotTaskAssistTab } from "./CopilotTaskAssistTab";
import { CopilotGenerativeResponsesTab } from "./CopilotGenerativeResponsesTab";
import { CopilotRulesEngineTab } from "./CopilotRulesEngineTab";
import { CopilotRealTimeSummaryTab } from "./CopilotRealTimeSummaryTab";
import { CopilotAutoSummaryTab } from "./CopilotAutoSummaryTab";
import { useContainerBreakpoint } from "../hooks/useContainerBreakpoint";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
} from "./ui/select";
import { LabeledFilterInline, LabeledSelectValue } from "./HeaderFilters";
import {
  DATE_RANGE_CUSTOM_OPTION,
  DATE_RANGE_LABELS,
  DATE_RANGE_PRIMARY_OPTIONS,
  DATE_RANGE_SECONDARY_OPTIONS,
  type DateRangeOption,
} from "../data/date-ranges";
import {
  DEFAULT_DASHBOARD_FILTERS as DEFAULT_FILTERS,
  type DashboardProductFilter,
  type DashboardTeamFilter,
} from "../data/dashboard-filters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type CopilotHeaderTabValue =
  | "overview"
  | "auto-summary"
  | "task-assist"
  | "rules-engine"
  | "real-time-summary"
  | "generative-responses";

const COPILOT_HEADER_TABS: { value: CopilotHeaderTabValue; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "auto-summary", label: "Auto Summary" },
  { value: "task-assist", label: "Task Assist" },
  { value: "rules-engine", label: "Rules Engine" },
  { value: "real-time-summary", label: "Real-Time Summary" },
  { value: "generative-responses", label: "Generative Responses" },
];

export function CopilotPage() {
  const aiAgentsCategory = ootbCategories.find((c) => c.id === "ai-agents");
  const copilotDashboard = aiAgentsCategory?.dashboards.find((d) => d.id === "ai-agents-copilot");
  const { ref: dashboardContentRef, isBelowBreakpoint: isCompactDashboard } =
    useContainerBreakpoint<HTMLDivElement>(768);
  const [dateRange, setDateRange] = useState<DateRangeOption>(DEFAULT_FILTERS.dateRange);
  const [team, setTeam] = useState(DEFAULT_FILTERS.team);
  const [product, setProduct] = useState(DEFAULT_FILTERS.product);
  const [activeTab, setActiveTab] = useState<CopilotHeaderTabValue>("overview");
  const hasFilterChanges = useMemo(() => {
    return (
      dateRange !== DEFAULT_FILTERS.dateRange ||
      team !== DEFAULT_FILTERS.team ||
      product !== DEFAULT_FILTERS.product
    );
  }, [dateRange, team, product]);

  if (!copilotDashboard) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h1 className="text-4xl mb-2">404</h1>
          <p className="text-muted-foreground">Copilot dashboard not found</p>
        </div>
      </div>
    );
  }

  return (
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId={copilotDashboard.id}>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CopilotHeaderTabValue)} className="flex flex-col h-full min-h-0">
        <div className="flex flex-col h-full min-h-0">
          <PageHeader className={pageHeaderTabsFooterClassName}>
            <section>
              <section className="flex items-center gap-2">
                <h1 className="text-3xl tracking-tight">Copilot</h1>
              </section>
              <p className="text-muted-foreground mt-1">{copilotDashboard.description}</p>
            </section>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeOption)}>
                <SelectTrigger className="h-8 w-auto shrink-0" aria-label="Filter by date range">
                  <LabeledFilterInline label="Date range">{DATE_RANGE_LABELS[dateRange]}</LabeledFilterInline>
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_PRIMARY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {DATE_RANGE_LABELS[opt]}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  {DATE_RANGE_SECONDARY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {DATE_RANGE_LABELS[opt]}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={DATE_RANGE_CUSTOM_OPTION}>
                    {DATE_RANGE_LABELS[DATE_RANGE_CUSTOM_OPTION]}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={team} onValueChange={(v) => setTeam(v as DashboardTeamFilter)}>
                <SelectTrigger className="h-8 w-auto shrink-0" aria-label="Filter by team">
                  <LabeledSelectValue label="Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-teams">All Teams</SelectItem>
                  <SelectItem value="tier-1">Tier 1 Support</SelectItem>
                  <SelectItem value="tier-2">Tier 2 Support</SelectItem>
                  <SelectItem value="technical">Technical Team</SelectItem>
                </SelectContent>
              </Select>

              <Select value={product} onValueChange={(v) => setProduct(v as DashboardProductFilter)}>
                <SelectTrigger className="h-8 w-auto shrink-0" aria-label="Filter by product">
                  <LabeledSelectValue label="Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-products">All Products</SelectItem>
                  <SelectItem value="product-a">Product A</SelectItem>
                  <SelectItem value="product-b">Product B</SelectItem>
                  <SelectItem value="product-c">Product C</SelectItem>
                </SelectContent>
              </Select>

              {hasFilterChanges && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() => {
                    setDateRange(DEFAULT_FILTERS.dateRange);
                    setTeam(DEFAULT_FILTERS.team);
                    setProduct(DEFAULT_FILTERS.product);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              )}
            </div>
            <div className="mt-4 overflow-x-auto">
              <TabsList variant="line" className="w-max min-w-max flex-nowrap">
                {COPILOT_HEADER_TABS.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value} className="shrink-0 whitespace-nowrap">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </PageHeader>

          <div className="flex-1 min-h-0 overflow-auto">
            <div className={cn(pageRootListScrollGutterClassName, "pb-4 md:pb-8")}>
              <PageTransition className={pageMainColumnClassName}>
                <div ref={dashboardContentRef}>
                  <TabsContent value="overview" className="mt-0 data-[state=inactive]:hidden">
                    <CopilotOverviewTab
                      isCompactDashboard={isCompactDashboard}
                      showWidgetOverflowMenu={false}
                    />
                  </TabsContent>

                  <TabsContent value="auto-summary" className="mt-0 data-[state=inactive]:hidden">
                    <CopilotAutoSummaryTab
                      isCompactDashboard={isCompactDashboard}
                      showWidgetOverflowMenu={false}
                    />
                  </TabsContent>

                  <TabsContent value="task-assist" className="mt-0 data-[state=inactive]:hidden">
                    <CopilotTaskAssistTab
                      isCompactDashboard={isCompactDashboard}
                      showWidgetOverflowMenu={false}
                    />
                  </TabsContent>

                  <TabsContent value="rules-engine" className="mt-0 data-[state=inactive]:hidden">
                    <CopilotRulesEngineTab
                      isCompactDashboard={isCompactDashboard}
                      showWidgetOverflowMenu={false}
                    />
                  </TabsContent>

                  <TabsContent value="real-time-summary" className="mt-0 data-[state=inactive]:hidden">
                    <CopilotRealTimeSummaryTab
                      isCompactDashboard={isCompactDashboard}
                      showWidgetOverflowMenu={false}
                    />
                  </TabsContent>

                  <TabsContent value="generative-responses" className="mt-0 data-[state=inactive]:hidden">
                    <CopilotGenerativeResponsesTab
                      isCompactDashboard={isCompactDashboard}
                      showWidgetOverflowMenu={false}
                    />
                  </TabsContent>
                </div>
              </PageTransition>
            </div>
          </div>
        </div>
      </Tabs>
    </WidgetAIProvider>
  );
}
