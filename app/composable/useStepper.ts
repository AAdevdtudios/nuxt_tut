import type { Step } from "~/types";

export function useStepper(steps: Step[]) {
  const currentIndex = ref(0);

  const currentStep = computed(() => steps[currentIndex.value]);

  const canProceed = computed(() => {
    const step = currentStep.value;
    return !step!.required || step!.isComplete;
  });

  const goNext = () => {
    if (canProceed.value && currentIndex.value < steps.length - 1) {
      currentIndex.value++;
    }
  };

  const goPrev = () => {
    if (currentIndex.value > 0) {
      currentIndex.value--;
    }
  };

  const goTo = (index: number) => {
    currentIndex.value = index;
  };

  const getFinalData = () =>
    steps.reduce((acc, step) => {
      acc[step.id] = step.data;
      return acc;
    }, {} as Record<string, unknown>);

  return {
    currentIndex,
    currentStep,
    canProceed,
    goNext,
    goPrev,
    goTo,
    getFinalData,
  };
}
