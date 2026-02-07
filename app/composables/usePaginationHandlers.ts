/**
 * usePaginationHandlers Composable - Pagination UI Handler Logic
 *
 * Provides reusable pagination event handlers for pages
 * Eliminates duplicate pagination update logic across pages
 *
 * SOLID Principles:
 * - Single Responsibility: Handles pagination UI events only
 * - DRY: Eliminates duplicate handler code
 */

import type { Ref } from "vue";

export interface PaginationState {
  page: Ref<number>;
  pageSize: Ref<number>;
}

export interface UsePaginationHandlersReturn {
  updatePage: (newPage: number) => void;
  updatePageSize: (newPageSize: number) => void;
}

/**
 * Composable for common pagination event handlers
 * Encapsulates the logic for updating page and page size
 *
 * @param pagination - Pagination state object with page and pageSize refs
 * @param onFetch - Callback function to fetch data when pagination changes
 * @returns Pagination event handlers
 *
 * @example
 * const { updatePage, updatePageSize } = usePaginationHandlers(
 *   { page: explore.page, pageSize: explore.pageSize },
 *   () => explore.fetchExplores()
 * );
 */
export function usePaginationHandlers(
  pagination: PaginationState,
  onFetch: () => Promise<void> | void,
): UsePaginationHandlersReturn {
  /**
   * Handle page change
   * @param newPage - New page number
   */
  const updatePage = (newPage: number): void => {
    pagination.page.value = newPage;
  };

  /**
   * Handle page size change
   * Resets to page 1 and triggers data fetch
   * @param newPageSize - New page size
   */
  const updatePageSize = (newPageSize: number): void => {
    pagination.pageSize.value = newPageSize;
    pagination.page.value = 1;
    onFetch();
  };

  return {
    updatePage,
    updatePageSize,
  };
}
