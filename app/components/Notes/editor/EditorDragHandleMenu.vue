<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

const props = defineProps<{
  insertOpen: boolean;
  moreOpen: boolean;
  insertActions: DropdownMenuItem[];
  moreActions: DropdownMenuItem[];
}>();

const emit = defineEmits<{
  "update:insertOpen": [value: boolean];
  "update:moreOpen": [value: boolean];
}>();
</script>

<template>
  <div class="flex items-center gap-1 rounded-lg border border-default bg-default/95 p-1 shadow-sm backdrop-blur">
    <UDropdownMenu
      :open="props.insertOpen"
      :items="props.insertActions"
      @update:open="(value) => emit('update:insertOpen', value)"
    >
      <UButton icon="i-lucide-plus" size="xs" variant="ghost" color="neutral" @mousedown.prevent />
    </UDropdownMenu>

    <UDropdownMenu
      :open="props.moreOpen"
      :items="props.moreActions"
      @update:open="(value) => emit('update:moreOpen', value)"
    >
      <UButton icon="i-lucide-ellipsis" size="xs" variant="ghost" color="neutral" @mousedown.prevent />
    </UDropdownMenu>
  </div>
</template>
