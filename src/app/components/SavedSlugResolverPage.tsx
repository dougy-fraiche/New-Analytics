import { useParams } from "react-router";
import { useProjects } from "../contexts/ProjectContext";
import {
  findProjectBySlug,
  findStandaloneDashboardBySlug,
} from "../lib/saved-slugs";
import { SavedFoldersPage } from "./SavedFoldersPage";
import { DashboardPage } from "./DashboardPage";

export function SavedSlugResolverPage() {
  const { savedSlug } = useParams<{ savedSlug?: string }>();
  const { projects, standaloneDashboards } = useProjects();

  if (!savedSlug) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h1 className="text-4xl mb-2">404</h1>
          <p className="text-muted-foreground">Page not found</p>
        </div>
      </div>
    );
  }

  const project = findProjectBySlug(projects, savedSlug);
  if (project) {
    return <SavedFoldersPage resolvedFolderId={project.id} />;
  }

  const standaloneDashboard = findStandaloneDashboardBySlug(standaloneDashboards, savedSlug);
  if (standaloneDashboard) {
    return <DashboardPage resolvedStandaloneDashboardId={standaloneDashboard.id} />;
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center">
        <h1 className="text-4xl mb-2">404</h1>
        <p className="text-muted-foreground">Saved item not found</p>
      </div>
    </div>
  );
}
