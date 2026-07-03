<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    projectTitle?: string;
    currentSection?: string;
    currentProject?: boolean;
    progressPercent?: number;
    smartQueriesAnswered?: number;
    weekLabel?: string;
    materialsCount?: number;
    notesCount?: number;
    usageDelta?: string;
    usageLabel?: string;
    usageCaption?: string;
    lastActivityDay?: string;
  }>(),
  {
    projectTitle: "Neural Network Architecture & Backpropagation",
    currentProject: false,
    currentSection: "Section 4: Derivative Matrices",
    progressPercent: 75,
    smartQueriesAnswered: 128,
    weekLabel: "Week 3",
    materialsCount: 42,
    notesCount: 18,
    usageDelta: "+0%",
    usageLabel: "0 / 0",
    usageCaption: "Questions Usage",
    lastActivityDay: "F",
  },
);

const dayBars = computed(() => [
  { label: "M", height: 40 },
  { label: "T", height: 60 },
  { label: "W", height: 50 },
  { label: "TH", height: 90 },
  { label: "F", height: 80 },
]);
</script>

<template>
  <section class="my-2 grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
    <div
      class="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary to-primary-container p-1 text-white md:col-span-2 lg:col-span-2"
    >
      <div
        class="flex h-full min-h-60 w-full flex-col justify-between rounded-3xl bg-black/10 p-8 backdrop-blur-sm"
      >
        <div>
          <UBadge
            class="bg-white/20 px-3 py-1 text-[10px] font-bold uppercase text-white/80 tracking-widest"
            label="Ongoing Study"
          />
          <h3 class="mt-4 text-2xl font-bold leading-tight">
            {{ props.projectTitle }}
          </h3>
          <p class="mt-2 text-sm text-white/85">
            {{ props.currentSection }}
          </p>
        </div>

        <div
          class="flex flex-col md:flex-row mt-5 md:items-center justify-between gap-4"
        >
          <div class="flex items-center gap-2">
            <UProgress v-model="props.progressPercent" class="w-24" />
            <span class="text-xs font-medium"
              >{{ props.progressPercent }}%</span
            >
          </div>
          <UButton
            :label="props.currentProject ? 'Resume Session' : 'Create Project'"
            class="bg-white px-6 py-2 text-sm font-bold text-primary hover:bg-white/90"
          />
        </div>
      </div>
    </div>

    <div
      class="flex flex-col justify-between rounded-3xl border-none bg-surface-container-lowest p-8"
    >
      <div class="flex items-start justify-between">
        <UIcon name="i-lucide-clock-3" class="size-5 text-primary" />
        <span
          class="rounded bg-primary-fixed/30 px-2 py-0.5 text-[10px] font-bold text-primary"
          >{{ props.usageDelta }}</span
        >
      </div>
      <div>
        <p class="text-4xl font-extrabold text-on-surface">
          {{ props.usageLabel }}
        </p>
        <p class="ga-muted mt-1 text-xs font-medium">
          {{ props.usageCaption }}
        </p>
      </div>
      <div class="mt-4 grid grid-cols-5 gap-1">
        <div
          v-for="bar in dayBars"
          :key="bar.label"
          class="flex flex-col items-center gap-1"
        >
          <div class="flex h-8 w-full items-end">
            <div
              class="w-full rounded-sm"
              :class="
                bar.label === props.lastActivityDay
                  ? 'bg-primary'
                  : 'bg-secondary-fixed-dim/40'
              "
              :style="{ height: `${bar.height}%` }"
            />
          </div>
          <span class="ga-subtle text-[9px] font-semibold">
            {{ bar.label }}
          </span>
        </div>
      </div>
    </div>

    <div
      class="flex flex-col justify-between rounded-3xl border-none bg-surface-container-lowest p-8"
    >
      <div class="flex items-start justify-between">
        <UIcon name="i-lucide-circle-help" class="size-5 text-tertiary" />
        <span class="ga-subtle text-xs">{{ props.weekLabel }}</span>
      </div>
      <div>
        <p class="text-4xl font-extrabold text-on-surface">
          {{ props.smartQueriesAnswered }}
        </p>
        <p class="ga-muted mt-1 text-xs font-medium">
          Smart Queries Answered
        </p>
      </div>
      <div class="ga-muted mt-4 flex items-center gap-3 text-xs">
        <span>{{ props.materialsCount }} materials</span>
        <span>•</span>
        <span>{{ props.notesCount }} notes</span>
      </div>
    </div>
  </section>
</template>
