import type { WidgetAIPromptButtonProps } from "./WidgetAIPromptButton";
import { WidgetOverflowMenu } from "./WidgetOverflowMenu";

export type WidgetAskAIAndOverflowProps = WidgetAIPromptButtonProps & {
  /** When false, no header controls are shown. Default true. */
  showOverflowMenu?: boolean;
};

/** Shared widget header control wrapper (overflow-only; Ask AI removed app-wide). */
export function WidgetAskAIAndOverflow({
  showOverflowMenu = true,
  ...props
}: WidgetAskAIAndOverflowProps) {
  if (!showOverflowMenu) return null;

  const { widgetTitle, chartType } = props;
  return (
    <div className="flex shrink-0 items-center gap-0">
      <WidgetOverflowMenu widgetTitle={widgetTitle} chartType={chartType} />
    </div>
  );
}
