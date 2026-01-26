<template>
  <div class="space-y-4">
    <div class="md:flex gap-4 w-full">
      <UFormField
        label="Study Hours Per Day"
        description="Specify your preferred study hours each day"
        class="w-full font-medium text-md"
        :ui="{ description: 'text-sm text-muted' }"
      >
        <USelect
          v-model="hoursPerDay"
          :items="hoursPerDayOptions"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Break Duration (minutes)"
        description="Specify your preferred break duration in minutes"
        class="w-full font-medium text-md"
        :ui="{ description: 'text-sm text-muted' }"
      >
        <USelect
          v-model="breakDuration"
          :items="breakDurationOptions"
          class="w-full"
        />
      </UFormField>
    </div>
    <UFormField
      label="Study Style"
      description="Specify your preferred study style"
      class="w-full mt-4 font-medium text-md"
      :ui="{ description: 'text-sm text-muted' }"
    >
      <USelect
        v-model="studyStyle"
        :items="studyStyleOptions"
        class="w-full"
        description-key="description"
      />
    </UFormField>
    <UFormField
      label="Unavailable Time Slots"
      description="Specify your unavailable time slots"
      class="w-full mt-4 font-medium text-md"
      :ui="{ description: 'text-sm text-muted' }"
    >
      <div class="flex flex-col md:flex-row mt-2 gap-4">
        <USelect
          v-model="unavailableDay"
          :items="daysOfWeek"
          placeholder="Day of the week"
          class="w-full"
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
          :disabled="!unavailableDay || !unavailableStart || !unavailableEnd"
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
import type { SelectItem } from "@nuxt/ui";
import type { SubjectsStepData, StudyStyle, UnavailableSlot } from "~/types";

const props = defineProps<{
  subjects: SubjectsStepData["subjects"];
}>();

const hoursPerDay = ref<number>(6);
const breakDuration = ref<number>(15);
const studyStyle = ref<StudyStyle>("balanced");
const unavailableDay = ref<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun" | "">("");
const unavailableStart = ref<string>("");
const unavailableEnd = ref<string>("");
const unavailableSlots = ref<UnavailableSlot[]>([]);

const hoursPerDayOptions = [2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => ({
  label: `${h} hours`,
  value: h,
}));
const breakDurationOptions = [10, 15, 20, 30, 45, 60].map((m) => ({
  label: `${m} min`,
  value: m,
}));
const studyStyleOptions = [
  {
    label: "Intensive",
    value: "intensive",
    description: "Longer, focused sessions with fewer breaks.",
  },
  {
    label: "Distributed",
    value: "balanced",
    description: "Balanced sessions with regular breaks.",
  },
  {
    label: "Flexible",
    value: "light",
    description: "Shorter, flexible sessions with more breaks.",
  },
];
const daysOfWeek = [
  { label: "Monday", value: "Mon" },
  { label: "Tuesday", value: "Tue" },
  { label: "Wednesday", value: "Wed" },
  { label: "Thursday", value: "Thu" },
  { label: "Friday", value: "Fri" },
  { label: "Saturday", value: "Sat" },
  { label: "Sunday", value: "Sun" },
];

function addUnavailableSlot() {
  if (!unavailableDay.value || !unavailableStart.value || !unavailableEnd.value)
    return;
  unavailableSlots.value.push({
    day: unavailableDay.value,
    time: { start: unavailableStart.value, end: unavailableEnd.value },
  });
  unavailableDay.value = "";
  unavailableStart.value = "";
  unavailableEnd.value = "";
}

function removeUnavailableSlot(idx: number) {
  unavailableSlots.value.splice(idx, 1);
}
</script>
