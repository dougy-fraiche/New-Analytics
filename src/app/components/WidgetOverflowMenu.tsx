import { useState } from "react";
import { MoreVertical, Pencil, Settings2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  DATE_RANGE_CUSTOM_OPTION,
  DATE_RANGE_LABELS,
  DATE_RANGE_PRIMARY_OPTIONS,
  DATE_RANGE_SECONDARY_OPTIONS,
} from "../data/date-ranges";

interface WidgetOverflowMenuProps {
  widgetTitle: string;
  chartType?: string;
  /** Called when user confirms rename */
  onRename?: (newTitle: string) => void;
  /** Called when user confirms delete */
  onDelete?: () => void;
  /** Called when user updates config */
  onConfigure?: (config: WidgetConfig) => void;
}

export interface WidgetConfig {
  timeRange: string;
  refreshInterval: string;
}

export function WidgetOverflowMenu({
  widgetTitle,
  chartType,
  onRename,
  onDelete,
  onConfigure,
}: WidgetOverflowMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(widgetTitle);
  const [config, setConfig] = useState<WidgetConfig>({
    timeRange: "7d",
    refreshInterval: "off",
  });

  const handleRename = () => {
    if (!newTitle.trim()) return;
    if (onRename) {
      onRename(newTitle.trim());
    }
    toast.success("Widget renamed", {
      description: `Renamed to "${newTitle.trim()}"`,
    });
    setRenameOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    toast.success("Widget removed", {
      description: `"${widgetTitle}" has been removed.`,
    });
    setDeleteOpen(false);
  };

  const handleConfigure = () => {
    if (onConfigure) {
      onConfigure(config);
    }
    toast.success("Widget updated", {
      description: "Configuration has been applied.",
    });
    setConfigureOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">Widget options</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onSelect={() => {
              setNewTitle(widgetTitle);
              setRenameOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setConfigureOpen(true)}
          >
            <Settings2 className="h-4 w-4" />
            Configure
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Rename Widget</DialogTitle>
            <DialogDescription>
              Enter a new name for this widget.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="widget-name" className="mb-2">
              Name
            </Label>
            <Input
              id="widget-name"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
              }}
              className="bg-background"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newTitle.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Dialog */}
      <Dialog open={configureOpen} onOpenChange={setConfigureOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Configure Widget</DialogTitle>
            <DialogDescription>
              Adjust settings for "{widgetTitle}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Time Range</Label>
              <Select
                value={config.timeRange}
                onValueChange={(v) =>
                  setConfig((prev) => ({ ...prev, timeRange: v }))
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last 1 hour</SelectItem>
                  <SelectItem value="6h">Last 6 hours</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectSeparator />
                  {DATE_RANGE_PRIMARY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {DATE_RANGE_LABELS[opt]}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  {DATE_RANGE_SECONDARY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {DATE_RANGE_LABELS[opt]}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectItem value={DATE_RANGE_CUSTOM_OPTION}>
                    {DATE_RANGE_LABELS[DATE_RANGE_CUSTOM_OPTION]}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Auto-refresh</Label>
              <Select
                value={config.refreshInterval}
                onValueChange={(v) =>
                  setConfig((prev) => ({ ...prev, refreshInterval: v }))
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="10s">Every 10 seconds</SelectItem>
                  <SelectItem value="30s">Every 30 seconds</SelectItem>
                  <SelectItem value="1m">Every minute</SelectItem>
                  <SelectItem value="5m">Every 5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigureOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfigure}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Widget</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{widgetTitle}" from this
              dashboard? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}