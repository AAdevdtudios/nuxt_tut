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
    <LibraryContent :viewType="viewMode" :itemsList="filteredItems" />
  </DashboardBodyLayout>
</template>

<script lang="ts" setup>
import { type LibraryItem, type LibraryTypeValue } from "~/types";

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
  { id: 3, title: "Document D", type: "docx", size: 4.0, content: "" },
  { id: 4, title: "Example Website", type: "website", size: 2.1, content: "" },
  { id: 5, title: "Example Devs", type: "website", size: 1.5, content: "" },
  { id: 6, title: "Example Note", type: "note", size: 1.5, content: "" },
  {
    id: 7,
    title: "AI Generated Content",
    type: "ai_generated",
    size: 2.0,
    content: "",
  },
  { id: 8, title: "Biology Chapter 5", type: "pdf", size: 3.0, content: "" },
  { id: 9, title: "Another Document", type: "docx", size: 1.2, content: "" },
]);

// Filter items based on search query and document type
const filteredItems = computed(() => {
  return itemsList.value.filter((item) => {
    const matchesSearch =
      searchQuery.value === "" ||
      item.title.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesType = value.value === "all" || item.type === value.value;
    return matchesSearch && matchesType;
  });
});

watch([searchQuery, value], ([newSearch, newValue]) => {
  console.log("Search Query:", newSearch);
  console.log("Document Type:", newValue);
});
</script>
