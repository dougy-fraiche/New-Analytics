import { useEffect, useState } from "react";
import { Bookmark, Check, ChevronsUpDown, Folder, FolderPlus } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

export interface EditDashboardDialogProjectOption {
  id: string;
  name: string;
}

interface EditDashboardDialogValues {
  name: string;
  description: string;
  locationProjectId: string | null;
}

interface EditDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  initialDescription?: string;
  initialLocationProjectId: string | null;
  projects: EditDashboardDialogProjectOption[];
  onCreateFolder: (folderName: string) => EditDashboardDialogProjectOption | null;
  onSubmit: (values: EditDashboardDialogValues) => void;
}

const ROOT_LOCATION_ID = "__root__";

export function EditDashboardDialog({
  open,
  onOpenChange,
  initialName,
  initialDescription,
  initialLocationProjectId,
  projects,
  onCreateFolder,
  onSubmit,
}: EditDashboardDialogProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || "");
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialLocationProjectId ?? ROOT_LOCATION_ID,
  );
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [justCreatedFolderId, setJustCreatedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setDescription(initialDescription || "");
    setSelectedProjectId(initialLocationProjectId ?? ROOT_LOCATION_ID);
    setLocationPopoverOpen(false);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setJustCreatedFolderId(null);
  }, [open, initialName, initialDescription, initialLocationProjectId]);

  const handleCreateFolderAndSelect = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const created = onCreateFolder(trimmed);
    if (!created) return;
    setSelectedProjectId(created.id);
    setIsCreatingFolder(false);
    setNewFolderName("");
    setJustCreatedFolderId(created.id);
    setTimeout(() => setJustCreatedFolderId(null), 1500);
  };

  const handleConfirm = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    onSubmit({
      name: trimmedName,
      description: description.trim(),
      locationProjectId: selectedProjectId === ROOT_LOCATION_ID ? null : selectedProjectId,
    });
  };

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
          <DialogTitle>Edit Dashboard</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dashboard-edit-name">Name</Label>
            <Input
              id="dashboard-edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dashboard name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  handleConfirm();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dashboard-edit-description">Description</Label>
            <Textarea
              id="dashboard-edit-description"
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
                        {projects.find((p) => p.id === selectedProjectId)?.name ?? "Select a location"}
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={!name.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

