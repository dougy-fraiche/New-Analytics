import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useProjects } from "../contexts/ProjectContext";
import { toast } from "sonner";

interface DuplicateDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Original dashboard name to duplicate */
  dashboardName: string;
  /** Optional sourceOotbId to carry over to the duplicate */
  sourceOotbId?: string;
}

/**
 * Generates a unique duplicate name by appending (2), (3), etc.
 * Searches all folders + standalone dashboards for existing names.
 */
function generateDuplicateName(
  baseName: string,
  allNames: string[]
): string {
  // Strip any existing trailing " (N)" to get the true base
  const baseMatch = baseName.match(/^(.+?)\s*\((\d+)\)$/);
  const trueName = baseMatch ? baseMatch[1].trimEnd() : baseName;

  // Build a set of lowercase names for fast comparison
  const namesLower = new Set(allNames.map((n) => n.toLowerCase()));

  // Start from (2) and increment
  let counter = 2;
  let candidate = `${trueName} (${counter})`;
  while (namesLower.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${trueName} (${counter})`;
  }
  return candidate;
}

export function DuplicateDashboardDialog({
  open,
  onOpenChange,
  dashboardName,
  sourceOotbId,
}: DuplicateDashboardDialogProps) {
  const {
    projects,
    standaloneDashboards,
    addDashboardToProject,
    addStandaloneDashboard,
  } = useProjects();

  const [name, setName] = useState("");
  const [targetFolderId, setTargetFolderId] = useState("");

  // Gather all existing dashboard names across folders + standalone
  const allDashboardNames = [
    ...projects.flatMap((p) => p.dashboards.map((d) => d.name)),
    ...standaloneDashboards.map((d) => d.name),
  ];

  // Reset state when the dialog opens with a new dashboard
  useEffect(() => {
    if (open) {
      setName(generateDuplicateName(dashboardName, allDashboardNames));
      setTargetFolderId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dashboardName]);

  const handleDuplicate = () => {
    const trimmed = name.trim();
    if (!trimmed || !targetFolderId) return;

    const destinationName =
      targetFolderId === "__standalone__"
        ? "standalone"
        : projects.find((p) => p.id === targetFolderId)?.name || "folder";

    if (targetFolderId === "__standalone__") {
      addStandaloneDashboard(trimmed, sourceOotbId);
    } else {
      addDashboardToProject(targetFolderId, trimmed, sourceOotbId);
    }

    toast.success("Dashboard duplicated", {
      description: `"${trimmed}" has been created in ${destinationName}.`,
    });

    onOpenChange(false);
  };

  const isValid = name.trim().length > 0 && targetFolderId.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicate Dashboard</DialogTitle>
          <DialogDescription>
            Create a copy of this dashboard. Choose a name and destination folder.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="duplicate-name">Name</Label>
            <Input
              id="duplicate-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dashboard name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid) {
                  handleDuplicate();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duplicate-folder">Destination</Label>
            <Select value={targetFolderId} onValueChange={setTargetFolderId}>
              <SelectTrigger id="duplicate-folder">
                <SelectValue placeholder="Select a destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__standalone__">
                  Standalone (no folder)
                </SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleDuplicate} disabled={!isValid}>
            Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
