import type { CSSProperties } from "react";
import { Progress } from "./ui/progress";
import { cn } from "./ui/utils";

function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function CopilotProgressBar({
  value,
  className,
  indicatorClassName,
  indicatorColor,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
  indicatorColor?: string;
}) {
  const resolvedValue = clampProgress(value);
  const indicatorStyle = indicatorColor
    ? ({ "--copilot-progress-indicator": indicatorColor } as CSSProperties)
    : undefined;

  return (
    <Progress
      value={resolvedValue}
      className={cn("bg-muted", className)}
      indicatorClassName={cn(
        indicatorColor ? "bg-[var(--copilot-progress-indicator)]" : undefined,
        indicatorClassName,
      )}
      style={indicatorStyle}
    />
  );
}
