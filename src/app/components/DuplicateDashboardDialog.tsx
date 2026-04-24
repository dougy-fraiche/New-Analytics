import { useState, useEffect } from "react";
import { Bookmark, Check, ChevronsUpDown, Folder, FolderPlus } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { useProjects } from "../contexts/ProjectContext";
import { toast } from "sonner";
import type { SavedDashboardSnapshot } from "../types/saved-dashboard-snapshot";
import { cloneSavedDashboardSnapshot } from "../lib/saved-dashboard-snapshot";

interface DuplicateDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Original dashboard name to duplicate */
  dashboardName: string;
  /** Optional description to seed the duplicate */
  dashboardDescription?: string;
  /** Optional source location (folder id or null for Saved root) */
  initialLocationProjectId?: string | null;
  /** Optional sourceOotbId to carry over to the duplicate */
  sourceOotbId?: string;
  /** Optional KPI labels to carry over to the duplicate */
  kpis?: string[];
  /** Optional frozen snapshot to carry over to the duplicate */
  snapshot?: SavedDashboardSnapshot;
}

const ROOT_LOCATION_ID = "__root__";

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
  dashboardDescription,
  initialLocationProjectId = null,
  sourceOotbId,
  kpis,
  snapshot,
}: DuplicateDashboardDialogProps) {
  const {
    projects,
    standaloneDashboards,
    addProject,
    addDashboardToProject,
    addStandaloneDashboard,
  } = useProjects();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(ROOT_LOCATION_ID);
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [justCreatedFolderId, setJustCreatedFolderId] = useState<string | null>(null);

  // Gather all existing dashboard names across folders + standalone
  const allDashboardNames = [
    ...projects.flatMap((p) => p.dashboards.map((d) => d.name)),
    ...standaloneDashboards.map((d) => d.name),
  ];

  // Reset state when the dialog opens with a new dashboard
  useEffect(() => {
    if (open) {
      setName(generateDuplicateName(dashboardName, allDashboardNames));
      setDescription(dashboardDescription || "");
      setSelectedProjectId(initialLocationProjectId ?? ROOT_LOCATION_ID);
      setLocationPopoverOpen(false);
      setIsCreatingFolder(false);
      setNewFolderName("");
      setJustCreatedFolderId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dashboardName, dashboardDescription, initialLocationProjectId]);

  const handleCreateFolderAndSelect = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const created = addProject(trimmed);
    setSelectedProjectId(created.id);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setJustCreatedFolderId(created.id);
    setTimeout(() => setJustCreatedFolderId(null), 1500);
    toast.success(`Folder "${created.name}" created`);
  };

  const handleDuplicate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const trimmedDescription = description.trim();
    const destinationProjectId =
      selectedProjectId === ROOT_LOCATION_ID ? null : selectedProjectId;

    const destinationName =
      destinationProjectId === null
        ? "Saved"
        : projects.find((p) => p.id === destinationProjectId)?.name || "folder";

    if (destinationProjectId === null) {
      addStandaloneDashboard(
        trimmed,
        sourceOotbId,
        trimmedDescription || undefined,
        {
          kpis: [...(kpis ?? [])],
          snapshot: cloneSavedDashboardSnapshot(snapshot),
        },
      );
    } else {
      addDashboardToProject(
        destinationProjectId,
        trimmed,
        sourceOotbId,
        trimmedDescription || undefined,
        {
          kpis: [...(kpis ?? [])],
          snapshot: cloneSavedDashboardSnapshot(snapshot),
        },
      );
    }

    toast.success("Dashboard duplicated", {
      description: `"${trimmed}" has been created in ${destinationName}.`,
    });

    onOpenChange(false);
  };

  const isValid = name.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setLocationPopoverOpen(false);
          setIsCreatingFolder(false);
          setNewFolderName("");
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Duplicate Dashboard</DialogTitle>
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
            <Label htmlFor="duplicate-description">Description</Label>
            <Textarea
              id="duplicate-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this dashboard..."
              className="resize-none"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Popover
              open={locationPopoverOpen}
              onOpenChange={(nextOpen) => {
                setLocationPopoverOpen(nextOpen);
                if (!nextOpen) {
                  setIsCreatingFolder(false);
                  setNewFolderName("");
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={locationPopoverOpen}
                  className="w-full justify-between font-normal"
                >
                  <span className="flex items-center gap-2 truncate">
                    {selectedProjectId === ROOT_LOCATION_ID ? (
                      <>
                        <Bookmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {projects.find((p) => p.id === selectedProjectId)?.name ??
                          "Select a location"}
                      </>
                    )}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="max-h-[200px] overflow-y-auto p-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground outline-none cursor-pointer"
                    onClick={() => {
                      setSelectedProjectId(ROOT_LOCATION_ID);
                      setLocationPopoverOpen(false);
                    }}
                  >
                    <Check
                      className={`h-3.5 w-3.5 shrink-0 ${selectedProjectId === ROOT_LOCATION_ID ? "opacity-100" : "opacity-0"}`}
                    />
                    <Bookmark className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span>Saved</span>
                  </button>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      setLocationPopoverOpen(false);
                    }}
                  >
                    <Check
                      className={`h-3.5 w-3.5 shrink-0 ${selectedProjectId === project.id ? "opacity-100" : "opacity-0"}`}
                    />
                    <Folder
                      className={`h-3.5 w-3.5 shrink-0 ${justCreatedFolderId === project.id ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <span className="truncate">{project.name}</span>
                  </button>
                ))}
                </div>
                <Separator />
                <div className="p-1">
                  {isCreatingFolder ? (
                    <div className="flex items-center gap-1.5 px-1 py-1">
                      <FolderPlus className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                      <Input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Folder name"
                        className="h-7 text-sm flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === "Enter" && newFolderName.trim()) {
                            handleCreateFolderAndSelect();
                          }
                          if (e.key === "Escape") {
                            setIsCreatingFolder(false);
                            setNewFolderName("");
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        disabled={!newFolderName.trim()}
                        onClick={handleCreateFolderAndSelect}
                      >
                        Create
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground outline-none cursor-pointer"
                      onClick={() => setIsCreatingFolder(true)}
                    >
                      <FolderPlus className="h-3.5 w-3.5 shrink-0" />
                      <span>New Folder</span>
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
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
