/**
 * useProjectRelationships Composable
 *
 * Resolves relationships between projects and libraries
 * Components use computed properties here instead of relying on API shape
 *
 * Usage in components:
 * const { projectWithLibraries, projectLibraries } = useProjectRelationships(projectId)
 */

import { computed } from "vue";
import { useProjectStore } from "~/stores/projects";
import { useLibraryStore } from "~/stores/libraries";
import { ProjectService } from "~/services/projectService";

export function useProjectRelationships(projectId: string) {
  const projectStore = useProjectStore();
  const libraryStore = useLibraryStore();
  const projectService = new ProjectService();

  /**
   * Get project details
   */
  const project = computed(() => projectStore.getProjectById(projectId));

  /**
   * Get libraries for this project
   */
  const projectLibraries = computed(() => {
    if (!project.value) return [];
    return libraryStore.getLibrariesByIds(project.value.libraryIds);
  });

  /**
   * Get project with all metadata (formatted for display)
   */
  const projectWithMetadata = computed(() => {
    if (!project.value) return null;

    return {
      ...project.value,
      formattedDueDate: projectService.formatDateRange(
        project.value.start,
        project.value.end,
      ),
      progress: projectService.calculateProgress(
        project.value.start,
        project.value.end,
      ),
      daysRemaining: projectService.daysRemaining(project.value.end),
      isOverdue: projectService.isOverdue(project.value.end),
      colorClass: projectService.getColorClass(project.value.color),
      status: projectService.getStatus(project.value.start, project.value.end),
    };
  });

  /**
   * Ensure all libraries for this project are loaded
   */
  const ensureLibrariesLoaded = async () => {
    if (!project.value) return;
    await libraryStore.ensureLibrariesLoaded(project.value.libraryIds);
  };

  return {
    project,
    projectLibraries,
    projectWithMetadata,
    ensureLibrariesLoaded,
  };
}

/**
 * useLibraryRelationships Composable
 *
 * For resolving which projects a library belongs to
 * (if needed later)
 */
export function useLibraryRelationships(libraryId: string | number) {
  const libraryStore = useLibraryStore();
  const projectStore = useProjectStore();

  /**
   * Get library details
   */
  const library = computed(() => libraryStore.getLibraryById(libraryId));

  /**
   * Get projects that reference this library
   * (Linear search - use only if needed, consider inverting the relationship)
   */
  const projectsWithLibrary = computed(() => {
    const projects = projectStore.allProjects;
    return projects.filter((p) => p.libraryIds.includes(libraryId));
  });

  return {
    library,
    projectsWithLibrary,
  };
}
