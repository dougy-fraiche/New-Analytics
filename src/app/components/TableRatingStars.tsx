import { Star } from "lucide-react";

import { cn } from "./ui/utils";

function parseFivePointRating(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(5, Math.round(value)));
  }

  if (typeof value !== "string") return 0;

  const normalized = value.trim();
  if (!normalized || normalized === "-") return 0;

  const outOfFiveMatch = normalized.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*5$/);
  const parsed = outOfFiveMatch ? Number(outOfFiveMatch[1]) : Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(5, Math.round(parsed)));
}

export function TableRatingStars({
  rating,
  className,
}: {
  rating: string | number | null | undefined;
  className?: string;
}) {
  const filledCount = parseFivePointRating(rating);

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="img"
      aria-label={`${filledCount} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < filledCount;

        return (
          <Star
            key={index}
            className={cn(
              "size-4 shrink-0",
              filled
                ? "fill-primary text-primary"
                : "fill-transparent text-muted-foreground/50",
            )}
            strokeWidth={1.9}
            aria-hidden
          />
        );
      })}
    </span>
  );
}
