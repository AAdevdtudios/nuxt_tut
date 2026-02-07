<template>
  <div class="flex gap-2 items-center justify-between">
    <UFieldGroup class="flex flex-1">
      <UInput
        v-model="localSearchQuery"
        placeholder="Search your library..."
        icon="i-lucide-search"
        class="relative flex-1 max-w-md"
        clearable
        :loading="searchLoading"
        @input="onInput"
      />
      <USelect
        v-model="localLibraryType"
        :items="libraryTypes"
        class="px-7 max-w-md"
        @change="emit('update:libraryType', localLibraryType)"
      />
    </UFieldGroup>
    <UFieldGroup>
      <UButton
        icon="i-lucide-list"
        variant="subtle"
        :color="viewMode === 'list' ? 'primary' : 'neutral'"
        aria-label="List View"
        @click="changeViewBtn('list')"
      />
      <UButton
        icon="i-lucide-grid"
        variant="subtle"
        :color="viewMode === 'grid' ? 'primary' : 'neutral'"
        aria-label="Grid View"
        @click="changeViewBtn('grid')"
      />
    </UFieldGroup>
  </div>
</template>

<script lang="ts" setup>
import type { SelectItem } from "@nuxt/ui";

const emit = defineEmits<{
  "update:searchQuery": [value: string];
  "update:libraryType": [value: string];
  changeView: [value: "list" | "grid"];
}>();

const props = defineProps<{
  searchQuery?: string;
  libraryType?: string;
  viewMode?: "list" | "grid";
}>();

const libraryTypes = ref<SelectItem[]>([
  { label: "All", value: "all" },
  { label: "Documents", value: "doc" },
  { label: "Links", value: "url" },
  { label: "Notes", value: "note" },
]);

const localSearchQuery = ref(props.searchQuery ?? "");
const localLibraryType = ref(props.libraryType ?? "all");
const searchLoading = ref(false);

let searchTimeout: ReturnType<typeof setTimeout> | null = null;

function onInput() {
  searchLoading.value = true;
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    emit("update:searchQuery", localSearchQuery.value);
    searchLoading.value = false;
  }, 500); // 500ms debounce
}

watch(
  () => props.searchQuery,
  (val) => {
    if (val !== localSearchQuery.value) localSearchQuery.value = val || "";
  },
);
watch(
  () => props.libraryType,
  (val) => {
    if (val !== localLibraryType.value) localLibraryType.value = val || "all";
  },
);

const viewMode = computed({
  get: () => props.viewMode || "grid",
  set: (val: "list" | "grid") => emit("changeView", val),
});

function changeViewBtn(view: "list" | "grid") {
  viewMode.value = view;
}
</script>
