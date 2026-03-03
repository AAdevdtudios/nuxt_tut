/**
 * useProjects Composable - Feature-Level State Management
 *
 * Orchestrates projects feature logic:
 * - Manages projects and pagination state
 * - Coordinates with ProjectService
 * - Handles filtering and search
 * - Error handling and notifications
 */

import { ref, computed, watch } from "vue";
import type { Ref, ComputedRef } from "vue";
import type {
  ProjectItem,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ProjectsResponse,
  ProjectSingleResponse,
} from "~/types/project.types";
import { ProjectService } from "~/services/projectService";
import { usePagination } from "./usePagination";

export interface UseProjectsOptions {
  onError?: (error: string, details?: string[]) => void;
  onSuccess?: (message: string) => void;
}

export interface UseProjectsReturn {
  // State
  projects: Ref<ProjectItem[]>;
  currentProject: Ref<ProjectItem | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  searchQuery: Ref<string>;
  validationErrors: Ref<Array<{ field?: string; message: string }>>;

  // Pagination
  page: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
  pageCount: ComputedRef<number>;
  pageSizeOptions: number[];

  // Computed
  isEmpty: ComputedRef<boolean>;

  // Actions
  fetchProjects(): Promise<void>;
  fetchProject(documentId: string): Promise<void>;
  createProject(payload: ProjectCreateRequest): Promise<void>;
  updateProject(
    documentId: string,
    payload: ProjectUpdateRequest,
  ): Promise<void>;
  deleteProject(documentId: string): Promise<void>;
  search(query: string): void;
  initialize(): Promise<void>;
}

/**
 * Main composable for projects feature
 * Manages state, data fetching, and user interactions
 */
export function useProjects(
  options: UseProjectsOptions = {},
): UseProjectsReturn {
  const service = new ProjectService();
  const { $api } = useNuxtApp();
  const pagination = usePagination();

  // Reactive state
  const projects = ref<ProjectItem[]>([]);
  const currentProject = ref<ProjectItem | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const validationErrors = ref<Array<{ field?: string; message: string }>>([]);
  const searchQuery = ref("");

  /**
   * Computed property: Total number of pages
   */
  const pageCount = computed(() => {
    return Math.ceil(pagination.total.value / pagination.pageSize.value);
  });

  /**
   * Computed property: Check if projects list is empty
   */
  const isEmpty = computed(() => {
    return !isLoading.value && projects.value.length === 0;
  });

  /**
   * Normalizes error responses from API or exceptions
   */
  const normalizeError = (err: any): { message: string; details: string[] } => {
    let message = "An error occurred";
    let details: string[] = [];

    if (typeof err === "string") {
      message = err;
    } else if (err instanceof Error) {
      message = err.message;
    } else if (err.data?.statusMessage) {
      message = err.data.statusMessage;

      // Parse validation errors
      if (message.includes("Validation failed:")) {
        const errorPart = message.replace("Validation failed: ", "");
        details = errorPart.split(", ");
      }
    } else if (err.message) {
      message = err.message;
    }

    return { message, details };
  };

  /**
   * Fetches all projects with pagination and filters
   */
  const fetchProjects = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;
      validationErrors.value = [];

      const query = new URLSearchParams();
      query.append("page", pagination.page.value.toString());
      query.append("pageSize", pagination.pageSize.value.toString());

      if (searchQuery.value && searchQuery.value.trim() !== "") {
        query.append("search", searchQuery.value);
      }

      const response = await $api.fetch<ProjectsResponse>(
        `/api/projects?${query.toString()}`,
        {
          method: "GET",
        },
      );

      if (!response?.data) {
        throw new Error("Invalid response structure");
      }

      projects.value = response.data;
      pagination.updatePagination(response.meta?.pagination);

      options.onSuccess?.("Projects loaded successfully");
    } catch (err) {
      const { message, details } = normalizeError(err);
      error.value = message;
      validationErrors.value = details.map((d) => ({ message: d }));
      options.onError?.(message, details);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetches a single project by documentId
   */
  const fetchProject = async (documentId: string): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $api.fetch<ProjectSingleResponse>(
        `/api/projects/${documentId}`,
        {
          method: "GET",
        },
      );

      if (!response?.data) {
        throw new Error("Invalid response structure");
      }

      currentProject.value = response.data;
      options.onSuccess?.("Project loaded successfully");
    } catch (err) {
      const { message, details } = normalizeError(err);
      error.value = message;
      validationErrors.value = details.map((d) => ({ message: d }));
      options.onError?.(message, details);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Creates a new project
   */
  const createProject = async (
    payload: ProjectCreateRequest,
  ): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;
      validationErrors.value = [];

      await $api.mutate<ProjectSingleResponse>("/api/projects", {
        method: "POST",
        body: payload,
      });

      options.onSuccess?.("Project created successfully");
      await fetchProjects();
    } catch (err) {
      const { message, details } = normalizeError(err);
      error.value = message;
      validationErrors.value = details.map((d) => ({ message: d }));
      options.onError?.(message, details);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Updates an existing project
   */
  const updateProject = async (
    documentId: string,
    payload: ProjectUpdateRequest,
  ): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $api.mutate<ProjectSingleResponse>(
        `/api/projects/${documentId}`,
        {
          method: "PUT",
          body: payload,
        },
      );

      if (response?.data) {
        currentProject.value = response.data;
      }

      options.onSuccess?.("Project updated successfully");
      await fetchProjects();
    } catch (err) {
      const { message, details } = normalizeError(err);
      error.value = message;
      validationErrors.value = details.map((d) => ({ message: d }));
      options.onError?.(message, details);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Deletes a project
   */
  const deleteProject = async (documentId: string): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      await $api.mutate(`/api/projects/${documentId}`, {
        method: "DELETE",
      });

      options.onSuccess?.("Project deleted successfully");
      await fetchProjects();
    } catch (err) {
      const { message, details } = normalizeError(err);
      error.value = message;
      validationErrors.value = details.map((d) => ({ message: d }));
      options.onError?.(message, details);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Updates search query and resets pagination
   */
  const search = (query: string): void => {
    searchQuery.value = query;
    pagination.resetPage();
    fetchProjects();
  };

  /**
   * Initializes composable by fetching initial data
   */
  const initialize = async (): Promise<void> => {
    await fetchProjects();
  };

  // Watch for pagination changes
  watch(
    () => pagination.page.value,
    () => {
      fetchProjects();
    },
  );

  watch(
    () => pagination.pageSize.value,
    () => {
      pagination.resetPage();
      fetchProjects();
    },
  );

  return {
    // State
    projects,
    currentProject,
    isLoading,
    error,
    searchQuery,
    validationErrors,

    // Pagination
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    pageCount,
    pageSizeOptions: [10, 25, 50, 100],

    // Computed
    isEmpty,

    // Methods
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    search,
    initialize,
  };
}
