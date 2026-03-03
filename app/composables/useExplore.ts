/**
 * useExplore Composable - Feature-Level State Management
 *
 * Orchestrates explore feature logic:
 * - Manages explore and category state
 * - Coordinates with pagination
 * - Handles filtering and search
 * - Error handling and notifications
 *
 * SOLID Principles:
 * - Single Responsibility: Manages explore feature lifecycle
 * - Dependency Inversion: Uses injected services
 * - Open/Closed: Easy to extend functionality
 */

import { ref, computed } from "vue";
import type { Ref, ComputedRef } from "vue";
import type {
  Category,
  Explore,
  Language,
  ExploresQueryParams,
  CategoriesResponse,
  ExploresResponse,
} from "~/types/explore.types";
import { DEFAULT_CATEGORY } from "~/types/explore.types";
import { ExploreService } from "~/services/exploreService";
import { usePagination } from "./usePagination";

export interface UseExploreOptions {
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export interface UseExploreReturn {
  // State
  explores: Ref<Explore[]>;
  categories: Ref<Category[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  searchQuery: Ref<string>;
  selectedCategory: Ref<string>;

  // Pagination
  page: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
  pageCount: Ref<number>;
  pageSizeOptions: number[];

  // Computed
  uniqueLanguages: Readonly<ComputedRef<Language[]>>;
  isLoading: Readonly<ComputedRef<boolean>>;
  isEmpty: Readonly<ComputedRef<boolean>>;

  // Actions
  fetchExplores(): Promise<void>;
  fetchCategories(): Promise<void>;
  selectCategory(categoryId: string): void;
  search(query: string): void;
  openExplore(url: string): void;
  formatDownloads(downloads: string | number): string;
  initialize(): Promise<void>;
}

/**
 * Main composable for explore feature
 * Manages state, data fetching, and user interactions
 *
 * @param options - Configuration options
 * @returns Explore feature state and methods
 *
 * @example
 * const explore = useExplore();
 * await explore.initialize();
 */
export function useExplore(options: UseExploreOptions = {}): UseExploreReturn {
  // Services
  const service = new ExploreService();
  const { $api } = useNuxtApp();

  // State
  const explores = ref<Explore[]>([]);
  const categories = ref<Category[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Filters
  const searchQuery = ref("");
  const selectedCategory = ref(DEFAULT_CATEGORY);

  // Pagination
  const pagination = usePagination({
    onPageChange: () => fetchExplores(),
    onPageSizeChange: () => fetchExplores(),
  });

  // Computed properties
  const uniqueLanguages = computed((): Language[] => {
    return service.extractUniqueLanguages(explores.value);
  });

  const isLoading = computed((): boolean => loading.value);

  const isEmpty = computed((): boolean => {
    return explores.value.length === 0 && !loading.value;
  });

  /**
   * Fetches explores based on current filters and pagination
   */
  const fetchExplores = async (): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      const params: ExploresQueryParams = {
        page: pagination.page.value,
        pageSize: pagination.pageSize.value,
        search: searchQuery.value || undefined,
        categoryId:
          selectedCategory.value !== DEFAULT_CATEGORY
            ? selectedCategory.value
            : undefined,
      };

      const response = await $api.fetch<ExploresResponse>("/api/explores", {
        method: "GET",
        query: {
          page: params.page,
          pageSize: params.pageSize,
          ...(params.search && { search: params.search }),
          ...(params.categoryId && { categoryId: params.categoryId }),
        },
      });

      explores.value = response.items || [];
      pagination.updatePagination({
        page: response.page,
        pageSize: response.pageSize,
        pageCount: Math.max(
          1,
          Math.ceil(response.totalCount / Math.max(1, response.pageSize)),
        ),
        total: response.totalCount,
      });

      options.onSuccess?.("Explores loaded successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch explores";
      error.value = errorMessage;
      options.onError?.(errorMessage);
      console.error("[useExplore] fetchExplores error:", err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Fetches all available categories
   */
  const fetchCategories = async (): Promise<void> => {
    try {
      loading.value = true;
      error.value = null;

      const response = await $api.fetch<CategoriesResponse>("/api/categories", {
        method: "GET",
      });

      categories.value = response.items || [];

      options.onSuccess?.("Categories loaded successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch categories";
      error.value = errorMessage;
      options.onError?.(errorMessage);
      console.error("[useExplore] fetchCategories error:", err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Selects a category and resets pagination
   * @param categoryId - Category id to select
   */
  const selectCategory = (categoryId: string): void => {
    selectedCategory.value = categoryId;
    pagination.resetPage();
    fetchExplores();
  };

  /**
   * Updates search query and resets pagination
   * @param query - Search query string
   */
  const search = (query: string): void => {
    searchQuery.value = query;
    pagination.resetPage();
    fetchExplores();
  };

  /**
   * Opens an explore resource in a new tab
   * @param url - Resource URL
   */
  const openExplore = (url: string): void => {
    service.openResource(url);
  };

  /**
   * Formats download count for display
   * @param downloads - Download count
   * @returns Formatted download count
   */
  const formatDownloads = (downloads: string | number): string => {
    return service.formatDownloadCount(downloads);
  };

  /**
   * Initializes the feature by loading categories and explores
   * Call this on component mount
   */
  const initialize = async (): Promise<void> => {
    try {
      await Promise.all([fetchCategories(), fetchExplores()]);
    } catch (err) {
      console.error("[useExplore] initialize error:", err);
      throw err;
    }
  };

  return {
    // State
    explores,
    categories,
    loading,
    error,
    searchQuery,
    selectedCategory,

    // Pagination
    page: pagination.page,
    pageSize: pagination.pageSize,
    total: pagination.total,
    pageCount: pagination.pageCount,
    pageSizeOptions: pagination.pageSizeOptions,

    // Computed
    uniqueLanguages,
    isLoading,
    isEmpty,

    // Actions
    fetchExplores,
    fetchCategories,
    selectCategory,
    search,
    openExplore,
    formatDownloads,
    initialize,
  };
}
