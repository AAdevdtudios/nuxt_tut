<template>
  <div class="flex items-center gap-2 overflow-x-auto pb-2">
    <UButton
      @click="$emit('select', 'all')"
      class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      :variant="selected === 'all' ? 'solid' : 'ghost'"
    >
      All
    </UButton>
    <UButton
      v-for="category in categories"
      :key="category.id"
      @click="$emit('select', category.id)"
      class="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize"
      :variant="selected === category.id ? 'solid' : 'ghost'"
    >
      {{ category.name }}
    </UButton>
  </div>
</template>

<script setup lang="ts">
import type { Category } from "~/types/explore.types";

/**
 * CategoryFilter Component
 *
 * Renders category buttons for filtering explores
 * Emits select events when a category is clicked
 *
 * @example
 * ```vue
 * <CategoryFilter
 *   :categories="categories"
 *   :selected="selectedCategory"
 *   @select="selectCategory"
 * />
 * ```
 */

defineProps<{
  /** List of available categories */
  categories: Category[];
  /** Currently selected category id */
  selected: string;
}>();

defineEmits<{
  /** Emitted when a category is selected with its id */
  select: [categoryId: string];
}>();
</script>
