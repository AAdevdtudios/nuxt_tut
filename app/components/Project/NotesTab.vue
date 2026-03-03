<template>
  <div class="px-2">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-semibold">Project Notes</h2>
      <span class="text-sm text-muted">{{ notes.length }} linked</span>
    </div>

    <div v-if="notes.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="note in notes"
        :key="note.documentId"
        class="p-4 border border-default rounded-lg flex justify-between items-center gap-4"
      >
        <div class="flex gap-2">
          <UAvatar
            size="3xl"
            icon="i-lucide-file-text"
            class="rounded-lg bg-secondary/10 text-secondary-foreground"
          />
          <div>
            <h3 class="text-lg font-medium">{{ note.title }}</h3>
            <p class="text-sm text-muted">
              {{ getDescription(note) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <UEmpty
      v-else
      icon="i-lucide-file-text"
      title="No notes yet"
      description="Create or attach note items to see them here."
    />
  </div>
</template>

<script setup lang="ts">
import type { LibraryItem } from "~/types";

withDefaults(
  defineProps<{
    notes?: LibraryItem[];
  }>(),
  {
    notes: () => [],
  },
);

function getDescription(note: LibraryItem) {
  if (note.content) return note.content.slice(0, 100);
  if (note.fileName) return note.fileName;
  return "No preview available";
}
</script>
