<template>
  <div class="flex flex-col gap-3 mt-5">
    <label v-if="showLabel" class="text-sm font-medium">Select Color</label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="preset in presets"
        :key="preset"
        @click="$emit('update:modelValue', preset)"
        :class="[
          'h-10 w-10 rounded-lg border-2 transition-all hover:scale-110',
          modelValue === preset
            ? 'border-foreground ring-2 ring-offset-2'
            : 'border-default',
        ]"
        :style="{ backgroundColor: `#${preset}` }"
        :title="`#${preset}`"
        type="button"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const presets = [
  "f87171", // red
  "fbbf24", // amber
  "34d399", // emerald
  "60a5fa", // blue
  "a78bfa", // violet
  "f472b6", // pink
  "facc15", // yellow
  "38bdf8", // sky
  "4ade80", // green
  "c084fc", // fuchsia
  "ec4899", // rose
  "14b8a6", // teal
];

defineProps<{
  modelValue: string;
  showLabel?: boolean;
}>();

defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();
</script>
