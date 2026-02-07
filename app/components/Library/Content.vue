<template>
  <!-- Loading State -->
  <div v-if="loading" class="flex items-center justify-center py-12">
    <div class="text-center">
      <UIcon
        name="i-lucide-loader-2"
        class="h-8 w-8 animate-spin mx-auto mb-2"
      />
      <p class="text-muted-foreground">Loading library...</p>
    </div>
  </div>

  <!-- Empty State -->
  <div
    v-else-if="isEmpty"
    class="flex flex-col items-center justify-center py-12"
  >
    <UIcon name="i-lucide-inbox" class="h-12 w-12 text-muted-foreground mb-4" />
    <h3 class="text-lg font-semibold text-foreground">No items found</h3>
    <p class="text-sm text-muted-foreground">
      {{
        searchQuery
          ? "Try adjusting your search filters"
          : "Start by adding your first library item"
      }}
    </p>
  </div>

  <!-- Content Grid/List -->
  <div v-else :class="viewType === 'grid' ? gridClass : listClass">
    <LibraryCard
      v-for="item in itemsList"
      :key="item.documentId"
      :item="item"
      :view-type="viewType"
      @open="$emit('open-resource', item.url ?? '')"
      @edit="$emit('edit-item', item.documentId)"
      @delete="$emit('delete-item', item.documentId)"
    />
  </div>

  <!-- Pagination -->
  <div
    v-if="!isEmpty && !loading"
    class="mt-8 flex items-center justify-between"
  >
    <div class="flex items-center gap-4">
      <label class="text-sm font-medium text-foreground">
        Items per page:
        <USelect
          :modelValue="pageSize"
          :items="
            pageSizeOptions.map((size) => ({
              label: size.toString(),
              value: size,
            }))
          "
          class="ml-2 inline-block w-20"
          @update:modelValue="$emit('update:page-size', $event)"
        />
      </label>
      <p class="text-sm text-muted-foreground">
        Showing {{ (currentPage - 1) * pageSize + 1 }} to
        {{ Math.min(currentPage * pageSize, total) }} of {{ total }}
      </p>
    </div>
    <UPagination
      v-model="currentPageModel"
      :page-count="pageSize"
      :total="total"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LibraryItem } from "~/types";

interface Props {
  itemsList: LibraryItem[];
  viewType: "grid" | "list";
  loading?: boolean;
  isEmpty?: boolean;
  pageSize: number;
  pageSizeOptions: number[];
  currentPage: number;
  total: number;
  pageCount: number;
  searchQuery?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  isEmpty: false,
  searchQuery: "",
});

const emit = defineEmits<{
  "update:page": [page: number];
  "update:page-size": [size: number];
  "open-resource": [url: string];
  "delete-item": [documentId: string];
  "edit-item": [documentId: string];
}>();

const gridClass = "grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4";
const listClass = "flex flex-col gap-2";

const currentPageModel = computed({
  get: () => props.currentPage,
  set: (value) => emit("update:page", value),
});
</script>
