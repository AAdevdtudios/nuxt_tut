<template>
  <ProjectLibraryManager
    mode="materials"
    :items="materials"
    :count="materials.length"
    :project-id="projectId"
    :attached-library-ids="attachedLibraryIds"
    @changed="emit('materials-attached')"
  />
</template>

<script setup lang="ts">
import type { LibraryItem } from "~/types";

withDefaults(
  defineProps<{
    materials?: LibraryItem[];
    projectId?: string;
    attachedLibraryIds?: string[];
  }>(),
  {
    materials: () => [],
    projectId: "",
    attachedLibraryIds: () => [],
  },
);

const emit = defineEmits<{
  "materials-attached": [];
}>();
</script>
