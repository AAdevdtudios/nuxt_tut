<template>
  <DashboardBodyLayout
    title="Library"
    description="Manage your study materials and resources"
  >
    <template #actions>
      <AddProjectBtn />
    </template>
    <LibraryHeaderActions
      v-model:searchQuery="searchQuery"
      v-model:value="value"
      :viewMode="viewMode"
      @changeView="(view) => (viewMode = view)"
    />
    <LibraryContent
      :searchQuery="searchQuery"
      :documentType="value"
      :viewType="viewMode"
      :itemsList="itemsList"
    />
  </DashboardBodyLayout>
</template>

<script lang="ts" setup>
import { libraryTypes, type LibraryItem, type LibraryTypeValue } from "~/types";

// No additional script logic needed for this simple library page
definePageMeta({
  layout: "dashboard",
});
const value = ref<LibraryTypeValue>("all");
const searchQuery = ref("");
const viewMode = ref<"list" | "grid">("grid");
const itemsList = ref<LibraryItem[]>([
  {
    id: 1,
    title: "Advanced Calculus Notes",
    type: "pdf",
    size: 2.4,
    content: "",
  },
  { id: 2, title: "Biology Chapter 5", type: "pdf", size: 2.0, content: "" },
  { id: 3, title: "Another Document", type: "docx", size: 1.2, content: "" },
]);

watch([searchQuery, value], ([newSearch, newValue]) => {
  console.log("Search Query:", newSearch);
  console.log("Document Type:", newValue);
});
</script>
