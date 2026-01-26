<template>
  <UModal
    scrollable
    :ui="{
      content: 'px-5 py-5 max-w-5xl w-full',
    }"
  >
    <UButton
      label="Generate New Timetable"
      icon="i-lucide-plus"
      color="primary"
    />

    <template #content>
      <!-- DialogTitle (required for accessibility) -->
      <UDialogTitle class="sr-only"> AI Timetable Generator </UDialogTitle>
      <!-- DialogDescription (required for accessibility) -->
      <UDialogDescription class="sr-only">
        Configure your preferences and let AI create an optimized study schedule
        for you.
      </UDialogDescription>

      <!-- Header -->
      <div class="flex flex-col w-full p-0 lg:p-6">
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-sparkles" class="text-lg text-primary" />
          <h3 class="text-lg font-semibold text-card-foreground">
            AI Timetable Generator
          </h3>
        </div>
        <p class="text-sm text-muted-foreground">
          Configure your preferences and let AI create an optimized study
          schedule for you.
        </p>
      </div>
      <!-- Tabs -->
      <UTabs
        v-if="!isMobile"
        :items="selectItems"
        :model-value="currentIndex"
        @update:model-value="(idx) => goTo(Number(idx))"
        class="mt-2 mb-4"
      />

      <!-- Mobile Select -->
      <USelect
        v-else
        :items="selectItems"
        :model-value="currentIndex"
        @update:model-value="(idx) => goTo(Number(idx))"
        :icon="currentStep?.icon"
        class="mt-2 mb-4"
      />

      <!-- Step Content -->
      <div>
        <component
          :is="currentStep!.component"
          v-model:isComplete="currentStep!.isComplete"
          v-model:data="currentStep!.data"
          :subjects="steps[0]?.data?.subjects ?? []"
          :all-data="
            steps.reduce((acc, step) => ({ ...acc, [step.id]: step.data }), {})
          "
        />
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useIsMobile } from "~/composable/useIsMobile";
import { useStepper } from "~/composable/useStepper";
import { AI_TIMETABLE_STEPS } from "~/constants/ai-timetable.steps";
import type { Step } from "~/types";
const { isMobile } = useIsMobile();

const steps = reactive<Step[]>(
  AI_TIMETABLE_STEPS.map((step) => ({
    ...step,
    required: step.required ?? true,
    isComplete: false,
    data: null,
  }))
);

const selectItems = computed(() =>
  steps.map((step, index) => ({
    label: step.label,
    value: index,
    icon: step.icon,
  }))
);

const { currentIndex, currentStep, goNext, goPrev, goTo, getFinalData } =
  useStepper(steps);
const submit = () => {
  const payload = getFinalData();
  console.log(payload);
  // send to API
};
</script>
