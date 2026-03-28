import { useState } from "react";
import { Link } from "react-router";
import { Pin, PinOff, Search, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { PageContent, PageHeader } from "./PageChrome";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { useProjects } from "../contexts/ProjectContext";
import { toast } from "sonner";
import { BulkActionBar } from "./BulkActionBar";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { LabeledSelectValue } from "./HeaderFilters";
import { PageTransition } from "./PageTransition";
import {
  ootbCategories,
  allOotbDashboards,
  standaloneCategories,
  totalOotbDashboardCount,
} from "../data/ootb-dashboards";

export function ObservabilityPage() {
  const { isFavorite, toggleFavorite } = useProjects();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
      path: `/observability/${cat.id}/${d.id}`,
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

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((d) => d.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkPin = () => {
    const ids = Array.from(selectedIds);
    let added = 0;
    ids.forEach((id) => {
      const d = allItems.find((item) => item.id === id);
      if (d && !isFavorite(d.id)) {
        toggleFavorite({ id: d.id, name: d.name, path: `/dashboard/${d.id}` });
        added++;
      }
    });
    clearSelection();
    toast.success(`Pinned ${added} dashboard${added !== 1 ? "s" : ""}`);
  };

  const handleBulkUnpin = () => {
    const ids = Array.from(selectedIds);
    let removed = 0;
    ids.forEach((id) => {
      const d = allItems.find((item) => item.id === id);
      if (d && isFavorite(d.id)) {
        toggleFavorite({ id: d.id, name: d.name, path: `/dashboard/${d.id}` });
        removed++;
      }
    });
    clearSelection();
    toast.success(`Unpinned ${removed} dashboard${removed !== 1 ? "s" : ""}`);
  };

  const allChecked = filteredItems.length > 0 && selectedIds.size === filteredItems.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < filteredItems.length;

  const selectedList = Array.from(selectedIds);
  const selectedFavCount = selectedList.filter((id) => isFavorite(id)).length;
  const selectedNonPinCount = selectedList.length - selectedFavCount;
  const hasActiveFilters = searchQuery.length > 0 || categoryFilter !== "all";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl tracking-tight">Observability</h1>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {totalOotbDashboardCount} total dashboards
            </Badge>
          </div>
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
        </div>
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-auto">
        <PageContent className="space-y-6 p-8">
      <PageTransition className="space-y-6">
      <HeaderAIInsightsRow
        dashboardId="observability"
        dashboardData={{
          id: "observability",
          title: "Observability",
          description:
            "Out-of-the-box dashboards providing comprehensive insights into your conversational analytics platform",
        }}
      />
      {/* All Dashboards Table */}
      <div className="space-y-3">
          <BulkActionBar
            selectedCount={selectedIds.size}
            totalCount={filteredItems.length}
            onClearSelection={clearSelection}
          >
            {selectedNonPinCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleBulkPin}
              >
                <Pin className="h-3.5 w-3.5 mr-1.5" />
                Pin
              </Button>
            )}
            {selectedFavCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleBulkUnpin}
              >
                <PinOff className="h-3.5 w-3.5 mr-1.5" />
                Unpin
              </Button>
            )}
          </BulkActionBar>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allChecked ? true : someChecked ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Dashboard</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No dashboards match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  return (
                    <TableRow
                      key={item.id}
                      className="group h-[3rem]"
                      data-state={selectedIds.has(item.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelected(item.id)}
                          aria-label={`Select ${item.name}`}
                        />
                      </TableCell>
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
        </PageContent>
      </div>
    </div>
  );
}