export type AIAgentOverviewKpi = {
  label: string;
  value: string;
  trend: string;
  sparkline: number[];
};

export const aiAgentOverviewKpis: AIAgentOverviewKpi[] = [
  {
    label: "Total Sessions",
    value: "12,847",
    trend: "+8.3%",
    sparkline: [10200, 10800, 11200, 11650, 12000, 12400, 12847],
  },
  {
    label: "Active Sessions",
    value: "162",
    trend: "+5.2%",
    sparkline: [118, 126, 132, 138, 144, 152, 162],
  },
  {
    label: "Avg. Session Length",
    value: "3.2 min",
    trend: "-2.1%",
    sparkline: [3.8, 3.7, 3.6, 3.45, 3.35, 3.28, 3.2],
  },
  {
    label: "Handovers (Escalations)",
    value: "342",
    trend: "-4.5%",
    sparkline: [398, 384, 372, 362, 354, 348, 342],
  },
  {
    label: "Positive Ratings",
    value: "94.2%",
    trend: "+1.8%",
    sparkline: [90.1, 91.0, 91.8, 92.4, 93.0, 93.6, 94.2],
  },
  {
    label: "Unique Contacts",
    value: "10,456",
    trend: "+6.7%",
    sparkline: [8450, 8760, 9020, 9420, 9730, 10080, 10456],
  },
];

export type AIAgentEvaluationKpi = {
  label: string;
  value: string;
  caption: string;
  badge: string;
};

export const aiAgentEvaluationKpis: AIAgentEvaluationKpi[] = [
  { label: "Evaluated", value: "2,847", caption: "conversations", badge: "+3.2%" },
  { label: "Success Rate", value: "68%", caption: "goal achieved", badge: "+1.4%" },
  { label: "Containment", value: "73%", caption: "AI resolved", badge: "+2.0%" },
  { label: "Positive Sent", value: "58%", caption: "good sentiment", badge: "−0.8%" },
  { label: "Compliance", value: "89%", caption: "114 violations", badge: "−1.1%" },
  { label: "Brand Aligned", value: "71%", caption: "fully aligned", badge: "+0.6%" },
];

export type AIAgentProductivityRow = {
  agentName: string;
  totalSessions: number;
  sentimentPct: number;
  brandAlignmentPct: number;
};

export const aiAgentProductivityRows: AIAgentProductivityRow[] = [
  { agentName: "Agent-Aria", totalSessions: 1842, sentimentPct: 64, brandAlignmentPct: 77 },
  { agentName: "Agent-Orion", totalSessions: 1633, sentimentPct: 56, brandAlignmentPct: 68 },
  { agentName: "Agent-Nova", totalSessions: 1522, sentimentPct: 58, brandAlignmentPct: 71 },
  { agentName: "Agent-Luna", totalSessions: 1366, sentimentPct: 62, brandAlignmentPct: 74 },
  { agentName: "Agent-Atlas", totalSessions: 1284, sentimentPct: 55, brandAlignmentPct: 69 },
  { agentName: "Agent-Echo", totalSessions: 1179, sentimentPct: 57, brandAlignmentPct: 70 },
  { agentName: "Agent-Sage", totalSessions: 1122, sentimentPct: 60, brandAlignmentPct: 72 },
  { agentName: "Agent-Kai", totalSessions: 1026, sentimentPct: 54, brandAlignmentPct: 67 },
  { agentName: "Agent-Mira", totalSessions: 963, sentimentPct: 59, brandAlignmentPct: 73 },
  { agentName: "Agent-Sol", totalSessions: 910, sentimentPct: 53, brandAlignmentPct: 66 },
];
