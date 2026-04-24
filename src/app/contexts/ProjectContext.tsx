import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import type { SavedDashboardSnapshot } from "../types/saved-dashboard-snapshot";

// Context for managing projects and dashboards across the app
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  kpis: string[];
  snapshot?: SavedDashboardSnapshot;
  /** Optional reference to the source OOTB dashboard type (e.g. "agent-queries") for inheriting chat prompts */
  sourceOotbId?: string;
}

interface CreateDashboardOptions {
  kpis?: string[];
  snapshot?: SavedDashboardSnapshot;
}

export interface Project {
  id: string;
  name: string;
  dashboards: Dashboard[];
}

interface ProjectContextType {
  projects: Project[];
  addProject: (name: string) => Project;
  renameProject: (projectId: string, newName: string) => void;
  deleteProject: (projectId: string) => void;
  addDashboardToProject: (
    projectId: string,
    dashboardName: string,
    sourceOotbId?: string,
    description?: string,
    options?: CreateDashboardOptions,
  ) => Dashboard;
  updateDashboardInProject: (
    projectId: string,
    dashboardId: string,
    updates: Partial<
      Pick<Dashboard, "name" | "description" | "kpis" | "snapshot" | "sourceOotbId">
    >,
  ) => void;
  renameDashboardInProject: (projectId: string, dashboardId: string, newName: string) => void;
  deleteDashboardFromProject: (projectId: string, dashboardId: string) => void;
  moveDashboardToProject: (fromProjectId: string, dashboardId: string, toProjectId: string) => void;
  restoreProject: (project: Project) => void;
  restoreDashboardToProject: (projectId: string, dashboard: Dashboard) => void;
  standaloneDashboards: Dashboard[];
  addStandaloneDashboard: (
    dashboardName: string,
    sourceOotbId?: string,
    description?: string,
    options?: CreateDashboardOptions,
  ) => Dashboard;
  updateStandaloneDashboard: (
    dashboardId: string,
    updates: Partial<
      Pick<Dashboard, "name" | "description" | "kpis" | "snapshot" | "sourceOotbId">
    >,
  ) => void;
  renameStandaloneDashboard: (dashboardId: string, newName: string) => void;
  deleteStandaloneDashboard: (dashboardId: string) => void;
  restoreStandaloneDashboard: (dashboard: Dashboard) => void;
  moveStandaloneToFolder: (dashboardId: string, toProjectId: string) => void;
  moveDashboardToStandalone: (fromProjectId: string, dashboardId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "proj-1",
      name: "Customer Support Analysis",
      dashboards: [
        { id: "dash-1", name: "Q1 Escalations", description: "Tracks escalation volume, root causes, and resolution times across support tiers for Q1 2026.", createdBy: "Alice Chen", kpis: ["Escalation Rate", "Resolution Time"] },
        { id: "dash-2", name: "Self-Service Trends", description: "Monitors self-service adoption rates, drop-off points, and containment across chatbot and help center channels.", createdBy: "Bob Martinez", kpis: ["Self-Service Usage", "User Satisfaction"] },
        { id: "dash-10", name: "Agent Handle Time Breakdown", description: "Compares average handle time by agent, shift, and AI co-pilot usage to identify efficiency gaps.", createdBy: "Charlie Nguyen", kpis: ["Average Handle Time", "Peak Hours"] },
      ],
    },
    {
      id: "proj-2",
      name: "Product Insights",
      dashboards: [
        { id: "dash-3", name: "Feature Adoption", description: "Measures adoption funnels and usage frequency for recently launched product features including the billing portal.", createdBy: "David Park", kpis: ["Adoption Rate", "Feature Usage"] },
        { id: "dash-11", name: "Bug Report Trends", description: "Analyzes bug report volume by category, severity, and resolution cadence with month-over-month trends.", createdBy: "Eve Johnson", kpis: ["Bug Count", "Resolution Time"] },
        { id: "dash-12", name: "NPS by Product Area", description: "Breaks down Net Promoter Score across product areas with verbatim theme analysis for detractors and promoters.", createdBy: "Frank Olsen", kpis: ["NPS Score", "Product Area"] },
      ],
    },
  ]);

  // Standalone dashboards live at the same level as folders (not inside any folder).
  // Seeded with the former "Executive Reporting" folder's dashboards.
  const [standaloneDashboards, setStandaloneDashboards] = useState<Dashboard[]>([
    { id: "dash-4", name: "Weekly KPI Summary", description: "Executive snapshot of weekly interaction volume, containment rate, CSAT, and agent utilization metrics.", createdBy: "Grace Liu", kpis: ["KPIs", "Weekly Summary"] },
    { id: "dash-5", name: "Monthly Business Review", description: "Monthly operational review covering cost per interaction, resolution volume, and AI co-pilot ROI analysis.", createdBy: "Hank Williams", kpis: ["Business Metrics", "Monthly Review"] },
    { id: "dash-13", name: "Quarterly Board Deck Metrics", description: "Board-ready quarterly metrics with year-over-year growth, automation rate trends, and projected cost savings.", createdBy: "Ivy Nakamura", kpis: ["Board Metrics", "Quarterly Review"] },
  ]);

  const addProject = useCallback((name: string): Project => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      dashboards: [],
    };
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  }, []);

  const renameProject = useCallback((projectId: string, newName: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p))
    );
  }, []);

  const deleteProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  const addDashboardToProject = useCallback((
    projectId: string,
    dashboardName: string,
    sourceOotbId?: string,
    description?: string,
    options?: CreateDashboardOptions,
  ): Dashboard => {
    const newDashboard: Dashboard = {
      id: `dash-${Date.now()}`,
      name: dashboardName,
      description,
      createdBy: "User",
      kpis: options?.kpis ?? [],
      snapshot: options?.snapshot,
      sourceOotbId,
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, dashboards: [...p.dashboards, newDashboard] }
          : p
      )
    );
    return newDashboard;
  }, []);

  const updateDashboardInProject = useCallback((
    projectId: string,
    dashboardId: string,
    updates: Partial<
      Pick<Dashboard, "name" | "description" | "kpis" | "snapshot" | "sourceOotbId">
    >,
  ) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              dashboards: p.dashboards.map((d) =>
                d.id === dashboardId ? { ...d, ...updates } : d,
              ),
            }
          : p
      )
    );
  }, []);

  const renameDashboardInProject = useCallback((projectId: string, dashboardId: string, newName: string) => {
    updateDashboardInProject(projectId, dashboardId, { name: newName });
  }, [updateDashboardInProject]);

  const deleteDashboardFromProject = useCallback((projectId: string, dashboardId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, dashboards: p.dashboards.filter((d) => d.id !== dashboardId) }
          : p
      )
    );
  }, []);

  const moveDashboardToProject = useCallback((fromProjectId: string, dashboardId: string, toProjectId: string) => {
    setProjects((prev) => {
      const sourceProject = prev.find((p) => p.id === fromProjectId);
      const dashboard = sourceProject?.dashboards.find((d) => d.id === dashboardId);
      if (!dashboard) return prev;
      return prev.map((p) => {
        if (p.id === fromProjectId) {
          return { ...p, dashboards: p.dashboards.filter((d) => d.id !== dashboardId) };
        }
        if (p.id === toProjectId) {
          return { ...p, dashboards: [...p.dashboards, { ...dashboard }] };
        }
        return p;
      });
    });
  }, []);

  const restoreProject = useCallback((project: Project) => {
    setProjects((prev) => {
      if (prev.some((p) => p.id === project.id)) return prev;
      return [...prev, project];
    });
  }, []);

  const restoreDashboardToProject = useCallback((projectId: string, dashboard: Dashboard) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        if (p.dashboards.some((d) => d.id === dashboard.id)) return p;
        return { ...p, dashboards: [...p.dashboards, dashboard] };
      })
    );
  }, []);

  const addStandaloneDashboard = useCallback((
    dashboardName: string,
    sourceOotbId?: string,
    description?: string,
    options?: CreateDashboardOptions,
  ) => {
    const newDashboard: Dashboard = {
      id: `dash-${Date.now()}`,
      name: dashboardName,
      description,
      createdBy: "User",
      kpis: options?.kpis ?? [],
      snapshot: options?.snapshot,
      sourceOotbId,
    };
    setStandaloneDashboards((prev) => [...prev, newDashboard]);
    return newDashboard;
  }, []);

  const updateStandaloneDashboard = useCallback((
    dashboardId: string,
    updates: Partial<
      Pick<Dashboard, "name" | "description" | "kpis" | "snapshot" | "sourceOotbId">
    >,
  ) => {
    setStandaloneDashboards((prev) =>
      prev.map((d) => (d.id === dashboardId ? { ...d, ...updates } : d))
    );
  }, []);

  const renameStandaloneDashboard = useCallback((dashboardId: string, newName: string) => {
    updateStandaloneDashboard(dashboardId, { name: newName });
  }, [updateStandaloneDashboard]);

  const deleteStandaloneDashboard = useCallback((dashboardId: string) => {
    setStandaloneDashboards((prev) => prev.filter((d) => d.id !== dashboardId));
  }, []);

  const restoreStandaloneDashboard = useCallback((dashboard: Dashboard) => {
    setStandaloneDashboards((prev) => {
      if (prev.some((d) => d.id === dashboard.id)) return prev;
      return [...prev, dashboard];
    });
  }, []);

  const moveStandaloneToFolder = useCallback((dashboardId: string, toProjectId: string) => {
    // Read the dashboard from standaloneDashboards state inside the updater
    // to avoid stale closure issues
    setStandaloneDashboards((sPrev) => {
      const dashboard = sPrev.find((d) => d.id === dashboardId);
      if (!dashboard) return sPrev;

      // Schedule project update from within the standalone updater
      const dashboardCopy = { ...dashboard };
      queueMicrotask(() => {
        setProjects((pPrev) =>
          pPrev.map((p) => {
            if (p.id === toProjectId) {
              return { ...p, dashboards: [...p.dashboards, dashboardCopy] };
            }
            return p;
          })
        );
      });

      return sPrev.filter((d) => d.id !== dashboardId);
    });
  }, []);

  const moveDashboardToStandalone = useCallback((fromProjectId: string, dashboardId: string) => {
    // Look up the dashboard from current state BEFORE calling setProjects
    // to avoid relying on side-effects inside the state updater (which is
    // fragile under React concurrent rendering).
    setProjects((prev) => {
      const sourceProject = prev.find((p) => p.id === fromProjectId);
      const dashboard = sourceProject?.dashboards.find((d) => d.id === dashboardId);
      if (!dashboard) return prev;

      // Schedule the standalone addition as a separate state update
      // (safe because we captured `dashboard` from the prev snapshot).
      const dashboardCopy = { ...dashboard };
      queueMicrotask(() => {
        setStandaloneDashboards((sPrev) => [...sPrev, dashboardCopy]);
      });

      return prev.map((p) => {
        if (p.id === fromProjectId) {
          return { ...p, dashboards: p.dashboards.filter((d) => d.id !== dashboardId) };
        }
        return p;
      });
    });
  }, []);

  const value = useMemo(
    () => ({
      projects,
      addProject,
      renameProject,
      deleteProject,
      addDashboardToProject,
      updateDashboardInProject,
      renameDashboardInProject,
      deleteDashboardFromProject,
      moveDashboardToProject,
      restoreProject,
      restoreDashboardToProject,
      standaloneDashboards,
      addStandaloneDashboard,
      updateStandaloneDashboard,
      renameStandaloneDashboard,
      deleteStandaloneDashboard,
      restoreStandaloneDashboard,
      moveStandaloneToFolder,
      moveDashboardToStandalone,
    }),
    [
      projects,
      addProject,
      renameProject,
      deleteProject,
      addDashboardToProject,
      updateDashboardInProject,
      renameDashboardInProject,
      deleteDashboardFromProject,
      moveDashboardToProject,
      restoreProject,
      restoreDashboardToProject,
      standaloneDashboards,
      addStandaloneDashboard,
      updateStandaloneDashboard,
      renameStandaloneDashboard,
      deleteStandaloneDashboard,
      restoreStandaloneDashboard,
      moveStandaloneToFolder,
      moveDashboardToStandalone,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }
  return context;
}
