import type {
  AITimetableWizardState,
  DeadlinesStepData,
  PreferencesStepData,
  ScheduleStepData,
  SubjectsStepData,
} from "~/types";
import type {
  TimetableGenerateRequest,
  TimetableGenerateResponse,
} from "~/types/timetable.types";

function buildSubjectsPayload(data: SubjectsStepData) {
  return data.subjects.map((subject) => ({
    name: subject,
    priority: data.prioritySubjects.includes(subject) ? "high" : "medium",
  })) as TimetableGenerateRequest["subjects"];
}

function buildUnavailableSlotsPayload(data: ScheduleStepData) {
  return data.unavailableSlots.map((slot) => ({
    day: slot.day,
    start: slot.time.start,
    end: slot.time.end,
  }));
}

function buildDeadlinesPayload(data: DeadlinesStepData) {
  return [
    ...data.exams.map((item) => ({
      type: "exam" as const,
      subject: item.subject,
      date: item.date,
    })),
    ...data.assignments.map((item) => ({
      type: "assignment" as const,
      subject: item.subject,
      date: item.date,
    })),
  ];
}

function ensureDateRange(data: PreferencesStepData | null | undefined) {
  if (!data?.startDate || !data?.endDate) {
    throw new Error("Select a start date and end date.");
  }

  return {
    startDate: data.startDate,
    endDate: data.endDate,
  };
}

export function useTimetableGenerator() {
  const generatedTimetable = useState<TimetableGenerateResponse | null>(
    "generated-timetable",
    () => null,
  );
  const isGeneratingTimetable = useState<boolean>(
    "is-generating-timetable",
    () => false,
  );

  const { $api } = useNuxtApp();

  const clearGeneratedTimetable = () => {
    generatedTimetable.value = null;
  };

  const generateTimetable = async (state: AITimetableWizardState) => {
    const subjects = state.subjects.data;
    const schedule = state.schedule.data;
    const deadlines = state.deadlines.data ?? {
      exams: [],
      assignments: [],
    };
    const preferences = state.preferences.data;

    if (!subjects) {
      throw new Error("Add at least one subject.");
    }

    if (!schedule) {
      throw new Error("Complete the study schedule step.");
    }

    const { startDate, endDate } = ensureDateRange(preferences);

    const payload: TimetableGenerateRequest = {
      subjects: buildSubjectsPayload(subjects),
      studyHoursPerDay: schedule.hoursPerDay,
      breakMinutes: schedule.breakDurationMinutes,
      studyStyle: schedule.studyStyle,
      unavailableSlots: buildUnavailableSlotsPayload(schedule),
      deadlines: buildDeadlinesPayload(deadlines),
      startDate,
      endDate,
    };

    isGeneratingTimetable.value = true;

    try {
      const response = await $api.mutate<TimetableGenerateResponse>(
        "/api/ai/timetable",
        {
          method: "POST",
          body: payload,
        },
      );

      generatedTimetable.value = response;
      return response;
    } finally {
      isGeneratingTimetable.value = false;
    }
  };

  return {
    generatedTimetable,
    isGeneratingTimetable,
    generateTimetable,
    clearGeneratedTimetable,
  };
}
