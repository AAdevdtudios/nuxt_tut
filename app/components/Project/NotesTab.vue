<template>
  <ProjectLibraryManager
    mode="notes"
    :items="notes"
    :count="notesCount"
    :project-id="projectId"
    :attached-library-ids="attachedLibraryIds"
    :fetch-attached-from-project="true"
    @changed="emit('notes-attached')"
  />
</template>

<script setup lang="ts">
import type { LibraryItem } from "~/types";

withDefaults(
  defineProps<{
    notes?: LibraryItem[];
    notesCount?: number;
    projectId?: string;
    attachedLibraryIds?: string[];
  }>(),
  {
    notes: () => [],
    notesCount: 0,
    projectId: "",
    attachedLibraryIds: () => [],
  },
);

const emit = defineEmits<{
  "notes-attached": [];
}>();
</script>
