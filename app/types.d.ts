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

// Library Types - Aligned with Zod schemas and Strapi CMS
export type LibraryType = "url" | "doc" | "note";

export interface LibraryItem {
  id: number;
  documentId: string;
  title: string;
  url?: string | null;
  content?: string | null;
  docID?: string | number | null;
  libraryType: LibraryType;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  libUUID?: string;
}

export interface LibrariesResponse {
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

export interface LibrarySingleResponse {
  data: LibraryItem;
}

export interface LibraryCreateRequest {
  title: string;
  libraryType: LibraryType;
  url?: string | null;
  content?: string | null;
  docID?: string | number | null;
  libUUID?: string;
  locale?: string;
}

export interface LibraryUpdateRequest {
  title?: string;
  libraryType?: LibraryType;
  url?: string | null;
  content?: string | null;
  docID?: string | number | null;
}

export interface UploadedFile {
  id: number;
  name: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl?: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

export type UploadResponse = UploadedFile[];

// Legacy library types (deprecated, use LibraryType instead)
export interface LibrarySelection {
  id: number;
  title: string;
  type: LibraryTypeValue;
}

export interface LibraryTypeOption {
  label: string;
  value: string;
}

export const libraryTypeOptions = [
  { label: "All", value: "all" },
  { label: "Documents", value: "doc" },
  { label: "Links", value: "url" },
  { label: "Notes", value: "note" },
] as const;

export type LibraryTypeValue = (typeof libraryTypeOptions)[number]["value"];

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
