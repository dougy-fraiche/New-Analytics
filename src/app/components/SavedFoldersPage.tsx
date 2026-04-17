import { useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { FileText, Plus, MoreHorizontal, MoreVertical, Trash2, Search, FolderInput, Folder, LayoutDashboard, ChevronRight, Pencil, GripVertical, FolderOutput, Copy, RotateCcw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "./ui/empty";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { LabeledSelectValue } from "./HeaderFilters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  tableOverflowMenuColumnClassName,
} from "./ui/table";
import { toast } from "sonner";
import { showDeletedObjectToast, showObjectDeletionToast } from "../lib/object-deletion-toast";
import { useProjects } from "../contexts/ProjectContext";
import { BulkActionBar } from "./BulkActionBar";
import { DeleteDashboardDialog } from "./DeleteDashboardDialog";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import { DuplicateDashboardDialog } from "./DuplicateDashboardDialog";
import { EditDashboardDialog } from "./EditDashboardDialog";
import { useDrag, useDrop } from "react-dnd";

import {
  PageHeader,
  pageMainColumnClassName,
  pageRootListScrollGutterClassName,
} from "./PageChrome";
import { cn } from "./ui/utils";
import { PageTransition } from "./PageTransition";
import { HeaderAIInsightsRow } from "./HeaderAIInsightsRow";
import { ROUTES } from "../routes";
import {
  getDashboardSlug,
  getProjectSlug,
  validateSavedFolderDashboardName,
  validateSavedFolderName,
  validateSavedStandaloneDashboardName,
} from "../lib/saved-slugs";

const DRAG_TYPE_DASHBOARD = "CUSTOM_DASHBOARD";

interface DragItem {
  key: string;
  dashboardId: string;
  dashboardName: string;
  fromProjectId: string | null;
}

/** A single draggable dashboard row in the All Custom Dashboards table */
function DraggableDashboardRow({
  item,
  children,
  isSelected,
}: {
  item: { key: string; dashboard: { id: string; name: string }; projectId: string | null };
  children: React.ReactNode;
  isSelected: boolean;
}) {
  const [{ isDragging }, dragRef, previewRef] = useDrag(() => ({
    type: DRAG_TYPE_DASHBOARD,
    item: { key: item.key, dashboardId: item.dashboard.id, dashboardName: item.dashboard.name, fromProjectId: item.projectId } as DragItem,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [item.key, item.dashboard.id, item.dashboard.name, item.projectId]);

  return (
    <TableRow
      ref={previewRef as unknown as React.Ref<HTMLTableRowElement>}
      className="group h-[3rem]"
      data-state={isSelected ? "selected" : undefined}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <TableCell>
        <div ref={dragRef as unknown as React.Ref<HTMLDivElement>} className="cursor-grab active:cursor-grabbing p-1 -m-1">
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
}

/** A folder card that acts as a drop target */
function DroppableFolderCard({
  projectId,
  onDrop,
  children,
}: {
  projectId: string;
  onDrop: (item: DragItem) => void;
  children: React.ReactNode;
}) {
  const [{ isOver, canDrop }, dropRef] = useDrop(() => ({
    accept: DRAG_TYPE_DASHBOARD,
    drop: (item: DragItem) => { onDrop(item); },
    canDrop: (item: DragItem) => item.fromProjectId !== projectId,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [projectId, onDrop]);

  return (
    <div ref={dropRef as unknown as React.Ref<HTMLDivElement>} className={`transition-[box-shadow,outline] ${isOver && canDrop ? "ring-2 ring-primary ring-offset-2 rounded-xl" : ""}`}>
      {children}
    </div>
  );
}

export function SavedFoldersPage({ resolvedFolderId }: { resolvedFolderId?: string }) {
  const navigate = useNavigate();
  const { folderSlug } = useParams<{ folderSlug?: string }>();
  const {
    projects, addProject, renameProject, deleteProject,
    deleteDashboardFromProject, restoreProject, restoreDashboardToProject,
    standaloneDashboards, deleteStandaloneDashboard, restoreStandaloneDashboard,
    updateDashboardInProject, updateStandaloneDashboard,
    moveDashboardToProject, moveStandaloneToFolder, moveDashboardToStandalone,
  } = useProjects();

  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ projectId: string; name: string } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set());
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [deleteDashboardConfirm, setDeleteDashboardConfirm] = useState<{ dashboardId: string; dashboardName: string } | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<{ projectId: string; projectName: string; dashboardCount: number } | null>(null);
  const [showBulkDeleteFolderConfirm, setShowBulkDeleteFolderConfirm] = useState(false);
  const [editDashboardDialog, setEditDashboardDialog] = useState<{
    dashboardId: string;
    dashboardName: string;
    dashboardDescription: string;
    projectId: string | null;
  } | null>(null);
  const [moveDashboardDialog, setMoveDashboardDialog] = useState<{ dashboardId: string; dashboardName: string; fromProjectId: string | null } | null>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string>("");
  const [duplicateDashboardDialog, setDuplicateDashboardDialog] = useState<{
    dashboardName: string;
    dashboardDescription: string;
    projectId: string | null;
    sourceOotbId?: string;
  } | null>(null);

  const selectedFolder = resolvedFolderId
    ? projects.find((project) => project.id === resolvedFolderId) ?? null
    : folderSlug
    ? projects.find((project) => getProjectSlug(project) === folderSlug) ?? null
    : null;

  const folderPath = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    return project ? ROUTES.SAVED_FOLDER(getProjectSlug(project)) : ROUTES.SAVED;
  };

  const folderDashboardPath = (projectId: string, dashboardId: string) => {
    const project = projects.find((item) => item.id === projectId);
    const dashboard = project?.dashboards.find((item) => item.id === dashboardId);
    if (!project || !dashboard) return ROUTES.SAVED;
    return ROUTES.SAVED_FOLDER_DASHBOARD(getProjectSlug(project), getDashboardSlug(dashboard));
  };

  const standaloneDashboardPath = (dashboardId: string) => {
    const dashboard = standaloneDashboards.find((item) => item.id === dashboardId);
    return dashboard
      ? ROUTES.SAVED_STANDALONE_DASHBOARD(getDashboardSlug(dashboard))
      : ROUTES.SAVED;
  };

  const handleCreateFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const validationError = validateSavedFolderName(trimmed, projects, standaloneDashboards);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    addProject(trimmed);
    setNewFolderName("");
    setNewFolderDialog(false);
  };

  const handleDeleteFolder = (projectId: string) => {
    const snapshot = projects.find(p => p.id === projectId);
    if (!snapshot) return;
    if (snapshot.dashboards.length === 0) {
      deleteProject(projectId);
      showDeletedObjectToast({
        objectType: "Folder",
        objectName: snapshot.name,
        onUndo: () => {
          restoreProject(snapshot);
        },
      });
    } else {
      setDeleteFolderConfirm({ projectId, projectName: snapshot.name, dashboardCount: snapshot.dashboards.length });
    }
  };

  const handleRenameFolder = () => {
    if (!renameDialog) return;
    const trimmed = renameDialog.name.trim();
    if (!trimmed) return;
    const validationError = validateSavedFolderName(
      trimmed,
      projects,
      standaloneDashboards,
      renameDialog.projectId,
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }
    renameProject(renameDialog.projectId, trimmed);
    if (selectedFolder?.id === renameDialog.projectId) {
      navigate(ROUTES.SAVED_FOLDER(getProjectSlug({ name: trimmed })), { replace: true });
    }
    setRenameDialog(null);
  };

  const confirmDeleteFolder = () => {
    if (!deleteFolderConfirm) return;
    const { projectId, projectName } = deleteFolderConfirm;
    const snapshot = projects.find(p => p.id === projectId);
    if (snapshot) {
      deleteProject(projectId);
      showDeletedObjectToast({
        objectType: "Folder",
        objectName: projectName,
        onUndo: () => {
          restoreProject(snapshot);
        },
      });
    }
    setDeleteFolderConfirm(null);
  };

  // --- Folder selection helpers ---
  const toggleFolderSelected = (id: string) => {
    setSelectedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllFolders = () => {
    if (selectedFolderIds.size === projects.length) {
      setSelectedFolderIds(new Set());
    } else {
      setSelectedFolderIds(new Set(projects.map((p) => p.id)));
    }
  };
  const clearFolderSelection = () => setSelectedFolderIds(new Set());

  const handleBulkDeleteFolders = () => {
    const ids = Array.from(selectedFolderIds);
    const selected = projects.filter((p) => ids.includes(p.id));
    const hasNonEmpty = selected.some((p) => p.dashboards.length > 0);
    if (hasNonEmpty) {
      setShowBulkDeleteFolderConfirm(true);
    } else {
      // All selected folders are empty — delete immediately
      const snapshots = selected;
      ids.forEach((id) => deleteProject(id));
      clearFolderSelection();
      showObjectDeletionToast({
        title: `Deleted ${ids.length} folder${ids.length > 1 ? "s" : ""}`,
        onUndo: () => {
          snapshots.forEach((s) => restoreProject(s));
        },
        restoredTitle: "Folders restored",
      });
    }
  };

  const confirmBulkDeleteFolders = () => {
    const ids = Array.from(selectedFolderIds);
    const snapshots = projects.filter((p) => ids.includes(p.id));
    ids.forEach((id) => deleteProject(id));
    clearFolderSelection();
    showObjectDeletionToast({
      title: `Deleted ${ids.length} folder${ids.length > 1 ? "s" : ""}`,
      onUndo: () => {
        snapshots.forEach((s) => restoreProject(s));
      },
      restoredTitle: "Folders restored",
    });
    setShowBulkDeleteFolderConfirm(false);
  };

  // --- Dashboard selection helpers (within folder) ---
  const toggleDashboardSelected = (id: string) => {
    setSelectedDashboardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAllDashboards = () => {
    if (!selectedFolder) return;
    if (selectedDashboardIds.size === selectedFolder.dashboards.length) {
      setSelectedDashboardIds(new Set());
    } else {
      setSelectedDashboardIds(new Set(selectedFolder.dashboards.map((d) => d.id)));
    }
  };
  const clearDashboardSelection = () => setSelectedDashboardIds(new Set());

  const handleBulkDeleteDashboards = () => {
    if (!selectedFolder) return;
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDeleteDashboards = () => {
    if (!selectedFolder) return;
    const ids = Array.from(selectedDashboardIds);
    const snapshots = selectedFolder.dashboards.filter((d) => ids.includes(d.id));
    ids.forEach((id) => deleteDashboardFromProject(selectedFolder.id, id));
    clearDashboardSelection();
    showObjectDeletionToast({
      title: `Deleted ${ids.length} dashboard${ids.length > 1 ? "s" : ""}`,
      onUndo: () => {
        snapshots.forEach((d) => restoreDashboardToProject(selectedFolder.id, d));
      },
      restoredTitle: "Dashboards restored",
    });
    setShowBulkDeleteConfirm(false);
  };

  const confirmSingleDeleteDashboard = () => {
    if (!deleteDashboardConfirm || !selectedFolder) return;
    const { dashboardId, dashboardName } = deleteDashboardConfirm;
    const snapshot = selectedFolder.dashboards.find((d) => d.id === dashboardId);
    deleteDashboardFromProject(selectedFolder.id, dashboardId);
    showDeletedObjectToast({
      objectType: "Dashboard",
      objectName: dashboardName,
      onUndo: snapshot
        ? () => {
            restoreDashboardToProject(selectedFolder.id, snapshot);
          }
        : undefined,
    });
    setDeleteDashboardConfirm(null);
  };

  // --- Drag and drop handler for folder card targets ---
  const handleDropOnFolder = useCallback((targetFolderId: string, dragItem: DragItem) => {
    if (dragItem.fromProjectId === targetFolderId) return;
    const validationError = validateSavedFolderDashboardName(
      targetFolderId,
      dragItem.dashboardName,
      projects,
    );
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (dragItem.fromProjectId) {
      moveDashboardToProject(dragItem.fromProjectId, dragItem.dashboardId, targetFolderId);
    } else {
      moveStandaloneToFolder(dragItem.dashboardId, targetFolderId);
    }
    const targetFolder = projects.find((p) => p.id === targetFolderId);
    toast.success(`Moved "${dragItem.dashboardName}" to ${targetFolder?.name || "folder"}`);
  }, [moveDashboardToProject, moveStandaloneToFolder, projects]);

  // --- Drop target for "move to standalone" (page heading area) ---
  const [{ isOverStandalone }, standaloneDropRef] = useDrop(() => ({
    accept: DRAG_TYPE_DASHBOARD,
    drop: (item: DragItem) => {
      if (!item.fromProjectId) return; // already standalone
      const validationError = validateSavedStandaloneDashboardName(
        item.dashboardName,
        projects,
        standaloneDashboards,
      );
      if (validationError) {
        toast.error(validationError);
        return;
      }
      moveDashboardToStandalone(item.fromProjectId, item.dashboardId);
      toast.success(`Moved "${item.dashboardName}" to standalone`);
    },
    canDrop: (item: DragItem) => !!item.fromProjectId,
    collect: (monitor) => ({
      isOverStandalone: monitor.isOver() && monitor.canDrop(),
    }),
  }), [moveDashboardToStandalone, projects, standaloneDashboards]);

  // --- Handle move via dialog ---
  const handleMoveConfirm = () => {
    if (!moveDashboardDialog || !moveTargetFolderId) return;
    if (moveTargetFolderId === "__standalone__") {
      // Move to standalone
      if (moveDashboardDialog.fromProjectId) {
        const validationError = validateSavedStandaloneDashboardName(
          moveDashboardDialog.dashboardName,
          projects,
          standaloneDashboards,
        );
        if (validationError) {
          toast.error(validationError);
          return;
        }
        moveDashboardToStandalone(moveDashboardDialog.fromProjectId, moveDashboardDialog.dashboardId);
        toast.success(`Moved "${moveDashboardDialog.dashboardName}" to standalone`);
      }
    } else {
      const validationError = validateSavedFolderDashboardName(
        moveTargetFolderId,
        moveDashboardDialog.dashboardName,
        projects,
      );
      if (validationError) {
        toast.error(validationError);
        return;
      }
      if (moveDashboardDialog.fromProjectId) {
        moveDashboardToProject(moveDashboardDialog.fromProjectId, moveDashboardDialog.dashboardId, moveTargetFolderId);
      } else {
        moveStandaloneToFolder(moveDashboardDialog.dashboardId, moveTargetFolderId);
      }
      const targetFolder = projects.find((p) => p.id === moveTargetFolderId);
      toast.success(`Moved "${moveDashboardDialog.dashboardName}" to ${targetFolder?.name || "folder"}`);
    }
    setMoveDashboardDialog(null);
    setMoveTargetFolderId("");
  };

  const handleConfirmEditDashboard = (values: {
    name: string;
    description: string;
    locationProjectId: string | null;
  }) => {
    if (!editDashboardDialog) return;
    const trimmedName = values.name.trim();
    if (!trimmedName) return;

    const sourceProjectId = editDashboardDialog.projectId;
    const nextDescription = values.description || undefined;
    const destinationProjectId = values.locationProjectId;

    const validationError =
      destinationProjectId === null
        ? validateSavedStandaloneDashboardName(
            trimmedName,
            projects,
            standaloneDashboards,
            sourceProjectId ? undefined : editDashboardDialog.dashboardId,
          )
        : validateSavedFolderDashboardName(
            destinationProjectId,
            trimmedName,
            projects,
            sourceProjectId === destinationProjectId ? editDashboardDialog.dashboardId : undefined,
          );

    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (sourceProjectId) {
      updateDashboardInProject(sourceProjectId, editDashboardDialog.dashboardId, {
        name: trimmedName,
        description: nextDescription,
      });
    } else {
      updateStandaloneDashboard(editDashboardDialog.dashboardId, {
        name: trimmedName,
        description: nextDescription,
      });
    }

    if (sourceProjectId && destinationProjectId === null) {
      moveDashboardToStandalone(sourceProjectId, editDashboardDialog.dashboardId);
    } else if (
      sourceProjectId &&
      destinationProjectId &&
      destinationProjectId !== sourceProjectId
    ) {
      moveDashboardToProject(
        sourceProjectId,
        editDashboardDialog.dashboardId,
        destinationProjectId,
      );
    } else if (!sourceProjectId && destinationProjectId) {
      moveStandaloneToFolder(editDashboardDialog.dashboardId, destinationProjectId);
    }

    toast.success("Dashboard updated", {
      description: `"${trimmedName}" has been updated.`,
    });
    setEditDashboardDialog(null);
  };

  if (folderSlug && !selectedFolder && !resolvedFolderId) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h1 className="text-4xl mb-2">404</h1>
          <p className="text-muted-foreground">Folder not found</p>
        </div>
      </div>
    );
  }

  // Show folder contents if drilling down
  if (selectedFolder) {
    const filteredDashboards = selectedFolder.dashboards.filter((d) => {
      if (!searchQuery) return true;
      return d.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const allDashChecked = filteredDashboards.length > 0 && selectedDashboardIds.size === filteredDashboards.length;
    const someDashChecked = selectedDashboardIds.size > 0 && selectedDashboardIds.size < filteredDashboards.length;

    return (
      <div className="flex flex-col flex-1 min-h-0">
        <PageHeader>
          <section className="flex items-center gap-2">
            <h1 className="text-3xl tracking-tight">{selectedFolder.name}</h1>
            <Badge variant="secondary" className="text-xs px-2 py-0.5">
              {selectedFolder.dashboards.length} {selectedFolder.dashboards.length === 1 ? "dashboard" : "dashboards"}
            </Badge>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="ml-auto h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">More options</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRenameDialog({ projectId: selectedFolder.id, name: selectedFolder.name })}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDeleteFolder(selectedFolder.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </section>
          {selectedFolder.dashboards.length > 0 && (
            <div className="mt-4 flex w-full flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dashboards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setSearchQuery("")}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              )}
            </div>
          )}
        </PageHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
        <PageTransition className={cn(pageMainColumnClassName, "space-y-6")}>
        <HeaderAIInsightsRow
          dashboardId={`saved-folder-${selectedFolder.id}`}
          dashboardData={{
            id: `saved-folder-${selectedFolder.id}`,
            title: selectedFolder.name,
            description: `${selectedFolder.dashboards.length} ${selectedFolder.dashboards.length === 1 ? "dashboard" : "dashboards"}`,
          }}
        />
        {/* Dashboards in Folder */}
        {selectedFolder.dashboards.length > 0 ? (
          <>
          {filteredDashboards.length > 0 ? (
          <div className="space-y-3">
              <BulkActionBar
                selectedCount={selectedDashboardIds.size}
                totalCount={filteredDashboards.length}
                onClearSelection={clearDashboardSelection}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={handleBulkDeleteDashboards}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </BulkActionBar>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={allDashChecked ? true : someDashChecked ? "indeterminate" : false}
                        onCheckedChange={toggleAllDashboards}
                        aria-label="Select all dashboards"
                      />
                    </TableHead>
                    <TableHead>Dashboard Name</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>KPIs</TableHead>
                    <TableHead className={tableOverflowMenuColumnClassName}>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDashboards.map((dashboard) => (
                      <TableRow
                        key={dashboard.id}
                        className="group h-[3rem]"
                        data-state={selectedDashboardIds.has(dashboard.id) ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedDashboardIds.has(dashboard.id)}
                            onCheckedChange={() => toggleDashboardSelected(dashboard.id)}
                            aria-label={`Select ${dashboard.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            to={folderDashboardPath(selectedFolder.id, dashboard.id)}
                            className="flex items-center gap-3 hover:underline"
                          >
                            <span className="font-normal">{dashboard.name}</span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date().toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {dashboard.createdBy}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {dashboard.kpis.map((kpi) => (
                              <Badge key={kpi} variant="secondary" className="text-xs">
                                {kpi}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className={tableOverflowMenuColumnClassName}>
                          <DropdownMenu>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">More options</span>
                                  </Button>
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="left">More options</TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditDashboardDialog({
                                    dashboardId: dashboard.id,
                                    dashboardName: dashboard.name,
                                    dashboardDescription: dashboard.description || "",
                                    projectId: selectedFolder.id,
                                  });
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setMoveDashboardDialog({ dashboardId: dashboard.id, dashboardName: dashboard.name, fromProjectId: selectedFolder.id });
                                }}
                              >
                                <FolderInput className="h-4 w-4 mr-2" />
                                Move to Folder
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDuplicateDashboardDialog({
                                    dashboardName: dashboard.name,
                                    dashboardDescription: dashboard.description || "",
                                    projectId: selectedFolder.id,
                                    sourceOotbId: dashboard.sourceOotbId,
                                  });
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setDeleteDashboardConfirm({ dashboardId: dashboard.id, dashboardName: dashboard.name });
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
          </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No dashboards match your search</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your search query
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          </>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No dashboards in this folder yet</EmptyTitle>
              <EmptyDescription>
                Create dashboards from conversations and save them here
              </EmptyDescription>
            </EmptyHeader>
            <Link to="/">
              <Button variant="outline" size="sm">
                Start a Conversation
              </Button>
            </Link>
          </Empty>
        )}

        {/* Delete Dashboard Confirmation Dialogs */}
        <DeleteDashboardDialog
          open={!!deleteDashboardConfirm}
          onOpenChange={(open) => { if (!open) setDeleteDashboardConfirm(null); }}
          onConfirm={confirmSingleDeleteDashboard}
          dashboardName={deleteDashboardConfirm?.dashboardName}
        />
        <DeleteDashboardDialog
          open={showBulkDeleteConfirm}
          onOpenChange={(open) => { if (!open) setShowBulkDeleteConfirm(false); }}
          onConfirm={confirmBulkDeleteDashboards}
          count={selectedDashboardIds.size}
        />

        {/* Edit Dashboard Dialog (folder detail view) */}
        <EditDashboardDialog
          open={!!editDashboardDialog}
          onOpenChange={(open) => {
            if (!open) setEditDashboardDialog(null);
          }}
          initialName={editDashboardDialog?.dashboardName || ""}
          initialDescription={editDashboardDialog?.dashboardDescription || ""}
          initialLocationProjectId={editDashboardDialog?.projectId ?? null}
          projects={projects.map((project) => ({ id: project.id, name: project.name }))}
          onCreateFolder={(folderName) => {
            const trimmed = folderName.trim();
            if (!trimmed) return null;
            const validationError = validateSavedFolderName(trimmed, projects, standaloneDashboards);
            if (validationError) {
              toast.error(validationError);
              return null;
            }
            return addProject(trimmed);
          }}
          onSubmit={handleConfirmEditDashboard}
        />

        {/* Move Dashboard Dialog (folder detail view) */}
        <Dialog open={!!moveDashboardDialog} onOpenChange={() => { setMoveDashboardDialog(null); setMoveTargetFolderId(""); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Dashboard</DialogTitle>
              <DialogDescription>
                Select a destination for "{moveDashboardDialog?.dashboardName}".
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label>Destination</Label>
              <Select value={moveTargetFolderId} onValueChange={setMoveTargetFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__standalone__">Standalone (no folder)</SelectItem>
                  {projects.filter((p) => p.id !== moveDashboardDialog?.fromProjectId).map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setMoveDashboardDialog(null); setMoveTargetFolderId(""); }}>
                Cancel
              </Button>
              <Button onClick={handleMoveConfirm} disabled={!moveTargetFolderId}>Move</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Duplicate Dashboard Dialog (folder detail view) */}
        <DuplicateDashboardDialog
          open={!!duplicateDashboardDialog}
          onOpenChange={(open) => { if (!open) setDuplicateDashboardDialog(null); }}
          dashboardName={duplicateDashboardDialog?.dashboardName || ""}
          dashboardDescription={duplicateDashboardDialog?.dashboardDescription || ""}
          initialLocationProjectId={duplicateDashboardDialog?.projectId ?? null}
          sourceOotbId={duplicateDashboardDialog?.sourceOotbId}
        />

        {/* Rename Folder Dialog (folder detail view) */}
        <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
          <DialogContent className="sm:max-w-[25rem]">
            <DialogHeader>
              <DialogTitle>Rename Folder</DialogTitle>
            </DialogHeader>
            <div className="grid gap-2 py-4">
              <Label className="sr-only" htmlFor="rename-project">Folder Name</Label>
              <Input
                id="rename-project"
                value={renameDialog?.name || ""}
                onChange={(e) =>
                  setRenameDialog(
                    renameDialog ? { ...renameDialog, name: e.target.value } : null
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameFolder();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialog(null)}>
                Cancel
              </Button>
              <Button onClick={handleRenameFolder}>Rename</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Folder Confirmation Dialog (folder detail view) */}
        <DeleteFolderDialog
          open={!!deleteFolderConfirm}
          onOpenChange={(open) => { if (!open) setDeleteFolderConfirm(null); }}
          onConfirm={confirmDeleteFolder}
          folderName={deleteFolderConfirm?.projectName}
          dashboardCount={deleteFolderConfirm?.dashboardCount}
        />
        </PageTransition>
          </div>
        </div>
      </div>
    );
  }

  // Show all folders
  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    return p.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const allFoldersChecked = filteredProjects.length > 0 && selectedFolderIds.size === filteredProjects.length;
  const someFoldersChecked = selectedFolderIds.size > 0 && selectedFolderIds.size < filteredProjects.length;

  const allCustomDashboards = projects
    .flatMap((project) =>
      project.dashboards.map((dashboard) => ({
        key: `${project.id}-${dashboard.id}`,
        dashboard,
        projectId: project.id as string | null,
        folderName: project.name as string | null,
        linkPath: ROUTES.SAVED_FOLDER_DASHBOARD(
          getProjectSlug(project),
          getDashboardSlug(dashboard),
        ),
      })),
    )
    .concat(
      standaloneDashboards.map((dashboard) => ({
        key: `standalone-${dashboard.id}`,
        dashboard,
        projectId: null,
        folderName: null,
        linkPath: ROUTES.SAVED_STANDALONE_DASHBOARD(getDashboardSlug(dashboard)),
      })),
    );
  const filteredCustomDashboards = allCustomDashboards.filter((item) => {
    // Folder filter
    if (folderFilter === "standalone" && item.projectId !== null) return false;
    if (folderFilter !== "all" && folderFilter !== "standalone" && item.projectId !== folderFilter) return false;
    // Search filter
    if (!searchQuery) return true;
    return item.dashboard.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const allDashboardsChecked = filteredCustomDashboards.length > 0 && selectedDashboardIds.size === filteredCustomDashboards.length;
  const someDashboardsChecked = selectedDashboardIds.size > 0 && selectedDashboardIds.size < filteredCustomDashboards.length;

  const toggleAllCustomDashboards = () => {
    if (selectedDashboardIds.size === filteredCustomDashboards.length) {
      setSelectedDashboardIds(new Set());
    } else {
      setSelectedDashboardIds(new Set(filteredCustomDashboards.map((d) => d.key)));
    }
  };

  const handleBulkDeleteAllDashboards = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDeleteAllDashboards = () => {
    const ids = Array.from(selectedDashboardIds);
    const snapshots = allCustomDashboards.filter((d) => ids.includes(d.key));
    ids.forEach((id) => {
      const item = allCustomDashboards.find((d) => d.key === id);
      if (item) {
        if (item.projectId) {
          deleteDashboardFromProject(item.projectId, item.dashboard.id);
        } else {
          deleteStandaloneDashboard(item.dashboard.id);
        }
      }
    });
    clearDashboardSelection();
    showObjectDeletionToast({
      title: `Deleted ${ids.length} dashboard${ids.length > 1 ? "s" : ""}`,
      onUndo: () => {
        snapshots.forEach((d) => {
          if (d.projectId) {
            restoreDashboardToProject(d.projectId!, d.dashboard);
          } else {
            restoreStandaloneDashboard(d.dashboard);
          }
        });
      },
      restoredTitle: "Dashboards restored",
    });
    setShowBulkDeleteConfirm(false);
  };

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0">
        <PageHeader>
          <div
            ref={standaloneDropRef as unknown as React.Ref<HTMLDivElement>}
            className={`flex items-center justify-between rounded-lg p-2 -m-2 transition-[box-shadow,background-color] ${isOverStandalone ? "ring-2 ring-primary ring-offset-2 bg-primary/5" : ""}`}
          >
            <section>
              <section className="flex items-center gap-2">
                <h1 className="text-3xl tracking-tight">Saved</h1>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {projects.length} folders
                </Badge>
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {projects.reduce((sum, p) => sum + p.dashboards.length, 0) + standaloneDashboards.length} total dashboards
                </Badge>
              </section>
              <p className="text-muted-foreground mt-2">
                Organize and manage your saved dashboards in folders
              </p>
              {isOverStandalone && (
                <p className="text-sm text-primary mt-1">Drop here to move to standalone</p>
              )}
            </section>
            <Button onClick={() => setNewFolderDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
          {allCustomDashboards.length > 0 && (
            <div className="mt-4 flex w-full flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dashboards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={folderFilter} onValueChange={(val) => { setFolderFilter(val); clearDashboardSelection(); }}>
                <SelectTrigger className="h-8 w-auto shrink-0">
                  <LabeledSelectValue label="Folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  <SelectItem value="standalone">Standalone</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchQuery || folderFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => { setSearchQuery(""); setFolderFilter("all"); }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Filters
                </Button>
              )}
            </div>
          )}
        </PageHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          <div className={cn(pageRootListScrollGutterClassName, "pb-8")}>
        <PageTransition className={cn(pageMainColumnClassName, "space-y-6")}>
        <HeaderAIInsightsRow
          dashboardId="saved"
          dashboardData={{
            id: "saved",
            title: "Saved",
            description: "Organize and manage your saved dashboards in folders",
          }}
        />
        {/* Folder Cards Overview — each is a drop target */}
        {projects.length > 0 && (
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium tracking-tight">
              <Folder className="size-4 shrink-0 text-primary" aria-hidden />
              Folders
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <DroppableFolderCard
                  key={project.id}
                  projectId={project.id}
                  onDrop={(item) => handleDropOnFolder(project.id, item)}
                >
                  <Card className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0 space-y-4">
                          <CardTitle className="text-base">
                            <Link to={folderPath(project.id)} className="hover:underline">
                              {project.name}
                            </Link>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Badge asChild variant="secondary" className="text-xs">
                              <Link to={folderPath(project.id)}>
                                {project.dashboards.length} {project.dashboards.length === 1 ? "dashboard" : "dashboards"}
                              </Link>
                            </Badge>
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">More options</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setRenameDialog({ projectId: project.id, name: project.name })}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteFolder(project.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                  </Card>
                </DroppableFolderCard>
              ))}
            </div>
          </section>
        )}

        {/* All Custom Dashboards Table */}
        {allCustomDashboards.length > 0 ? (
          <>
        {filteredCustomDashboards.length > 0 ? (
        <div className="space-y-3">
            <BulkActionBar
              selectedCount={selectedDashboardIds.size}
              totalCount={allCustomDashboards.length}
              onClearSelection={clearDashboardSelection}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={handleBulkDeleteAllDashboards}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Delete
              </Button>
            </BulkActionBar>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"><span className="sr-only">Drag</span></TableHead>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allDashboardsChecked ? true : someDashboardsChecked ? "indeterminate" : false}
                      onCheckedChange={toggleAllCustomDashboards}
                      aria-label="Select all dashboards"
                    />
                  </TableHead>
                  <TableHead>Dashboard</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead className={tableOverflowMenuColumnClassName}>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomDashboards.map((item) => (
                    <DraggableDashboardRow
                      key={item.key}
                      item={item}
                      isSelected={selectedDashboardIds.has(item.key)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedDashboardIds.has(item.key)}
                          onCheckedChange={() => toggleDashboardSelected(item.key)}
                          aria-label={`Select ${item.dashboard.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Link
                          to={item.linkPath}
                          className="flex items-center gap-3 hover:underline"
                        >
                          <span className="font-normal">{item.dashboard.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        {item.folderName ? (
                          <Badge asChild variant="secondary">
                            <Link to={folderPath(item.projectId!)}>{item.folderName}</Link>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.dashboard.createdBy}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date().toLocaleDateString()}
                      </TableCell>
                      <TableCell className={tableOverflowMenuColumnClassName}>
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">More options</span>
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="left">More options</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditDashboardDialog({
                                  dashboardId: item.dashboard.id,
                                  dashboardName: item.dashboard.name,
                                  dashboardDescription: item.dashboard.description || "",
                                  projectId: item.projectId,
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setMoveDashboardDialog({ dashboardId: item.dashboard.id, dashboardName: item.dashboard.name, fromProjectId: item.projectId });
                                setMoveTargetFolderId("");
                              }}
                            >
                              {item.projectId ? (
                                <FolderInput className="h-4 w-4 mr-2" />
                              ) : (
                                <FolderInput className="h-4 w-4 mr-2" />
                              )}
                              Move to Folder
                            </DropdownMenuItem>
                            {item.projectId && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const validationError = validateSavedStandaloneDashboardName(
                                    item.dashboard.name,
                                    projects,
                                    standaloneDashboards,
                                  );
                                  if (validationError) {
                                    toast.error(validationError);
                                    return;
                                  }
                                  moveDashboardToStandalone(item.projectId!, item.dashboard.id);
                                  toast.success(`Moved "${item.dashboard.name}" to standalone`);
                                }}
                              >
                                <FolderOutput className="h-4 w-4 mr-2" />
                                Remove from Folder
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setDuplicateDashboardDialog({
                                  dashboardName: item.dashboard.name,
                                  dashboardDescription: item.dashboard.description || "",
                                  projectId: item.projectId,
                                  sourceOotbId: item.dashboard.sourceOotbId,
                                });
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (item.projectId) {
                                  const project = projects.find((p) => p.id === item.projectId);
                                  const snapshot = project?.dashboards.find((d) => d.id === item.dashboard.id);
                                  if (snapshot) {
                                    deleteDashboardFromProject(item.projectId, item.dashboard.id);
                                    showDeletedObjectToast({
                                      objectType: "Dashboard",
                                      objectName: item.dashboard.name,
                                      onUndo: () => {
                                        restoreDashboardToProject(item.projectId!, snapshot);
                                      },
                                    });
                                  }
                                } else {
                                  const snapshot = { ...item.dashboard };
                                  deleteStandaloneDashboard(item.dashboard.id);
                                  showDeletedObjectToast({
                                    objectType: "Dashboard",
                                    objectName: item.dashboard.name,
                                    onUndo: () => {
                                      restoreStandaloneDashboard(snapshot);
                                    },
                                  });
                                }
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </DraggableDashboardRow>
                  ))}
              </TableBody>
            </Table>
        </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutDashboard />
              </EmptyMedia>
              <EmptyTitle>No dashboards match your filters</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search or filter criteria
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
          </>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutDashboard />
              </EmptyMedia>
              <EmptyTitle>No saved dashboards yet</EmptyTitle>
              <EmptyDescription>
                Create dashboards from conversations and save them here
              </EmptyDescription>
            </EmptyHeader>
            <Link to="/">
              <Button variant="outline" size="sm">
                Start a Conversation
              </Button>
            </Link>
          </Empty>
        )}
        </PageTransition>
          </div>
        </div>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Folders help you organize related dashboards.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g., Q1 Customer Analysis"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Folder Dialog */}
      <Dialog open={!!renameDialog} onOpenChange={() => setRenameDialog(null)}>
        <DialogContent className="sm:max-w-[25rem]">
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label className="sr-only" htmlFor="rename-project">Folder Name</Label>
            <Input
              id="rename-project"
              value={renameDialog?.name || ""}
              onChange={(e) =>
                setRenameDialog(
                  renameDialog ? { ...renameDialog, name: e.target.value } : null
                )
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameFolder();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleRenameFolder}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirmation Dialog */}
      <DeleteFolderDialog
        open={!!deleteFolderConfirm}
        onOpenChange={(open) => { if (!open) setDeleteFolderConfirm(null); }}
        onConfirm={confirmDeleteFolder}
        folderName={deleteFolderConfirm?.projectName}
        dashboardCount={deleteFolderConfirm?.dashboardCount}
      />

      {/* Bulk Delete Folder Confirmation Dialog */}
      <DeleteFolderDialog
        open={showBulkDeleteFolderConfirm}
        onOpenChange={(open) => { if (!open) setShowBulkDeleteFolderConfirm(false); }}
        onConfirm={confirmBulkDeleteFolders}
        count={selectedFolderIds.size}
      />

      {/* Bulk Delete Dashboard Confirmation Dialog (main view) */}
      <DeleteDashboardDialog
        open={showBulkDeleteConfirm}
        onOpenChange={(open) => { if (!open) setShowBulkDeleteConfirm(false); }}
        onConfirm={confirmBulkDeleteAllDashboards}
        count={selectedDashboardIds.size}
      />

      {/* Move Dashboard Dialog (main view) */}
      <Dialog open={!!moveDashboardDialog} onOpenChange={() => { setMoveDashboardDialog(null); setMoveTargetFolderId(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Dashboard</DialogTitle>
            <DialogDescription>
              Select a destination for "{moveDashboardDialog?.dashboardName}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label>Destination</Label>
            <Select value={moveTargetFolderId} onValueChange={setMoveTargetFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                {moveDashboardDialog?.fromProjectId && (
                  <SelectItem value="__standalone__">Standalone (no folder)</SelectItem>
                )}
                {projects
                  .filter((p) => p.id !== moveDashboardDialog?.fromProjectId)
                  .map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setMoveDashboardDialog(null); setMoveTargetFolderId(""); }}>
              Cancel
            </Button>
            <Button onClick={handleMoveConfirm} disabled={!moveTargetFolderId}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dashboard Dialog (main view) */}
      <EditDashboardDialog
        open={!!editDashboardDialog}
        onOpenChange={(open) => {
          if (!open) setEditDashboardDialog(null);
        }}
        initialName={editDashboardDialog?.dashboardName || ""}
        initialDescription={editDashboardDialog?.dashboardDescription || ""}
        initialLocationProjectId={editDashboardDialog?.projectId ?? null}
        projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        onCreateFolder={(folderName) => {
          const trimmed = folderName.trim();
          if (!trimmed) return null;
          const validationError = validateSavedFolderName(trimmed, projects, standaloneDashboards);
          if (validationError) {
            toast.error(validationError);
            return null;
          }
          return addProject(trimmed);
        }}
        onSubmit={handleConfirmEditDashboard}
      />

      {/* Duplicate Dashboard Dialog (main view) */}
      <DuplicateDashboardDialog
        open={!!duplicateDashboardDialog}
        onOpenChange={(open) => { if (!open) setDuplicateDashboardDialog(null); }}
        dashboardName={duplicateDashboardDialog?.dashboardName || ""}
        dashboardDescription={duplicateDashboardDialog?.dashboardDescription || ""}
        initialLocationProjectId={duplicateDashboardDialog?.projectId ?? null}
        sourceOotbId={duplicateDashboardDialog?.sourceOotbId}
      />
    </>
  );
}
