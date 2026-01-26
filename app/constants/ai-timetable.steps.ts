import { markRaw } from "vue";
import {
  TimetableStepsDeadlinesTab,
  TimetableStepsPreferencesTab,
  TimetableStepsScheduleTab,
  TimetableStepsSubjectsTab,
} from "#components";
import type { StepDefinition } from "~/types";

export const AI_TIMETABLE_STEPS = [
  {
    id: "subjects",
    label: "Subjects",
    icon: "i-lucide-book",
    component: markRaw(TimetableStepsSubjectsTab),
    required: true,
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: "i-lucide-sliders",
    component: markRaw(TimetableStepsScheduleTab),
    required: true,
  },
  {
    id: "deadlines",
    label: "Deadlines",
    icon: "i-lucide-eye",
    component: markRaw(TimetableStepsDeadlinesTab),
    required: false, // ⬅️ OPTIONAL
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: "i-lucide-clock",
    component: markRaw(TimetableStepsPreferencesTab),
    required: false, // ⬅️ OPTIONAL
  },
] satisfies readonly StepDefinition[];
