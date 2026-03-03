/**
 * Library Composable - useLibrary
 * Manages library data fetching, pagination, filtering, and state
 *
 * Architecture:
 * - Composition API composable for reactive state management
 * - Direct $fetch calls to API endpoints (Nuxt auto-imported)
 * - LibraryService for utility methods
 * - Pagination handling via usePagination composable
 * - Server-side Zod validation with error normalization
 */

import { ref, computed, watch } from "vue";
import type {
  LibraryItem,
  LibrariesResponse,
  LibraryCreateRequest,
  LibraryUpdateRequest,
  LibrarySingleResponse,
} from "~/types";
import { usePagination } from "./usePagination";
import { LibraryService } from "~/services/libraryService";

export interface UseLibraryOptions {
  onError?: (error: string, details?: string[]) => void;
  onSuccess?: (message: string) => void;
}

export interface ApiValidationError {
  field?: string;
  message: string;
}

export function useLibrary(options: UseLibraryOptions = {}) {
  const service = new LibraryService();
  const { $api } = useNuxtApp();
  const refreshVersion = useState<number>("library-refresh-version", () => 0);

  const bumpRefreshVersion = () => {
    refreshVersion.value += 1;
  };

  const uploadDocument = async (file: File): Promise<string> => {
    const isPdf =
      file.type?.toLowerCase() === "application/pdf" ||
      file.name?.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      throw new Error("Only PDF files are allowed for document uploads");
    }

    const formData = new FormData();
    formData.append("purpose", "library-document");
    formData.append("File", file);

    const response = await $api.mutate<{ url: string }>("/api/uploads", {
      method: "POST",
      body: formData,
    });

    if (!response?.url) {
      throw new Error("Document upload failed");
    }

    return response.url;
  };

  const normalizeCreateOrUpdatePayload = async (
    payload: LibraryCreateRequest | LibraryUpdateRequest,
  ): Promise<LibraryCreateRequest | LibraryUpdateRequest> => {
    if (!payload.file) {
      return payload;
    }

    const docsUrl = await uploadDocument(payload.file);

    return {
      ...payload,
      libraryType: payload.libraryType ?? "doc",
      docsUrl,
      file: null,
    };
  };

  const toFormData = (
    payload: LibraryCreateRequest | LibraryUpdateRequest,
  ): FormData => {
    const formData = new FormData();

    if (payload.title !== undefined) formData.append("title", payload.title);
    if (payload.libraryType !== undefined) {
      formData.append("libraryType", payload.libraryType);
    }
    if (payload.url !== undefined && payload.url !== null) {
      formData.append("url", payload.url);
    }
    if ("docsUrl" in payload && payload.docsUrl !== undefined && payload.docsUrl !== null) {
      formData.append("docsUrl", payload.docsUrl);
    }
    if (payload.content !== undefined && payload.content !== null) {
      formData.append("content", payload.content);
    }
    if (payload.file) {
      formData.append("file", payload.file);
    }

    return formData;
  };

  // Pagination
  const pagination = usePagination(); // Default page size: 25 (matches Strapi default)

  // Reactive state
  const libraries = ref<LibraryItem[]>([]);
  const currentLibrary = ref<LibraryItem | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const validationErrors = ref<ApiValidationError[]>([]);
  const searchQuery = ref("");
  const selectedLibraryType = ref("all");
  const total = ref(0);

  /**
   * Computed property: Total number of pages
   */
  const pageCount = computed(() => {
    return Math.ceil(total.value / pagination.pageSize.value);
  });

  /**
   * Computed property: Check if library list is empty
   */
  const isEmpty = computed(() => {
    return !isLoading.value && libraries.value.length === 0;
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
   * Fetches all libraries with pagination and filters
   */
  const fetchLibraries = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      const params: Record<string, any> = {
        page: pagination.page.value,
        pageSize: pagination.pageSize.value,
      };

      if (searchQuery.value.trim()) {
        params.search = searchQuery.value;
      }

      if (selectedLibraryType.value !== "all") {
        params.libraryType = selectedLibraryType.value;
      }

      const response = await $api.fetch<LibrariesResponse>("/api/libraries", {
        method: "GET",
        query: params,
      });

      if (!response?.data) {
        throw new Error("Invalid response structure");
      }

      libraries.value = response.data;
      total.value = response.meta?.pagination?.total || 0;

      options.onSuccess?.("Libraries loaded successfully");
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
   * Fetches a single library by documentId
   * @param documentId - Document ID of the library to fetch
   */
  const fetchLibrary = async (documentId: string): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $api.fetch<LibrarySingleResponse>(
        `/api/libraries/${documentId}`,
        {
          method: "GET",
        },
      );

      if (!response?.data) {
        throw new Error("Invalid response structure");
      }

      currentLibrary.value = response.data;
      options.onSuccess?.("Library loaded successfully");
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
   * Creates a new library item
   * @param payload - Library creation request data
   */
  const createLibrary = async (
    payload: LibraryCreateRequest,
    refreshList: boolean = true,
  ): Promise<LibraryItem | null> => {
    try {
      isLoading.value = true;
      error.value = null;
      const normalizedPayload = await normalizeCreateOrUpdatePayload(payload);
      const formData = toFormData(normalizedPayload);

      const response = await $api.mutate<LibrarySingleResponse>("/api/libraries", {
        method: "POST",
        body: formData,
      });

      options.onSuccess?.("Library created successfully");
      if (response?.data) {
        currentLibrary.value = response.data;
      }

      bumpRefreshVersion();

      if (refreshList) {
        await fetchLibraries();
      }

      return response?.data ?? null;
    } catch (err) {
      const { message, details } = normalizeError(err);
      error.value = message;
      validationErrors.value = details.map((d) => ({ message: d }));
      options.onError?.(message, details);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Updates an existing library item
   * @param documentId - Document ID of the library to update
   * @param payload - Library update request data
   */
  const updateLibrary = async (
    documentId: string,
    payload: LibraryUpdateRequest,
    refreshList: boolean = true,
  ): Promise<LibraryItem | null> => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $api.mutate<LibrarySingleResponse>(
        `/api/libraries/${documentId}`,
        {
          method: "PUT",
          body: toFormData(await normalizeCreateOrUpdatePayload(payload)),
        },
      );

      if (response?.data) {
        currentLibrary.value = response.data;
      }

      options.onSuccess?.("Library updated successfully");
      bumpRefreshVersion();
      if (refreshList) {
        await fetchLibraries();
      }

      return response?.data ?? null;
    } catch (err) {
      const { message, details } = normalizeError(err);
      error.value = message;
      validationErrors.value = details.map((d) => ({ message: d }));
      options.onError?.(message, details);
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Deletes a library item
   * @param documentId - Document ID of the library to delete
   */
  const deleteLibrary = async (documentId: string): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      await $api.mutate(`/api/libraries/${documentId}`, {
        method: "DELETE",
      });

      options.onSuccess?.("Library deleted successfully");
      bumpRefreshVersion();
      // Refresh the list after deletion
      await fetchLibraries();
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
   * Selects a library type and resets pagination
   * @param type - Library type to filter by ("all", "url", "doc", "note")
   */
  const selectLibraryType = (type: string): void => {
    selectedLibraryType.value = type;
    pagination.resetPage();
    fetchLibraries();
  };

  /**
   * Updates search query and resets pagination
   * @param query - Search query string
   */
  const search = (query: string): void => {
    searchQuery.value = query;
    pagination.resetPage();
    fetchLibraries();
  };

  /**
   * Initializes composable by fetching initial data
   */
  const initialize = async (): Promise<void> => {
    await fetchLibraries();
  };

  /**
   * Opens library URL in new tab (utility method)
   * @param url - URL to open
   */
  const openLibraryUrl = (url: string): void => {
    service.openLibraryUrl(url);
  };

  // Watch for pagination changes and re-fetch
  watch(
    () => pagination.page.value,
    () => {
      fetchLibraries();
    },
  );

  watch(
    () => pagination.pageSize.value,
    () => {
      pagination.resetPage();
      fetchLibraries();
    },
  );

  return {
    // State
    libraries,
    currentLibrary,
    isLoading,
    error,
    validationErrors,
    searchQuery,
    selectedLibraryType,
    total,
    pageCount,
    isEmpty,
    pageSizeOptions: [10, 25, 50, 100],
    refreshVersion,

    // Pagination
    page: pagination.page,
    pageSize: pagination.pageSize,

    // Methods
    fetchLibraries,
    fetchLibrary,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    selectLibraryType,
    search,
    initialize,
    openLibraryUrl,
    normalizeError,
  };
}
