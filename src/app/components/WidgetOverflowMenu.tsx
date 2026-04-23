import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import { toast } from "sonner";
import { showDeletedObjectToast } from "../lib/object-deletion-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface WidgetOverflowMenuProps {
  widgetTitle: string;
  chartType?: string;
  /** Called when user confirms rename */
  onRename?: (newTitle: string) => void;
  /** Called when user confirms delete */
  onDelete?: () => void;
}

export function WidgetOverflowMenu({
  widgetTitle,
  chartType,
  onRename,
  onDelete,
}: WidgetOverflowMenuProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(widgetTitle);

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
    showDeletedObjectToast({
      objectType: "Widget",
      objectName: widgetTitle,
      description: `"${widgetTitle}" has been removed.`,
    });
    setDeleteOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Widget options"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
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
