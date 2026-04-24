import type { ChartRow } from "../types/conversation-types";
import {
  buildTrendSparklineSeries,
  type KpiSparklinePattern,
} from "./kpi-trend-sparkline";
import type {
  BuildSavedDashboardSnapshotInput,
  SavedDashboardSnapshot,
  SavedDashboardSnapshotKpi,
} from "../types/saved-dashboard-snapshot";

const KPI_PATTERN_BY_DIRECTION: Record<"up" | "down" | "neutral", KpiSparklinePattern[]> = {
  up: ["steadyUp", "smallDipRecovery", "smallSpikePullback"],
  down: ["steadyDown", "smallSpikePullback", "smallDipRecovery"],
  neutral: ["flat"],
};

const DEFAULT_METRIC_POOL: Array<{ label: string; value: string }> = [
  { label: "Total Escalations", value: "260" },
  { label: "Avg Resolution Time", value: "4.3h" },
  { label: "Customer Satisfaction", value: "94%" },
  { label: "Resolution Rate", value: "87%" },
  { label: "Self-Service Containment", value: "73%" },
  { label: "Avg Session Length", value: "3.2 min" },
  { label: "Unique Contacts", value: "10,456" },
];

const CATEGORY_POOL = [
  "Billing Support",
  "Technical Issues",
  "Account Access",
  "Feature Requests",
  "Order Tracking",
  "Returns & Refunds",
  "General Inquiry",
  "Subscription Changes",
  "Payment Failures",
  "Security Alerts",
];

const AGENT_POOL = [
  "Sarah Johnson",
  "Michael Chen",
  "Emily Rodriguez",
  "David Kim",
  "Lisa Wang",
  "Rachel Clark",
  "James Wilson",
  "Amanda Taylor",
];

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function parseNumeric(value: string): number {
  const match = value.replaceAll(",", "").match(/-?\d+(?:\.\d+)?/);
  if (!match?.[0]) return 0;
  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cloneRows(rows: ChartRow[]): ChartRow[] {
  return rows.map((row) => ({ ...row }));
}

function pickN<T>(pool: T[], count: number, random: () => number): T[] {
  const copy = [...pool];
  const result: T[] = [];
  while (copy.length > 0 && result.length < count) {
    const idx = Math.floor(random() * copy.length);
    const [picked] = copy.splice(idx, 1);
    if (picked !== undefined) result.push(picked);
  }
  return result;
}

function buildMetricSource(input: BuildSavedDashboardSnapshotInput, random: () => number) {
  if (input.baseDashboard?.metrics && input.baseDashboard.metrics.length >= 3) {
    return input.baseDashboard.metrics.slice(0, 4);
  }
  return pickN(DEFAULT_METRIC_POOL, 4, random);
}

function trendFromMetric(value: string, random: () => number): { direction: "up" | "down" | "neutral"; trend: string } {
  const roll = random();
  const direction: "up" | "down" | "neutral" =
    roll < 0.52 ? "up" : roll < 0.86 ? "down" : "neutral";
  if (direction === "neutral") return { direction, trend: "No change" };

  const sign = direction === "up" ? "+" : "-";
  const numeric = parseNumeric(value);

  if (value.includes("%")) {
    const delta = Math.max(0.4, random() * 7.2);
    return { direction, trend: `${sign}${delta.toFixed(1)}%` };
  }

  if (numeric > 0 && numeric < 2) {
    const delta = Math.max(0.01, random() * 0.08);
    return { direction, trend: `${sign}${delta.toFixed(2)}` };
  }

  if (/\b(min|h|hr)\b/i.test(value)) {
    const delta = Math.max(0.2, random() * 2.4);
    return { direction, trend: `${sign}${delta.toFixed(1)}%` };
  }

  const delta = Math.max(0.6, random() * 9.8);
  return { direction, trend: `${sign}${delta.toFixed(1)}%` };
}

function buildKpis(input: BuildSavedDashboardSnapshotInput, random: () => number): SavedDashboardSnapshotKpi[] {
  const source = buildMetricSource(input, random);
  return source.map((metric, index) => {
    const trendMeta = trendFromMetric(metric.value, random);
    const patterns = KPI_PATTERN_BY_DIRECTION[trendMeta.direction];
    const sparklinePattern =
      patterns[Math.floor(random() * patterns.length)] ?? "flat";
    const sparkline = buildTrendSparklineSeries({
      value: metric.value,
      trend: trendMeta.trend,
      pattern: sparklinePattern,
      seedKey: `${input.seed}:kpi:${metric.label}:${index}`,
    });

    return {
      label: metric.label,
      value: metric.value,
      trend: trendMeta.trend,
      seriesName: metric.label,
      sparklinePattern,
      sparkline,
    };
  });
}

function resolveBaseTrendRows(input: BuildSavedDashboardSnapshotInput): ChartRow[] | null {
  const rows = input.baseDashboard?.chartData?.trend;
  if (!rows || rows.length < 4) return null;
  return cloneRows(rows);
}

function resolveBaseBreakdownRows(input: BuildSavedDashboardSnapshotInput): ChartRow[] | null {
  const rows = input.baseDashboard?.chartData?.breakdown;
  if (!rows || rows.length < 4) return null;
  return cloneRows(rows);
}

function pickAxisKeys(row: ChartRow, defaults: { xKey: string; yKey: string }): { xKey: string; yKey: string } {
  const entries = Object.entries(row);
  const xEntry = entries.find(([, value]) => typeof value === "string");
  const yEntry = entries.find(([, value]) => typeof value === "number");
  return {
    xKey: xEntry?.[0] ?? defaults.xKey,
    yKey: yEntry?.[0] ?? defaults.yKey,
  };
}

function buildTrendDataset(input: BuildSavedDashboardSnapshotInput, random: () => number) {
  const base = resolveBaseTrendRows(input);
  if (base && base.length > 0) {
    const { xKey, yKey } = pickAxisKeys(base[0], { xKey: "date", yKey: "conversations" });
    const data = base.map((row, index) => {
      const baseValue = Number(row[yKey] ?? 0);
      const wave = Math.sin((index / Math.max(1, base.length - 1)) * Math.PI * 2) * 0.08;
      const jitter = (random() - 0.5) * 0.16;
      const nextValue = Math.max(0, Math.round(baseValue * (1 + wave + jitter)));
      return { ...row, [yKey]: nextValue };
    });
    return { data, xKey, yKey };
  }

  let baseline = 1000 + Math.floor(random() * 900);
  const data = Array.from({ length: 12 }, (_, index) => {
    baseline = Math.max(160, baseline + Math.round((random() - 0.48) * 240));
    return { date: `Week ${index + 1}`, conversations: baseline };
  });
  return { data, xKey: "date", yKey: "conversations" };
}

function buildCategoryDataset(input: BuildSavedDashboardSnapshotInput, random: () => number) {
  const base = resolveBaseBreakdownRows(input);
  if (base && base.length > 0) {
    const { xKey, yKey } = pickAxisKeys(base[0], { xKey: "category", yKey: "tickets" });
    const data = base.map((row, index) => {
      const baseValue = Number(row[yKey] ?? 0);
      const multiplier = 0.76 + random() * 0.58 + (index % 2 === 0 ? 0.06 : -0.03);
      return { ...row, [yKey]: Math.max(24, Math.round(baseValue * multiplier)) };
    });
    return { data, xKey, yKey };
  }

  const categories = pickN(CATEGORY_POOL, 6, random);
  const data = categories.map((category, index) => ({
    category,
    tickets: Math.max(38, Math.round((0.78 + random() * 0.95) * (420 - index * 38))),
  }));
  return { data, xKey: "category", yKey: "tickets" };
}

function buildComparisonDataset(
  trendRows: ChartRow[],
  trendYKey: string,
  random: () => number,
) {
  const picked = trendRows.filter((_, index) => index % 2 === 1).slice(0, 6);
  const data = (picked.length > 0 ? picked : trendRows.slice(0, 6)).map((row, index) => {
    const current = Number(row[trendYKey] ?? 0);
    const baseline = Math.max(40, Math.round(current * (0.78 + random() * 0.18)));
    return {
      week: `Period ${index + 1}`,
      thisPeriod: current,
      lastPeriod: baseline,
    };
  });
  return { data, xKey: "week", yKey: "thisPeriod", y2Key: "lastPeriod" };
}

function buildTableRows(random: () => number) {
  const agents = pickN(AGENT_POOL, 5, random);
  return agents.map((agent, index) => {
    const escalations = Math.max(6, Math.round(12 + random() * 24 + index * 2));
    const resolved = Math.max(80, Math.round(130 + random() * 110 + index * 8));
    const avgTimeHours = (3.1 + random() * 2.2).toFixed(1);
    const satisfaction = `${Math.round(84 + random() * 14)}%`;
    return {
      agent,
      escalations,
      resolved,
      avgTime: `${avgTimeHours}h`,
      satisfaction,
    };
  });
}

function adjustKpisTowardTrend(
  kpis: SavedDashboardSnapshotKpi[],
  trendRows: ChartRow[],
  trendYKey: string,
): SavedDashboardSnapshotKpi[] {
  if (kpis.length === 0 || trendRows.length === 0) return kpis;
  const first = Number(trendRows[0]?.[trendYKey] ?? 0);
  const last = Number(trendRows[trendRows.length - 1]?.[trendYKey] ?? 0);
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return kpis;

  const trendPct = ((last - first) / first) * 100;
  return kpis.map((kpi, index) => {
    if (index !== 0 || kpi.trend === "No change") return kpi;
    const sign = trendPct >= 0 ? "+" : "-";
    const magnitude = Math.abs(trendPct);
    const trendText = `${sign}${Math.max(0.1, magnitude).toFixed(1)}%`;
    return {
      ...kpi,
      trend: trendText,
      sparkline: buildTrendSparklineSeries({
        value: kpi.value,
        trend: trendText,
        pattern: kpi.sparklinePattern,
        seedKey: `${kpi.label}:trend-adjusted`,
      }),
    };
  });
}

export function buildSavedDashboardSnapshot(
  input: BuildSavedDashboardSnapshotInput,
): SavedDashboardSnapshot {
  const random = createSeededRandom(hashSeed(input.seed));
  const trendDataset = buildTrendDataset(input, random);
  const categoryDataset = buildCategoryDataset(input, random);
  const comparisonDataset = buildComparisonDataset(
    trendDataset.data,
    trendDataset.yKey,
    random,
  );

  const kpis = adjustKpisTowardTrend(
    buildKpis(input, random),
    trendDataset.data,
    trendDataset.yKey,
  );

  return {
    kpis,
    datasets: {
      trend: trendDataset,
      category: categoryDataset,
      comparison: comparisonDataset,
    },
    table: buildTableRows(random),
  };
}

export function deriveSavedDashboardKpiLabels(
  snapshot: SavedDashboardSnapshot,
  count = 3,
): string[] {
  return snapshot.kpis.slice(0, Math.max(0, count)).map((kpi) => kpi.label);
}

export function cloneSavedDashboardSnapshot(
  snapshot?: SavedDashboardSnapshot,
): SavedDashboardSnapshot | undefined {
  if (!snapshot) return undefined;
  return {
    kpis: snapshot.kpis.map((kpi) => ({
      ...kpi,
      sparkline: [...kpi.sparkline],
    })),
    datasets: {
      trend: {
        ...snapshot.datasets.trend,
        data: cloneRows(snapshot.datasets.trend.data),
      },
      category: {
        ...snapshot.datasets.category,
        data: cloneRows(snapshot.datasets.category.data),
      },
      comparison: {
        ...snapshot.datasets.comparison,
        data: cloneRows(snapshot.datasets.comparison.data),
      },
    },
    table: snapshot.table.map((row) => ({ ...row })),
  };
}
