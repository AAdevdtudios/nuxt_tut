import { markRaw } from "vue";
import {
  TimetableStepsDeadlinesTab,
  TimetableStepsPreferencesTab,
  TimetableStepsScheduleTab,
  TimetableStepsSubjectsTab,
} from "#components";
import type {
  AITimetableInput,
  AITimetableWizardState,
  StepDefinition,
} from "~/types";

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

export const initialTimetableState: AITimetableWizardState = {
  subjects: { data: null, completed: false },
  schedule: { data: null, completed: false },
  deadlines: { data: null, completed: false, optional: true },
  preferences: {
    data: null,
    completed: true, // ⬅️ ALWAYS TRUE
    optional: true,
  },
  review: { data: null, completed: false },
};

export function normalizeAITimetableInput(
  state: AITimetableWizardState
): AITimetableInput {
  return {
    subjects: state.subjects.data!,
    schedule: {
      hoursPerDay: state.schedule.data?.hoursPerDay ?? 6,
      breakDurationMinutes: state.schedule.data?.breakDurationMinutes ?? 15,
      studyStyle: state.schedule.data?.studyStyle ?? "balanced",
      unavailableSlots: state.schedule.data?.unavailableSlots ?? [],
    },
    deadlines: state.deadlines.data ?? {
      exams: [],
      assignments: [],
    },
  };
}
