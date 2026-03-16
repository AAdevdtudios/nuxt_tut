/**
 * Projects Pinia Store
 *
 * Normalized state management for projects
 * - Stores project metadata only (no nested libraries)
 * - References libraries via libraryIds
 * - Handles project CRUD operations
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages projects
 * - Dependency Inversion: Doesn't depend on library store
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  ProjectItem,
  ProjectCreateRequest,
  ProjectUpdateRequest,
} from "~/types/project.types";

export interface NormalizedProject {
  id: string;
  documentId: string;
  title: string;
  description?: string | null;
  icons: string;
  color: string;
  start: string;
  end: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  libraryIds: string[]; // Only store IDs, not full objects
  librariesCount: number;
  notesCount: number;
  progressLevel?: number | null;
}

export const useProjectStore = defineStore("projects", () => {
  const getApi = () => {
    const nuxtApp = useNuxtApp();

    if (nuxtApp.$api) {
      return nuxtApp.$api;
    }

    return {
      fetch: <T>(url: string, options?: any) => $fetch<T>(url, options),
      mutate: <T>(url: string, options?: any) => $fetch<T>(url, options),
    };
  };

  // State: Projects by documentId for quick lookup
  const projectsById = ref<Record<string, NormalizedProject>>({});

  // State: Pagination
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    pageCount: 1,
  });

  // State: Current filters
  const searchQuery = ref("");
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Get all projects as array (for rendering lists)
   */
  const allProjects = computed(() => Object.values(projectsById.value));

  /**
   * Check if projects list is empty
   */
  const isEmpty = computed(() => allProjects.value.length === 0);

  /**
   * Get project by documentId
   */
  const getProjectById = (documentId: string) => projectsById.value[documentId];

  /**
   * Fetch all projects with pagination and search
   */
  const fetchProjects = async (page = 1, pageSize = 10, search = "") => {
    try {
      isLoading.value = true;
      error.value = null;

      const query = new URLSearchParams();
      query.append("page", page.toString());
      query.append("pageSize", pageSize.toString());

      if (search && search.trim() !== "") {
        query.append("search", search);
      }

      const response = await getApi().fetch<any>(`/api/projects?${query.toString()}`, {
        method: "GET",
      });

      if (!response?.data) throw new Error("Invalid response structure");

      // Normalize: Extract libraries and store only IDs
      projectsById.value = {};
      response.data.forEach((project: any) => {
        projectsById.value[project.documentId] = normalizeProject(project);
      });

      // Update pagination
      if (response.meta?.pagination) {
        pagination.value = response.meta.pagination;
      }

      searchQuery.value = search;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch projects";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch single project by documentId
   */
  const fetchProject = async (documentId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await getApi().fetch<any>(`/api/projects/${documentId}`, {
        method: "GET",
      });

      if (!response?.data) throw new Error("Invalid response structure");

      projectsById.value[documentId] = normalizeProject(response.data);

      return projectsById.value[documentId];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch project";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Create new project
   */
  const createProject = async (payload: ProjectCreateRequest) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await getApi().mutate<any>("/api/projects", {
        method: "POST",
        body: payload,
      });

      if (!response?.data) throw new Error("Invalid response structure");

      const normalized = normalizeProject(response.data);
      projectsById.value[normalized.documentId] = normalized;

      return normalized;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to create project";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update existing project
   */
  const updateProject = async (
    documentId: string,
    payload: ProjectUpdateRequest,
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await getApi().mutate<any>(`/api/projects/${documentId}`, {
        method: "PUT",
        body: payload,
      });

      if (!response?.data) throw new Error("Invalid response structure");

      const normalized = normalizeProject(response.data);
      projectsById.value[normalized.documentId] = normalized;

      return normalized;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update project";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete project
   */
  const deleteProject = async (documentId: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      await getApi().mutate(`/api/projects/${documentId}`, {
        method: "DELETE",
      });

      // Remove from store
      delete projectsById.value[documentId];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to delete project";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Clear all projects from store
   */
  const clearProjects = () => {
    projectsById.value = {};
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      pageCount: 1,
    };
    searchQuery.value = "";
    error.value = null;
  };

  /**
   * Update search query and reset pagination
   */
  const setSearchQuery = (query: string) => {
    searchQuery.value = query;
    pagination.value.page = 1;
  };

  return {
    // State
    projectsById,
    pagination,
    searchQuery,
    isLoading,
    error,

    // Computed
    allProjects,
    isEmpty,

    // Methods
    getProjectById,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    clearProjects,
    setSearchQuery,
  };
});

/**
 * Normalize project data: Extract libraries, keep only IDs
 */
export function normalizeProject(project: any): NormalizedProject {
  const libraries = Array.isArray(project.libraries) ? project.libraries : [];
  const derivedLibraryIds = libraries
    .map((lib: any) => String(lib.id || lib.documentId || ""))
    .filter(Boolean);
  const apiLibraryIds = Array.isArray(project.libraryIds)
    ? project.libraryIds.map((id: any) => String(id)).filter(Boolean)
    : [];
  const libraryIds = Array.from(new Set([...apiLibraryIds, ...derivedLibraryIds]));

  return {
    id: String(project.id || project.documentId || ""),
    documentId: String(project.documentId || project.id || ""),
    title: project.title,
    description: project.description,
    icons: project.icons,
    color: project.color,
    start: project.start,
    end: project.end,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    publishedAt: project.publishedAt,
    libraryIds, // Only IDs, not full objects
    librariesCount: Number(project.librariesCount ?? 0),
    notesCount: Number(project.notesCount ?? 0),
    progressLevel:
      project.progressLevel === null || project.progressLevel === undefined
        ? null
        : Number(project.progressLevel),
  };
}
