<template>
  <div class="relative">
    <UInput
      :value="value"
      placeholder="Search for topics, courses, or materials..."
      icon="i-lucide-search"
      class="w-full"
      @update:model-value="$emit('update:value', $event)"
    />
  </div>
</template>

<script setup lang="ts" generic="T extends string">
/**
 * SearchBar Component
 *
 * Renders a search input for filtering explores
 * Emits update:value events when the user types
 *
 * @example
 * ```vue
 * <SearchBar
 *   :value="searchQuery"
 *   @update:value="search"
 * />
 * ```
 */

defineProps<{
  /** Current search query value */
  value: string;
}>();

defineEmits<{
  /** Emitted when the search query changes */
  "update:value": [value: string];
}>();
</script>
