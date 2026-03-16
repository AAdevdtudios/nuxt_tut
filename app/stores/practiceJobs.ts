import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type PracticeJobStatus =
  | "idle"
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type PracticeQuestion = {
  id: string;
  question: string;
  type: "multiple-choice" | "short-answer" | "essay" | "reasoning";
  options?: string[] | null;
  answer?: string | null;
  difficulty?: string | null;
  reason?: string | null;
  correctAnswers?: string[] | null;
  rubric?: unknown;
};

export type PracticeJobState = {
  projectId: string;
  jobId: string | null;
  status: PracticeJobStatus;
  progress: number;
  message: string;
  sourceMode: "random" | "single";
  libraryItemId: string | null;
  numberOfQuestions: number;
  focusArea: string;
  additionalInstructions: string;
  updatedAt: string | null;
  questions: PracticeQuestion[];
};

function createDefaultProjectJob(projectId: string): PracticeJobState {
  return {
    projectId,
    jobId: null,
    status: "idle",
    progress: 0,
    message: "",
    sourceMode: "random",
    libraryItemId: null,
    numberOfQuestions: 10,
    focusArea: "",
    additionalInstructions: "",
    updatedAt: null,
    questions: [],
  };
}

export const usePracticeJobsStore = defineStore(
  "practiceJobs",
  () => {
    const jobsByProject = ref<Record<string, PracticeJobState>>({});

    const ensureProjectJob = (projectId: string) => {
      if (!jobsByProject.value[projectId]) {
        jobsByProject.value[projectId] = createDefaultProjectJob(projectId);
      }

      return jobsByProject.value[projectId];
    };

    const getProjectJob = (projectId: string) => jobsByProject.value[projectId];

    const getProjectJobComputed = (projectId: string) =>
      computed(() => ensureProjectJob(projectId));

    const setJobRequested = (
      projectId: string,
      payload: {
        jobId: string;
        status?: PracticeJobStatus;
        sourceMode: "random" | "single";
        libraryItemId: string | null;
        numberOfQuestions: number;
        focusArea: string;
        additionalInstructions: string;
      },
    ) => {
      const state = ensureProjectJob(projectId);
      state.jobId = payload.jobId;
      state.status = payload.status || "pending";
      state.progress = 0;
      state.message = "Question generation queued";
      state.sourceMode = payload.sourceMode;
      state.libraryItemId = payload.libraryItemId;
      state.numberOfQuestions = payload.numberOfQuestions;
      state.focusArea = payload.focusArea;
      state.additionalInstructions = payload.additionalInstructions;
      state.updatedAt = new Date().toISOString();
      state.questions = [];
    };

    const setJobStatus = (
      projectId: string,
      payload: {
        status: PracticeJobStatus;
        progress?: number;
        message?: string;
      },
    ) => {
      const state = ensureProjectJob(projectId);
      state.status = payload.status;
      if (typeof payload.progress === "number" && Number.isFinite(payload.progress)) {
        state.progress = Math.max(0, Math.min(100, Math.round(payload.progress)));
      }
      if (typeof payload.message === "string") {
        state.message = payload.message;
      }
      state.updatedAt = new Date().toISOString();
    };

    const setJobQuestions = (
      projectId: string,
      questions: PracticeQuestion[],
      message = "Questions generated successfully.",
    ) => {
      const state = ensureProjectJob(projectId);
      state.questions = questions;
      state.status = "completed";
      state.progress = 100;
      state.message = message;
      state.updatedAt = new Date().toISOString();
    };

    const clearProjectJob = (projectId: string) => {
      jobsByProject.value[projectId] = createDefaultProjectJob(projectId);
    };

    return {
      jobsByProject,
      ensureProjectJob,
      getProjectJob,
      getProjectJobComputed,
      setJobRequested,
      setJobStatus,
      setJobQuestions,
      clearProjectJob,
    };
  },
  {
    persist: true,
  },
);
