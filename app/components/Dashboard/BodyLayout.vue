<script setup lang="ts">
// No additional script logic needed for this simple dashboard body layout
defineProps({
  title: {
    type: String,
    required: false,
    default: "Dashboard",
  },
  description: {
    type: String,
    required: false,
    default: "",
  },
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold text-foreground">{{ title }}</h2>
        <p class="mt-1 text-muted-foreground">
          {{ description ?? "" }}
        </p>
      </div>
      <slot name="actions" />
    </div>
    <slot />
  </div>
</template>
