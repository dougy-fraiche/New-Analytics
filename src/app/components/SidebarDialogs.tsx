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
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { DeleteDashboardDialog } from "./DeleteDashboardDialog";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import type { SidebarDialogState } from "../hooks/useSidebarDialogs";
import type { Project } from "../contexts/ProjectContext";

interface SidebarDialogsProps {
  state: SidebarDialogState;
  dispatch: React.Dispatch<any>;
  projects: Project[];
  handleCreateProject: () => void;
  handleRenameProject: () => void;
  handleRenameDashboard: () => void;
  handleAddDashboard: () => void;
  handleMoveDashboard: () => void;
  handleRenameConversation: () => void;
  confirmDeleteDashboard: () => void;
  confirmDeleteFolder: () => void;
}

export function SidebarDialogs({
  state,
  dispatch,
  projects,
  handleCreateProject,
  handleRenameProject,
  handleRenameDashboard,
  handleAddDashboard,
  handleMoveDashboard,
  handleRenameConversation,
  confirmDeleteDashboard,
  confirmDeleteFolder,
}: SidebarDialogsProps) {
  return (
    <>
      {/* New Project Dialog */}
      <Dialog
        open={state.newProjectDialog}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLOSE_NEW_PROJECT" });
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Folders help you organize related dashboards.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="project-name">Folder Name</Label>
            <Input
              id="project-name"
              value={state.newProjectName}
              onChange={(e) =>
                dispatch({ type: "SET_NEW_PROJECT_NAME", name: e.target.value })
              }
              placeholder="e.g., Q1 Customer Analysis"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "CLOSE_NEW_PROJECT" })}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Project Dialog */}
      <Dialog
        open={!!state.renameDialog}
        onOpenChange={() => dispatch({ type: "CLOSE_RENAME_PROJECT" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for your folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="rename-project">Folder Name</Label>
            <Input
              id="rename-project"
              value={state.renameDialog?.name || ""}
              onChange={(e) =>
                dispatch({ type: "UPDATE_RENAME_PROJECT_NAME", name: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameProject();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "CLOSE_RENAME_PROJECT" })}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameProject}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dashboard Dialog */}
      <Dialog
        open={!!state.renameDashboardDialog}
        onOpenChange={() => dispatch({ type: "CLOSE_RENAME_DASHBOARD" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Dashboard</DialogTitle>
            <DialogDescription>
              Enter a new name for your dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="rename-dashboard">Dashboard Name</Label>
            <Input
              id="rename-dashboard"
              value={state.renameDashboardDialog?.name || ""}
              onChange={(e) =>
                dispatch({ type: "UPDATE_RENAME_DASHBOARD_NAME", name: e.target.value })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameDashboard();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "CLOSE_RENAME_DASHBOARD" })}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameDashboard}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dashboard Dialog */}
      <Dialog
        open={!!state.newDashboardDialog}
        onOpenChange={() => dispatch({ type: "CLOSE_NEW_DASHBOARD" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Dashboard</DialogTitle>
            <DialogDescription>
              Dashboards are generated from conversations.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="dashboard-name">Dashboard Name</Label>
            <Input
              id="dashboard-name"
              value={state.newDashboardName}
              onChange={(e) =>
                dispatch({ type: "SET_NEW_DASHBOARD_NAME", name: e.target.value })
              }
              placeholder="e.g., Escalation Trends"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddDashboard();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "CLOSE_NEW_DASHBOARD" })}
            >
              Cancel
            </Button>
            <Button onClick={handleAddDashboard}>Add Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Conversation Dialog */}
      <Dialog
        open={!!state.renameConversationDialog}
        onOpenChange={() => dispatch({ type: "CLOSE_RENAME_CONVERSATION" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Draft</DialogTitle>
            <DialogDescription>
              Enter a new name for your draft.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="rename-conversation">Draft Name</Label>
            <Input
              id="rename-conversation"
              value={state.renameConversationDialog?.name || ""}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_RENAME_CONVERSATION_NAME",
                  name: e.target.value,
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameConversation();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "CLOSE_RENAME_CONVERSATION" })}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameConversation}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dashboard Dialog */}
      <Dialog
        open={!!state.moveDashboardDialog}
        onOpenChange={() => dispatch({ type: "CLOSE_MOVE_DASHBOARD" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Dashboard</DialogTitle>
            <DialogDescription>
              Select a folder to move the dashboard to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label htmlFor="move-dashboard">Folder Name</Label>
            <Select
              value={state.moveTargetProjectId}
              onValueChange={(val) =>
                dispatch({ type: "SET_MOVE_TARGET", projectId: val })
              }
            >
              <SelectTrigger id="move-dashboard">
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                {projects
                  .filter((project) =>
                    state.moveDashboardDialog
                      ? project.id !== state.moveDashboardDialog.fromProjectId
                      : true
                  )
                  .map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "CLOSE_MOVE_DASHBOARD" })}
            >
              Cancel
            </Button>
            <Button onClick={handleMoveDashboard}>Move Dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dashboard Confirmation */}
      <DeleteDashboardDialog
        open={!!state.deleteDashboardConfirm}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLOSE_DELETE_DASHBOARD" });
        }}
        onConfirm={confirmDeleteDashboard}
        dashboardName={state.deleteDashboardConfirm?.dashboardName}
      />

      {/* Delete Folder Confirmation */}
      <DeleteFolderDialog
        open={!!state.deleteFolderConfirm}
        onOpenChange={(open) => {
          if (!open) dispatch({ type: "CLOSE_DELETE_FOLDER" });
        }}
        onConfirm={confirmDeleteFolder}
        folderName={state.deleteFolderConfirm?.projectName}
        dashboardCount={state.deleteFolderConfirm?.dashboardCount}
      />
    </>
  );
}
