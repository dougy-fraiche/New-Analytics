import { useState } from "react";
import { Link } from "react-router";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ArrowUpRight,
  Search,
  RotateCcw,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { PageContent, PageHeader } from "./PageChrome";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "./ui/empty";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import { LabeledSelectValue } from "./HeaderFilters";
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
import { BulkActionBar } from "./BulkActionBar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { PageTransition } from "./PageTransition";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { WidgetAIPromptButton } from "./WidgetAIPromptButton";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";

type ActionStatus = "completed" | "failed" | "in_progress" | "pending";

interface ActionRecord {
  id: string;
  name: string;
  type: string;
  status: ActionStatus;
  triggeredBy: string;
  startedAt: string;
  completedAt: string | null;
  /** Short headline for the impact badge (metric, dollar value, etc.). */
  impactBadge: string;
  /** Supporting line shown under the badge. */
  impactDescription: string;
  details: string;
}

const initialActions: ActionRecord[] = [
  {
    id: "act-001",
    name: "Deploy Account Verification Agent",
    type: "Agent Deployment",
    status: "completed",
    triggeredBy: "John Doe",
    startedAt: "Feb 20, 2026 09:14 AM",
    completedAt: "Feb 20, 2026 09:16 AM",
    impactBadge: "+23%",
    impactDescription: "Containment lift for verification volume; ~$180K/yr value at current run rate",
    details: "Deployed AI agent to handle account verification requests in Tier-1 queue.",
  },
  {
    id: "act-002",
    name: "Update Knowledge Base — Password Reset",
    type: "Knowledge Update",
    status: "completed",
    triggeredBy: "Emily Rodriguez",
    startedAt: "Feb 20, 2026 08:45 AM",
    completedAt: "Feb 20, 2026 08:45 AM",
    impactBadge: "−12%",
    impactDescription: "Repeat contacts on reset intent; ~$42K/yr deflection value projected",
    details: "Updated article #KB-1042 with new 2FA reset flow instructions.",
  },
  {
    id: "act-003",
    name: "Retrain Escalation Classifier",
    type: "Model Training",
    status: "in_progress",
    triggeredBy: "System (Scheduled)",
    startedAt: "Feb 20, 2026 08:00 AM",
    completedAt: null,
    impactBadge: "+4%",
    impactDescription: "Routing accuracy once training finishes; validation holdout in progress",
    details: "Retraining escalation prediction model with last 30 days of labeled data.",
  },
  {
    id: "act-004",
    name: "Export Q4 Analytics Report",
    type: "Report Export",
    status: "completed",
    triggeredBy: "Sarah Johnson",
    startedAt: "Feb 19, 2026 04:30 PM",
    completedAt: "Feb 19, 2026 04:31 PM",
    impactBadge: "Q4 pack",
    impactDescription: "Executive readout for workforce and channel planning decisions",
    details: "Exported PDF report for Q4 2025 customer support analytics.",
  },
  {
    id: "act-005",
    name: "Bulk Reassign Billing Tickets",
    type: "Ticket Automation",
    status: "failed",
    triggeredBy: "Michael Chen",
    startedAt: "Feb 19, 2026 02:10 PM",
    completedAt: "Feb 19, 2026 02:10 PM",
    impactBadge: "−3 min AHT",
    impactDescription: "Target for billing queue; not realized — run failed at destination capacity",
    details: "Attempted to reassign 47 billing tickets to Tier-2. Failed: target queue at capacity.",
  },
  {
    id: "act-006",
    name: "Enable Copilot for Technical Team",
    type: "Configuration",
    status: "completed",
    triggeredBy: "John Doe",
    startedAt: "Feb 19, 2026 11:00 AM",
    completedAt: "Feb 19, 2026 11:00 AM",
    impactBadge: "−38%",
    impactDescription: "Handle time for technical queue; ~$5.8K/wk labor savings (measured)",
    details: "Enabled AI Copilot suggestions for all agents in the Technical Support team.",
  },
  {
    id: "act-007",
    name: "Generate Weekly Digest",
    type: "Report Export",
    status: "pending",
    triggeredBy: "System (Scheduled)",
    startedAt: "Feb 21, 2026 06:00 AM",
    completedAt: null,
    impactBadge: "Weekly",
    impactDescription: "Digest to team leads; faster review vs. ad hoc dashboard checks",
    details: "Scheduled weekly digest email for all team leads.",
  },
  {
    id: "act-008",
    name: "Archive Stale Conversations",
    type: "Maintenance",
    status: "completed",
    triggeredBy: "System (Automated)",
    startedAt: "Feb 18, 2026 12:00 AM",
    completedAt: "Feb 18, 2026 12:02 AM",
    impactBadge: "312",
    impactDescription: "Conversations archived past retention; storage + compliance posture",
    details: "Archived 312 conversations older than 90 days with resolved status.",
  },
  {
    id: "act-009",
    name: "Sync CRM Contact Data",
    type: "Integration",
    status: "completed",
    triggeredBy: "System (Scheduled)",
    startedAt: "Feb 18, 2026 03:00 AM",
    completedAt: "Feb 18, 2026 03:04 AM",
    impactBadge: "1,847",
    impactDescription: "Contact rows synced; fewer identity and context errors in tickets",
    details: "Synced 1,847 contact records from Salesforce CRM.",
  },
  {
    id: "act-010",
    name: "Deploy Routing Rule Update",
    type: "Configuration",
    status: "failed",
    triggeredBy: "David Kim",
    startedAt: "Feb 17, 2026 03:45 PM",
    completedAt: "Feb 17, 2026 03:45 PM",
    impactBadge: "−12%",
    impactDescription: "Escalation reduction goal; not deployed — rule conflict with existing policy",
    details: "Routing rule conflict detected. Rule overlaps with existing priority escalation rule.",
  },
];

const statusConfig: Record<
  ActionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: XCircle },
  in_progress: { label: "In Progress", variant: "secondary", icon: Loader2 },
  pending: { label: "Pending", variant: "outline", icon: Clock },
};

const allTypes = Array.from(new Set(initialActions.map((a) => a.type)));

export function ActionsHistoryPage() {
  const [actions, setActions] = useState<ActionRecord[]>(initialActions);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = actions.filter((action) => {
    const matchesSearch =
      !searchQuery ||
      action.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.impactBadge.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.impactDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.triggeredBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || action.status === statusFilter;
    const matchesType = typeFilter === "all" || action.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const counts = {
    total: actions.length,
    completed: actions.filter((a) => a.status === "completed").length,
    failed: actions.filter((a) => a.status === "failed").length,
    active: actions.filter((a) => a.status === "in_progress" || a.status === "pending").length,
  };

  // Selection helpers
  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkRetry = () => {
    const ids = Array.from(selectedIds);
    const failedIds = ids.filter((id) => {
      const a = actions.find((act) => act.id === id);
      return a && a.status === "failed";
    });
    if (failedIds.length === 0) {
      toast.error("No failed actions selected to retry");
      return;
    }
    setActions((prev) =>
      prev.map((a) =>
        failedIds.includes(a.id) ? { ...a, status: "pending" as ActionStatus } : a
      )
    );
    clearSelection();
    toast.success(`Retrying ${failedIds.length} failed action${failedIds.length > 1 ? "s" : ""}`);
  };

  const handleBulkRemove = () => {
    const ids = Array.from(selectedIds);
    const snapshots = actions.filter((a) => ids.includes(a.id));
    setActions((prev) => prev.filter((a) => !ids.includes(a.id)));
    clearSelection();
    toast.success(`Removed ${ids.length} action${ids.length > 1 ? "s" : ""} from log`, {
      action: {
        label: "Undo",
        onClick: () => {
          setActions((prev) => [...snapshots, ...prev].sort(
            (a, b) => initialActions.findIndex((x) => x.id === a.id) - initialActions.findIndex((x) => x.id === b.id)
          ));
          toast.success("Actions restored");
        },
      },
    });
  };

  const handleBulkExport = () => {
    const ids = Array.from(selectedIds);
    clearSelection();
    toast.success(`Exported ${ids.length} action${ids.length > 1 ? "s" : ""} to CSV`);
  };

  const allChecked = filtered.length > 0 && selectedIds.size === filtered.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < filtered.length;

  // Check if any selected items are failed
  const hasFailedSelected = Array.from(selectedIds).some((id) => {
    const a = actions.find((act) => act.id === id);
    return a && a.status === "failed";
  });

  return (
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId="actions-history">
      <div className="flex flex-col flex-1 min-h-0">
      <PageHeader>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl tracking-tight">History</h1>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 shrink-0">
              {counts.total} total actions
            </Badge>
            <Button variant="outline" size="sm" className="ml-auto">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Export Log
            </Button>
          </div>
            <p className="text-muted-foreground mt-2">
              Audit log of all automated and manual actions across the platform
            </p>
            {actions.length > 0 && (
              <div className="mt-4 flex w-full flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 w-auto shrink-0">
                    <LabeledSelectValue label="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 w-auto shrink-0">
                    <LabeledSelectValue label="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {allTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(statusFilter !== "all" || typeFilter !== "all" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setTypeFilter("all");
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Filters
                  </Button>
                )}
              </div>
            )}
        </div>
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-auto">
        <PageContent className="space-y-6 p-8">
      <PageTransition className="space-y-6">
      <HeaderAIInsightsRow
        dashboardId="actions-history"
        dashboardData={{
          id: "actions-history",
          title: "History",
          description: "Audit log of all automated and manual actions across the platform",
        }}
        recommendedActionsTitle="History insights"
        hideDismissAll
        recommendedActionsContent={
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            <div
              id="actions-history-insight-completed"
              className="relative flex min-w-0 flex-col gap-2 rounded-xl border border-primary/40 bg-primary/[0.03] p-4 transition-[box-shadow,border-color,background-color] hover:border-primary/55 hover:bg-primary/[0.05] hover:shadow-md"
            >
              <div className="absolute right-3 top-3 z-10">
                <WidgetAIPromptButton
                  widgetTitle={`History insight: Completed actions (${counts.completed} in this log)`}
                  chartType="metric"
                  widgetAnchorId="actions-history-insight-completed"
                  tooltipLabel="Ask AI about this insight"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-2.5 pr-10">
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-semibold leading-6 tracking-tight tabular-nums text-foreground">
                  {counts.completed}
                </p>
                <p className="text-sm leading-snug text-foreground/80">
                  Successfully finished actions in this log
                </p>
              </div>
            </div>
            <div
              id="actions-history-insight-failed-active"
              className="relative flex min-w-0 flex-col gap-2 rounded-xl border border-primary/40 bg-primary/[0.03] p-4 transition-[box-shadow,border-color,background-color] hover:border-primary/55 hover:bg-primary/[0.05] hover:shadow-md"
            >
              <div className="absolute right-3 top-3 z-10">
                <WidgetAIPromptButton
                  widgetTitle={`History insight: Failed or active actions (${counts.failed + counts.active} in this log)`}
                  chartType="metric"
                  widgetAnchorId="actions-history-insight-failed-active"
                  tooltipLabel="Ask AI about this insight"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-2.5 pr-10">
                <p className="text-xs text-muted-foreground">Failed / active</p>
                <p className="text-xl font-semibold leading-6 tracking-tight tabular-nums text-foreground">
                  {counts.failed + counts.active}
                </p>
                <p className="text-sm leading-snug text-foreground/80">
                  Actions still running or that ended in failure
                </p>
              </div>
            </div>
          </div>
        }
      />
      {actions.length > 0 ? (
        <>
      {/* Actions Table */}
      {filtered.length > 0 ? (
      <div className="space-y-3">
          <BulkActionBar
            selectedCount={selectedIds.size}
            totalCount={filtered.length}
            onClearSelection={clearSelection}
          >
            {hasFailedSelected && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleBulkRetry}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Retry Failed
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleBulkExport}
            >
              <ArrowUpRight className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={handleBulkRemove}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Remove
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
                <TableHead>Action</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Triggered By</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead className={tableOverflowMenuColumnClassName}>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((action) => {
                  const statusInfo = statusConfig[action.status];
                  return (
                    <TableRow
                      key={action.id}
                      className="group"
                      data-state={selectedIds.has(action.id) ? "selected" : undefined}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(action.id)}
                          onCheckedChange={() => toggleSelected(action.id)}
                          aria-label={`Select ${action.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{action.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {action.details}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{action.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {action.status === "in_progress" ? (
                            <Loader2
                              className="animate-spin"
                              aria-hidden
                            />
                          ) : null}
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{action.triggeredBy}</TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{action.startedAt}</div>
                      </TableCell>
                      <TableCell className="min-w-[10rem] max-w-[16rem] align-top">
                        <div className="flex flex-col gap-1.5">
                          <Badge
                            variant="outline"
                            className={
                              action.status === "failed"
                                ? "w-fit border-destructive/40 bg-destructive/5 px-2 py-0.5 text-xs font-medium text-destructive"
                                : action.status === "pending" ||
                                    action.status === "in_progress"
                                  ? "w-fit border-amber-500/40 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-600/50 dark:bg-amber-950/40 dark:text-amber-200"
                                  : "w-fit border-green-500/50 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:border-green-700 dark:bg-emerald-950/50 dark:text-emerald-200"
                            }
                          >
                            {action.impactBadge}
                          </Badge>
                          <p className="text-xs leading-snug text-muted-foreground">
                            {action.impactDescription}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className={tableOverflowMenuColumnClassName}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More options</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">More options</TooltipContent>
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
              <Clock />
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
              <Clock />
            </EmptyMedia>
            <EmptyTitle>No actions in history yet</EmptyTitle>
            <EmptyDescription>
              Deploy recommended actions to see them tracked here as an audit log
            </EmptyDescription>
          </EmptyHeader>
          <Link to="/recommended-actions">
            <Button variant="outline" size="sm">
              View Recommended Actions
            </Button>
          </Link>
        </Empty>
      )}
      </PageTransition>
        </PageContent>
      </div>
    </div>
    </WidgetAIProvider>
  );
}