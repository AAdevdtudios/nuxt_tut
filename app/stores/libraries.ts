/**
 * Libraries Pinia Store
 *
 * Normalized state management for libraries
 * - Stores libraries as { byId: Record<id, Library> }
 * - Libraries are stored once and referenced by ID
 * - Projects reference libraries via libraryIds
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages libraries
 * - No circular dependencies with projects store
 */

import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  LibraryItem,
  LibraryCreateRequest,
  LibraryUpdateRequest,
} from "~/types";

export const useLibraryStore = defineStore("libraries", () => {
  // State: Normalized libraries by ID
  const librariesById = ref<Record<string | number, LibraryItem>>({});

  // State: Pagination
  const pagination = ref({
    page: 1,
    pageSize: 25,
    total: 0,
    pageCount: 1,
  });

  // State: Current filters
  const searchQuery = ref("");
  const selectedType = ref("all");
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * Get all libraries as array (for rendering lists)
   */
  const allLibraries = computed(() => Object.values(librariesById.value));

  /**
   * Get library by ID
   */
  const getLibraryById = (id: string | number) => librariesById.value[id];

  /**
   * Get libraries by IDs (used for project → libraries resolution)
   */
  const getLibrariesByIds = (ids: (string | number)[]) =>
    ids.map((id) => librariesById.value[id]).filter(Boolean);

  /**
   * Check if libraries list is empty
   */
  const isEmpty = computed(() => allLibraries.value.length === 0);

  /**
   * Get filtered libraries by type
   */
  const getLibrariesByType = (type: string) => {
    if (type === "all" || !type) return allLibraries.value;
    return allLibraries.value.filter((lib) => lib.libraryType === type);
  };

  /**
   * Fetch all libraries with pagination and search
   */
  const fetchLibraries = async (
    page = 1,
    pageSize = 25,
    search = "",
    type = "all",
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const query = new URLSearchParams();
      query.append("page", page.toString());
      query.append("pageSize", pageSize.toString());

      if (search && search.trim() !== "") {
        query.append("search", search);
      }

      const response = await $fetch<any>(`/api/libraries?${query.toString()}`);

      if (!response?.data || !Array.isArray(response.data)) {
        throw new Error("Invalid response structure");
      }

      // Normalize: Store libraries by ID (upsert pattern)
      response.data.forEach((lib: any) => {
        librariesById.value[lib.id] = lib;
      });

      // Update pagination
      if (response.meta?.pagination) {
        pagination.value = response.meta.pagination;
      }

      searchQuery.value = search;
      selectedType.value = type;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch libraries";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch single library by ID
   */
  const fetchLibrary = async (id: string | number) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch<any>(`/api/libraries/${id}`);

      if (!response?.data) throw new Error("Invalid response structure");

      librariesById.value[response.data.id] = response.data;

      return response.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch library";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Create new library
   */
  const createLibrary = async (payload: LibraryCreateRequest) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch<any>("/api/libraries", {
        method: "POST",
        body: payload,
      });

      if (!response?.data) throw new Error("Invalid response structure");

      librariesById.value[response.data.id] = response.data;

      return response.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to create library";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update existing library
   */
  const updateLibrary = async (
    id: string | number,
    payload: LibraryUpdateRequest,
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch<any>(`/api/libraries/${id}`, {
        method: "PUT",
        body: payload,
      });

      if (!response?.data) throw new Error("Invalid response structure");

      librariesById.value[response.data.id] = response.data;

      return response.data;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update library";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Delete library
   */
  const deleteLibrary = async (id: string | number) => {
    try {
      isLoading.value = true;
      error.value = null;

      await $fetch(`/api/libraries/${id}`, {
        method: "DELETE",
      });

      // Remove from store
      delete librariesById.value[id];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to delete library";
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Batch fetch libraries (used when resolving project → libraries)
   */
  const ensureLibrariesLoaded = async (ids: (string | number)[]) => {
    const missingIds = ids.filter((id) => !librariesById.value[id]);

    if (missingIds.length === 0) return; // All already loaded

    try {
      // Fetch missing libraries in parallel
      const promises = missingIds.map((id) => fetchLibrary(id));
      await Promise.allSettled(promises);
    } catch (err) {
      console.error("[LibraryStore] Error loading libraries:", err);
    }
  };

  /**
   * Clear all libraries from store
   */
  const clearLibraries = () => {
    librariesById.value = {};
    pagination.value = {
      page: 1,
      pageSize: 25,
      total: 0,
      pageCount: 1,
    };
    searchQuery.value = "";
    selectedType.value = "all";
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
    librariesById,
    pagination,
    searchQuery,
    selectedType,
    isLoading,
    error,

    // Computed
    allLibraries,
    isEmpty,

    // Methods
    getLibraryById,
    getLibrariesByIds,
    getLibrariesByType,
    fetchLibraries,
    fetchLibrary,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    ensureLibrariesLoaded,
    clearLibraries,
    setSearchQuery,
  };
});
