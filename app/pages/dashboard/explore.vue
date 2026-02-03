<template>
  <DashboardBodyLayout
    title="Explore"
    description="Discover new topics and study materials"
  >
    <div class="space-y-6">
      <!-- Search Bar -->
      <SearchBar
        :value="explore.searchQuery.value"
        @update:value="explore.search"
      />

      <!-- Categories Filter -->
      <CategoryFilter
        :categories="explore.categories.value"
        :selected="explore.selectedCategory.value"
        @select="explore.selectCategory"
      />

      <!-- Main Content -->
      <ExploreMaterialsSection
        :explores="explore.explores.value"
        :loading="explore.isLoading.value"
        :is-empty="explore.isEmpty.value"
        :page-size="explore.pageSize.value"
        :page-size-options="explore.pageSizeOptions"
        :current-page="explore.page.value"
        :total="explore.total.value"
        :page-count="explore.pageCount.value"
        @update:page-size="updatePageSize"
        @update:page="updatePage"
        @open-resource="explore.openExplore"
        @refresh="explore.fetchExplores"
      />
    </div>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useExplore } from "~/composables/useExplore";

// Imports for components
import SearchBar from "~/components/Explore/SearchBar.vue";
import CategoryFilter from "~/components/Explore/CategoryFilter.vue";
import ExploreMaterialsSection from "~/components/Explore/MaterialsSection.vue";

definePageMeta({
  layout: "dashboard",
});

// Initialize explore composable with error handling
const explore = useExplore({
  onError: (error: string) => {
    useToast().add({
      title: "Error",
      description: error,
      color: "error",
    });
  },
  onSuccess: (message: string) => {
    console.log("[Explore Page]", message);
  },
});

/**
 * Update current page
 * @param newPage - New page number
 */
const updatePage = (newPage: number): void => {
  explore.page.value = newPage;
};

/**
 * Update page size and reset to first page
 * @param newPageSize - New page size
 */
const updatePageSize = (newPageSize: number): void => {
  console.log(newPageSize);

  explore.pageSize.value = newPageSize;
  explore.page.value = 1;
  explore.fetchExplores();
};

// Initialize on mount
onMounted(async () => {
  try {
    await explore.initialize();
  } catch (error) {
    console.error("[Explore Page] Failed to initialize:", error);
    useToast().add({
      title: "Initialization Error",
      description: "Failed to load explore data",
      color: "error",
    });
  }
});
</script>
