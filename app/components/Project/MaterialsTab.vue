<template>
  <div class="px-2">
    <h2 class="text-2xl font-semibold mb-4">Project Materials</h2>
    <!-- Add more materials content as needed -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- List of materials will go here -->
      <div
        v-for="(material, index) in materials"
        :key="index"
        class="p-4 border border-default rounded-lg flex justify-between items-center gap-4"
      >
        <div class="flex gap-2">
          <UAvatar
            size="3xl"
            :icon="iconMap[material.type]"
            class="rounded-lg bg-secondary/10 text-secondary-foreground"
          />
          <div>
            <h3 class="text-lg font-medium">{{ material.title }}</h3>
            <p class="text-sm text-muted">
              {{ material.description }}
            </p>
          </div>
        </div>
        <div>
          <UButton
            variant="ghost"
            size="lg"
            icon="i-lucide-download"
            :aria-label="`Remove ${material.title}`"
          />
          <UButton
            variant="ghost"
            size="lg"
            color="error"
            icon="i-lucide-book-minus"
            :aria-label="`Download ${material.title}`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const materials = ref([
  {
    title: "Material 1",
    description: "Description for material 1.",
    type: "pdf",
  },
  {
    title: "Material 2",
    description: "Description for material 2.",
    type: "website",
  },
  {
    title: "Material 3",
    description: "Description for material 3.",
    type: "text",
  },
]);
const iconMap: Record<string, string> = {
  pdf: "i-lucide-file",
  website: "i-lucide-globe",
  text: "i-lucide-sticky-note",
};
</script>
