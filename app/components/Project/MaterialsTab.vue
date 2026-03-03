<template>
  <div class="px-2">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-2xl font-semibold">Project Materials</h2>
      <span class="text-sm text-muted">{{ materials.length }} linked</span>
    </div>

    <div v-if="materials.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="material in materials"
        :key="material.documentId"
        class="p-4 border border-default rounded-lg flex justify-between items-center gap-4"
      >
        <div class="flex gap-2">
          <UAvatar
            size="3xl"
            :icon="iconMap[material.libraryType]"
            class="rounded-lg bg-secondary/10 text-secondary-foreground"
          />
          <div>
            <h3 class="text-lg font-medium">{{ material.title }}</h3>
            <p class="text-sm text-muted">
              {{ getDescription(material) }}
            </p>
          </div>
        </div>
        <div>
          <UButton
            v-if="material.url || material.fileUrl"
            variant="ghost"
            size="lg"
            icon="i-lucide-external-link"
            :to="material.url || material.fileUrl || undefined"
            target="_blank"
            :aria-label="`Open ${material.title}`"
          />
        </div>
      </div>
    </div>

    <UEmpty
      v-else
      icon="i-lucide-book"
      title="No materials yet"
      description="Attach documents or links to see them here."
    />
  </div>
</template>

<script setup lang="ts">
import type { LibraryItem } from "~/types";

withDefaults(
  defineProps<{
    materials?: LibraryItem[];
  }>(),
  {
    materials: () => [],
  },
);

const iconMap: Record<LibraryItem["libraryType"], string> = {
  doc: "i-lucide-file",
  url: "i-lucide-globe",
  note: "i-lucide-sticky-note",
};

function getDescription(material: LibraryItem) {
  if (material.fileName) return material.fileName;
  if (material.url) return material.url;
  if (material.content) return material.content.slice(0, 80);
  return "No preview available";
}
</script>
