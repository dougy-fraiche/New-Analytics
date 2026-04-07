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
import { ootbCategories, totalOotbDashboardCount } from "../data/ootb-dashboards";
import { ROUTES } from "../routes";

export function ObservabilityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Build a flat list of displayable items: categories with their dashboards
  const allItems = ootbCategories.flatMap((cat) => {
    if (cat.dashboards.length === 0) {
      // Standalone category — treat category itself as a dashboard
      return [{ id: cat.id, name: cat.name, icon: cat.icon, categoryName: "Standalone", categoryId: cat.id, description: `${cat.name} comparison and analytics`, lastUpdated: "Recently", path: `/dashboard/${cat.id}` }];
    }
    return cat.dashboards.map((d) => ({
      ...d,
      categoryName: cat.name,
      categoryId: cat.id,
      path: d.id === "ai-agents-copilot" ? ROUTES.COPILOT : ROUTES.AI_AGENTS_DASHBOARD(d.id),
    }));
  });

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
          <section className="flex items-center gap-3">
            <h1 className="text-3xl tracking-tight">Observability</h1>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {totalOotbDashboardCount} total dashboards
            </Badge>
          </section>
          <p className="text-muted-foreground mt-2">
            Out-of-the-box dashboards providing comprehensive insights into your conversational analytics platform
          </p>
          <div className="mt-4 flex w-full flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search dashboards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-auto shrink-0">
                <LabeledSelectValue label="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {ootbCategories.map((category) => (
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
                <TableHead>Dashboard</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
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
                      <TableCell>
                        <Link
                          to={item.path}
                          className="font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm text-muted-foreground">{"description" in item ? item.description : ""}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.categoryName}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {"lastUpdated" in item ? item.lastUpdated : "—"}
                        </div>
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
