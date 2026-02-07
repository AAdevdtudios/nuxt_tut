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
      @open-resource="library.openLibraryUrl"
      @delete-item="deleteLibrary"
      @edit-item="editLibrary"
    />
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useLibrary } from "~/composables/useLibrary";
import { useLibraryPreferencesStore } from "~/stores/libraryPreferences";

definePageMeta({
  layout: "dashboard",
});

// Toast for notifications
const toast = useToast();

// Initialize library composable with enhanced error handlers
const library = useLibrary({
  onError: (error: string, details?: string[]) => {
    toast.add({
      title: "Error",
      description: error,
      color: "error",
    });

    // Log validation details if available
    if (details && details.length > 0) {
      console.warn("[Library Page] Validation errors:", details);
    }
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

/**
 * Update current page
 * @param newPage - New page number
 */
const updatePage = (newPage: number): void => {
  library.page.value = newPage;
};

/**
 * Update page size and reset to first page
 * @param newPageSize - New page size
 */
const updatePageSize = (newPageSize: number): void => {
  library.pageSize.value = newPageSize;
  library.page.value = 1;
  library.fetchLibraries();
};

/**
 * Delete library item
 * @param documentId - Document ID to delete
 */
const deleteLibrary = async (documentId: string): Promise<void> => {
  try {
    await library.deleteLibrary(documentId);
  } catch (error) {
    console.error("[Library Page] Delete failed:", error);
  }
};

/**
 * Edit library item (navigate to edit modal/page)
 * @param documentId - Document ID to edit
 */
const editLibrary = (documentId: string): void => {
  // TODO: Implement edit functionality
  console.log("[Library Page] Edit item:", documentId);
};

/**
 * Initialize on mount
 */
onMounted(async () => {
  try {
    await library.initialize();
  } catch (error) {
    console.error("[Library Page] Failed to initialize:", error);
    toast.add({
      title: "Initialization Error",
      description: "Failed to load library",
      color: "error",
    });
  }
});
</script>
