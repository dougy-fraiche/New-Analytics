import { TableBadge } from "./TableBadge";
import { cn } from "./ui/utils";

function splitFeatures(features: string): string[] {
  return features
    .split(",")
    .map((feature) => feature.trim())
    .filter(Boolean);
}

export function TableFeatureBadges({
  features,
  className,
}: {
  features: string;
  className?: string;
}) {
  const items = splitFeatures(features);

  if (items.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <span className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((feature) => (
        <TableBadge
          key={feature}
          variant="outline"
          className="rounded-md border-border bg-transparent font-normal text-foreground"
        >
          {feature}
        </TableBadge>
      ))}
    </span>
  );
}
