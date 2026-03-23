import { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Rocket as RocketIcon,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "./ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { BulkActionBar } from "./BulkActionBar";
import {
  recommendedActionsData,
  typeColors,
  priorityColors,
  actionIconMap,
  actionIconColors,
  defaultActionIcon,
  defaultActionIconColors,
  type RecommendedAction,
  type PriorityLevel,
} from "../data/recommended-actions";
import { RecommendedActionSheet } from "./RecommendedActionSheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useNavigate } from "react-router";
import { useProjects } from "../contexts/ProjectContext";

const LINKED_DASHBOARD_IDS_BY_ACTION_ID: Record<number, string[]> = {
  1: ["dash-2", "dash-13"],
  2: ["dash-4"],
  3: ["dash-10", "dash-5"],
  4: ["dash-11"],
  5: ["dash-12"],
  6: ["dash-1"],
  7: ["dash-3"],
};

export function RecommendedActionsPage() {
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dismissedActions, setDismissedActions] = useState<number[]>([]);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetAction, setSheetAction] = useState<RecommendedAction | null>(null);
  const navigate = useNavigate();
  const { projects, standaloneDashboards } = useProjects();

  const getLinkedDashboardPathForAction = (actionId: number): string | null => {
    const linkedDashboardIds = LINKED_DASHBOARD_IDS_BY_ACTION_ID[actionId] ?? [];
    const preferredDashboardId = linkedDashboardIds[0];
    if (!preferredDashboardId) return null;

    const project = projects.find((p) => p.dashboards.some((d) => d.id === preferredDashboardId));
    if (project) return `/project/${project.id}/dashboard/${preferredDashboardId}`;

    const standaloneMatch = standaloneDashboards.some((d) => d.id === preferredDashboardId);
    if (standaloneMatch) return `/saved/dashboard/${preferredDashboardId}`;

    // Fallback: still navigate somewhere usable.
    return `/dashboard/${preferredDashboardId}`;
  };

  // Filter and sort
  const filteredActions = recommendedActionsData.filter((action) => {
    if (dismissedActions.includes(action.id)) return false;
    if (priorityFilter !== "all" && action.priority !== priorityFilter) return false;
    if (typeFilter !== "all" && action.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !action.title.toLowerCase().includes(q) &&
        !action.description.toLowerCase().includes(q) &&
        !action.note.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const sortedActions = [...filteredActions].sort((a, b) => {
    const priorityOrder: Record<PriorityLevel, number> = { High: 3, Medium: 2, Low: 1 };
    return sortDirection === "desc"
      ? priorityOrder[b.priority] - priorityOrder[a.priority]
      : priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const pendingCount = recommendedActionsData.filter(
    (a) => !dismissedActions.includes(a.id)
  ).length;
  const highPriorityCount = recommendedActionsData.filter(
    (a) => !dismissedActions.includes(a.id) && a.priority === "High"
  ).length;
  const totalROI = recommendedActionsData
    .filter((a) => !dismissedActions.includes(a.id))
    .reduce((sum, a) => {
      const val = parseInt(a.projectedROI.replace(/[^0-9]/g, ""));
      return sum + val;
    }, 0);

  const hasActiveFilters =
    priorityFilter !== "all" || typeFilter !== "all" || categoryFilter !== "all" || searchQuery !== "";

  const clearFilters = () => {
    setPriorityFilter("all");
    setTypeFilter("all");
    setCategoryFilter("all");
    setSearchQuery("");
  };

  const handleDismiss = (id: number) => {
    const action = recommendedActionsData.find((a) => a.id === id);
    setDismissedActions((prev) => [...prev, id]);
    toast.success("Action dismissed", {
      description: action
        ? `"${action.title}" has been dismissed.`
        : "Action dismissed.",
    });
  };

  // Selection helpers
  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === sortedActions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedActions.map((a) => a.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDismiss = () => {
    const ids = Array.from(selectedIds);
    setDismissedActions((prev) => [...prev, ...ids]);
    clearSelection();
    toast.success(`Dismissed ${ids.length} action${ids.length > 1 ? "s" : ""}`, {
      action: {
        label: "Undo",
        onClick: () => {
          setDismissedActions((prev) => prev.filter((id) => !ids.includes(id)));
          toast.success("Actions restored");
        },
      },
    });
  };

  const handleBulkImplement = () => {
    const ids = Array.from(selectedIds);
    clearSelection();
    toast.success(`${ids.length} action${ids.length > 1 ? "s" : ""} queued for implementation`);
  };

  const allChecked = sortedActions.length > 0 && selectedIds.size === sortedActions.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < sortedActions.length;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="shrink-0 sticky top-0 z-10 bg-background px-8 pt-6 pb-0">
        <div>
          <h1 className="text-3xl tracking-tight">Recommended Actions</h1>
          <p className="text-muted-foreground mt-2">
            AI-generated recommendations to improve your customer experience
          </p>
        </div>
      </header>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="space-y-6 p-8">
      {/* Summary Cards */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {pendingCount} pending actions
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {highPriorityCount} high priority
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          142K potential customer impact
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          ${(totalROI / 1000).toFixed(0)}K/wk projected ROI
        </Badge>
      </div>

      {pendingCount > 0 ? (
        <>
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-8">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Tool Build">Tool Build</SelectItem>
            <SelectItem value="AI Agent">AI Agent</SelectItem>
            <SelectItem value="Process Change">Process Change</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px] h-8">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="containment">Containment</SelectItem>
            <SelectItem value="efficiency">Efficiency</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="link"
            size="sm"
            onClick={clearFilters}
            className="text-primary ml-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Actions Table */}
      {sortedActions.length > 0 ? (
      <div className="space-y-3">
          <BulkActionBar
            selectedCount={selectedIds.size}
            totalCount={sortedActions.length}
            onClearSelection={clearSelection}
          >
            <Button
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={handleBulkImplement}
            >
              <RocketIcon className="h-3.5 w-3.5 mr-1.5" />
              Implement
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleBulkDismiss}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Dismiss
            </Button>
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
                <TableHead className="min-w-[280px]">
                  Recommended Action
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-foreground"
                    onClick={() =>
                      setSortDirection((d) => (d === "desc" ? "asc" : "desc"))
                    }
                  >
                    Priority
                    {sortDirection === "desc" ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronUp className="h-3.5 w-3.5" />
                    )}
                  </button>
                </TableHead>
                <TableHead>Projected Impact</TableHead>
                <TableHead className="text-right">Projected ROI</TableHead>
                <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedActions.map((action) => (
                  <TableRow
                    key={action.id}
                    data-state={selectedIds.has(action.id) ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => setSheetAction(action)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(action.id)}
                        onCheckedChange={() => toggleSelected(action.id)}
                        aria-label={`Select ${action.title}`}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      {(() => {
                        const IconComp = actionIconMap[action.id] ?? defaultActionIcon;
                        const colors = actionIconColors[action.id] ?? defaultActionIconColors;
                        return (
                          <div className="flex items-start gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg} mt-0.5`}>
                              <IconComp className={`h-4 w-4 ${colors.text}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium">{action.title}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {action.description}
                              </p>
                              <p className="text-xs text-amber-600 mt-1 italic">
                                {action.note}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${typeColors[action.type]}`}
                      >
                        {action.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${priorityColors[action.priority]}`}
                      >
                        {action.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-primary">
                        {action.impactValue}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.impactLabel}
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {action.projectedROI}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(() => {
                          const linkedPath = getLinkedDashboardPathForAction(action.id);
                          if (!linkedPath) return null;

                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(linkedPath);
                              }}
                            >
                              View Evidence
                            </Button>
                          );
                        })()}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSheetAction(action);
                              }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More options</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">View details</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
      </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RocketIcon />
            </EmptyMedia>
            <EmptyTitle>No actions match the current filters</EmptyTitle>
            <EmptyDescription>
              Try adjusting your search or filter criteria
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
        </>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RocketIcon />
            </EmptyMedia>
            <EmptyTitle>No pending actions</EmptyTitle>
            <EmptyDescription>
              All recommendations have been addressed — check back later for new suggestions
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <RecommendedActionSheet
        action={sheetAction}
        open={!!sheetAction}
        onOpenChange={(open) => { if (!open) setSheetAction(null); }}
        onDismiss={(id) => {
          handleDismiss(id);
          setSheetAction(null);
        }}
      />
        </div>
      </div>
    </div>
  );
}