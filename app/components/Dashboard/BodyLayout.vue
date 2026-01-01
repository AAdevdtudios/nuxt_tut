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
    <DashboardHeader :title="title" :description="description">
      <template #actions>
        <slot name="actions" />
      </template>
    </DashboardHeader>
    <slot />
  </div>
</template>
