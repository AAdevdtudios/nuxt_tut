<template>
  <div>
    <!-- Header with title and page size selector -->
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-xl font-semibold text-foreground">Available Resources</h3>
      <USelect
        :modelValue="pageSize"
        :items="
          pageSizeOptions.map((size) => ({
            label: size.toString(),
            value: size,
          }))
        "
        class="w-24"
        placeholder="Page Size"
        @update:modelValue="$emit('update:page-size', $event)"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader" class="h-8 w-8 animate-spin text-primary" />
    </div>

    <!-- Empty State -->
    <UEmpty
      v-else-if="isEmpty"
      icon="i-lucide-inbox"
      title="No resources found"
      description="Try adjusting your search or category filters"
      :actions="[
        {
          label: 'Refresh',
          variant: 'outline',
          color: 'primary',
          onClick: () => $emit('refresh'),
        },
      ]"
    />

    <!-- Resources List -->
    <div v-else class="space-y-3">
      <ExploreResourceCard
        v-for="item in explores"
        :key="item.id"
        :explore="item"
        @open="$emit('open-resource', item.url)"
      />

      <!-- Pagination -->
      <div class="flex justify-center mt-8">
        <UPagination
          :page="currentPage"
          :total="total"
          :itemsPerPage="pageSize"
          active-color="primary"
          active-variant="subtle"
          @update:page="$emit('update:page', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Explore } from "~/types/explore.types";
import ExploreResourceCard from "./ResourceCard.vue";

/**
 * ExploreMaterialsSection Component
 *
 * Displays a paginated list of explore resources with loading and empty states
 * Manages pagination and page size updates
 *
 * @example
 * ```vue
 * <ExploreMaterialsSection
 *   :explores="explores"
 *   :loading="isLoading"
 *   :is-empty="isEmpty"
 *   :page-size="pageSize"
 *   :page-size-options="pageSizeOptions"
 *   :current-page="page"
 *   :total="total"
 *   :page-count="pageCount"
 *   @update:page-size="updatePageSize"
 *   @update:page="updatePage"
 *   @open-resource="openExplore"
 *   @refresh="fetchExplores"
 * />
 * ```
 */

defineProps<{
  /** List of explores/resources to display */
  explores: Explore[];
  /** Loading state */
  loading: boolean;
  /** Whether the list is empty */
  isEmpty: boolean;
  /** Current page size */
  pageSize: number;
  /** Available page size options */
  pageSizeOptions: number[];
  /** Current page number */
  currentPage: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  pageCount: number;
}>();

defineEmits<{
  /** Emitted when page size changes */
  "update:page-size": [size: number];
  /** Emitted when current page changes */
  "update:page": [page: number];
  /** Emitted when a resource should be opened */
  "open-resource": [url: string];
  /** Emitted when the list should be refreshed */
  refresh: [];
}>();
</script>
