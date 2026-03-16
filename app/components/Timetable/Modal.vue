<template>
  <UModal
    v-model:open="isOpen"
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

      <div class="mt-6 flex flex-col gap-3 border-t border-default pt-4 md:flex-row md:items-center md:justify-between">
        <div class="text-sm text-muted-foreground">
          Step {{ currentIndex + 1 }} of {{ steps.length }}
        </div>
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="currentIndex === 0"
            @click="goPrev"
          >
            Back
          </UButton>
          <UButton
            v-if="currentIndex < steps.length - 1"
            color="primary"
            :disabled="currentStep?.required && !currentStep?.isComplete"
            @click="goNext"
          >
            Next
          </UButton>
          <UButton
            v-else
            color="primary"
            icon="i-lucide-sparkles"
            :loading="isGeneratingTimetable"
            :disabled="!canGenerate"
            @click="submit"
          >
            Generate Timetable
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useIsMobile } from "~/composable/useIsMobile";
import { useStepper } from "~/composable/useStepper";
import { useTimetableGenerator } from "~/composables/useTimetableGenerator";
import { AI_TIMETABLE_STEPS } from "~/constants/ai-timetable.steps";
import type { AITimetableWizardState, Step } from "~/types";
const { isMobile } = useIsMobile();
const toast = useToast();
const isOpen = ref(false);

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

const { currentIndex, currentStep, goNext, goPrev, goTo } =
  useStepper(steps);

const wizardState = computed<AITimetableWizardState>(() => ({
  subjects: {
    data: steps.find((step) => step.id === "subjects")?.data ?? null,
    completed: steps.find((step) => step.id === "subjects")?.isComplete ?? false,
  },
  schedule: {
    data: steps.find((step) => step.id === "schedule")?.data ?? null,
    completed: steps.find((step) => step.id === "schedule")?.isComplete ?? false,
  },
  deadlines: {
    data: steps.find((step) => step.id === "deadlines")?.data ?? null,
    completed: steps.find((step) => step.id === "deadlines")?.isComplete ?? true,
  },
  preferences: {
    data: steps.find((step) => step.id === "preferences")?.data ?? null,
    completed: steps.find((step) => step.id === "preferences")?.isComplete ?? false,
  },
  review: {
    data: null,
    completed: false,
  },
}));

const canGenerate = computed(() =>
  steps.every((step) => !step.required || step.isComplete),
);

const { generateTimetable, isGeneratingTimetable } = useTimetableGenerator();

const submit = async () => {
  try {
    await generateTimetable(wizardState.value);
    isOpen.value = false;
    toast.add({
      title: "Timetable generated",
      description: "Your new study schedule is ready.",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Generation failed",
      description: error?.message || "Could not generate timetable.",
      color: "error",
    });
  }
};
</script>
