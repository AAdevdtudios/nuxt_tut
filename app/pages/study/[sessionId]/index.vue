<script setup lang="ts">
import AdaptivePathSpotlight from "~/components/Study/AdaptivePathSpotlight.vue";

definePageMeta({ layout: "newdash" });

type StudySubPath = {
  key: string;
  title?: string;
  description?: string | null;
  status: "locked" | "unlocked" | "completed" | string;
  isActive?: boolean;
  order?: number | null;
  type?: "concept" | "drill" | "mistake-check" | "application" | "exam-check" | string;
  attemptCount?: number | null;
  latestScore?: number | null;
  bestScore?: number | null;
  lastAttemptAtUtc?: string | null;
};

type StudyTopic = {
  key: string;
  topic?: string;
  title?: string;
  description?: string;
  minScore?: number;
  maxScore?: number;
  currentScore?: number;
  status: "locked" | "unlocked" | "completed" | "review" | string;
  difficulty?: string;
  completedStageCount?: number;
  totalStageCount?: number;
  totalAttemptCount?: number;
  attemptCount?: number | null;
  isActive?: boolean;
  isConfirmed?: boolean;
  isMastered?: boolean;
  nextReviewAtUtc?: string | null;
  subPaths?: StudySubPath[];
};

type StudyRecommendation = {
  nextTopicKey?: string | null;
  nextTopic?: string | null;
  reason?: string | null;
  difficulty?: string | null;
  passed?: boolean;
  masteryScore?: number;
  suggestedActions?: string[];
  activeQuestionJobId?: string | null;
  stage?: "diagnostic" | "path" | string;
};

type ContentReadiness = {
  detectedSubject?: string;
  subjectCategory?: string;
  contentType?: string;
  extractionQuality?: string;
  visualDependency?: string;
  canGenerate?: string[];
  mayStruggleWith?: string[];
  supportedQuestionStyles?: string[];
};

type StudySession = {
  id: string;
  sourceLibraryItemId?: string | null;
  title?: string;
  status: "analyzing" | "topics_pending_confirmation" | "in_progress" | "completed" | "failed" | "diagnostic_ready" | string;
  masteryScore?: number;
  currentDifficulty?: string;
  topics?: StudyTopic[];
  activePathKey?: string | null;
  diagnosticScore?: number;
  scoreScale?: { min: number; max: number } | null;
  studyLevel?: string | null;
  questionStyle?: string | null;
  recommendation?: StudyRecommendation | null;
  message?: string | null;
  contentReadiness?: ContentReadiness | null;
};

type PracticeResponse = {
  sessionId?: string;
  jobId?: string;
  status?: string;
  focusTopicKey?: string;
  focusTopic?: string;
  studyLevel?: string;
  questionStyle?: string;
};

type DeleteStudySessionResponse = {
  sessionId?: string;
  sourceLibraryItemId?: string | null;
  deleted?: boolean;
  sourceDeleted?: boolean;
};

type QuestionJobStatus = {
  jobId?: string;
  status?: "pending" | "running" | "completed" | "failed" | string;
  progress?: number | null;
  generatedCount?: number | null;
  totalCount?: number | null;
  message?: string | null;
};

type QuestionResult = {
  jobId?: string;
  status?: string;
  questions?: unknown[] | null;
  message?: string | null;
};

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();

const sessionId = computed(() => String(route.params.sessionId || ""));
const session = ref<StudySession | null>(null);
const isLoading = ref(true);
const isPreparing = ref(false);
const isStartingPractice = ref(false);
const isDeleting = ref(false);
const isSavingPreferences = ref(false);
const studyLevel = ref("Auto");
const questionStyle = ref("exam-style");
const preferencesHydrated = ref(false);
const lastSavedStudyLevel = ref("");
const lastSavedQuestionStyle = ref("");
const preferenceNotice = ref("");
const isPreparingDiagnostic = ref(false);
const diagnosticStage = ref<"idle" | "getting-ready" | "generating" | "ready">("idle");
const diagnosticStatusMessage = ref("");
const diagnosticError = ref("");
const diagnosticProgress = ref(0);
const topicConfirmation = ref<Record<string, boolean>>({});
const isConfirming = ref(false);

const studyLevelOptions = [
  { label: "Auto", value: "Auto" },
  { label: "GCSE", value: "GCSE" },
  { label: "A-Level", value: "A-Level" },
  { label: "Undergraduate", value: "Undergraduate" },
  { label: "Masters", value: "Masters" },
  { label: "Professional", value: "Professional" },
];

const questionStyleOptions = [
  { label: "Exam style", value: "exam-style" },
  { label: "Short answer", value: "short-answer" },
  { label: "Mixed", value: "mixed" },
  { label: "Problem solving", value: "problem-solving" },
  { label: "Case study", value: "case-study" },
  { label: "Custom", value: "custom" },
];

const masteryPercent = computed(() =>
  Math.round(Number(session.value?.masteryScore || 0) * 100),
);
const topics = computed(() => session.value?.topics || []);
const confirmedTopics = computed(() => topics.value.filter((t) => t.isConfirmed));
const unconfirmedTopics = computed(() => topics.value.filter((t) => !t.isConfirmed));
const activePath = computed(
  () =>
    topics.value.find((topic) => topic.key === session.value?.activePathKey) ||
    topics.value.find((topic) => topic.status === "unlocked" && topic.isActive) ||
    null,
);
const diagnosticJobId = computed(
  () => session.value?.recommendation?.activeQuestionJobId || null,
);
const topicsPendingConfirmation = computed(() => session.value?.status === "topics_pending_confirmation");
const isBeforeDiagnostic = computed(() => session.value?.status === "diagnostic_ready");
const confirmedCount = computed(() => Object.values(topicConfirmation.value).filter(Boolean).length);
const activePathBranches = computed(() =>
  activePath.value ? questBranches(activePath.value) : [],
);
const activePathPosition = computed(() => {
  if (!activePath.value) return 0;
  const index = confirmedTopics.value.findIndex((topic) => topic.key === activePath.value?.key);
  return index >= 0 ? index + 1 : 1;
});
const diagnosticButtonLabel = computed(() => {
  if (diagnosticStage.value === "getting-ready") return "Getting ready...";
  if (diagnosticStage.value === "generating") return "Questions generating...";
  if (diagnosticStage.value === "ready") return "Ready for test";
  return "Start Diagnostic";
});

function pathTitle(path: StudyTopic) {
  return path.topic || path.title || path.key;
}

function scoreLabel(value?: number, attemptCount?: number | null) {
  if (value === undefined || value === null) return "Not attempted";
  if (!attemptCount) return "Not attempted";
  return `${Math.round(value)}%`;
}

function scoreRangeLabel(path: StudyTopic) {
  if (path.minScore === undefined || path.maxScore === undefined) {
    return "Adaptive range";
  }
  return `${path.minScore}-${path.maxScore}`;
}

function statusIcon(status: string) {
  if (status === "completed") return "i-lucide-check";
  if (status === "unlocked") return "i-lucide-circle-dot";
  return "i-lucide-lock";
}

function questStatusIcon(branch: StudySubPath) {
  if (branch.status === "completed") return "i-lucide-check";
  if (branch.isActive) return "i-lucide-sparkles";
  return "i-lucide-lock";
}

function isActivePath(path: StudyTopic) {
  if (path.status !== "unlocked") return false;
  if (session.value?.activePathKey) {
    return path.key === session.value.activePathKey;
  }
  return path.isActive === true;
}

function questTypeIcon(type?: string | null) {
  if (type === "concept") return "i-lucide-map";
  if (type === "drill") return "i-lucide-dumbbell";
  if (type === "mistake-check") return "i-lucide-search-check";
  if (type === "application") return "i-lucide-route";
  if (type === "exam-check") return "i-lucide-shield-check";
  return "i-lucide-git-branch";
}

function branchStatusLabel(branch: StudySubPath) {
  if (branch.isActive) return "active";
  return branch.status;
}

function usesAdvancedExamLabel() {
  return ["A-Level", "Undergraduate", "Masters", "Professional"].includes(studyLevel.value);
}

function branchTitle(branch: StudySubPath) {
  if (branch.type === "exam-check") {
    return usesAdvancedExamLabel() ? "Mastery check" : "Boss check";
  }
  if (branch.title) return branch.title;
  return branch.key;
}

function branchScoreLabel(branch: StudySubPath) {
  if (branch.latestScore === undefined || branch.latestScore === null) return "";
  return `Latest: ${Math.round(branch.latestScore)}%`;
}

function questBranches(path: StudyTopic): StudySubPath[] {
  if (Array.isArray(path.subPaths) && path.subPaths.length) {
    return [...path.subPaths].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
  }

  const pathIsComplete = path.status === "completed";
  const pathIsActive = isActivePath(path);
  const branchState = (index: number): "completed" | "unlocked" | "locked" => {
    if (pathIsComplete) return "completed";
    if (pathIsActive && index === 0) return "unlocked";
    return "locked";
  };

  return [
    {
      key: `${path.key}-initial`,
      title: "Initial Practice",
      description: "Five questions to establish your starting point on this topic.",
      status: branchState(0),
      isActive: pathIsActive && !pathIsComplete,
      order: 1,
      type: "concept",
    },
    {
      key: `${path.key}-revision`,
      title: "Targeted Revision",
      description: "Ten focused questions on the weak areas GapAI identified.",
      status: branchState(1),
      isActive: false,
      order: 2,
      type: "drill",
    },
    {
      key: `${path.key}-retest`,
      title: "Retest",
      description: "Five exam-style questions. Pass to mark this topic mastered.",
      status: branchState(2),
      isActive: false,
      order: 3,
      type: "exam-check",
    },
  ];
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function updateDiagnosticProgress(status: QuestionJobStatus) {
  const progress = Number(status.progress ?? 0);
  diagnosticProgress.value = Math.max(0, Math.min(100, progress));

  if (status.status === "completed") {
    diagnosticStage.value = "ready";
    diagnosticProgress.value = 100;
    diagnosticStatusMessage.value = status.message || "Questions ready.";
    return;
  }

  diagnosticStage.value = status.status === "pending" ? "getting-ready" : "generating";
  diagnosticStatusMessage.value =
    status.message ||
    (status.status === "pending"
      ? "Stay here while GapAI prepares the assessment."
      : "GapAI is generating exam-style questions from your material.");
}

function failedQuestionSetMessage(message?: string | null) {
  const value = String(message || "").trim();
  if (
    value ===
    "Could not generate a high-quality question set from this source. Please try again or upload clearer material."
  ) {
    return "GapAI rejected this generated set because the questions were not reliable enough. Try again, or switch to an easier level.";
  }
  return value || "GapAI could not create a clean question set from this section yet.";
}

function hydratePreferences(response: StudySession) {
  if (preferencesHydrated.value) return;

  studyLevel.value = response.studyLevel || studyLevel.value;
  questionStyle.value = response.questionStyle || questionStyle.value;
  lastSavedStudyLevel.value = studyLevel.value;
  lastSavedQuestionStyle.value = questionStyle.value;
  preferencesHydrated.value = true;
}

async function saveStudyPreferences() {
  if (!sessionId.value || !preferencesHydrated.value) return;
  if (
    studyLevel.value === lastSavedStudyLevel.value &&
    questionStyle.value === lastSavedQuestionStyle.value
  ) {
    return;
  }

  try {
    isSavingPreferences.value = true;
    const response = await $api.mutate<StudySession>(
      `/api/study-sessions/${sessionId.value}/preferences`,
      {
        method: "PATCH",
        body: {
          studyLevel: studyLevel.value,
          questionStyle: questionStyle.value,
        },
      },
    );
    session.value = response;
    lastSavedStudyLevel.value = studyLevel.value;
    lastSavedQuestionStyle.value = questionStyle.value;
    preferenceNotice.value =
      "Your future questions will use this level and style. Start a new practice set to apply it.";
  } catch (error: any) {
    toast.add({
      title: "Could not save exam setup",
      description: error?.data?.message || error?.statusMessage || error?.message || "Please try again.",
      color: "error",
    });
  } finally {
    isSavingPreferences.value = false;
  }
}

async function confirmTopics() {
  const allTopics = session.value?.topics || [];
  const anyConfirmed = allTopics.some((t) => topicConfirmation.value[t.key]);
  if (!anyConfirmed) {
    toast.add({
      title: "Select at least one topic",
      description: "You need to confirm at least one topic to continue studying.",
      color: "warning",
    });
    return;
  }

  try {
    isConfirming.value = true;
    const body = {
      topics: allTopics.map((t) => ({
        key: t.key,
        confirmed: Boolean(topicConfirmation.value[t.key]),
      })),
    };
    const response = await $api.mutate<StudySession>(
      `/api/study-sessions/${sessionId.value}/topics/confirm`,
      { method: "PATCH", body },
    );
    session.value = response;
    hydratePreferences(response);
  } catch (error: any) {
    toast.add({
      title: "Could not confirm topics",
      description: error?.statusMessage || error?.message || "Please try again.",
      color: "error",
    });
  } finally {
    isConfirming.value = false;
  }
}

async function fetchSession() {
  if (!sessionId.value) return;
  try {
    const response = await $api.fetch<StudySession>(
      `/api/study-sessions/${sessionId.value}`,
    );
    session.value = response;
    hydratePreferences(response);
    initTopicConfirmation(response);
  } catch (error: any) {
    toast.add({
      title: "Could not load study stream",
      description: error?.statusMessage || error?.message || "Please try again.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

async function fetchLatestSession() {
  const response = await $api.fetch<StudySession>(
    `/api/study-sessions/${sessionId.value}`,
  );
  session.value = response;
  hydratePreferences(response);
  initTopicConfirmation(response);
  return response;
}

function resolvePracticePath(response: StudySession) {
  if (response.activePathKey) {
    return response.topics?.find((t) => t.key === response.activePathKey) || null;
  }
  // Fallback for legacy sessions without activePathKey
  return (
    response.topics?.find((topic) => topic.isActive === true) ||
    response.topics?.find((topic) => topic.status === "unlocked") ||
    null
  );
}

function formatReviewDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const diffDays = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  if (diffDays <= 0) return "review due now";
  return `spaced review in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
}

function initTopicConfirmation(sessionData: StudySession) {
  if (sessionData.status !== "topics_pending_confirmation") return;
  if (Object.keys(topicConfirmation.value).length) return;
  const initial: Record<string, boolean> = {};
  (sessionData.topics || []).forEach((t) => { initial[t.key] = true; });
  topicConfirmation.value = initial;
}

async function openDiagnostic() {
  const jobId = diagnosticJobId.value;
  if (!jobId || isPreparingDiagnostic.value) return;

  isPreparingDiagnostic.value = true;
  diagnosticStage.value = "getting-ready";
  diagnosticError.value = "";
  diagnosticStatusMessage.value = "Checking diagnostic readiness...";
  diagnosticProgress.value = 0;

  try {
    for (let attempt = 0; attempt < 45; attempt += 1) {
      try {
        const status = await $api.fetch<QuestionJobStatus>(
          `/api/study-sessions/${sessionId.value}/tests/${jobId}`,
        );
        updateDiagnosticProgress(status);

        if (status.status === "failed") {
          diagnosticStage.value = "idle";
          diagnosticProgress.value = 0;
          diagnosticStatusMessage.value = "";
          diagnosticError.value = failedQuestionSetMessage(status.message);
          return;
        }

        const result = await $api.fetch<QuestionResult>(
          `/api/study-sessions/${sessionId.value}/tests/${jobId}/result`,
        );

        if (result.questions?.length) {
          diagnosticStage.value = "ready";
          diagnosticProgress.value = 100;
          diagnosticStatusMessage.value = result.message || "Questions ready.";
          await wait(350);
          await router.push(
            `/study/${sessionId.value}/test/${jobId}?type=diagnostic&studyLevel=${encodeURIComponent(studyLevel.value)}&questionStyle=${encodeURIComponent(questionStyle.value)}`,
          );
          return;
        }
      } catch (error: any) {
        const status = error?.statusCode || error?.status;
        if (status !== 202 && status !== 404) throw error;
      }

      diagnosticStage.value = diagnosticStage.value === "getting-ready" ? "generating" : diagnosticStage.value;
      await wait(1200);
    }

    throw new Error("Questions are still being prepared. Try again in a moment.");
  } catch (error: any) {
    diagnosticStage.value = "idle";
    diagnosticStatusMessage.value = "";
    diagnosticProgress.value = 0;
    diagnosticError.value = failedQuestionSetMessage(
      error?.data?.error || error?.data?.message || error?.statusMessage || error?.message,
    );
  } finally {
    isPreparingDiagnostic.value = false;
  }
}

async function preparePath(path: StudyTopic) {
  if (!isActivePath(path)) return;

  try {
    isPreparing.value = true;
    await router.push(
      `/study/${sessionId.value}/prepare/${encodeURIComponent(path.key)}`,
    );
  } catch (error: any) {
    toast.add({
      title: "Could not prepare path",
      description: error?.statusMessage || error?.message || "Please try again.",
      color: "error",
    });
  } finally {
    isPreparing.value = false;
  }
}

async function startPractice() {
  try {
    isStartingPractice.value = true;
    const latestSession = await fetchLatestSession();
    const practicePath = resolvePracticePath(latestSession);

    if (!practicePath?.key) {
      throw new Error("No active practice path is available yet.");
    }

    const response = await $api.mutate<PracticeResponse>(
      `/api/study-sessions/${sessionId.value}/paths/${encodeURIComponent(practicePath.key)}/practice`,
      {
        method: "POST",
        body: {
          sessionId: sessionId.value,
          pathKey: practicePath.key,
          mode: "next",
          studyLevel: studyLevel.value,
          questionStyle: questionStyle.value,
        },
      },
    );
    if (!response.jobId) throw new Error("No practice job was returned.");
    await router.push(
      `/study/${sessionId.value}/test/${response.jobId}?type=practice&pathKey=${encodeURIComponent(practicePath.key)}`,
    );
  } catch (error: any) {
    toast.add({
      title: "Could not start practice",
      description: error?.statusMessage || error?.message || "Please try again.",
      color: "error",
    });
  } finally {
    isStartingPractice.value = false;
  }
}

async function deleteCurrentSession() {
  if (!sessionId.value) return;
  if (!confirm(`Delete "${session.value?.title || "this study stream"}"? This removes attempts and the uploaded source for this session.`)) {
    return;
  }

  try {
    isDeleting.value = true;
    await $api.mutate<DeleteStudySessionResponse>(
      `/api/study-sessions/${sessionId.value}?deleteSource=true`,
      {
        method: "DELETE",
      },
    );
    toast.add({
      title: "Study stream deleted",
      description: "The session and linked source were removed.",
      color: "success",
    });
    await router.push("/dashboard");
  } catch (error: any) {
    toast.add({
      title: "Could not delete study stream",
      description: error?.data?.message || error?.statusMessage || error?.message || "Please try again.",
      color: "error",
    });
  } finally {
    isDeleting.value = false;
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let preferencesTimer: ReturnType<typeof setTimeout> | null = null;

watch([studyLevel, questionStyle], () => {
  if (!preferencesHydrated.value) return;
  if (preferencesTimer) clearTimeout(preferencesTimer);
  preferenceNotice.value = "";
  preferencesTimer = setTimeout(() => {
    void saveStudyPreferences();
  }, 500);
});

onMounted(async () => {
  await fetchSession();
  pollTimer = setInterval(() => {
    if (session.value?.status === "analyzing") {
      void fetchSession();
    }
  }, 3000);
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
  if (preferencesTimer) clearTimeout(preferencesTimer);
});
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <header class="ga-surface-warm rounded-[2rem] border p-6 sm:p-8">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="ga-link text-xs font-bold uppercase tracking-[0.22em]">
            Adaptive study stream
          </p>
          <h1 class="ga-heading mt-2 font-serif text-3xl font-semibold sm:text-5xl">
            {{ session?.title || "Study stream" }}
          </h1>
          <p class="ga-muted mt-3 max-w-2xl text-sm leading-6">
            Confirm your topics, then work through each stage — Initial Practice,
            Targeted Revision, and Retest — until the topic is mastered.
            Only one path is ever active at a time.
          </p>
        </div>
        <div class="space-y-3">
          <div class="ga-surface rounded-2xl border p-4">
            <p class="ga-subtle text-xs font-semibold">Mastery</p>
            <p class="ga-heading mt-1 text-3xl font-bold">{{ masteryPercent }}%</p>
            <UProgress :model-value="masteryPercent" color="primary" class="mt-2 w-48" />
          </div>
          <UButton
            label="Delete stream"
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            class="w-full justify-center rounded-xl"
            :loading="isDeleting"
            @click="deleteCurrentSession"
          />
        </div>
      </div>
    </header>

    <section v-if="isLoading" class="ga-surface rounded-[2rem] border p-8">
      <USkeleton class="h-8 w-1/2 rounded-xl" />
      <USkeleton class="mt-4 h-32 rounded-2xl" />
    </section>

    <section
      v-else-if="session?.status === 'analyzing'"
      class="ga-surface rounded-[2rem] border p-8 text-center"
    >
      <UIcon name="i-lucide-loader-circle" class="mx-auto h-10 w-10 animate-spin text-[var(--ga-primary)]" />
      <h2 class="ga-heading mt-4 font-serif text-3xl font-semibold">
        GapAI is reading your material...
      </h2>
      <p class="ga-muted mt-2">Building your diagnostic test and locked path stream.</p>
      <UProgress animation="carousel" color="primary" class="mx-auto mt-5 max-w-md" />
    </section>

    <section
      v-else-if="topicsPendingConfirmation"
      class="ga-surface rounded-[2rem] border p-6 sm:p-8"
    >
      <div class="mb-6">
        <p class="ga-link text-xs font-bold uppercase tracking-[0.22em]">
          Step 1 — Choose your topics
        </p>
        <h2 class="ga-heading mt-2 font-serif text-3xl font-semibold sm:text-4xl">
          GapAI selected {{ session?.topics?.length || 0 }} study-ready topic{{ (session?.topics?.length || 0) !== 1 ? "s" : "" }} from your material
        </h2>
        <p class="ga-muted mt-3 max-w-2xl text-sm leading-6">
          Select the topics you want to study. GapAI activates the first confirmed topic immediately —
          the rest stay queued. Only one topic is ever active at a time.
        </p>
      </div>

      <div
        v-if="session?.contentReadiness"
        class="mb-6 rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] p-4"
      >
        <div class="flex flex-wrap items-center gap-2 mb-3">
          <UBadge
            :color="session.contentReadiness.extractionQuality === 'high' ? 'success' : session.contentReadiness.extractionQuality === 'partial' ? 'warning' : 'error'"
            variant="soft"
            class="rounded-full"
          >
            Extraction: {{ session.contentReadiness.extractionQuality || "unknown" }}
          </UBadge>
          <UBadge
            :color="session.contentReadiness.visualDependency === 'low' ? 'success' : session.contentReadiness.visualDependency === 'medium' ? 'warning' : 'error'"
            variant="soft"
            class="rounded-full"
          >
            Visual content: {{ session.contentReadiness.visualDependency || "unknown" }}
          </UBadge>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 text-xs">
          <div v-if="session.contentReadiness.canGenerate?.length">
            <p class="font-semibold text-[var(--ga-text)] mb-1.5">GapAI can generate</p>
            <ul class="space-y-1">
              <li
                v-for="item in session.contentReadiness.canGenerate"
                :key="item"
                class="flex items-start gap-1.5 ga-text"
              >
                <UIcon name="i-lucide-check" class="mt-0.5 h-3 w-3 shrink-0 text-[var(--ga-success,#22c55e)]" />
                {{ item }}
              </li>
            </ul>
          </div>
          <div v-if="session.contentReadiness.mayStruggleWith?.length && session.contentReadiness.mayStruggleWith[0] !== 'None identified'">
            <p class="font-semibold text-[var(--ga-text)] mb-1.5">May struggle with</p>
            <ul class="space-y-1">
              <li
                v-for="item in session.contentReadiness.mayStruggleWith"
                :key="item"
                class="flex items-start gap-1.5 ga-muted"
              >
                <UIcon name="i-lucide-alert-triangle" class="mt-0.5 h-3 w-3 shrink-0 text-[var(--ga-warning,#f59e0b)]" />
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="space-y-3">
        <button
          v-for="topic in session?.topics"
          :key="topic.key"
          type="button"
          class="flex w-full items-start gap-4 rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] p-4 text-left transition hover:border-[var(--ga-primary)]"
          @click="topicConfirmation[topic.key] = !topicConfirmation[topic.key]"
        >
          <div
            :class="[
              'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition',
              topicConfirmation[topic.key]
                ? 'border-[var(--ga-primary)] bg-[var(--ga-primary)] text-white'
                : 'border-[var(--ga-border)] bg-[var(--ga-surface)]',
            ]"
          >
            <UIcon v-if="topicConfirmation[topic.key]" name="i-lucide-check" class="h-3 w-3" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="ga-heading font-semibold">{{ topic.topic || topic.title || topic.key }}</p>
            <p v-if="topic.description" class="ga-muted mt-1 text-sm leading-5">
              {{ topic.description }}
            </p>
          </div>
        </button>
      </div>

      <div class="mt-6 flex flex-wrap items-center gap-3">
        <UButton
          :label="isConfirming ? 'Starting...' : `Confirm ${confirmedCount} topic${confirmedCount !== 1 ? 's' : ''} and start`"
          icon="i-lucide-arrow-right"
          color="primary"
          class="rounded-xl"
          :loading="isConfirming"
          :disabled="confirmedCount === 0 || isConfirming"
          @click="confirmTopics"
        />
        <UButton
          label="Select all"
          color="neutral"
          variant="ghost"
          class="rounded-xl"
          :disabled="isConfirming"
          @click="session?.topics?.forEach(t => { topicConfirmation[t.key] = true })"
        />
        <UButton
          label="Clear all"
          color="neutral"
          variant="ghost"
          class="rounded-xl"
          :disabled="isConfirming"
          @click="topicConfirmation = {}"
        />
      </div>
    </section>

    <section
      v-else-if="session?.status === 'failed'"
      class="ga-surface rounded-[2rem] border p-8 text-center"
    >
      <UIcon name="i-lucide-triangle-alert" class="mx-auto h-10 w-10 text-red-500" />
      <h2 class="ga-heading mt-4 font-serif text-3xl font-semibold">
        Analysis failed
      </h2>
      <p class="ga-muted mt-2">{{ session.message || "Try another material." }}</p>
      <UButton to="/dashboard" label="Start again" color="primary" class="mt-5 rounded-xl" />
    </section>

    <template v-else>
      <AdaptivePathSpotlight
        v-model:study-level="studyLevel"
        v-model:question-style="questionStyle"
        :status="session?.status || 'in_progress'"
        :active-path="activePath"
        :branches="activePathBranches"
        :path-position="activePathPosition"
        :path-count="confirmedTopics.length"
        :recommendation-title="session?.recommendation?.nextTopic"
        :recommendation-reason="session?.recommendation?.reason"
        :study-level-options="studyLevelOptions"
        :question-style-options="questionStyleOptions"
        :is-saving-preferences="isSavingPreferences"
        :preference-notice="preferenceNotice"
        :diagnostic-button-label="diagnosticButtonLabel"
        :diagnostic-job-id="diagnosticJobId"
        :is-preparing-diagnostic="isPreparingDiagnostic"
        :diagnostic-status-message="diagnosticStatusMessage"
        :diagnostic-error="diagnosticError"
        :diagnostic-progress="diagnosticProgress"
        :is-preparing="isPreparing"
        :is-starting-practice="isStartingPractice"
        @open-diagnostic="openDiagnostic"
        @prepare="activePath && preparePath(activePath)"
        @start-practice="startPractice"
      />

      <section class="ga-surface rounded-[2rem] border p-5">
        <div class="mb-4">
          <p class="ga-subtle text-xs font-bold uppercase tracking-[0.2em]">
            Learning path
          </p>
          <h2 class="ga-heading mt-1 font-serif text-3xl font-semibold">
            Topic progression
          </h2>
        </div>

        <div class="space-y-3">
          <div class="rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] p-4">
            <div class="flex items-center gap-3">
              <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--ga-primary-soft)] text-[var(--ga-primary)]">
                <UIcon name="i-lucide-check-check" class="h-4 w-4" />
              </div>
              <div>
                <p class="ga-heading text-sm font-semibold">
                  Diagnostic
                </p>
                <p class="ga-subtle text-xs">
                  {{ session?.status === 'diagnostic_ready' ? 'Ready to begin' : 'Completed or in progress' }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-for="path in confirmedTopics"
            :key="path.key"
            :class="[
              'relative overflow-hidden rounded-2xl border p-4 transition',
              isActivePath(path)
                ? 'border-[var(--ga-primary)] bg-[var(--ga-primary-soft)]'
                : 'border-[var(--ga-border)] bg-[var(--ga-surface-soft)]',
            ]"
          >
            <div
              v-if="isBeforeDiagnostic"
              class="absolute inset-0 z-10 flex items-center justify-center bg-[var(--ga-surface)]/70 backdrop-blur-sm"
            >
              <div class="rounded-full border border-[var(--ga-border)] bg-[var(--ga-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ga-text-muted)]">
                Complete diagnostic to reveal this path
              </div>
            </div>
            <div
              v-else-if="path.status === 'completed'"
              class="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            >
              <span
                class="-rotate-12 rounded-xl border-4 border-green-600/70 px-8 py-2 font-serif text-4xl font-black uppercase tracking-[0.35em] text-green-600/70"
              >
                Passed
              </span>
            </div>
            <div
              :class="[
                'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
                isBeforeDiagnostic ? 'blur-[2px]' : path.status === 'completed' ? 'blur-[3px] opacity-80' : '',
              ]"
            >
              <div class="flex min-w-0 items-start gap-3">
                <div
                  :class="[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                    path.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : path.status === 'unlocked'
                        ? 'bg-[var(--ga-primary)] text-[#fffaf0]'
                        : 'bg-[var(--ga-surface)] text-[var(--ga-muted)]',
                  ]"
                >
                  <UIcon :name="statusIcon(path.status)" class="h-4 w-4" />
                </div>
                <div class="min-w-0">
                  <p class="ga-heading font-semibold">{{ pathTitle(path) }}</p>
                  <p class="ga-muted mt-1 text-sm leading-6">
                    {{ path.description || 'This path unlocks as you progress.' }}
                  </p>
                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <UBadge
                      v-if="path.isMastered"
                      color="success"
                      variant="soft"
                      class="rounded-full"
                    >
                      <UIcon name="i-lucide-star" class="mr-1 h-3 w-3" />
                      Mastered
                    </UBadge>
                    <UBadge
                      v-else-if="path.isConfirmed && !isActivePath(path)"
                      color="neutral"
                      variant="soft"
                      class="rounded-full"
                    >
                      Confirmed — queued
                    </UBadge>
                    <UBadge
                      v-else-if="path.isConfirmed && isActivePath(path)"
                      color="primary"
                      variant="soft"
                      class="rounded-full"
                    >
                      Active
                    </UBadge>
                    <span
                      v-if="path.isMastered && path.nextReviewAtUtc"
                      class="ga-subtle text-xs font-medium"
                    >
                      {{ formatReviewDate(path.nextReviewAtUtc) }}
                    </span>
                  </div>
                  <p class="ga-subtle mt-1.5 text-xs">
                    Score: {{ scoreLabel(path.currentScore, path.attemptCount) }} · Difficulty: {{ path.difficulty || "adaptive" }}
                  </p>
                </div>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-2">
                <div class="flex gap-2">
                  <UButton
                    label="Review topic"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    class="rounded-xl"
                    :disabled="!isActivePath(path)"
                    :loading="isPreparing && isActivePath(path)"
                    @click="preparePath(path)"
                  />
                  <UButton
                    :label="path.isMastered ? 'Practice again' : 'Start practice'"
                    color="primary"
                    size="sm"
                    class="rounded-xl"
                    :disabled="!isActivePath(path)"
                    :loading="isStartingPractice && isActivePath(path)"
                    @click="startPractice"
                  />
                </div>
                <p
                  v-if="!isActivePath(path) && path.isConfirmed && !path.isMastered"
                  class="ga-subtle text-right text-xs"
                >
                  Complete the active topic first
                </p>
              </div>
            </div>
            <div
              :class="[
                'mt-4 flex gap-3 overflow-x-auto border-t border-[var(--ga-border)] pt-4 pb-2 [scrollbar-width:thin]',
                isBeforeDiagnostic ? 'blur-[2px]' : '',
              ]"
            >
              <div
                v-for="branch in questBranches(path)"
                :key="branch.key"
                :class="[
                  'relative min-w-[230px] max-w-[260px] flex-1 rounded-2xl border p-3 transition',
                  branch.status === 'completed'
                    ? 'border-green-200 bg-green-50 text-green-800'
                    : branch.isActive
                      ? 'border-[var(--ga-primary)] bg-[var(--ga-surface)] shadow-sm'
                    : 'border-[var(--ga-border)] bg-[var(--ga-surface)] opacity-60',
                ]"
              >
                <div class="flex items-start gap-3">
                  <div
                    :class="[
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      branch.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : branch.isActive
                          ? 'bg-[var(--ga-primary)] text-[#fffaf0]'
                          : 'bg-[var(--ga-surface-soft)] text-[var(--ga-text-muted)]',
                    ]"
                  >
                    <UIcon :name="questStatusIcon(branch)" class="h-4 w-4" />
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="text-sm font-semibold">
                        {{ branchTitle(branch) }}
                      </p>
                      <UBadge
                        size="xs"
                        :color="branch.status === 'completed' ? 'success' : branch.isActive ? 'primary' : 'neutral'"
                        variant="soft"
                        class="rounded-full capitalize"
                      >
                        {{ branchStatusLabel(branch) }}
                      </UBadge>
                    </div>
                    <p class="mt-1 text-xs leading-5 opacity-80">
                      {{ branch.description }}
                    </p>
                    <div class="mt-2 flex flex-wrap items-center gap-1.5">
                      <UBadge
                        v-if="branch.type"
                        size="xs"
                        color="neutral"
                        variant="outline"
                        class="rounded-full"
                      >
                        <UIcon :name="questTypeIcon(branch.type)" class="mr-1 h-3 w-3" />
                        {{ branch.type.replace(/-/g, " ") }}
                      </UBadge>
                      <span v-if="branchScoreLabel(branch)" class="text-[11px] font-semibold opacity-75">
                        {{ branchScoreLabel(branch) }}
                      </span>
                      <span v-if="branch.bestScore != null" class="text-[11px] font-semibold opacity-75">
                        Best: {{ Math.round(branch.bestScore) }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="unconfirmedTopics.length > 0" class="mt-5 border-t border-[var(--ga-border)] pt-5">
          <p class="ga-subtle mb-3 text-xs font-semibold uppercase tracking-[0.15em]">
            Not in your plan
          </p>
          <div class="space-y-2">
            <div
              v-for="path in unconfirmedTopics"
              :key="path.key"
              class="flex items-center gap-3 rounded-xl border border-[var(--ga-border)] bg-[var(--ga-surface)] p-3 opacity-60"
            >
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ga-surface-soft)] text-[var(--ga-muted)]">
                <UIcon name="i-lucide-minus-circle" class="h-4 w-4" />
              </div>
              <div class="min-w-0 flex-1">
                <p class="ga-heading text-sm font-semibold">{{ path.topic }}</p>
                <p class="ga-subtle mt-0.5 text-xs">{{ path.description || 'Not included in this study plan.' }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
