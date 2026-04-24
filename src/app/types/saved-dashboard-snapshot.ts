import type { ChartRow, DashboardData } from "./conversation-types";
import type { KpiSparklinePattern } from "../lib/kpi-trend-sparkline";

export interface SavedDashboardSnapshotKpi {
  label: string;
  value: string;
  trend: string;
  seriesName: string;
  sparklinePattern: KpiSparklinePattern;
  sparkline: number[];
}

export interface SavedDashboardSnapshotDataset {
  data: ChartRow[];
  xKey: string;
  yKey: string;
  y2Key?: string;
}

export interface SavedDashboardSnapshotTableRow {
  agent: string;
  escalations: number;
  resolved: number;
  avgTime: string;
  satisfaction: string;
}

export interface SavedDashboardSnapshot {
  kpis: SavedDashboardSnapshotKpi[];
  datasets: {
    trend: SavedDashboardSnapshotDataset;
    category: SavedDashboardSnapshotDataset;
    comparison: SavedDashboardSnapshotDataset;
  };
  table: SavedDashboardSnapshotTableRow[];
}

export interface BuildSavedDashboardSnapshotInput {
  seed: string;
  title: string;
  description?: string;
  sourceOotbId?: string;
  baseDashboard?: DashboardData | null;
}

