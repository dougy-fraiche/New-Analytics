import { useReducer } from "react";
import { useProjects, type Project } from "../contexts/ProjectContext";
import { useConversations } from "../contexts/ConversationContext";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

interface RenameProjectPayload {
  projectId: string;
  name: string;
}

interface RenameConversationPayload {
  conversationId: string;
  name: string;
}

interface RenameDashboardPayload {
  projectId: string;
  dashboardId: string;
  name: string;
}

interface MoveDashboardPayload {
  fromProjectId: string;
  dashboardId: string;
  dashboardName: string;
}

interface DeleteDashboardPayload {
  projectId: string;
  dashboardId: string;
  dashboardName: string;
}

interface DeleteFolderPayload {
  projectId: string;
  projectName: string;
  dashboardCount: number;
}

export interface SidebarDialogState {
  newProjectDialog: boolean;
  newProjectName: string;
  renameDialog: RenameProjectPayload | null;
  renameConversationDialog: RenameConversationPayload | null;
  renameDashboardDialog: RenameDashboardPayload | null;
  moveDashboardDialog: MoveDashboardPayload | null;
  moveTargetProjectId: string;
  deleteDashboardConfirm: DeleteDashboardPayload | null;
  deleteFolderConfirm: DeleteFolderPayload | null;
  newDashboardDialog: string | null;
  newDashboardName: string;
}

// ── Actions ────────────────────────────────────────────────────────────────

type DialogAction =
  | { type: "OPEN_NEW_PROJECT" }
  | { type: "CLOSE_NEW_PROJECT" }
  | { type: "SET_NEW_PROJECT_NAME"; name: string }
  | { type: "OPEN_RENAME_PROJECT"; payload: RenameProjectPayload }
  | { type: "CLOSE_RENAME_PROJECT" }
  | { type: "UPDATE_RENAME_PROJECT_NAME"; name: string }
  | { type: "OPEN_RENAME_CONVERSATION"; payload: RenameConversationPayload }
  | { type: "CLOSE_RENAME_CONVERSATION" }
  | { type: "UPDATE_RENAME_CONVERSATION_NAME"; name: string }
  | { type: "OPEN_RENAME_DASHBOARD"; payload: RenameDashboardPayload }
  | { type: "CLOSE_RENAME_DASHBOARD" }
  | { type: "UPDATE_RENAME_DASHBOARD_NAME"; name: string }
  | { type: "OPEN_MOVE_DASHBOARD"; payload: MoveDashboardPayload }
  | { type: "CLOSE_MOVE_DASHBOARD" }
  | { type: "SET_MOVE_TARGET"; projectId: string }
  | { type: "OPEN_DELETE_DASHBOARD"; payload: DeleteDashboardPayload }
  | { type: "CLOSE_DELETE_DASHBOARD" }
  | { type: "OPEN_DELETE_FOLDER"; payload: DeleteFolderPayload }
  | { type: "CLOSE_DELETE_FOLDER" }
  | { type: "OPEN_NEW_DASHBOARD"; projectId: string }
  | { type: "CLOSE_NEW_DASHBOARD" }
  | { type: "SET_NEW_DASHBOARD_NAME"; name: string };

// ── Reducer ────────────────────────────────────────────────────────────────

const initialState: SidebarDialogState = {
  newProjectDialog: false,
  newProjectName: "",
  renameDialog: null,
  renameConversationDialog: null,
  renameDashboardDialog: null,
  moveDashboardDialog: null,
  moveTargetProjectId: "",
  deleteDashboardConfirm: null,
  deleteFolderConfirm: null,
  newDashboardDialog: null,
  newDashboardName: "",
};

function dialogReducer(state: SidebarDialogState, action: DialogAction): SidebarDialogState {
  switch (action.type) {
    case "OPEN_NEW_PROJECT":
      return { ...state, newProjectDialog: true, newProjectName: "" };
    case "CLOSE_NEW_PROJECT":
      return { ...state, newProjectDialog: false, newProjectName: "" };
    case "SET_NEW_PROJECT_NAME":
      return { ...state, newProjectName: action.name };
    case "OPEN_RENAME_PROJECT":
      return { ...state, renameDialog: action.payload };
    case "CLOSE_RENAME_PROJECT":
      return { ...state, renameDialog: null };
    case "UPDATE_RENAME_PROJECT_NAME":
      return state.renameDialog
        ? { ...state, renameDialog: { ...state.renameDialog, name: action.name } }
        : state;
    case "OPEN_RENAME_CONVERSATION":
      return { ...state, renameConversationDialog: action.payload };
    case "CLOSE_RENAME_CONVERSATION":
      return { ...state, renameConversationDialog: null };
    case "UPDATE_RENAME_CONVERSATION_NAME":
      return state.renameConversationDialog
        ? { ...state, renameConversationDialog: { ...state.renameConversationDialog, name: action.name } }
        : state;
    case "OPEN_RENAME_DASHBOARD":
      return { ...state, renameDashboardDialog: action.payload };
    case "CLOSE_RENAME_DASHBOARD":
      return { ...state, renameDashboardDialog: null };
    case "UPDATE_RENAME_DASHBOARD_NAME":
      return state.renameDashboardDialog
        ? { ...state, renameDashboardDialog: { ...state.renameDashboardDialog, name: action.name } }
        : state;
    case "OPEN_MOVE_DASHBOARD":
      return { ...state, moveDashboardDialog: action.payload, moveTargetProjectId: "" };
    case "CLOSE_MOVE_DASHBOARD":
      return { ...state, moveDashboardDialog: null, moveTargetProjectId: "" };
    case "SET_MOVE_TARGET":
      return { ...state, moveTargetProjectId: action.projectId };
    case "OPEN_DELETE_DASHBOARD":
      return { ...state, deleteDashboardConfirm: action.payload };
    case "CLOSE_DELETE_DASHBOARD":
      return { ...state, deleteDashboardConfirm: null };
    case "OPEN_DELETE_FOLDER":
      return { ...state, deleteFolderConfirm: action.payload };
    case "CLOSE_DELETE_FOLDER":
      return { ...state, deleteFolderConfirm: null };
    case "OPEN_NEW_DASHBOARD":
      return { ...state, newDashboardDialog: action.projectId, newDashboardName: "" };
    case "CLOSE_NEW_DASHBOARD":
      return { ...state, newDashboardDialog: null, newDashboardName: "" };
    case "SET_NEW_DASHBOARD_NAME":
      return { ...state, newDashboardName: action.name };
    default:
      return state;
  }
}

export interface UseSidebarDialogsOptions {
  /** Called after a new folder is created from the sidebar dialog (e.g. expand Saved). */
  onFolderCreated?: (project: Project) => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSidebarDialogs(options?: UseSidebarDialogsOptions) {
  const [state, dispatch] = useReducer(dialogReducer, initialState);
  const {
    projects,
    addProject,
    renameProject,
    deleteProject,
    addDashboardToProject,
    renameDashboardInProject,
    deleteDashboardFromProject,
    moveDashboardToProject,
    restoreProject,
    restoreDashboardToProject,
  } = useProjects();
  const { renameConversation } = useConversations();

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleCreateProject = () => {
    const name = state.newProjectName.trim();
    if (name) {
      const project = addProject(name);
      options?.onFolderCreated?.(project);
      toast.success("Folder created", {
        description: `"${name}" has been created.`,
      });
      dispatch({ type: "CLOSE_NEW_PROJECT" });
    }
  };

  const handleRenameProject = () => {
    if (state.renameDialog && state.renameDialog.name.trim()) {
      renameProject(state.renameDialog.projectId, state.renameDialog.name);
      toast.success("Folder renamed", {
        description: `Renamed to "${state.renameDialog.name.trim()}".`,
      });
      dispatch({ type: "CLOSE_RENAME_PROJECT" });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const snapshot = projects.find((p) => p.id === projectId);
    if (!snapshot) return;
    if (snapshot.dashboards.length === 0) {
      // Empty folder — delete immediately, no confirmation needed
      deleteProject(projectId);
      toast.success("Folder deleted", {
        description: `"${snapshot.name}" has been deleted.`,
        action: {
          label: "Undo",
          onClick: () => {
            restoreProject(snapshot);
            toast.success("Folder restored");
          },
        },
      });
    } else {
      dispatch({
        type: "OPEN_DELETE_FOLDER",
        payload: {
          projectId,
          projectName: snapshot.name,
          dashboardCount: snapshot.dashboards.length,
        },
      });
    }
  };

  const confirmDeleteFolder = () => {
    if (!state.deleteFolderConfirm) return;
    const { projectId, projectName } = state.deleteFolderConfirm;
    const snapshot = projects.find((p) => p.id === projectId);
    if (snapshot) {
      deleteProject(projectId);
      toast.success("Folder deleted", {
        description: `"${projectName}" has been deleted.`,
        action: {
          label: "Undo",
          onClick: () => {
            restoreProject(snapshot);
            toast.success("Folder restored");
          },
        },
      });
    }
    dispatch({ type: "CLOSE_DELETE_FOLDER" });
  };

  const handleDeleteDashboard = (projectId: string, dashboardId: string, dashboardName: string) => {
    dispatch({
      type: "OPEN_DELETE_DASHBOARD",
      payload: { projectId, dashboardId, dashboardName },
    });
  };

  const confirmDeleteDashboard = () => {
    if (!state.deleteDashboardConfirm) return;
    const { projectId, dashboardId, dashboardName } = state.deleteDashboardConfirm;
    const project = projects.find((p) => p.id === projectId);
    const dashboardSnapshot = project?.dashboards.find((d) => d.id === dashboardId);
    deleteDashboardFromProject(projectId, dashboardId);
    toast.success("Dashboard deleted", {
      description: `"${dashboardName}" has been deleted.`,
      action: {
        label: "Undo",
        onClick: () => {
          if (dashboardSnapshot) {
            restoreDashboardToProject(projectId, dashboardSnapshot);
            toast.success("Dashboard restored");
          }
        },
      },
    });
    dispatch({ type: "CLOSE_DELETE_DASHBOARD" });
  };

  const handleRenameDashboard = () => {
    if (state.renameDashboardDialog && state.renameDashboardDialog.name.trim()) {
      renameDashboardInProject(
        state.renameDashboardDialog.projectId,
        state.renameDashboardDialog.dashboardId,
        state.renameDashboardDialog.name
      );
      toast.success("Dashboard renamed", {
        description: `Renamed to "${state.renameDashboardDialog.name.trim()}".`,
      });
      dispatch({ type: "CLOSE_RENAME_DASHBOARD" });
    }
  };

  const handleAddDashboard = () => {
    if (state.newDashboardDialog && state.newDashboardName.trim()) {
      addDashboardToProject(state.newDashboardDialog, state.newDashboardName);
      toast.success("Dashboard added", {
        description: `"${state.newDashboardName.trim()}" has been added.`,
      });
      dispatch({ type: "CLOSE_NEW_DASHBOARD" });
    }
  };

  const handleMoveDashboard = () => {
    if (state.moveDashboardDialog && state.moveTargetProjectId) {
      moveDashboardToProject(
        state.moveDashboardDialog.fromProjectId,
        state.moveDashboardDialog.dashboardId,
        state.moveTargetProjectId
      );
      toast.success("Dashboard moved", {
        description: `"${state.moveDashboardDialog.dashboardName}" has been moved to "${projects.find((p) => p.id === state.moveTargetProjectId)?.name}".`,
      });
      dispatch({ type: "CLOSE_MOVE_DASHBOARD" });
    }
  };

  const handleRenameConversation = () => {
    if (state.renameConversationDialog && state.renameConversationDialog.name.trim()) {
      renameConversation(
        state.renameConversationDialog.conversationId,
        state.renameConversationDialog.name
      );
      toast.success("Conversation renamed", {
        description: `Renamed to "${state.renameConversationDialog.name.trim()}".`,
      });
      dispatch({ type: "CLOSE_RENAME_CONVERSATION" });
    }
  };

  return {
    state,
    dispatch,
    projects,
    handleCreateProject,
    handleRenameProject,
    handleDeleteProject,
    confirmDeleteFolder,
    handleDeleteDashboard,
    confirmDeleteDashboard,
    handleRenameDashboard,
    handleAddDashboard,
    handleMoveDashboard,
    handleRenameConversation,
  };
}