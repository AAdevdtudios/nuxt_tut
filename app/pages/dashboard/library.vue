<template>
  <DashboardBodyLayout
    title="Library"
    description="Manage your study materials and resources"
  >
    <!-- Add Content Button -->
    <template #actions>
      <AddProjectBtn />
    </template>

    <!-- Header with Search & Filters -->
    <LibraryHeaderActions
      :search-query="library.searchQuery.value"
      :library-type="library.selectedLibraryType.value"
      :view-mode="viewMode"
      @update:search-query="library.search"
      @update:library-type="library.selectLibraryType"
      @change-view="viewMode = $event"
    />

    <!-- Main Content -->
    <LibraryContent
      :view-type="viewMode"
      :items-list="library.libraries.value"
      :loading="library.isLoading.value"
      :is-empty="library.isEmpty.value"
      :page-size="library.pageSize.value"
      :page-size-options="library.pageSizeOptions"
      :current-page="library.page.value"
      :total="library.total.value"
      :page-count="library.pageCount.value"
      @update:page-size="updatePageSize"
      @update:page="updatePage"
      @open-resource="openLibrary"
      @delete-item="deleteLibrary"
      @edit-item="editLibrary"
    />
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useLibrary } from "~/composables/useLibrary";
import { useLibraryPreferencesStore } from "~/stores/libraryPreferences";
import { usePaginationHandlers } from "~/composables/usePaginationHandlers";
import type { LibraryItem } from "~/types";

definePageMeta({
  layout: "newdash",
});

// Toast for notifications
const toast = useToast();
const router = useRouter();

// Initialize library composable with enhanced error handlers
const library = useLibrary({
  onError: (error: string, details?: string[]) => {
    toast.add({
      title: "Error",
      description: error,
      color: "error",
    });
  },
  onSuccess: (message: string) => {
    toast.add({
      title: "Success",
      description: message,
      color: "success",
    });
  },
});

// Initialize library preferences store
const preferencesStore = useLibraryPreferencesStore();

// View mode - using store with reactive getter/setter
const viewMode = computed({
  get: () => preferencesStore.viewMode,
  set: (value: "grid" | "list") => preferencesStore.setViewMode(value),
});

// Initialize pagination handlers
const { updatePage, updatePageSize } = usePaginationHandlers(
  { page: library.page, pageSize: library.pageSize },
  () => library.fetchLibraries(),
);

/**
 * Delete library item
 * @param documentId - Document ID to delete
 */
const deleteLibrary = async (documentId: string): Promise<void> => {
  try {
    await library.deleteLibrary(documentId);
  } catch {}
};

const openLibrary = (item: LibraryItem): void => {
  if (item.libraryType === "note") {
    router.push(`/dashboard/notes/${item.documentId}`);
    return;
  }

  library.openLibraryUrl(item.url || item.fileUrl || "");
};

/**
 * Edit library item (navigate to edit modal/page)
 * @param documentId - Document ID to edit
 */
const editLibrary = (documentId: string): void => {
  router.push(`/dashboard/notes/${documentId}`);
};

/**
 * Initialize on mount
 */
onMounted(async () => {
  try {
    await library.initialize();
  } catch {
    toast.add({
      title: "Initialization Error",
      description: "Failed to load library",
      color: "error",
    });
  }
});

watch(
  () => library.refreshVersion.value,
  async () => {
    try {
      await library.fetchLibraries();
    } catch {}
  },
);
</script>
