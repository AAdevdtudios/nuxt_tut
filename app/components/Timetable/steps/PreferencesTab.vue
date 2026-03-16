<template>
  <div class="flex flex-col gap-4">
    <h3 class="text-lg md:text-2xl text-center font-black text-primary/70">
      Ready to Generate Your AI Timetable?
    </h3>
    <span class="text-xs md:text-sm text-muted text-center">
      Based on your preferences, AI will create an optimized study schedule that
      maximizes your learning potential.
    </span>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <UFormField
        label="Start Date"
        description="Choose when the schedule should begin."
      >
        <UInput v-model="startDate" type="date" class="w-full" />
      </UFormField>
      <UFormField
        label="End Date"
        description="Choose when the schedule should end."
      >
        <UInput v-model="endDate" type="date" class="w-full" />
      </UFormField>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 my-2 w-full gap-5">
      <div
        class="text-center items-center flex flex-col border py-3 rounded-2xl border-muted"
        v-for="value in total"
        :key="value.text"
      >
        <h3 class="text-2xl text-primary font-black">{{ value.value }}</h3>
        <span class="text-muted font-bold">{{ value.text }}</span>
      </div>
    </div>
    <p v-if="error" class="text-sm text-error">{{ error }}</p>
  </div>
</template>
<script lang="ts" setup>
import type {
  DeadlinesStepData,
  PreferencesStepData,
  ScheduleStepData,
  SubjectsStepData,
} from "~/types";

const isComplete = defineModel<boolean>("isComplete", { required: true });
const data = defineModel<PreferencesStepData | null>("data", { required: true });

const props = defineProps<{
  allData?: {
    subjects?: SubjectsStepData | null;
    schedule?: ScheduleStepData | null;
    deadlines?: DeadlinesStepData | null;
  };
}>();

const startDate = ref("");
const endDate = ref("");
const error = ref<string | null>(null);

const total = computed(() => [
  {
    text: "Subjects",
    value: props.allData?.subjects?.subjects.length ?? 0,
  },
  {
    text: "Hours/Day",
    value: props.allData?.schedule?.hoursPerDay ?? 0,
  },
  {
    text: "Deadlines",
    value:
      (props.allData?.deadlines?.exams.length ?? 0) +
      (props.allData?.deadlines?.assignments.length ?? 0),
  },
]);

watch(
  () => data.value,
  (value) => {
    if (!value) return;
    startDate.value = value.startDate ?? "";
    endDate.value = value.endDate ?? "";
  },
  { immediate: true },
);

watch([startDate, endDate], () => {
  if (!startDate.value || !endDate.value) {
    data.value = null;
    isComplete.value = false;
    error.value = "Start date and end date are required.";
    return;
  }

  if (startDate.value > endDate.value) {
    data.value = null;
    isComplete.value = false;
    error.value = "End date must be after start date.";
    return;
  }

  data.value = {
    startDate: startDate.value as `${number}-${number}-${number}`,
    endDate: endDate.value as `${number}-${number}-${number}`,
  };
  isComplete.value = true;
  error.value = null;
}, { immediate: true });
</script>
