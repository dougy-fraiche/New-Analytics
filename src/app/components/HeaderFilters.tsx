import { SelectValue } from "./ui/select";

export function LabeledSelectValue({ label }: { label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="shrink-0 text-muted-foreground">{label}:</span>
      <SelectValue />
    </span>
  );
}

