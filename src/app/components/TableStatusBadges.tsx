import type { AriaAttributes, ElementType } from "react";

import { TableBadge } from "./TableBadge";
import { cn } from "./ui/utils";

export type TableStatusTone = "negative" | "primary" | "warning" | "positive" | "neutral";

const tableStatusToneClassName: Record<TableStatusTone, string> = {
  negative: "border-red-500/35 bg-red-500/10 text-red-800 dark:text-red-300",
  primary: "border-[rgba(85,108,214,0.4)] bg-[rgba(85,108,214,0.1)] text-[#556cd6]",
  warning: "border-amber-500/40 bg-amber-500/12 text-amber-900 dark:text-amber-200",
  positive: "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  neutral: "border-border bg-muted/60 text-muted-foreground",
};

export function tableStatusToneFromSentiment(sentiment: string): TableStatusTone {
  const normalized = sentiment.trim().toLowerCase();
  if (normalized.includes("positive")) return "positive";
  if (normalized.includes("negative")) return "negative";
  if (normalized.includes("mixed")) return "warning";
  return "neutral";
}

export function tableStatusToneFromOutcome(outcome: string): TableStatusTone {
  const normalized = outcome.trim().toLowerCase();
  if (normalized.includes("resolved") || normalized.includes("satisfied")) return "positive";
  if (normalized.includes("pending") || normalized.includes("follow-up")) return "warning";
  if (normalized.includes("closed") || normalized.includes("no action")) return "neutral";
  return "neutral";
}

interface TableStatusBadgeProps {
  label: string;
  tone: TableStatusTone;
  className?: string;
  labelClassName?: string;
}

export function TableStatusBadge({
  label,
  tone,
  className,
  labelClassName,
}: TableStatusBadgeProps) {
  return (
    <TableBadge
      variant="outline"
      className={cn(
        "min-w-0 max-w-full justify-start font-normal",
        tableStatusToneClassName[tone],
        className,
      )}
    >
      <span className={cn("min-w-0 truncate", labelClassName)}>{label}</span>
    </TableBadge>
  );
}

interface TableStatusIconBadgeProps extends TableStatusBadgeProps {
  Icon: ElementType<{ className?: string; "aria-hidden"?: AriaAttributes["aria-hidden"] }>;
  iconClassName?: string;
}

export function TableStatusIconBadge({
  label,
  tone,
  Icon,
  className,
  iconClassName,
  labelClassName,
}: TableStatusIconBadgeProps) {
  return (
    <TableBadge
      variant="outline"
      className={cn(
        "min-w-0 max-w-full justify-start font-normal",
        tableStatusToneClassName[tone],
        className,
      )}
    >
      <Icon className={cn("size-3.5 shrink-0", iconClassName)} aria-hidden />
      <span className={cn("min-w-0 truncate", labelClassName)}>{label}</span>
    </TableBadge>
  );
}
