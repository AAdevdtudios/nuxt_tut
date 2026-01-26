<template>
  <div
    class="flex flex-col lg:flex-row w-full gap-2 lg:gap-0 lg:items-center justify-between"
  >
    <div>
      <div class="flex items-center gap-3">
        <slot name="leading-icon" />
        <h2 class="text-3xl font-bold text-foreground">{{ title }}</h2>
      </div>
      <p class="mt-1 text-muted-foreground">
        {{ description ?? "" }}
      </p>
    </div>
    <div class="flex gap-4 items-center">
      <slot name="actions" />
    </div>
  </div>
</template>
<script setup lang="ts">
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
