<script setup lang="ts">
const props = defineProps<{
  isTableContext: boolean;
  textScale: "sm" | "base" | "lg" | "xl";
  textScaleItems: { label: string; value: string }[];
}>();

const emit = defineEmits<{
  "update:textScale": [value: "sm" | "base" | "lg" | "xl"];
}>();
</script>

<template>
  <div
    class="sticky top-0 z-20 flex items-center justify-between border-b border-default bg-default/95 px-4 py-2 backdrop-blur"
  >
    <div class="text-xs text-primary" v-if="props.isTableContext">Table selected — right click for table context menu</div>
    <div v-else />

    <div class="flex items-center gap-2">
      <span class="text-xs text-muted-foreground">Font size</span>
      <USelect
        :model-value="props.textScale"
        :items="props.textScaleItems"
        value-key="value"
        size="sm"
        class="w-36"
        @update:model-value="(value) => emit('update:textScale', (value as 'sm' | 'base' | 'lg' | 'xl') || 'base')"
      />
    </div>
  </div>
</template>
