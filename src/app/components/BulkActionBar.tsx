import { X } from "lucide-react";
import { Button } from "./ui/button";
import type { ReactNode } from "react";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  onClearSelection: () => void;
  children: ReactNode;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  onClearSelection,
  children,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 mb-4">
      <span className="text-sm text-primary whitespace-nowrap" style={{ fontWeight: 500 }}>
        {selectedCount} of {totalCount} selected
      </span>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-2">{children}</div>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto h-7 px-2 text-muted-foreground"
        onClick={onClearSelection}
      >
        <X className="h-3.5 w-3.5 mr-1" />
        Clear
      </Button>
    </div>
  );
}
