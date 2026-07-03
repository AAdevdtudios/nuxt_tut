<template>
  <div class="px-2 space-y-4">
    <div class="flex items-center justify-end gap-3">
      <div class="flex rounded-lg border border-default bg-card p-1">
        <UButton
          size="sm"
          :variant="activeView === 'materials' ? 'solid' : 'ghost'"
          :color="activeView === 'materials' ? 'primary' : 'neutral'"
          icon="i-lucide-book"
          @click="activeView = 'materials'"
        >
          Materials
        </UButton>
        <UButton
          size="sm"
          :variant="activeView === 'notes' ? 'solid' : 'ghost'"
          :color="activeView === 'notes' ? 'primary' : 'neutral'"
          icon="i-lucide-file-text"
          @click="activeView = 'notes'"
        >
          Notes
        </UButton>
      </div>
    </div>

    <ProjectLibraryManager
      v-if="activeView === 'materials'"
      mode="materials"
      :items="materials"
      :count="materials.length"
      :project-id="projectId"
      :attached-library-ids="attachedLibraryIds"
      @changed="emit('materials-attached')"
    />

    <ProjectLibraryManager
      v-else
      mode="notes"
      :items="notes"
      :count="notesCount || notes.length"
      :project-id="projectId"
      :attached-library-ids="attachedLibraryIds"
      :fetch-attached-from-project="true"
      @changed="emit('notes-attached')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { LibraryItem } from "~/types";

withDefaults(
  defineProps<{
    materials?: LibraryItem[];
    notes?: LibraryItem[];
    notesCount?: number;
    projectId?: string;
    attachedLibraryIds?: string[];
  }>(),
  {
    materials: () => [],
    notes: () => [],
    notesCount: 0,
    projectId: "",
    attachedLibraryIds: () => [],
  },
);

const emit = defineEmits<{
  "materials-attached": [];
  "notes-attached": [];
}>();

const activeView = ref<"materials" | "notes">("materials");
</script>
