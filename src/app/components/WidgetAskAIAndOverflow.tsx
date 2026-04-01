import type { ComponentProps } from "react";
import { WidgetAIPromptButton } from "./WidgetAIPromptButton";
import { WidgetOverflowMenu } from "./WidgetOverflowMenu";

export type WidgetAskAIAndOverflowProps = ComponentProps<typeof WidgetAIPromptButton> & {
  /** When false, only the Ask AI control is shown (e.g. Observability OOTB dashboards). Default true. */
  showOverflowMenu?: boolean;
};

/** Ask AI + overflow menu with zero gap between the two triggers (shared dashboard / widget pattern). */
export function WidgetAskAIAndOverflow({
  showOverflowMenu = true,
  ...props
}: WidgetAskAIAndOverflowProps) {
  const { widgetTitle, chartType } = props;
  return (
    <div className="flex shrink-0 items-center gap-0">
      <WidgetAIPromptButton {...props} />
      {showOverflowMenu ? <WidgetOverflowMenu widgetTitle={widgetTitle} chartType={chartType} /> : null}
    </div>
  );
}
