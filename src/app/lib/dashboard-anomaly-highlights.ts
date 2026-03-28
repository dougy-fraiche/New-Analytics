import { generateGridLayout } from "../components/ChartVariants";

/**
 * Orange anomaly highlighting has been retired.
 * Keep the same return shape so call-sites remain unchanged.
 */
export function getDashboardAnomalyHighlights(chartLayoutId: string) {
  const chartPanelCount = generateGridLayout(chartLayoutId, true).panels.length;

  return {
    anomalyCardClass: "",
    highlightedKpiCards: new Set<number>(),
    highlightedChartPanels: new Set<number>(),
    highlightTableCard: false,
    chartPanelCount,
  };
}
