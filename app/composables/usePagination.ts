/**
 * usePagination Composable - Pagination State Management
 *
 * Handles all pagination-related state and logic
 * Separates pagination concerns from explore logic
 *
 * SOLID Principles:
 * - Single Responsibility: Only manages pagination state
 * - Dependency Inversion: Doesn't depend on explore logic
 */

import { ref, watch } from "vue";
import type { Ref } from "vue";
import type { PaginationMeta } from "~/types/explore.types";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "~/types/explore.types";

export interface UsePaginationOptions {
  onPageChange?: () => void;
  onPageSizeChange?: () => void;
}

export interface UsePaginationReturn {
  page: Ref<number>;
  pageSize: Ref<number>;
  total: Ref<number>;
  pageCount: Ref<number>;
  pageSizeOptions: number[];

  // Actions
  updatePagination(meta: PaginationMeta): void;
  resetPage(): void;
  nextPage(): void;
  previousPage(): void;
}

/**
 * Composable for managing pagination state
 * Decouples pagination logic from explore feature logic
 *
 * @param options - Configuration options
 * @returns Pagination state and methods
 *
 * @example
 * const { page, pageSize, total, updatePagination } = usePagination({
 *   onPageChange: () => refetch()
 * });
 */
export function usePagination(
  options: UsePaginationOptions = {},
): UsePaginationReturn {
  // State
  const page = ref(1);
  const pageSize = ref(DEFAULT_PAGE_SIZE);
  const total = ref(0);
  const pageCount = ref(1);

  // Watch for page changes
  watch(page, () => {
    options.onPageChange?.();
  });

  // Watch for page size changes
  watch(pageSize, () => {
    page.value = 1; // Reset to first page when page size changes
    options.onPageSizeChange?.();
  });

  /**
   * Update pagination metadata from API response
   * @param meta - Pagination metadata from backend
   */
  const updatePagination = (meta: PaginationMeta): void => {
    page.value = meta.page;
    pageSize.value = meta.pageSize;
    total.value = meta.total;
    pageCount.value = meta.pageCount;
  };

  /**
   * Reset pagination to first page
   */
  const resetPage = (): void => {
    page.value = 1;
  };

  /**
   * Navigate to next page if available
   */
  const nextPage = (): void => {
    if (page.value < pageCount.value) {
      page.value += 1;
    }
  };

  /**
   * Navigate to previous page if available
   */
  const previousPage = (): void => {
    if (page.value > 1) {
      page.value -= 1;
    }
  };

  return {
    page,
    pageSize,
    total,
    pageCount,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    updatePagination,
    resetPage,
    nextPage,
    previousPage,
  };
}
