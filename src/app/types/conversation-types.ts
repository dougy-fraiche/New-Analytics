/**
 * Shared domain types for explore thread messages, global chat, and chart payloads.
 */

/** Tabular / series row for charts and mock APIs (avoids `Record<string, any>`). */
export type ChartRow = Record<string, string | number | boolean | null | undefined>;

export interface DashboardData {
  id: string;
  title: string;
  description: string;
  metrics?: Array<{
    label: string;
    value: string;
  }>;
  chartData?: {
    trend?: ChartRow[];
    breakdown?: ChartRow[];
  };
}

/** Badge + anchor metadata when a user prompt originates from a widget. */
export interface WidgetMessageMeta {
  widgetRef?: string;
  widgetKpiLabel?: string;
  /** Serialized chart kind; validate with `isChartType` from ChartVariants when rendering icons. */
  widgetIconType?: string;
  widgetAnchorId?: string;
}
