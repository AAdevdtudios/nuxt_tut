<template>
  <UDrawer title="Select Content">
    <template #content>
      <div class="max-h-[60vh] overflow-y-auto">
        <button
          v-for="item in items"
          :key="item.id"
          @click="toggleContentSelection(item)"
          :class="[
            'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors text-sm',
            isSelected(item)
              ? 'bg-primary/10 text-primary'
              : 'text-foreground hover:bg-accent',
          ]"
        >
          <div
            :class="[
              'flex h-5 w-5 items-center justify-center rounded border',
              isSelected(item)
                ? 'border-primary bg-primary'
                : 'border-border bg-background',
            ]"
          >
            <UIcon
              v-if="isSelected(item)"
              name="i-lucide-check"
              class="h-3 w-3 text-primary-foreground"
            />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium line-clamp-1">{{ item.title }}</p>
            <p class="text-xs text-muted-foreground">{{ item.type }}</p>
          </div>
        </button>
      </div>
    </template>
  </UDrawer>
</template>

<script lang="ts" setup>
import type { LibrarySelection } from "~/types";
import { ref, watch } from "vue";

const props = defineProps<{
  items: LibrarySelection[];
  selected: LibrarySelection[];
}>();

const emit = defineEmits<{
  (e: "update:selected", items: LibrarySelection[]): void;
}>();

// Local reactive state for immediate UI updates
const localSelected = ref<LibrarySelection[]>([...props.selected]);

// Watch for prop changes to update local state
watch(
  () => props.selected,
  (newSelected) => {
    localSelected.value = [...newSelected];
  },
  { deep: true }
);

const isSelected = (item: LibrarySelection) => {
  return localSelected.value.some((selected) => selected.id === item.id);
};

const toggleContentSelection = (item: LibrarySelection) => {
  let updatedSelection: LibrarySelection[];
  if (isSelected(item)) {
    updatedSelection = localSelected.value.filter(
      (selected) => selected.id !== item.id
    );
  } else {
    updatedSelection = [...localSelected.value, item];
  }
  // Update local state immediately for reactive UI
  localSelected.value = updatedSelection;
  // Emit to parent
  emit("update:selected", updatedSelection);
};
</script>
