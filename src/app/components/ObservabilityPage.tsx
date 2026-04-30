import { useState } from "react";
import { Link } from "react-router";
import { Search, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  PageHeader,
  PageHeaderPrimaryRow,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { cn } from "./ui/utils";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { LabeledSelectValue } from "./HeaderFilters";
import { PageTransition } from "./PageTransition";
import { ootbCategories } from "../data/ootb-dashboards";
import { ROUTES } from "../routes";

export function ObservabilityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const aiAgentsCategory = ootbCategories.find((cat) => cat.id === "ai-agents");
  const copilotDashboard = aiAgentsCategory?.dashboards.find((d) => d.id === "ai-agents-copilot");

  // Observability should list only top-level dashboards: AI Agents, Copilot, and Knowledge Performance.
  const allItems = [
    aiAgentsCategory
      ? {
          id: aiAgentsCategory.id,
          name: aiAgentsCategory.name,
          categoryName: aiAgentsCategory.name,
          categoryId: aiAgentsCategory.id,
          description:
            aiAgentsCategory.pageDescription ??
            "End-to-end visibility for your AI agents",
          lastUpdated: "Recently",
          path: ROUTES.AI_AGENTS,
        }
      : null,
    copilotDashboard && aiAgentsCategory
      ? {
          ...copilotDashboard,
          categoryName: aiAgentsCategory.name,
          categoryId: aiAgentsCategory.id,
          path: ROUTES.COPILOT,
        }
      : null,
    aiAgentsCategory
      ? {
          id: "knowledge-performance",
          name: "Knowledge Performance",
          categoryName: aiAgentsCategory.name,
          categoryId: aiAgentsCategory.id,
          description: "Knowledge quality and retrieval performance dashboards with feedback and improvement workflows.",
          lastUpdated: "Recently",
          path: ROUTES.KNOWLEDGE_PERFORMANCE,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  const categoryOptions = Array.from(
    new Map(allItems.map((item) => [item.categoryId, item.categoryName])).entries()
  ).map(([id, name]) => ({ id, name }));

  const filteredItems = allItems.filter((d) => {
    if (categoryFilter !== "all" && d.categoryId !== categoryFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.categoryName.toLowerCase().includes(q) ||
      ("description" in d && d.description?.toLowerCase().includes(q))
    );
  });

  const hasActiveFilters = searchQuery.length > 0 || categoryFilter !== "all";

  return (
      <div className="flex flex-col flex-1 min-h-0">
        <PageHeader>
          <PageHeaderPrimaryRow
            title={(
              <section className="flex items-center gap-3">
                <h1 className="text-3xl tracking-tight">Observability</h1>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {allItems.length} total dashboards
                </Badge>
              </section>
            )}
            description="Out-of-the-box dashboards providing comprehensive insights into your conversational analytics platform"
          />
          <div className="flex w-full flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search dashboards"
                placeholder="Search dashboards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-auto shrink-0" aria-label="Filter by category">
                <LabeledSelectValue label="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            )}
          </div>
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
      <PageTransition className={cn(pageMainColumnClassName, "space-y-6")}>
      <HeaderAIInsightsRow
        dashboardId="observability"
        dashboardData={{
          id: "observability",
          title: "Observability",
          description:
            "Out-of-the-box dashboards providing comprehensive insights into your conversational analytics platform",
        }}
      />
      <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Dashboard</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-12 text-muted-foreground">
                    No dashboards match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  return (
                    <TableRow
                      key={item.id}
                      className="group h-[3rem]"
                    >
                      <TableCell className="w-[220px]">
                        <Link
                          to={item.path}
                          className="font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">{"description" in item ? item.description : ""}</p>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
      </div>
      </PageTransition>
        </div>
      </div>
    </div>
  );
}
