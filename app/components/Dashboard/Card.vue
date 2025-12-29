<script lang="ts" setup>
// No additional script logic needed for this simple card component
defineProps({
  title: {
    type: String,
    required: false,
    default: "",
  },
  icon: {
    type: String,
    required: false,
    default: "i-lucide-briefcase",
  },
  value: {
    type: [String, Number],
    required: false,
    default: "0",
  },
});
</script>

<template>
  <UCard>
    <p class="text-sm text-muted-foreground">{{ title }}</p>
    <div class="mt-2 flex">
      <p class="mt-2 text-3xl font-bold">{{ value }}</p>
      <!-- Icon -->
      <div
        class="ml-auto flex p-2 items-center justify-center rounded-lg bg-primary/10"
      >
        <UIcon :name="icon" size="25" class="ml-auto bg-primary" />
      </div>
    </div>
  </UCard>
</template>
