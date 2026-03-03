<template>
  <div
    class="flex items-center justify-between rounded-lg border border-default bg-card py-2 px-4 transition-all hover:border-primary"
  >
    <div class="flex items-center gap-3">
      <UIcon
        :name="'i-lucide-book-open'"
        class="size-20 md:size-5 text-primary"
      />
      <div class="flex flex-col">
        <span class="text-sm md:text-xl font-semibold text-card-foreground">
          {{ explore.title }}
        </span>
        <p class="mt-1 text-xs text-muted line-clamp-2 md:line-clamp-3">
          {{ explore.description }}
        </p>
        <div
          class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground md:gap-3"
        >
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-download" class="h-3 w-3" />
            {{ formatDownloadCount(explore.downloads) }} downloads
          </span>
          <span class="hidden md:inline">•</span>
          <span class="text-xs">{{ explore.copyright }}</span>
        </div>
      </div>
    </div>
    <UButton
      @click="$emit('open')"
      class="flex items-center gap-2 shrink-0 ml-4"
      color="primary"
    >
      <span class="hidden sm:inline">View</span>
      <UIcon name="i-lucide-external-link" class="h-4 w-4" />
    </UButton>
  </div>
</template>

<script setup lang="ts">
import type { Explore } from "~/types/explore.types";

/**
 * ExploreResourceCard Component
 *
 * Displays a single explore resource with metadata and action button
 *
 * @example
 * ```vue
 * <ExploreResourceCard
 *   :explore="item"
 *   @open="openExplore(item.url)"
 * />
 * ```
 */

defineProps<{
  /** The explore resource to display */
  explore: Explore;
}>();

defineEmits<{
  /** Emitted when the open/view button is clicked */
  open: [];
}>();

/**
 * Format download count with locale-specific number formatting
 * @param downloads - Number of downloads
 * @returns Formatted download count string
 */
const formatDownloadCount = (downloads: number | string): string => {
  return Number(downloads).toLocaleString();
};
</script>
