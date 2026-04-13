export interface WidgetAIPromptButtonProps {
  /** The widget/chart title, used as context reference when sending to AI panel. */
  widgetTitle: string;
  /** The chart type, used to show the correct icon in the reference badge. */
  chartType?: string;
  /** When set, links chat messages back to an in-page anchor (scroll + highlight). */
  widgetAnchorId?: string;
  /** Tooltip text on the sparkle trigger (default: Ask AI about this widget). */
  tooltipLabel?: string;
  /** Tooltip position for the sparkle trigger. */
  tooltipSide?: "top" | "right" | "bottom" | "left";
  /** Extra classes for the sparkle trigger button (e.g. different hover group). */
  triggerClassName?: string;
  /** Controlled open state (e.g. when opened from chart KPI click). */
  open?: boolean;
  /** Called when popover open state should change (for controlled mode). */
  onOpenChange?: (open: boolean) => void;
  /** When set, shows which KPI/segment is selected (e.g. from chart click). */
  selectedKpiLabel?: string | null;
  /** If provided, anchors the popover at a click point instead of the icon. */
  anchorPoint?: { x: number; y: number } | null;
  /** Optional prompt chips shown under the input; defaults to common analytics prompts. */
  suggestedPrompts?: string[];
  /** Optional callback fired when a suggested prompt chip is clicked. */
  onSuggestedPromptSelect?: (prompt: string) => void;
  /** Optional source metadata overrides keyed by suggested prompt text. */
  suggestedPromptSourceOverrides?: Record<
    string,
    {
      widgetTitle?: string;
      chartType?: string;
      widgetAnchorId?: string;
      selectedKpiLabel?: string | null;
    }
  >;
}

/**
 * Widget-level Ask AI trigger is intentionally disabled application-wide.
 * Keep this component + props as a compatibility shim for existing call sites.
 */
export function WidgetAIPromptButton(_props: WidgetAIPromptButtonProps) {
  return null;
}
