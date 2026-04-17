import type { Dashboard, Project } from "../contexts/ProjectContext";
import { ROUTES } from "../routes";

export function slugifySavedName(name: string): string {
  const normalized = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return normalized || "untitled";
}

export function getProjectSlug(project: Pick<Project, "name">): string {
  return slugifySavedName(project.name);
}

export function getDashboardSlug(dashboard: Pick<Dashboard, "name">): string {
  return slugifySavedName(dashboard.name);
}

export function getSavedFolderPath(project: Pick<Project, "name">): string {
  return ROUTES.SAVED_FOLDER(getProjectSlug(project));
}

export function getSavedFolderDashboardPath(
  project: Pick<Project, "name">,
  dashboard: Pick<Dashboard, "name">,
): string {
  return ROUTES.SAVED_FOLDER_DASHBOARD(
    getProjectSlug(project),
    getDashboardSlug(dashboard),
  );
}

export function getSavedStandaloneDashboardPath(
  dashboard: Pick<Dashboard, "name">,
): string {
  return ROUTES.SAVED_STANDALONE_DASHBOARD(getDashboardSlug(dashboard));
}

export function findProjectBySlug(projects: Project[], slug: string): Project | undefined {
  return projects.find((project) => getProjectSlug(project) === slug);
}

export function findStandaloneDashboardBySlug(
  standaloneDashboards: Dashboard[],
  slug: string,
): Dashboard | undefined {
  return standaloneDashboards.find((dashboard) => getDashboardSlug(dashboard) === slug);
}

export function findProjectDashboardBySlugs(
  projects: Project[],
  folderSlug: string,
  dashboardSlug: string,
): { project: Project; dashboard: Dashboard } | undefined {
  const project = findProjectBySlug(projects, folderSlug);
  if (!project) return undefined;
  const dashboard = project.dashboards.find((item) => getDashboardSlug(item) === dashboardSlug);
  if (!dashboard) return undefined;
  return { project, dashboard };
}

function existsFolderSlug(
  projects: Project[],
  slug: string,
  excludeProjectId?: string,
): boolean {
  return projects.some(
    (project) => project.id !== excludeProjectId && getProjectSlug(project) === slug,
  );
}

function existsStandaloneSlug(
  standaloneDashboards: Dashboard[],
  slug: string,
  excludeDashboardId?: string,
): boolean {
  return standaloneDashboards.some(
    (dashboard) => dashboard.id !== excludeDashboardId && getDashboardSlug(dashboard) === slug,
  );
}

export function validateSavedFolderName(
  name: string,
  projects: Project[],
  standaloneDashboards: Dashboard[],
  excludeProjectId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Folder name cannot be empty.";
  const slug = slugifySavedName(trimmed);

  if (existsFolderSlug(projects, slug, excludeProjectId)) {
    return "A folder with that name already exists.";
  }

  if (existsStandaloneSlug(standaloneDashboards, slug)) {
    return "Folder name conflicts with a standalone dashboard URL.";
  }

  return null;
}

export function validateSavedStandaloneDashboardName(
  name: string,
  projects: Project[],
  standaloneDashboards: Dashboard[],
  excludeDashboardId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Dashboard name cannot be empty.";
  const slug = slugifySavedName(trimmed);

  if (existsStandaloneSlug(standaloneDashboards, slug, excludeDashboardId)) {
    return "A standalone dashboard with that name already exists.";
  }

  if (existsFolderSlug(projects, slug)) {
    return "Dashboard name conflicts with a folder URL.";
  }

  return null;
}

export function validateSavedFolderDashboardName(
  projectId: string,
  name: string,
  projects: Project[],
  excludeDashboardId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Dashboard name cannot be empty.";

  const project = projects.find((item) => item.id === projectId);
  if (!project) return "Destination folder not found.";

  const slug = slugifySavedName(trimmed);
  const collision = project.dashboards.some(
    (dashboard) =>
      dashboard.id !== excludeDashboardId && getDashboardSlug(dashboard) === slug,
  );

  if (collision) {
    return `A dashboard with that name already exists in "${project.name}".`;
  }

  return null;
}
