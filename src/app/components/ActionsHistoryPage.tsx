import { useState } from "react";
import { Link } from "react-router";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowUpRight,
  Filter,
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
import { BulkActionBar } from "./BulkActionBar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { PageTransition } from "./PageTransition";

type ActionStatus = "completed" | "failed" | "in_progress" | "pending";

interface ActionRecord {
  id: string;
  name: string;
  type: string;
  status: ActionStatus;
  triggeredBy: string;
  startedAt: string;
  completedAt: string | null;
  duration: string | null;
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
    duration: "2m 14s",
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
    duration: "12s",
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
    duration: null,
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
    duration: "48s",
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
    duration: "3s",
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
    duration: "5s",
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
    duration: null,
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
    duration: "2m 03s",
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
    duration: "4m 22s",
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
    duration: "1s",
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
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl tracking-tight">Deployed Actions</h1>
            <p className="text-muted-foreground mt-2">
              Audit log of all automated and manual actions across the platform
            </p>
          </div>
          <Button variant="outline" size="sm">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Export Log
          </Button>
        </div>
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-auto">
        <PageContent className="space-y-6 p-8">
      <PageTransition className="space-y-6">
      {/* Summary Cards */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {counts.total} total actions
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {counts.completed} completed
        </Badge>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          {counts.failed + counts.active} failed / active
        </Badge>
      </div>

      {actions.length > 0 ? (
        <>
      {/* Filters */}
      <div className="flex w-full flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Status" />
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type" />
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
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="w-[50px]"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((action) => {
                  const statusInfo = statusConfig[action.status];
                  const StatusIcon = statusInfo.icon;
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
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon
                            className={`h-3 w-3 ${
                              action.status === "in_progress" ? "animate-spin" : ""
                            }`}
                          />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{action.triggeredBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {action.startedAt}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {action.duration || "—"}
                      </TableCell>
                      <TableCell className="text-right">
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
            <EmptyTitle>No deployed actions yet</EmptyTitle>
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
  );
}