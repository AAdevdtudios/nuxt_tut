<template>
  <div class="flex w-full items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold text-foreground">{{ title }}</h2>
      <p class="mt-1 text-muted-foreground">
        {{ description ?? "" }}
      </p>
    </div>
    <slot name="actions" />
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
