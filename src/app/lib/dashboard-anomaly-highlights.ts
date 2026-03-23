import { generateGridLayout } from "../components/ChartVariants";

export const ANOMALY_CARD_CLASS =
  "border-amber-400/60 bg-amber-50/30 dark:bg-amber-950/10";

function hashStringToPositiveInt(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) ^ input.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Stable anomaly highlights for dashboard widgets (KPI cards, chart panels, table).
 * Seeded by `chartLayoutId` so the same dashboard always gets the same picks.
 */
export function getDashboardAnomalyHighlights(chartLayoutId: string) {
  const chartPanelCount = generateGridLayout(chartLayoutId, true).panels.length;
  const totalKpiWidgets = 4 + chartPanelCount + 1;

  const highlightSeed = hashStringToPositiveInt(chartLayoutId);
  const highlightCount = 1 + (highlightSeed % 2);
  const pick1 = totalKpiWidgets > 0 ? highlightSeed % totalKpiWidgets : 0;
  const pick2 =
    totalKpiWidgets > 1
      ? (pick1 + 1 + ((highlightSeed >> 3) % (totalKpiWidgets - 1))) %
        totalKpiWidgets
      : pick1;

  const highlightedKpiWidgets = new Set<number>(
    highlightCount === 2 ? [pick1, pick2] : [pick1],
  );

  const highlightedKpiCards = new Set<number>(
    Array.from(highlightedKpiWidgets).filter((i) => i >= 0 && i < 4),
  );
  const highlightedChartPanels = new Set<number>(
    Array.from(highlightedKpiWidgets)
      .filter((i) => i >= 4 && i < 4 + chartPanelCount)
      .map((i) => i - 4),
  );
  const highlightTableCard = highlightedKpiWidgets.has(4 + chartPanelCount);

  return {
    anomalyCardClass: ANOMALY_CARD_CLASS,
    highlightedKpiCards,
    highlightedChartPanels,
    highlightTableCard,
    chartPanelCount,
  };
}
