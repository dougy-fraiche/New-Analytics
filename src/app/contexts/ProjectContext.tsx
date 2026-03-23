import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";

// Context for managing projects, dashboards, and favorites across the app
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  kpis: string[];
  /** Optional reference to the source OOTB dashboard type (e.g. "agent-queries") for inheriting chat prompts */
  sourceOotbId?: string;
}

export interface FavoriteDashboard {
  /** Unique key – composite of projectId/dashboardId or just dashboardId for featured */
  id: string;
  name: string;
  path: string;
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
  addDashboardToProject: (projectId: string, dashboardName: string, sourceOotbId?: string, description?: string) => Dashboard;
  renameDashboardInProject: (projectId: string, dashboardId: string, newName: string) => void;
  deleteDashboardFromProject: (projectId: string, dashboardId: string) => void;
  moveDashboardToProject: (fromProjectId: string, dashboardId: string, toProjectId: string) => void;
  restoreProject: (project: Project) => void;
  restoreDashboardToProject: (projectId: string, dashboard: Dashboard) => void;
  standaloneDashboards: Dashboard[];
  addStandaloneDashboard: (dashboardName: string, sourceOotbId?: string, description?: string) => Dashboard;
  renameStandaloneDashboard: (dashboardId: string, newName: string) => void;
  deleteStandaloneDashboard: (dashboardId: string) => void;
  restoreStandaloneDashboard: (dashboard: Dashboard) => void;
  moveStandaloneToFolder: (dashboardId: string, toProjectId: string) => void;
  moveDashboardToStandalone: (fromProjectId: string, dashboardId: string) => void;
  favorites: FavoriteDashboard[];
  toggleFavorite: (fav: FavoriteDashboard) => void;
  removeFavorites: (ids: string[]) => void;
  restoreFavorites: (favs: FavoriteDashboard[]) => void;
  isFavorite: (id: string) => boolean;
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

  const [favorites, setFavorites] = useState<FavoriteDashboard[]>([
    { id: "agent-queries", name: "Agent Queries", path: "/dashboard/agent-queries" },
    { id: "intent-nlu", name: "Intent & NLU", path: "/dashboard/intent-nlu" },
    { id: "knowledge-responses", name: "Knowledge Responses", path: "/dashboard/knowledge-responses" },
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
    // Collect dashboard IDs for favorites cleanup before removing the project
    setProjects((prev) => {
      const project = prev.find((p) => p.id === projectId);
      if (project) {
        const dashboardFavIds = project.dashboards.map((d) => `${projectId}/${d.id}`);
        // Schedule favorites cleanup — uses queueMicrotask to avoid calling
        // setFavorites inside setProjects's updater (React doesn't allow
        // nested setState during a render-phase updater).
        queueMicrotask(() => {
          setFavorites((fPrev) => fPrev.filter((f) => !dashboardFavIds.includes(f.id)));
        });
      }
      return prev.filter((p) => p.id !== projectId);
    });
  }, []);

  const addDashboardToProject = useCallback((projectId: string, dashboardName: string, sourceOotbId?: string, description?: string): Dashboard => {
    const newDashboard: Dashboard = {
      id: `dash-${Date.now()}`,
      name: dashboardName,
      description,
      createdBy: "User",
      kpis: [],
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

  const renameDashboardInProject = useCallback((projectId: string, dashboardId: string, newName: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, dashboards: p.dashboards.map((d) => d.id === dashboardId ? { ...d, name: newName } : d) }
          : p
      )
    );
  }, []);

  const deleteDashboardFromProject = useCallback((projectId: string, dashboardId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, dashboards: p.dashboards.filter((d) => d.id !== dashboardId) }
          : p
      )
    );
    // Remove from favorites if it was favorited
    const favoriteId = `${projectId}/${dashboardId}`;
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
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

  const addStandaloneDashboard = useCallback((dashboardName: string, sourceOotbId?: string, description?: string) => {
    const newDashboard: Dashboard = {
      id: `dash-${Date.now()}`,
      name: dashboardName,
      description,
      createdBy: "User",
      kpis: [],
      sourceOotbId,
    };
    setStandaloneDashboards((prev) => [...prev, newDashboard]);
    return newDashboard;
  }, []);

  const renameStandaloneDashboard = useCallback((dashboardId: string, newName: string) => {
    setStandaloneDashboards((prev) =>
      prev.map((d) => (d.id === dashboardId ? { ...d, name: newName } : d))
    );
  }, []);

  const deleteStandaloneDashboard = useCallback((dashboardId: string) => {
    setStandaloneDashboards((prev) => prev.filter((d) => d.id !== dashboardId));
    // Remove from favorites if it was favorited
    setFavorites((prev) => prev.filter((f) => f.id !== dashboardId));
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

  const toggleFavorite = useCallback((fav: FavoriteDashboard) => {
    setFavorites((prev) => {
      const existingIndex = prev.findIndex((d) => d.id === fav.id);
      if (existingIndex !== -1) {
        return prev.filter((d) => d.id !== fav.id);
      }
      return [...prev, fav];
    });
  }, []);

  const removeFavorites = useCallback((ids: string[]) => {
    setFavorites((prev) => prev.filter((d) => !ids.includes(d.id)));
  }, []);

  const restoreFavorites = useCallback((favs: FavoriteDashboard[]) => {
    setFavorites((prev) => {
      const existingIds = new Set(prev.map((d) => d.id));
      return [...prev, ...favs.filter((d) => !existingIds.has(d.id))];
    });
  }, []);

  const isFavorite = useCallback((id: string) => {
    return favorites.some((d) => d.id === id);
  }, [favorites]);

  const value = useMemo(
    () => ({
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
      standaloneDashboards,
      addStandaloneDashboard,
      renameStandaloneDashboard,
      deleteStandaloneDashboard,
      restoreStandaloneDashboard,
      moveStandaloneToFolder,
      moveDashboardToStandalone,
      favorites,
      toggleFavorite,
      removeFavorites,
      restoreFavorites,
      isFavorite,
    }),
    [
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
      standaloneDashboards,
      addStandaloneDashboard,
      renameStandaloneDashboard,
      deleteStandaloneDashboard,
      restoreStandaloneDashboard,
      moveStandaloneToFolder,
      moveDashboardToStandalone,
      favorites,
      toggleFavorite,
      removeFavorites,
      restoreFavorites,
      isFavorite,
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