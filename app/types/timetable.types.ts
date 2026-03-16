export interface TimetableRequestSubject {
  name: string;
  priority: "high" | "medium";
}

export interface TimetableRequestUnavailableSlot {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  start: string;
  end: string;
}

export interface TimetableRequestDeadline {
  type: "exam" | "assignment";
  subject: string;
  date: `${number}-${number}-${number}`;
}

export interface TimetableGenerateRequest {
  subjects: TimetableRequestSubject[];
  studyHoursPerDay: number;
  breakMinutes: number;
  studyStyle: "intensive" | "balanced" | "light";
  unavailableSlots: TimetableRequestUnavailableSlot[];
  deadlines: TimetableRequestDeadline[];
  startDate: `${number}-${number}-${number}`;
  endDate: `${number}-${number}-${number}`;
}

export interface TimetableBlock {
  subject: string | null;
  start: string;
  end: string;
  type: string;
}

export interface TimetableDaySchedule {
  date: string;
  day: string;
  blocks: TimetableBlock[];
}

export interface TimetableValidation {
  isValid: boolean;
  daysValidated: number;
  failedRules: number;
  allocationDeviationPercent: number;
  repairAttempts: number;
}

export interface TimetableGenerateResponse {
  schedule: TimetableDaySchedule[];
  notes: string;
  validation: TimetableValidation;
}
