import type { ReactNode } from "react";
import { cn } from "./ui/utils";

export function InsetMetricTile({
  value,
  label,
  supportingText,
  className,
  valueClassName,
  labelClassName,
  supportingTextClassName,
}: {
  value: ReactNode;
  label: ReactNode;
  supportingText?: ReactNode;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  supportingTextClassName?: string;
}) {
  return (
    <div className={cn("rounded-xl p-4 text-center", className)}>
      <p className={cn("text-3xl font-semibold tracking-tight", valueClassName)}>{value}</p>
      <p className={cn("mt-1 text-sm text-foreground", labelClassName)}>{label}</p>
      {supportingText ? (
        <p className={cn("text-xs text-muted-foreground", supportingTextClassName)}>{supportingText}</p>
      ) : null}
    </div>
  );
}
