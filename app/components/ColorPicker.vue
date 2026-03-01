<template>
  <div class="flex flex-col gap-4">
    <!-- Color Preview -->
    <div
      class="w-full h-24 rounded-lg border-2 border-default transition-colors"
      :style="{ backgroundColor: `#${modelValue}` }"
    />

    <!-- Hex Input -->
    <div class="flex gap-2">
      <div class="flex-1">
        <label class="text-xs text-muted-foreground block mb-1"
          >Hex Color</label
        >
        <UInput
          :model-value="modelValue"
          @update:model-value="(v) => $emit('update:modelValue', v)"
          placeholder="#000000"
          maxlength="6"
          class="w-full font-mono"
        />
      </div>
      <div class="flex items-end gap-1">
        <UButton
          icon="i-lucide-refresh-cw"
          variant="ghost"
          size="sm"
          @click="resetToRandom"
          title="Random color"
        />
      </div>
    </div>

    <!-- HSL Sliders -->
    <div class="flex flex-col gap-4">
      <!-- Hue Slider -->
      <div>
        <div class="flex justify-between mb-2">
          <label class="text-xs font-medium">Hue</label>
          <span class="text-xs text-muted-foreground">{{ hsl.h }}°</span>
        </div>
        <div class="flex gap-2 items-center">
          <input
            type="range"
            :value="hsl.h"
            @input="updateHue"
            min="0"
            max="360"
            class="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
            :style="{
              background: `linear-gradient(to right,
                hsl(0, 100%, 50%),
                hsl(60, 100%, 50%),
                hsl(120, 100%, 50%),
                hsl(180, 100%, 50%),
                hsl(240, 100%, 50%),
                hsl(300, 100%, 50%),
                hsl(360, 100%, 50%))`,
            }"
          />
          <span class="text-xs text-muted-foreground w-8">{{ hsl.h }}</span>
        </div>
      </div>

      <!-- Saturation Slider -->
      <div>
        <div class="flex justify-between mb-2">
          <label class="text-xs font-medium">Saturation</label>
          <span class="text-xs text-muted-foreground">{{ hsl.s }}%</span>
        </div>
        <div class="flex gap-2 items-center">
          <input
            type="range"
            :value="hsl.s"
            @input="updateSaturation"
            min="0"
            max="100"
            class="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
            :style="{
              background: `linear-gradient(to right,
                hsl(${hsl.h}, 0%, ${hsl.l}%),
                hsl(${hsl.h}, 100%, ${hsl.l}%))`,
            }"
          />
          <span class="text-xs text-muted-foreground w-8">{{ hsl.s }}</span>
        </div>
      </div>

      <!-- Lightness Slider (Tint Control) -->
      <div>
        <div class="flex justify-between mb-2">
          <label class="text-xs font-medium">Tint</label>
          <span class="text-xs text-muted-foreground">{{ hsl.l }}%</span>
        </div>
        <div class="flex gap-2 items-center">
          <input
            type="range"
            :value="hsl.l"
            @input="updateLightness"
            min="0"
            max="100"
            class="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
            :style="{
              background: `linear-gradient(to right,
                hsl(${hsl.h}, ${hsl.s}%, 0%),
                hsl(${hsl.h}, ${hsl.s}%, 50%),
                hsl(${hsl.h}, ${hsl.s}%, 100%))`,
            }"
          />
          <span class="text-xs text-muted-foreground w-8">{{ hsl.l }}</span>
        </div>
      </div>
    </div>

    <!-- Preset Colors -->
    <div>
      <label class="text-xs font-medium block mb-2">Quick Presets</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in presets"
          :key="preset"
          @click="$emit('update:modelValue', preset)"
          :class="[
            'h-8 w-8 rounded-lg border-2 transition-all',
            modelValue === preset
              ? 'border-foreground ring-2 ring-offset-2'
              : 'border-default hover:border-foreground',
          ]"
          :style="{ backgroundColor: `#${preset}` }"
          :title="`#${preset}`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

// Preset colors
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

// Parse hex to HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Parse HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

const hsl = computed(() => hexToHSL(props.modelValue));

function updateHue(e: Event) {
  const h = Number((e.target as HTMLInputElement).value);
  const hex = hslToHex(h, hsl.value.s, hsl.value.l);
  emit("update:modelValue", hex);
}

function updateSaturation(e: Event) {
  const s = Number((e.target as HTMLInputElement).value);
  const hex = hslToHex(hsl.value.h, s, hsl.value.l);
  emit("update:modelValue", hex);
}

function updateLightness(e: Event) {
  const l = Number((e.target as HTMLInputElement).value);
  const hex = hslToHex(hsl.value.h, hsl.value.s, l);
  emit("update:modelValue", hex);
}

function resetToRandom() {
  const randomHex = Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")
    .toUpperCase();
  emit("update:modelValue", randomHex);
}
</script>

<style scoped>
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  outline: none;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  background: white;
  border: 2px solid currentColor;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  background: white;
  border: 2px solid currentColor;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
