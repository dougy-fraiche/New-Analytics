import type { ReactNode } from "react";

import { SelectValue } from "./ui/select";

const filterLabelClassName = "shrink-0 font-normal text-muted-foreground";
export const responsiveFilterRowClassName = "mt-4 flex w-full min-w-0 flex-wrap items-center gap-3";
export const responsiveFilterSearchWrapClassName = "relative w-full min-w-0 flex-1 sm:max-w-sm";
export const responsiveFilterSelectTriggerClassName = "h-8 w-full sm:w-auto sm:shrink-0";
export const responsiveFilterActionButtonClassName = "w-full sm:w-auto sm:shrink-0";

export function FilterFieldLabel({ children }: { children: ReactNode }) {
  return <span className={filterLabelClassName}>{children}</span>;
}

/**
 * Label + Radix Select.Value side by side.
 * Prefer `className={responsiveFilterSelectTriggerClassName}` on SelectTrigger for responsive filter rows.
 */
export function LabeledSelectValue({ label }: { label: string }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <FilterFieldLabel>{label}</FilterFieldLabel>
      <SelectValue className="min-w-0 truncate" />
    </span>
  );
}

/** Label + arbitrary value (e.g. date range including custom formatting). */
export function LabeledFilterInline({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <FilterFieldLabel>{label}</FilterFieldLabel>
      <span className="min-w-0 truncate text-foreground">{children}</span>
    </span>
  );
}
