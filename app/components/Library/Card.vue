<template>
  <div
    v-if="viewType === 'grid'"
    class="rounded-lg border border-border border-muted mt-4 bg-card p-4 hover:shadow-md transition-shadow cursor-pointer group"
  >
    <!-- Grid View -->
    <div class="flex flex-col h-full">
      <!-- Icon -->
      <div
        class="mb-3 flex items-center justify-center h-30 bg-muted rounded-md group-hover:bg-muted/80 transition-colors"
      >
        <UIcon
          :name="getIconForType(item.libraryType)"
          size="32"
          class="text-muted-foreground"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 flex flex-col gap-2 mb-3">
        <h3
          class="font-bold text-foreground truncate text-xl"
          :title="item.title"
        >
          {{ item.title }}
        </h3>
        <UBadge variant="subtle" class="w-max px-2 py-1">
          {{ getLabelForType(item.libraryType) }}
        </UBadge>
        <p class="text-xs text-muted-foreground mt-auto">
          {{ formatDate(item.createdAt) }}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-2 py-3 border-t border-border border-muted">
        <UButton
          icon="i-lucide-external-link"
          size="lg"
          color="info"
          variant="solid"
          label="View"
          class="flex-1 items-center flex w-full justify-center"
          @click="$emit('open')"
        />
        <UButton
          v-if="item.libraryType === 'note'"
          icon="i-lucide-pencil"
          size="lg"
          color="warning"
          variant="outline"
          @click="$emit('edit')"
        />
        <UButton
          icon="i-lucide-trash-2"
          size="lg"
          color="error"
          variant="solid"
          @click="$emit('delete')"
        />
      </div>
    </div>
  </div>

  <!-- List View -->
  <div
    v-else
    class="flex items-center gap-4 rounded-lg border border-border border-muted bg-card p-3 hover:shadow-sm hover:bg-muted/80 transition-shadow group"
  >
    <!-- Icon -->
    <div
      class="shrink-0 flex items-center justify-center h-10 w-10 bg-muted rounded"
    >
      <UIcon
        :name="getIconForType(item.libraryType)"
        size="20"
        class="text-muted-foreground"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <h3
        class="font-medium text-foreground truncate text-sm"
        :title="item.title"
      >
        {{ item.title }}
      </h3>
      <p class="text-xs text-muted-foreground">
        {{ getLabelForType(item.libraryType) }} •
        {{ formatDate(item.createdAt) }}
      </p>
    </div>

    <!-- Actions -->
    <div class="shrink-0 flex gap-2">
      <UButton
        icon="i-lucide-external-link"
        size="xs"
        color="info"
        variant="ghost"
        @click="$emit('open')"
      />
      <UButton
        v-if="item.libraryType === 'note'"
        icon="i-lucide-pencil"
        size="xs"
        color="warning"
        variant="ghost"
        @click="$emit('edit')"
      />
      <UButton
        icon="i-lucide-trash-2"
        size="xs"
        color="error"
        variant="ghost"
        @click="$emit('delete')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LibraryItem } from "~/types";
import { LibraryService } from "~/services/libraryService";

interface Props {
  item: LibraryItem;
  viewType?: "grid" | "list";
}

defineProps<Props>();

defineEmits<{
  open: [];
  edit: [];
  delete: [];
}>();

const libraryService = new LibraryService();

function getIconForType(type: LibraryItem["libraryType"]): string {
  switch (type) {
    case "docs":
      return "i-lucide-file-text";
    case "url":
      return "i-lucide-link";
    case "note":
      return "i-lucide-sticky-note";
    default:
      return "i-lucide-file";
  }
}

function getLabelForType(type: LibraryItem["libraryType"]): string {
  switch (type) {
    case "docs":
      return "Document";
    case "url":
      return "Link";
    case "note":
      return "Note";
    default:
      return "Unknown";
  }
}

function formatDate(date: string): string {
  return libraryService.formatDate(date);
}
</script>
