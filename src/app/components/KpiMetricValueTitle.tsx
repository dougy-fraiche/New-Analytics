import { CardTitle } from "./ui/card";
import { cn } from "./ui/utils";

/**
 * Split values like "3.2 min", "4.3h", "94.2%" for KPI styling: large numerals, smaller unit.
 */
function splitKpiValue(value: string): { num: string; unit?: string } {
  const t = value.trim();
  const m = t.match(/^([\d,]+(?:\.\d+)?)\s*([a-zA-Z%]+)$/);
  if (!m) return { num: t };
  return { num: m[1], unit: m[2] };
}

export function KpiMetricValueTitle({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const { num, unit } = splitKpiValue(value);

  return (
    <CardTitle
      className={cn(
        "flex min-w-0 flex-1 items-baseline gap-x-1 text-3xl tabular-nums leading-none",
        className,
      )}
    >
      <span className="min-w-0 truncate">{num}</span>
      {unit ? (
        <span className="shrink-0 text-[0.5em] font-normal tabular-nums text-foreground">
          {unit}
        </span>
      ) : null}
    </CardTitle>
  );
}
