import {
  buildTrendSparklineSeries,
  type KpiSparklinePattern,
} from "../lib/kpi-trend-sparkline";

export type DashboardKpiKey =
  | "totalEscalations"
  | "avgResolutionHours"
  | "customerSatisfactionPct"
  | "resolutionRatePct";

export type DashboardTrendBadgeKpi = {
  key: DashboardKpiKey;
  label: string;
  value: string;
  trend: string;
  seriesName: string;
  sparklinePattern: KpiSparklinePattern;
  sparkline: number[];
};

function createDashboardKpi(
  kpi: Omit<DashboardTrendBadgeKpi, "sparkline">,
): DashboardTrendBadgeKpi {
  return {
    ...kpi,
    sparkline: buildTrendSparklineSeries({
      value: kpi.value,
      trend: kpi.trend,
      pattern: kpi.sparklinePattern,
      seedKey: `dashboard:${kpi.key}`,
    }),
  };
}

export const dashboardTrendBadgeKpis: DashboardTrendBadgeKpi[] = [
  createDashboardKpi({
    key: "totalEscalations",
    label: "Total Escalations",
    value: "260",
    trend: "+12%",
    seriesName: "Escalations",
    sparklinePattern: "smallDipRecovery",
  }),
  createDashboardKpi({
    key: "avgResolutionHours",
    label: "Avg Resolution Time",
    value: "4.3h",
    trend: "-8%",
    seriesName: "Avg. resolution",
    sparklinePattern: "smallSpikePullback",
  }),
  createDashboardKpi({
    key: "customerSatisfactionPct",
    label: "Customer Satisfaction",
    value: "94%",
    trend: "+2%",
    seriesName: "Satisfaction",
    sparklinePattern: "steadyUp",
  }),
  createDashboardKpi({
    key: "resolutionRatePct",
    label: "Resolution Rate",
    value: "87%",
    trend: "No change",
    seriesName: "Resolution rate",
    sparklinePattern: "flat",
  }),
];

export const dashboardTrendBadgeKpiByKey: Record<
  DashboardKpiKey,
  DashboardTrendBadgeKpi
> = Object.fromEntries(
  dashboardTrendBadgeKpis.map((kpi) => [kpi.key, kpi]),
) as Record<DashboardKpiKey, DashboardTrendBadgeKpi>;

