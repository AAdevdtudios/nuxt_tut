<template>
  <div class="px-2">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-semibold mb-4">Project Notes</h2>
      <UButton variant="outline" class="px-10" label="Add Note" />
    </div>
    <!-- Add more notes content as needed -->
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
            icon="i-lucide-file-text"
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
            :aria-label="`Download ${material.title}`"
          />
          <UButton
            variant="ghost"
            size="lg"
            color="error"
            icon="i-lucide-trash-2"
            :aria-label="`Remove ${material.title}`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const materials = [
  {
    title: "Note 1",
    description: "Description for note 1.",
    type: "text",
  },
  {
    title: "Note 2",
    description: "Description for note 2.",
    type: "text",
  },
  {
    title: "Note 3",
    description: "Description for note 3.",
    type: "text",
  },
];
const iconMap = {
  text: "i-lucide-file-text",
  pdf: "i-lucide-file-pdf",
  image: "i-lucide-image",
};
</script>
