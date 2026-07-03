<template>
  <div class="space-y-4">
    <div class="md:flex gap-4 w-full">
      <UFormField
        label="Study Hours Per Day"
        description="Specify your preferred study hours each day"
        class="w-full font-medium text-md"
        :ui="{ description: 'text-sm text-muted' }"
      >
        <USelectMenu
          :items="hoursPerDayOptions"
          v-model="selectedHours"
          value-key="value"
          class="w-full"
          :search-input="false"
        />
      </UFormField>
      <UFormField
        label="Break Duration (minutes)"
        description="Specify your preferred break duration in minutes"
        class="w-full font-medium text-md"
        :ui="{ description: 'text-sm text-muted' }"
      >
        <USelectMenu
          :items="breakDurationOptions"
          v-model="selectedBreaks"
          value-key="value"
          class="w-full"
          :search-input="false"
        />
      </UFormField>
    </div>

    <UFormField
      label="Study Style"
      description="Specify your preferred study style"
      class="w-full mt-4 font-medium text-md"
      :ui="{ description: 'text-sm text-muted' }"
    >
      <USelectMenu
        :items="studyStyleOptions"
        v-model="selectedStyle"
        value-key="value"
        class="w-full"
        description-key="description"
        :search-input="false"
      />
    </UFormField>

    <UFormField
      label="Unavailable Time Slots"
      description="Specify your unavailable time slots"
      class="w-full mt-4 font-medium text-md"
      :ui="{ description: 'text-sm text-muted' }"
    >
      <div class="flex flex-col md:flex-row mt-2 gap-4">
        <USelectMenu
          :items="daysOfWeek"
          v-model="selectedUnavailable"
          value-key="value"
          class="w-full"
          :search-input="false"
        />
        <UInput
          v-model="unavailableStart"
          type="time"
          placeholder="Start time"
          class="w-full"
        />
        <UInput
          v-model="unavailableEnd"
          type="time"
          placeholder="End time"
          class="w-full"
        />
        <UButton
          icon="i-lucide-plus"
          color="primary"
          class="w-full md:w-fit items-center justify-center"
          :disabled="
            !selectedUnavailable || !unavailableStart || !unavailableEnd
          "
          @click="addUnavailableSlot"
        />
      </div>

      <div v-if="unavailableSlots.length" class="mt-4 space-y-2">
        <div
          v-for="(slot, idx) in unavailableSlots"
          :key="idx"
          class="flex justify-between gap-2 border rounded px-3 py-1 text-sm"
        >
          <div>
            <span class="font-medium">{{ slot.day }}</span>
            <span>{{ slot.time.start }} - {{ slot.time.end }}</span>
          </div>
          <UButton
            icon="i-lucide-trash-2"
            variant="ghost"
            color="error"
            size="xs"
            @click="removeUnavailableSlot(idx)"
          />
        </div>
      </div>
    </UFormField>
  </div>
</template>

<script setup lang="ts">
import type { SelectMenuItem } from "@nuxt/ui";
import type {
  ScheduleStepData,
  SubjectsStepData,
  StudyStyle,
  UnavailableSlot,
} from "~/types";

const isComplete = defineModel<boolean>("isComplete", { required: true });
const data = defineModel<ScheduleStepData | null>("data", { required: true });
defineProps<{
  subjects: SubjectsStepData["subjects"];
}>();

type NumberOption = { label: string; value: number };
type StudyStyleOption = {
  label: string;
  value: StudyStyle;
  description: string;
};
type DayValue = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
type DayOption = { label: string; value: DayValue };

const selectedUnavailable = ref<DayValue | undefined>(undefined);
const unavailableStart = ref("");
const unavailableEnd = ref("");

const hoursPerDayOptions: SelectMenuItem[] = [2, 3, 4, 5, 6, 7, 8, 9, 10].map(
  (h) => ({
    label: `${h} hours`,
    value: h,
  }),
);

const breakDurationOptions: NumberOption[] = [10, 15, 20, 30, 45, 60].map(
  (m) => ({
    label: `${m} min`,
    value: m,
  }),
);

const studyStyleOptions: StudyStyleOption[] = [
  {
    label: "Cram",
    value: "cram",
    description: "Longer, focused sessions with fewer breaks.",
  },
  {
    label: "Distributed",
    value: "distributed",
    description: "Balanced sessions with regular breaks.",
  },
  {
    label: "Balanced",
    value: "balanced",
    description: "Shorter, flexible sessions with more breaks.",
  },
];

const daysOfWeek: DayOption[] = [
  { label: "Monday", value: "Mon" },
  { label: "Tuesday", value: "Tue" },
  { label: "Wednesday", value: "Wed" },
  { label: "Thursday", value: "Thu" },
  { label: "Friday", value: "Fri" },
  { label: "Saturday", value: "Sat" },
  { label: "Sunday", value: "Sun" },
];

function normalizeStudyStyle(value: unknown): StudyStyle {
  return value === "cram" || value === "distributed" || value === "balanced"
    ? value
    : "balanced";
}

function ensureScheduleData(): ScheduleStepData {
  if (!data.value) {
    data.value = {
      hoursPerDay: 4,
      breakDurationMinutes: 15,
      studyStyle: "balanced",
      unavailableSlots: [],
    };
  }

  return data.value;
}

const selectedHours = computed<number>({
  get: () => data.value?.hoursPerDay ?? 4,
  set: (value) => {
    ensureScheduleData().hoursPerDay = value ?? 4;
    isComplete.value = true;
  },
});

const selectedBreaks = computed<number>({
  get: () => data.value?.breakDurationMinutes ?? 15,
  set: (value) => {
    ensureScheduleData().breakDurationMinutes = value ?? 15;
    isComplete.value = true;
  },
});

const selectedStyle = computed<StudyStyle>({
  get: () => normalizeStudyStyle(data.value?.studyStyle),
  set: (value) => {
    ensureScheduleData().studyStyle = normalizeStudyStyle(value);
    isComplete.value = true;
  },
});

const unavailableSlots = computed<UnavailableSlot[]>({
  get: () => data.value?.unavailableSlots ?? [],
  set: (value) => {
    ensureScheduleData().unavailableSlots = value;
    isComplete.value = true;
  },
});

function addUnavailableSlot() {
  if (
    !selectedUnavailable.value ||
    !unavailableStart.value ||
    !unavailableEnd.value
  )
    return;

  unavailableSlots.value = [
    ...unavailableSlots.value,
    {
    day: selectedUnavailable.value,
    time: { start: unavailableStart.value, end: unavailableEnd.value },
    },
  ];
  selectedUnavailable.value = undefined;
  unavailableStart.value = "";
  unavailableEnd.value = "";
  isComplete.value = true;
}

function removeUnavailableSlot(idx: number) {
  unavailableSlots.value = unavailableSlots.value.filter(
    (_, index) => index !== idx,
  );
  isComplete.value = true;
}
</script>
