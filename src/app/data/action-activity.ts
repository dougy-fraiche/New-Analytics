export type ActionExecutionStatus =
  | "completed"
  | "failed"
  | "in_progress"
  | "pending"
  | "created";

export interface RecommendedActionActivity {
  actionId: number;
  owner: string;
  status: ActionExecutionStatus;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  relativeTimeLabel: string;
}

export const ACTION_STATUS_LABELS: Record<ActionExecutionStatus, string> = {
  completed: "Published",
  created: "Created",
  failed: "Failed",
  in_progress: "In Progress",
  pending: "Queued",
};

/**
 * Shared mock execution metadata for recommended actions.
 * This powers the Recommended Actions table, History rows, and top-nav notifications.
 */
export const recommendedActionActivityById: Record<number, RecommendedActionActivity> = {
  1: {
    actionId: 1,
    owner: "John Doe",
    status: "completed",
    startedAt: "Feb 20, 2026 09:14 AM",
    completedAt: "Feb 20, 2026 09:16 AM",
    updatedAt: "Feb 20, 2026 09:16 AM",
    relativeTimeLabel: "2 minutes ago",
  },
  2: {
    actionId: 2,
    owner: "Emily Rodriguez",
    status: "completed",
    startedAt: "Feb 20, 2026 08:45 AM",
    completedAt: "Feb 20, 2026 08:45 AM",
    updatedAt: "Feb 20, 2026 08:45 AM",
    relativeTimeLabel: "31 minutes ago",
  },
  3: {
    actionId: 3,
    owner: "Alex Morgan",
    status: "in_progress",
    startedAt: "Feb 20, 2026 08:00 AM",
    completedAt: null,
    updatedAt: "Feb 20, 2026 09:10 AM",
    relativeTimeLabel: "8 minutes ago",
  },
  4: {
    actionId: 4,
    owner: "Sarah Johnson",
    status: "created",
    startedAt: "Feb 19, 2026 04:30 PM",
    completedAt: null,
    updatedAt: "Feb 19, 2026 04:31 PM",
    relativeTimeLabel: "1 hour ago",
  },
  5: {
    actionId: 5,
    owner: "Michael Chen",
    status: "failed",
    startedAt: "Feb 19, 2026 02:10 PM",
    completedAt: "Feb 19, 2026 02:10 PM",
    updatedAt: "Feb 19, 2026 02:10 PM",
    relativeTimeLabel: "3 hours ago",
  },
  6: {
    actionId: 6,
    owner: "Jordan Lee",
    status: "completed",
    startedAt: "Feb 19, 2026 11:00 AM",
    completedAt: "Feb 19, 2026 11:00 AM",
    updatedAt: "Feb 19, 2026 11:00 AM",
    relativeTimeLabel: "4 hours ago",
  },
  7: {
    actionId: 7,
    owner: "Priya Patel",
    status: "pending",
    startedAt: "Feb 21, 2026 06:00 AM",
    completedAt: null,
    updatedAt: "Feb 21, 2026 06:00 AM",
    relativeTimeLabel: "6 hours ago",
  },
};
