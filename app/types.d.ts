export interface AuthResponse {
  jwt: string;
  user: User;
}

export interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  role?: {
    id: number;
    name: string;
    type: string;
  };
}
export interface ApiError {
  status: number;
  name: string;
  message: string;
  details?: {
    errors: Array<{ id: string; message: string; field: string }>;
  };
}

export interface LibraryListResponse {
  data: LibraryItem[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface LibraryItem {
  id: number;
  title: string;
  type: LibraryTypeValue;
  size: number;
  content: string;
  // createdAt: string;
  // updatedAt: string;
}

export interface LibrarySelection {
  id: number;
  title: string;
  type: LibraryTypeValue;
}

export interface LibraryType {
  label: string;
  value: string;
}
export const libraryTypes = [
  { label: "All", value: "all" },
  { label: "PDF", value: "pdf" },
  { label: "DOCX", value: "docx" },
  { label: "TXT", value: "txt" },
  { label: "Website", value: "website" },
  { label: "Note", value: "note" },
  { label: "AI Generated", value: "ai_generated" },
] as const;
export type LibraryTypeValue = (typeof libraryTypes)[number]["value"];

export type ChatHistory = {
  id: number;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
};

// Timetable Types would soon be moved to their own file

export interface StepDefinition {
  id: string;
  label: string;
  icon: string;
  component: Component;
  required?: boolean; // ⬅️ NEW (default: true)
}

export interface Step extends StepDefinition {
  isComplete: boolean;
  data: SubjectsStepData | null; // ⬅️ NEW (step output)
}
export type SubjectId = string;

export type ISODateString = `${number}-${number}-${number}`;
// (You can later normalize dd/mm/yyyy → ISO)

export interface TimeRange {
  start: string; // "08:00"
  end: string; // "10:30"
}

export interface UnavailableSlot {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  time: TimeRange;
}

export interface SubjectsStepData {
  subjects: SubjectId[];
  prioritySubjects: SubjectId[];
}
export type StudyStyle = "intensive" | "balanced" | "light";

export interface ScheduleStepData {
  hoursPerDay: number; // e.g. 6
  breakDurationMinutes: number; // e.g. 15
  studyStyle: StudyStyle;
  unavailableSlots: UnavailableSlot[];
}
export interface ExamDeadline {
  subject: SubjectId;
  date: ISODateString;
}

export interface AssignmentDeadline {
  subject: SubjectId;
  date: ISODateString;
}

export interface DeadlinesStepData {
  exams: ExamDeadline[];
  assignments: AssignmentDeadline[];
}

export interface AITimetableInput {
  subjects: SubjectsStepData;
  schedule: ScheduleStepData;
  deadlines: DeadlinesStepData;
}
export interface AITimetableWizardState {
  subjects: StepState<SubjectsStepData>;
  schedule: StepState<ScheduleStepData>;
  deadlines: StepState<DeadlinesStepData>;
  preferences: StepState<PreferencesStepData>; // ⬅️ ADD THIS
  review: StepState<ReviewStepData>;
}

// ~/types/preferences.ts

export type PreferredStudyTime = "morning" | "afternoon" | "evening" | "night";

export interface PreferencesStepData {
  preferredStudyTime?: PreferredStudyTime;
  breakDurationMinutes?: number;
  studyStyle?: StudyStyle;
  unavailableSlots?: UnavailableSlot[];
}
