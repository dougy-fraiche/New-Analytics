import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "./ui/utils";

function getAgentInitials(name: string): string {
  const parts = name
    .trim()
    .split(/[\s_-]+/g)
    .filter(Boolean);

  if (parts.length === 0) return "AG";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase() || "AG";
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export function TableAgentCell({
  name,
  avatarUrl,
  className,
  labelClassName,
  avatarClassName,
}: {
  name: string;
  avatarUrl?: string;
  className?: string;
  labelClassName?: string;
  avatarClassName?: string;
}) {
  const label = name.trim() || "Unknown Agent";
  const initials = getAgentInitials(label);

  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-2", className)}>
      <Avatar className={cn("size-6 shrink-0", avatarClassName)}>
        <AvatarImage src={avatarUrl} alt={label} />
        <AvatarFallback className="text-[10px] font-medium text-muted-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className={cn("min-w-0 truncate", labelClassName)}>{label}</span>
    </span>
  );
}
