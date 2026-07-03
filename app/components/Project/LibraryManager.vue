<template>
  <div class="px-2">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-semibold">{{ config.headerTitle }}</h2>
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted">{{ linkedCount }} linked</span>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          size="sm"
          @click="openPicker"
        >
          {{ config.addButtonLabel }}
        </UButton>
      </div>
    </div>

    <div
      v-if="renderedItems.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <div
        v-for="item in renderedItems"
        :key="getItemId(item)"
        class="p-4 border border-default rounded-lg flex justify-between items-center gap-4"
      >
        <div class="flex gap-2 min-w-0">
          <UAvatar
            size="3xl"
            :icon="iconMap[resolveLibraryType(item)]"
            class="rounded-lg bg-secondary/10 text-secondary-foreground"
          />
          <div class="min-w-0">
            <h3 class="text-lg font-medium truncate">{{ item.title }}</h3>
            <p class="text-sm text-muted truncate">
              {{ getDescription(item) }}
            </p>
          </div>
        </div>

        <div class="flex items-center">
          <UButton
            v-if="mode === 'notes'"
            variant="ghost"
            size="lg"
            icon="i-lucide-pencil"
            color="neutral"
            :aria-label="`Edit ${item.title}`"
            @click="openNoteEditor(item)"
          />
          <UButton
            v-if="mode === 'materials' && (item.url || item.fileUrl)"
            variant="ghost"
            size="lg"
            icon="i-lucide-external-link"
            :to="item.url || item.fileUrl || undefined"
            target="_blank"
            :aria-label="`Open ${item.title}`"
          />
          <UButton
            variant="ghost"
            size="lg"
            icon="i-lucide-trash-2"
            color="error"
            :aria-label="`Remove ${item.title} from project`"
            :loading="isRemovingId === getItemId(item)"
            @click="removeItem(item)"
          />
        </div>
      </div>
    </div>

    <UEmpty
      v-else
      :icon="config.emptyIcon"
      :title="config.emptyTitle"
      :description="config.emptyDescription"
    />

    <UModal v-model:open="pickerOpen" :ui="{ content: 'max-w-3xl w-full' }">
      <template #content>
        <div class="p-4">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold">
              {{ config.modalTitle }}
            </h2>
            <p class="text-sm text-muted mb-4">
              {{ config.modalDescription }}
            </p>
          </div>

          <div class="space-y-4">
            <div class="flex gap-2">
              <UInput
                v-model="search"
                icon="i-lucide-search"
                :placeholder="config.searchPlaceholder"
                class="flex-1"
                @keyup.enter="fetchAvailableItems"
              />
              <UButton
                color="neutral"
                variant="outline"
                :loading="isLoadingAvailable"
                @click="fetchAvailableItems"
              >
                Search
              </UButton>
            </div>

            <div
              v-if="isLoadingAvailable"
              class="flex items-center justify-center py-10 text-muted-foreground"
            >
              <UIcon
                name="i-lucide-loader-circle"
                class="h-5 w-5 animate-spin"
              />
            </div>

            <div
              v-else-if="availableItems.length === 0"
              class="rounded-lg border border-default p-8 text-center text-sm text-muted-foreground"
            >
              {{ config.emptyPickerText }}
            </div>

            <div v-else class="max-h-105 overflow-y-auto space-y-2 pr-1">
              <label
                v-for="item in availableItems"
                :key="getItemId(item)"
                class="flex cursor-pointer items-start justify-between gap-3 rounded-lg border border-default p-3 hover:border-primary/40"
              >
                <div class="flex items-start gap-3">
                  <UCheckbox
                    :model-value="selectedIds.includes(getItemId(item))"
                    @update:model-value="
                      toggleSelection(getItemId(item), $event)
                    "
                  />
                  <div>
                    <p class="font-medium text-foreground">{{ item.title }}</p>
                    <p class="text-xs text-muted-foreground">
                      {{ getPickerLabel(item) }}
                    </p>
                  </div>
                </div>
                <UIcon
                  :name="iconMap[resolveLibraryType(item)]"
                  class="h-4 w-4 text-muted-foreground"
                />
              </label>
            </div>

            <div class="flex justify-end gap-2 border-t border-default pt-4">
              <UButton
                color="neutral"
                variant="ghost"
                @click="pickerOpen = false"
              >
                Cancel
              </UButton>
              <UButton
                color="primary"
                :disabled="selectedIds.length === 0"
                :loading="isAttaching"
                @click="attachSelected"
              >
                Attach Selected
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { LibraryItem } from "~/types";

type LibraryManagerMode = "materials" | "notes";

const props = withDefaults(
  defineProps<{
    mode: LibraryManagerMode;
    items?: LibraryItem[];
    count?: number;
    projectId?: string;
    attachedLibraryIds?: string[];
    fetchAttachedFromProject?: boolean;
  }>(),
  {
    items: () => [],
    count: 0,
    projectId: "",
    attachedLibraryIds: () => [],
    fetchAttachedFromProject: false,
  },
);

const emit = defineEmits<{
  changed: [];
}>();

const router = useRouter();
const { $api } = useNuxtApp();
const toast = useToast();

const pickerOpen = ref(false);
const search = ref("");
const isLoadingAvailable = ref(false);
const isAttaching = ref(false);
const isRemovingId = ref<string | null>(null);
const availableItems = ref<LibraryItem[]>([]);
const selectedIds = ref<string[]>([]);
const renderedItems = ref<LibraryItem[]>([]);
const currentAttachedIds = ref<string[]>([]);

const iconMap: Record<LibraryItem["libraryType"], string> = {
  doc: "i-lucide-file",
  url: "i-lucide-globe",
  note: "i-lucide-file-text",
};

const config = computed(() => {
  if (props.mode === "notes") {
    return {
      headerTitle: "Project Notes",
      addButtonLabel: "Add Note",
      emptyIcon: "i-lucide-file-text",
      emptyTitle: "No notes yet",
      emptyDescription: "Create or attach note items to see them here.",
      modalTitle: "Add Notes to Project",
      modalDescription: "Select existing note items to attach.",
      searchPlaceholder: "Search notes...",
      emptyPickerText: "No notes available to attach.",
    };
  }

  return {
    headerTitle: "Project Materials",
    addButtonLabel: "Add Material",
    emptyIcon: "i-lucide-book",
    emptyTitle: "No materials yet",
    emptyDescription: "Attach documents or links to see them here.",
    modalTitle: "Add Materials to Project",
    modalDescription: "Select library materials to attach. Notes are excluded.",
    searchPlaceholder: "Search materials...",
    emptyPickerText: "No materials available to attach.",
  };
});

const linkedCount = computed(() =>
  Math.max(Number(props.count || 0), renderedItems.value.length),
);

function resolveLibraryType(item: any): LibraryItem["libraryType"] {
  const raw =
    item?.libraryType ??
    item?.libraryItemType ??
    item?.LibraryItemType ??
    item?.type ??
    item?.Type;

  if (raw === "doc" || raw === "url" || raw === "note") return raw;
  if (raw === 0 || raw === "0") return "doc";
  if (raw === 1 || raw === "1") return "url";
  if (raw === 2 || raw === "2") return "note";
  if (typeof raw === "string") {
    const normalized = raw.toLowerCase();
    if (normalized === "docs" || normalized === "document") return "doc";
    if (normalized === "url") return "url";
    if (normalized === "note" || normalized === "notes") return "note";
  }
  return "note";
}

function isModeMatch(item: any) {
  const type = resolveLibraryType(item);
  return props.mode === "notes" ? type === "note" : type !== "note";
}

function getItemId(item: LibraryItem) {
  return String(item.id || item.documentId || "");
}

function getCurrentLibraryIds() {
  return [...currentAttachedIds.value].map(String);
}

function getDescription(item: LibraryItem) {
  if (item.fileName) return item.fileName;
  if (item.url) return item.url;
  if (item.content) return item.content.slice(0, 100);
  return "No preview available";
}

function getPickerLabel(item: LibraryItem) {
  if (props.mode === "notes") return getDescription(item);
  return resolveLibraryType(item) === "doc" ? "Document" : "Link";
}

function parseListResponse(response: any): LibraryItem[] {
  return Array.isArray(response?.data)
    ? response.data
    : Array.isArray(response?.items)
      ? response.items
      : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];
}

async function fetchAttachedItems() {
  if (!props.projectId || !props.fetchAttachedFromProject) return;

  const filter = props.mode === "notes" ? "notes" : "exclude-notes";
  try {
    const response = await $api.fetch<any>(
      `/api/projects/${props.projectId}/libraries?filter=${filter}`,
      { method: "GET" },
    );
    const items = parseListResponse(response).filter((item) =>
      isModeMatch(item),
    );
    renderedItems.value = items;
  } catch {}
}

async function fetchAvailableItems() {
  if (!props.projectId) return;

  try {
    isLoadingAvailable.value = true;
    const query = new URLSearchParams({
      projectId: props.projectId,
      filter: props.mode === "notes" ? "notes" : "exclude-notes",
    });

    if (search.value.trim()) {
      query.set("search", search.value.trim());
    }

    const response = await $api.fetch<any>(
      `/api/projects/available-libraries?${query.toString()}`,
      { method: "GET" },
    );

    let items = parseListResponse(response).filter((item) => isModeMatch(item));

    if (items.length === 0) {
      const fallbackQuery = new URLSearchParams({
        page: "1",
        pageSize: "100",
        ...(props.mode === "notes" ? { type: "note" } : { libraryType: "all" }),
      });

      if (search.value.trim()) {
        fallbackQuery.set("search", search.value.trim());
      }

      const fallbackResponse = await $api.fetch<any>(
        `/api/libraries?${fallbackQuery.toString()}`,
        { method: "GET" },
      );

      const attachedSet = new Set(getCurrentLibraryIds());
      items = parseListResponse(fallbackResponse).filter(
        (item) => isModeMatch(item) && !attachedSet.has(getItemId(item)),
      );
    }

    availableItems.value = items.filter((item) => !!getItemId(item));
    selectedIds.value = [];
  } catch (error: any) {
    toast.add({
      title: `Failed to load ${props.mode === "notes" ? "notes" : "materials"}`,
      description: error?.message || "Could not load available libraries.",
      color: "error",
    });
  } finally {
    isLoadingAvailable.value = false;
  }
}

async function openPicker() {
  pickerOpen.value = true;
  await fetchAvailableItems();
}

function toggleSelection(id: string, checked: boolean | "indeterminate") {
  if (checked === "indeterminate") return;

  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value.push(id);
    }
    return;
  }

  selectedIds.value = selectedIds.value.filter((itemId) => itemId !== id);
}

async function attachSelected() {
  if (!props.projectId || selectedIds.value.length === 0) return;

  try {
    isAttaching.value = true;

    const mergedLibraries = Array.from(
      new Set([...getCurrentLibraryIds(), ...selectedIds.value.map(String)]),
    );

    await $api.mutate(`/api/projects/${props.projectId}`, {
      method: "PUT",
      body: {
        libraries: mergedLibraries,
      },
    });

    pickerOpen.value = false;
    currentAttachedIds.value = [...mergedLibraries];
    selectedIds.value = [];
    await fetchAttachedItems();

    toast.add({
      title: `${props.mode === "notes" ? "Notes" : "Materials"} attached`,
      description: "Selected items were added to the project.",
      color: "success",
    });
    emit("changed");
  } catch (error: any) {
    toast.add({
      title: "Attach failed",
      description: error?.message || "Could not attach selected items.",
      color: "error",
    });
  } finally {
    isAttaching.value = false;
  }
}

async function removeItem(item: LibraryItem) {
  if (!props.projectId) return;

  const itemId = getItemId(item);
  if (!itemId) return;

  const previousItems = [...renderedItems.value];
  const previousAttachedIds = [...currentAttachedIds.value];

  try {
    isRemovingId.value = itemId;
    renderedItems.value = renderedItems.value.filter(
      (entry) => getItemId(entry) !== itemId,
    );

    currentAttachedIds.value = getCurrentLibraryIds().filter(
      (id) => id !== itemId,
    );

    await $api.mutate(`/api/projects/${props.projectId}/libraries/${itemId}`, {
      method: "DELETE",
    });

    await fetchAttachedItems();

    toast.add({
      title: props.mode === "notes" ? "Note removed" : "Material removed",
      description: `"${item.title}" was removed from this project.`,
      color: "success",
    });
    emit("changed");
  } catch (error: any) {
    renderedItems.value = previousItems;
    currentAttachedIds.value = previousAttachedIds;

    toast.add({
      title: "Remove failed",
      description: error?.message || "Could not remove selected item.",
      color: "error",
    });
  } finally {
    isRemovingId.value = null;
  }
}

function openNoteEditor(item: LibraryItem) {
  const id = getItemId(item);
  if (!id || props.mode !== "notes") return;
  router.push(`/dashboard/notes/${id}`);
}

watch(
  () => props.items,
  (value) => {
    if (!props.fetchAttachedFromProject) {
      renderedItems.value = [...(value || [])].filter((item) =>
        isModeMatch(item),
      );
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => props.attachedLibraryIds,
  (value) => {
    currentAttachedIds.value = [...(value || [])].map(String);
  },
  { immediate: true, deep: true },
);

watch(
  () => props.projectId,
  async (value) => {
    if (!value) return;
    await fetchAttachedItems();
  },
  { immediate: true },
);
</script>
