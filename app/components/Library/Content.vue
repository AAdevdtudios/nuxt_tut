<template>
  <div
    :class="
      viewType === 'grid'
        ? 'grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4'
        : 'flex flex-col gap-2'
    "
  >
    <div
      v-for="item in itemsList"
      :key="item.id"
      :class="
        viewType === 'grid'
          ? 'border border-default p-4 rounded-lg'
          : 'flex items-center p-2 rounded-lg'
      "
    >
      <div
        :class="
          viewType === 'grid'
            ? 'mb-4 flex items-center justify-center h-32 bg-muted rounded-lg'
            : 'flex items-center justify-center h-16 w-16 bg-muted rounded-lg mr-4'
        "
      >
        <UIcon
          :name="iconFor(item.type)"
          size="32"
          class="text-muted-foreground"
        />
      </div>
      <div>
        <p class="font-medium text-foreground">{{ item.title }}</p>
        <p class="text-sm text-muted-foreground">
          Type: {{ item.type.toUpperCase() }} | Size:
          {{ item.size > 0 ? item.size + " MB" : "N/A" }}
        </p>
      </div>
      <!-- Button Icons for more actions -->
      <div
        :class="
          viewType === 'grid'
            ? 'mt-2 flex justify-end gap-2'
            : 'ml-auto flex items-center'
        "
      >
        <!-- If grid show icon list show text -->
        <!-- View button would take the entire space -->
        <UButton
          :variant="viewType === 'grid' ? 'outline' : 'ghost'"
          :label="viewType === 'grid' ? 'View' : ''"
          :class="viewType === 'grid' ? 'flex-1 justify-center gap-2' : ''"
        >
          <UIcon name="i-lucide-eye" size="20" />
          <span>{{ viewType === "grid" ? "View" : "" }}</span>
        </UButton>
        <UButton variant="ghost" aria-label="Download">
          <UIcon name="i-lucide-download" size="20" />
        </UButton>
        <UButton variant="ghost" aria-label="Delete">
          <UIcon name="i-lucide-trash-2" size="20" />
        </UButton>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import type { LibraryItem } from "~/types";

defineProps<{
  itemsList: LibraryItem[];
  viewType: "list" | "grid";
}>();

function iconFor(item: string) {
  switch (item) {
    case "pdf":
      return "i-lucide-file-text"; // lucide doesn't have a dedicated pdf in all packs; swap if you have it
    case "website":
      return "i-lucide-external-link";
    case "note":
      return "i-lucide-file-code";
    case "docx":
      return "i-lucide-file-text";
    case "txt":
      return "i-lucide-file";
    case "ai_generated":
      return "i-lucide-sparkles";
    default:
      return "i-lucide-file";
  }
}
</script>
