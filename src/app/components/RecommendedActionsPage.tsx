import { useState } from "react";
import {
  Trash2,
  Rocket as RocketIcon,
  Search,
  MoreHorizontal,
  RotateCcw,
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
} from "./ui/select";
import {
  LabeledSelectValue,
  responsiveFilterActionButtonClassName,
  responsiveFilterRowClassName,
  responsiveFilterSearchWrapClassName,
  responsiveFilterSelectTriggerClassName,
} from "./HeaderFilters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableOverflowMenuColumnClassName,
} from "./ui/table";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { BulkActionBar } from "./BulkActionBar";
import {
  recommendedActionsData,
  typeColors,
  priorityColors,
  type RecommendedAction,
} from "../data/recommended-actions";
import {
  ACTION_STATUS_LABELS,
  recommendedActionActivityById,
} from "../data/action-activity";
import {
  PageHeader,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { cn } from "./ui/utils";
import { RecommendedActionSheet } from "./RecommendedActionSheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useNavigate } from "react-router";
import { useProjects } from "../contexts/ProjectContext";
import { PageTransition } from "./PageTransition";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";
import { ROUTES } from "../routes";
import {
  getSavedFolderDashboardPath,
  getSavedStandaloneDashboardPath,
} from "../lib/saved-slugs";

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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sheetAction, setSheetAction] = useState<RecommendedAction | null>(null);
  const navigate = useNavigate();
  const { projects, standaloneDashboards } = useProjects();

  const getLinkedDashboardPathForAction = (actionId: number): string | null => {
    const linkedDashboardIds = LINKED_DASHBOARD_IDS_BY_ACTION_ID[actionId] ?? [];
    const preferredDashboardId = linkedDashboardIds[0];
    if (!preferredDashboardId) return null;

    const project = projects.find((p) =>
      p.dashboards.some((dashboard) => dashboard.id === preferredDashboardId),
    );
    const folderDashboard = project?.dashboards.find(
      (dashboard) => dashboard.id === preferredDashboardId,
    );
    if (project && folderDashboard) {
      return getSavedFolderDashboardPath(project, folderDashboard);
    }

    const standaloneMatch = standaloneDashboards.find(
      (dashboard) => dashboard.id === preferredDashboardId,
    );
    if (standaloneMatch) return getSavedStandaloneDashboardPath(standaloneMatch);

    // Fallback: still navigate somewhere usable.
    return ROUTES.DASHBOARD(preferredDashboardId);
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

  /** Row order comes from data until the user sorts via the shared Table (header click). */
  const sortedActions = filteredActions;

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
      action: {
        label: "Undo",
        onClick: () => {
          setDismissedActions((prev) => prev.filter((x) => x !== id));
          toast.success("Action restored");
        },
      },
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
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId="recommended-actions">
      <div className="flex flex-col flex-1 min-h-0">
      <PageHeader>
          <section className="flex items-center gap-3">
            <h1 className="text-3xl tracking-tight">Recommended Actions</h1>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {pendingCount} pending actions
            </Badge>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {highPriorityCount} high priority
            </Badge>
          </section>
          <p className="text-muted-foreground mt-2">
            AI-generated recommendations to improve your customer experience
          </p>
          {pendingCount > 0 && (
            <div className={responsiveFilterRowClassName}>
              <div className={responsiveFilterSearchWrapClassName}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Search actions"
                  placeholder="Search actions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger
                  className={responsiveFilterSelectTriggerClassName}
                  aria-label="Filter by priority"
                >
                  <LabeledSelectValue label="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger
                  className={responsiveFilterSelectTriggerClassName}
                  aria-label="Filter by type"
                >
                  <LabeledSelectValue label="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Tool Build">Tool Build</SelectItem>
                  <SelectItem value="AI Agent">AI Agent</SelectItem>
                  <SelectItem value="Process Change">Process Change</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger
                  className={responsiveFilterSelectTriggerClassName}
                  aria-label="Filter by category"
                >
                  <LabeledSelectValue label="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="containment">Containment</SelectItem>
                  <SelectItem value="efficiency">Efficiency</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className={responsiveFilterActionButtonClassName}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              )}
            </div>
          )}
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
      <PageTransition className={cn(pageMainColumnClassName, "space-y-6")}>
      <HeaderAIInsightsRow
        dashboardId="recommended-actions"
        dashboardData={{
          id: "recommended-actions",
          title: "Recommended Actions",
          description: "AI-generated recommendations to improve your customer experience",
        }}
        recommendedActionsTitle="Impact highlights"
        hideDismissAll
        recommendedActionsContent={
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            <div
              id="recommended-actions-highlight-reach"
              className="flex min-w-0 flex-col gap-2 rounded-xl border border-primary/40 bg-primary/[0.03] p-4 transition-[box-shadow,border-color,background-color] hover:border-primary/55 hover:bg-primary/[0.05] hover:shadow-md"
            >
              <div className="flex min-w-0 flex-col gap-2.5">
                <p className="text-xs text-muted-foreground">Potential Customer Impact</p>
                <p className="text-xl font-normal leading-6 tracking-tight text-foreground">142K</p>
                <p className="text-sm leading-snug text-foreground/80">
                  Estimated weekly reach across affected conversations
                </p>
              </div>
            </div>
            <div
              id="recommended-actions-highlight-roi"
              className="flex min-w-0 flex-col gap-2 rounded-xl border border-primary/40 bg-primary/[0.03] p-4 transition-[box-shadow,border-color,background-color] hover:border-primary/55 hover:bg-primary/[0.05] hover:shadow-md"
            >
              <div className="flex min-w-0 flex-col gap-2.5">
                <p className="text-xs text-muted-foreground">Projected ROI</p>
                <p className="text-xl font-normal leading-6 tracking-tight text-foreground">
                  ${(totalROI / 1000).toFixed(0)}K/wk
                </p>
                <p className="text-sm leading-snug text-foreground/80">
                  Combined value from currently pending recommendations
                </p>
              </div>
            </div>
          </div>
        }
      />
      {pendingCount > 0 ? (
        <>
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
                <TableHead className="w-[520px]">
                  Recommended Action
                </TableHead>
                <TableHead className="w-[132px]">Type</TableHead>
                <TableHead className="w-[120px]">Priority</TableHead>
                <TableHead className="w-[220px]">Projected Impact</TableHead>
                <TableHead className="w-[120px] text-right">Projected ROI</TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  <span className="sr-only">View evidence</span>
                </TableHead>
                <TableHead className={tableOverflowMenuColumnClassName}>
                  <span className="sr-only">More options</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedActions.map((action) => {
                const activity = recommendedActionActivityById[action.id];
                return (
                  <TableRow
                    key={action.id}
                    data-state={selectedIds.has(action.id) ? "selected" : undefined}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setSheetAction(action)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(action.id)}
                        onCheckedChange={() => toggleSelected(action.id)}
                        aria-label={`Select ${action.title}`}
                      />
                    </TableCell>
                    <TableCell className="w-[520px] py-4 whitespace-normal">
                      <div className="min-w-0">
                        <p className="font-normal">{action.title}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {action.description}
                        </p>
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          {action.note}
                        </p>
                        {activity ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {activity.owner} · {ACTION_STATUS_LABELS[activity.status]} · Updated {activity.updatedAt}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="w-[132px]">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${typeColors[action.type]}`}
                      >
                        {action.type}
                      </span>
                    </TableCell>
                    <TableCell className="w-[120px]">
                      <span
                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${priorityColors[action.priority]}`}
                      >
                        {action.priority}
                      </span>
                    </TableCell>
                    <TableCell className="w-[220px]">
                      <p className="text-sm font-normal text-success">
                        {action.impactValue}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.impactLabel}
                      </p>
                    </TableCell>
                    <TableCell className="w-[120px] text-right font-normal tabular-nums">
                      {action.projectedROI}
                    </TableCell>
                    <TableCell className="text-right whitespace-normal">
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
                    </TableCell>
                    <TableCell className={tableOverflowMenuColumnClassName}>
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
                    </TableCell>
                  </TableRow>
                );
              })}
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
      </PageTransition>
        </div>
      </div>
    </div>
    </WidgetAIProvider>
  );
}
