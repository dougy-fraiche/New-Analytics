import {
  buildTrendSparklineSeries,
  type KpiSparklinePattern,
} from "../lib/kpi-trend-sparkline";

export type AIAgentOverviewKpi = {
  label: string;
  value: string;
  trend: string;
  sparklinePattern: KpiSparklinePattern;
  sparkline: number[];
};

function createOverviewKpi(
  kpi: Omit<AIAgentOverviewKpi, "sparkline">,
): AIAgentOverviewKpi {
  return {
    ...kpi,
    sparkline: buildTrendSparklineSeries({
      value: kpi.value,
      trend: kpi.trend,
      pattern: kpi.sparklinePattern,
      seedKey: `ai-agent-overview:${kpi.label}`,
    }),
  };
}

export const aiAgentOverviewKpis: AIAgentOverviewKpi[] = [
  createOverviewKpi({
    label: "Total Sessions",
    value: "12,847",
    trend: "+8.3%",
    sparklinePattern: "smallDipRecovery",
  }),
  createOverviewKpi({
    label: "Active Sessions",
    value: "162",
    trend: "+5.2%",
    sparklinePattern: "steadyUp",
  }),
  createOverviewKpi({
    label: "Avg. Session Length",
    value: "3.2 min",
    trend: "-2.1%",
    sparklinePattern: "smallSpikePullback",
  }),
  createOverviewKpi({
    label: "Handovers (Escalations)",
    value: "342",
    trend: "-4.5%",
    sparklinePattern: "bigDipRecovery",
  }),
  createOverviewKpi({
    label: "Positive Ratings",
    value: "94.2%",
    trend: "+1.8%",
    sparklinePattern: "steadyUp",
  }),
  createOverviewKpi({
    label: "Unique Contacts",
    value: "10,456",
    trend: "+6.7%",
    sparklinePattern: "smallDipRecovery",
  }),
];

export type AIAgentEvaluationKpi = {
  label: string;
  value: string;
  caption: string;
  badge: string;
  sparklinePattern: KpiSparklinePattern;
  sparkline: number[];
};

function createEvaluationKpi(
  kpi: Omit<AIAgentEvaluationKpi, "sparkline">,
): AIAgentEvaluationKpi {
  return {
    ...kpi,
    sparkline: buildTrendSparklineSeries({
      value: kpi.value,
      trend: kpi.badge,
      pattern: kpi.sparklinePattern,
      seedKey: `ai-agent-evaluation:${kpi.label}`,
    }),
  };
}

export const aiAgentEvaluationKpis: AIAgentEvaluationKpi[] = [
  createEvaluationKpi({
    label: "Evaluated",
    value: "2,847",
    caption: "conversations",
    badge: "+3.2%",
    sparklinePattern: "steadyUp",
  }),
  createEvaluationKpi({
    label: "Success Rate",
    value: "68%",
    caption: "goal achieved",
    badge: "+1.4%",
    sparklinePattern: "smallDipRecovery",
  }),
  createEvaluationKpi({
    label: "Containment",
    value: "73%",
    caption: "AI resolved",
    badge: "+2.0%",
    sparklinePattern: "smallSpikePullback",
  }),
  createEvaluationKpi({
    label: "Positive Sent",
    value: "58%",
    caption: "good sentiment",
    badge: "−0.8%",
    sparklinePattern: "smallDipRecovery",
  }),
  createEvaluationKpi({
    label: "Compliance",
    value: "89%",
    caption: "114 violations",
    badge: "−1.1%",
    sparklinePattern: "steadyDown",
  }),
  createEvaluationKpi({
    label: "Brand Aligned",
    value: "71%",
    caption: "fully aligned",
    badge: "+0.6%",
    sparklinePattern: "flat",
  }),
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
