<template>
  <div class="flex items-center justify-between">
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
        v-model="localValue"
        :items="documentType"
        class="px-7 max-w-md"
        @change="emit('update:value', localValue)"
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

const emit = defineEmits(["update:searchQuery", "update:value", "changeView"]);
const props = defineProps({
  searchQuery: String,
  value: String,
  viewMode: {
    type: String,
    default: "grid",
  },
});

const documentType = ref<SelectItem[]>([
  { label: "All", value: "all" },
  { label: "PDF", value: "pdf" },
  { label: "DOCX", value: "docx" },
  { label: "TXT", value: "txt" },
  { label: "Website", value: "website" },
  { label: "AI Generated", value: "ai_generated" },
]);
const localSearchQuery = ref(props.searchQuery ?? "");
const localValue = ref(props.value ?? "All");
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
  }
);
watch(
  () => props.value,
  (val) => {
    if (val !== localValue.value) localValue.value = val || "All";
  }
);

const viewMode = computed({
  get: () => props.viewMode,
  set: (val: "list" | "grid") => emit("changeView", val),
});

function changeViewBtn(view: "list" | "grid") {
  viewMode.value = view;
}
</script>
