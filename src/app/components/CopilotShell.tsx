import { type ReactNode, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
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
import { ROUTES, type CopilotTabRoute } from "../routes";

const COPILOT_HEADER_TABS: { value: CopilotTabRoute; label: string }[] = [
  { value: "overview", label: "Overview" },
  { value: "auto-summary", label: "Auto Summary" },
  { value: "task-assist", label: "Task Assist" },
  { value: "rules-engine", label: "Rules Engine" },
  { value: "real-time-summary", label: "Real-Time Summary" },
  { value: "generative-responses", label: "Generative Responses" },
];

const COPILOT_DATE_RANGE_VALUES: DateRangeOption[] = [
  ...DATE_RANGE_PRIMARY_OPTIONS,
  ...DATE_RANGE_SECONDARY_OPTIONS,
  DATE_RANGE_CUSTOM_OPTION,
];

const COPILOT_TEAM_VALUES: DashboardTeamFilter[] = [
  "all-teams",
  "tier-1",
  "tier-2",
  "technical",
];

const COPILOT_PRODUCT_VALUES: DashboardProductFilter[] = [
  "all-products",
  "product-a",
  "product-b",
  "product-c",
];

function isDateRangeOption(value: string | null): value is DateRangeOption {
  if (!value) return false;
  return COPILOT_DATE_RANGE_VALUES.includes(value as DateRangeOption);
}

function isDashboardTeamFilter(value: string | null): value is DashboardTeamFilter {
  if (!value) return false;
  return COPILOT_TEAM_VALUES.includes(value as DashboardTeamFilter);
}

function isDashboardProductFilter(value: string | null): value is DashboardProductFilter {
  if (!value) return false;
  return COPILOT_PRODUCT_VALUES.includes(value as DashboardProductFilter);
}

type CopilotShellProps = {
  activeTab: CopilotTabRoute;
  children: (params: { isCompactDashboard: boolean }) => ReactNode;
};

export function CopilotShell({ activeTab, children }: CopilotShellProps) {
  const aiAgentsCategory = ootbCategories.find((c) => c.id === "ai-agents");
  const copilotDashboard = aiAgentsCategory?.dashboards.find((d) => d.id === "ai-agents-copilot");
  const { ref: dashboardContentRef, isBelowBreakpoint: isCompactDashboard } =
    useContainerBreakpoint<HTMLDivElement>(768);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateRangeParam = searchParams.get("dateRange");
  const teamParam = searchParams.get("team");
  const productParam = searchParams.get("product");

  const dateRange = isDateRangeOption(dateRangeParam) ? dateRangeParam : DEFAULT_FILTERS.dateRange;
  const team = isDashboardTeamFilter(teamParam) ? teamParam : DEFAULT_FILTERS.team;
  const product = isDashboardProductFilter(productParam) ? productParam : DEFAULT_FILTERS.product;

  const hasFilterChanges = useMemo(() => {
    return (
      dateRange !== DEFAULT_FILTERS.dateRange ||
      team !== DEFAULT_FILTERS.team ||
      product !== DEFAULT_FILTERS.product
    );
  }, [dateRange, team, product]);

  const setFilterParam = (key: "dateRange" | "team" | "product", value: string, defaultValue: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === defaultValue) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("dateRange");
    next.delete("team");
    next.delete("product");
    setSearchParams(next, { replace: true });
  };

  const handleTabChange = (value: string) => {
    const tab = value as CopilotTabRoute;
    if (tab === activeTab) return;
    navigate({ pathname: ROUTES.COPILOT_TAB(tab), search: location.search });
  };

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
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col h-full min-h-0">
        <div className="flex flex-col h-full min-h-0">
          <PageHeader className={pageHeaderTabsFooterClassName}>
            <section>
              <section className="flex items-center gap-2">
                <h1 className="text-3xl tracking-tight">Copilot</h1>
              </section>
              <p className="text-muted-foreground mt-1">{copilotDashboard.description}</p>
            </section>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Select
                value={dateRange}
                onValueChange={(value) =>
                  setFilterParam("dateRange", value as DateRangeOption, DEFAULT_FILTERS.dateRange)
                }
              >
                <SelectTrigger className="h-8 w-auto shrink-0" aria-label="Filter by date range">
                  <LabeledFilterInline label="Date range">{DATE_RANGE_LABELS[dateRange]}</LabeledFilterInline>
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_PRIMARY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {DATE_RANGE_LABELS[option]}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  {DATE_RANGE_SECONDARY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {DATE_RANGE_LABELS[option]}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={DATE_RANGE_CUSTOM_OPTION}>
                    {DATE_RANGE_LABELS[DATE_RANGE_CUSTOM_OPTION]}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={team}
                onValueChange={(value) =>
                  setFilterParam("team", value as DashboardTeamFilter, DEFAULT_FILTERS.team)
                }
              >
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

              <Select
                value={product}
                onValueChange={(value) =>
                  setFilterParam("product", value as DashboardProductFilter, DEFAULT_FILTERS.product)
                }
              >
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
                <Button variant="ghost" size="sm" className="h-8 shrink-0" onClick={resetFilters}>
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
            <div className="sr-only">
              {COPILOT_HEADER_TABS.map((tab) => (
                <TabsContent
                  key={`panel-${tab.value}`}
                  value={tab.value}
                  forceMount
                  className="hidden"
                />
              ))}
            </div>
          </PageHeader>

          <div className="flex-1 min-h-0 overflow-auto">
            <div className={cn(pageRootListScrollGutterClassName, "pb-4 md:pb-8")}>
              <PageTransition className={pageMainColumnClassName}>
                <div ref={dashboardContentRef}>{children({ isCompactDashboard })}</div>
              </PageTransition>
            </div>
          </div>
        </div>
      </Tabs>
    </WidgetAIProvider>
  );
}
