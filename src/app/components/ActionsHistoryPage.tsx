import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  CheckCircle2,
  Check,
  Clock,
  XCircle,
  Loader2,
  Bot,
  Search,
  RotateCcw,
  MoreHorizontal,
} from "lucide-react";
import {
  PageHeader,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { cn } from "./ui/utils";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { PageTransition } from "./PageTransition";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { TableBadge } from "./TableBadge";
import { WidgetAIProvider } from "../contexts/WidgetAIContext";
import { GLOBAL_AI_ASSISTANT_KEY } from "../lib/ai-assistant-global";

type ActionStatus = "completed" | "failed" | "in_progress" | "pending" | "created";

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
    type: "AI Agent",
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
    type: "Deterministic Process",
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
    type: "AI Agent",
    status: "in_progress",
    triggeredBy: "Alex Morgan",
    startedAt: "Feb 20, 2026 08:00 AM",
    completedAt: null,
    impactBadge: "+4%",
    impactDescription: "Routing accuracy once training finishes; validation holdout in progress",
    details: "Retraining escalation prediction model with last 30 days of labeled data.",
  },
  {
    id: "act-004",
    name: "Export Q4 Analytics Report",
    type: "Deterministic Process",
    status: "created",
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
    type: "AI Agent",
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
    type: "AI Agent",
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
    type: "Deterministic Process",
    status: "in_progress",
    triggeredBy: "Priya Patel",
    startedAt: "Feb 21, 2026 06:00 AM",
    completedAt: null,
    impactBadge: "Weekly",
    impactDescription: "Digest to team leads; faster review vs. ad hoc dashboard checks",
    details: "Scheduled weekly digest email for all team leads.",
  },
  {
    id: "act-008",
    name: "Archive Stale Conversations",
    type: "Deterministic Process",
    status: "completed",
    triggeredBy: "Jordan Lee",
    startedAt: "Feb 18, 2026 12:00 AM",
    completedAt: "Feb 18, 2026 12:02 AM",
    impactBadge: "312",
    impactDescription: "Conversations archived past retention; storage + compliance posture",
    details: "Archived 312 conversations older than 90 days with resolved status.",
  },
  {
    id: "act-009",
    name: "Sync CRM Contact Data",
    type: "AI Agent",
    status: "completed",
    triggeredBy: "Chris Martinez",
    startedAt: "Feb 18, 2026 03:00 AM",
    completedAt: "Feb 18, 2026 03:04 AM",
    impactBadge: "1,847",
    impactDescription: "Contact rows synced; fewer identity and context errors in tickets",
    details: "Synced 1,847 contact records from Salesforce CRM.",
  },
  {
    id: "act-010",
    name: "Deploy Routing Rule Update",
    type: "Deterministic Process",
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
  completed: { label: "Published", variant: "outline", icon: Check },
  created: { label: "Created", variant: "default", icon: Bot },
  failed: { label: "Failed", variant: "destructive", icon: XCircle },
  in_progress: { label: "In Progress", variant: "secondary", icon: Loader2 },
  pending: { label: "In Progress", variant: "outline", icon: Clock },
};

const allTypes = Array.from(new Set(initialActions.map((a) => a.type)));

export function ActionsHistoryPage() {
  const actions = initialActions;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const navigate = useNavigate();

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

  return (
    <WidgetAIProvider persistKey={GLOBAL_AI_ASSISTANT_KEY} ootbTypeId="actions-history">
      <div className="flex flex-col flex-1 min-h-0">
      <PageHeader>
          <section className="flex items-center gap-2">
            <h1 className="text-3xl tracking-tight">History</h1>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 shrink-0">
              {counts.total} total actions
            </Badge>
          </section>
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
      <SelectItem value="completed">Published</SelectItem>
      <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
      <SelectItem value="pending">In Progress</SelectItem>
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
      </PageHeader>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
      <PageTransition className={cn(pageMainColumnClassName, "space-y-6")}>
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
              className="flex min-w-0 flex-col gap-2 rounded-xl border border-primary/40 bg-primary/[0.03] p-4 transition-[box-shadow,border-color,background-color] hover:border-primary/55 hover:bg-primary/[0.05] hover:shadow-md"
            >
              <div className="flex min-w-0 flex-col gap-2.5">
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
              className="flex min-w-0 flex-col gap-2 rounded-xl border border-primary/40 bg-primary/[0.03] p-4 transition-[box-shadow,border-color,background-color] hover:border-primary/55 hover:bg-primary/[0.05] hover:shadow-md"
            >
              <div className="flex min-w-0 flex-col gap-2.5">
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
      <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[340px]">Action</TableHead>
                <TableHead className="w-[180px]">Type</TableHead>
                <TableHead className="w-[128px]">Status</TableHead>
                <TableHead className="w-[180px]">Triggered By</TableHead>
                <TableHead className="w-[196px]">Started</TableHead>
                <TableHead className="min-w-[22rem] w-[32%]">Impact</TableHead>
                <TableHead className={`${tableOverflowMenuColumnClassName} px-0 pr-4`}>
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
                    >
                      <TableCell className="w-[340px] whitespace-normal">
                        <section>
                          <p className="font-medium break-words">{action.name}</p>
                          <p className="mt-0.5 break-words text-xs leading-snug text-muted-foreground">
                            {action.details}
                          </p>
                        </section>
                      </TableCell>
                      <TableCell className="w-[180px]">
                        <TableBadge variant="secondary">{action.type}</TableBadge>
                      </TableCell>
                      <TableCell className="w-[128px]">
                        <TableBadge
                          variant={statusInfo.variant}
                          className={cn(
                            "gap-1.5",
                            action.status === "completed"
                              ? "border-transparent bg-emerald-600 text-white dark:bg-emerald-600 dark:text-white"
                              : "",
                          )}
                        >
                          {action.status === "in_progress" ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            <statusInfo.icon className="h-4 w-4" aria-hidden />
                          )}
                          {statusInfo.label}
                        </TableBadge>
                      </TableCell>
                      <TableCell className="w-[180px] text-sm">{action.triggeredBy}</TableCell>
                      <TableCell className="w-[196px]">
                        <div className="text-sm text-muted-foreground">{action.startedAt}</div>
                      </TableCell>
                      <TableCell className="min-w-[22rem] w-[32%] align-middle whitespace-normal">
                        <p className="line-clamp-2 break-words text-sm leading-snug text-muted-foreground">
                          {action.impactDescription}
                        </p>
                      </TableCell>
                      <TableCell className={`${tableOverflowMenuColumnClassName} px-0 pr-4`}>
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">More options</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              onSelect={() => {
                                navigate(
                                  `/automation-opportunities/agent/${encodeURIComponent(action.name)}`,
                                );
                              }}
                            >
                              <Bot className="h-4 w-4" />
                              View Agent
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
        </div>
      </div>
    </div>
    </WidgetAIProvider>
  );
}
