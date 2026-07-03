<script setup lang="ts">

definePageMeta({ layout: "newdash" });

type StudyQuestion = {
  id?: string;
  question?: string;
  type?: string;
  options?: string[] | null;
  answer?: string | null;
  difficulty?: string | null;
  reason?: string | null;
  correctAnswers?: string[] | null;
  rubric?: unknown;
};

type QuestionResult = {
  jobId?: string;
  status?: "pending" | "running" | "completed" | "failed" | string;
  questions?: StudyQuestion[];
  message?: string;
};

type QuestionJobStatus = {
  jobId?: string;
  status?: "pending" | "running" | "completed" | "failed" | string;
  progress?: number;
  generatedCount?: number;
  totalCount?: number;
  message?: string;
  createdAtUtc?: string | null;
  completedAtUtc?: string | null;
};

type TestDraft = {
  jobId?: string;
  currentQuestionIndex?: number;
  answers?: Record<string, string>;
  updatedAtUtc?: string;
};

type StudySubPath = {
  key?: string;
  title?: string;
  description?: string | null;
  status?: string;
  isActive?: boolean;
  order?: number | null;
  type?: string | null;
  attemptCount?: number | null;
  latestScore?: number | null;
  bestScore?: number | null;
  lastAttemptAtUtc?: string | null;
};

type StudySessionSnapshot = {
  status?: string;
  activePathKey?: string | null;
  topics?: Array<{
    key?: string;
    topic?: string;
    title?: string;
    minScore?: number;
    maxScore?: number;
    status?: string;
    isActive?: boolean;
    currentScore?: number;
    completedStageCount?: number;
    totalStageCount?: number;
    totalAttemptCount?: number;
    subPaths?: StudySubPath[];
  }>;
};

type AnswerResultItem = {
  questionId?: string;
  questionType?: string;
  difficulty?: string | null;
  userAnswer?: string | null;
  correct?: boolean;
  performanceLabel?: PerformanceLabel | string | null;
  score?: number | null;
  feedback?: string | null;
  correctAnswer?: string | null;
  correctAnswers?: string[] | null;
  strengths?: string[] | null;
  missingPoints?: string[] | null;
  improvementTip?: string | null;
};

type PerformanceLabel =
  | "strong"
  | "mostly_correct"
  | "developing"
  | "needs_revision";

type SubmitResponse = {
  sessionId?: string;
  attemptId?: string;
  attemptType?: "diagnostic" | "practice" | string;
  pathKey?: string | null;
  diagnosticScore?: number;
  scoreScale?: { min: number; max: number };
  averageScore?: number;
  passed?: boolean;
  pathCompleted?: boolean;
  performanceLabel?: PerformanceLabel | string | null;
  items?: AnswerResultItem[];
  results?: AnswerResultItem[];
  questionResults?: AnswerResultItem[];
  recommendation?: {
    nextTopicKey?: string | null;
    nextTopic?: string | null;
    reason?: string | null;
    difficulty?: string | null;
    suggestedActions?: string[];
    stage?: string;
  } | null;
  session?: StudySessionSnapshot;
};

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();

const sessionId = computed(() => String(route.params.sessionId || ""));
const jobId = computed(() => String(route.params.jobId || ""));
const testType = computed(() =>
  route.query.type === "practice" ? "practice" : "diagnostic",
);
const pathKey = computed(() =>
  typeof route.query.pathKey === "string" ? route.query.pathKey : "",
);

const result = ref<QuestionResult | null>(null);
const jobStatus = ref<QuestionJobStatus | null>(null);
const answers = ref<Record<string, string>>({});
const submitResult = ref<SubmitResponse | null>(null);
const isLoading = ref(true);
const isSubmitting = ref(false);
const isSavingDraft = ref(false);
const draftLoaded = ref(false);
const jobFailed = ref(false);
const failedJobMessage = ref("");
const loadMessage = ref("Preparing your exam questions...");
const hasAutoRetried = ref(false);
const isAutoRetrying = ref(false);
const currentIndex = ref(0);

const questions = computed(() => result.value?.questions || []);
const currentQuestion = computed(() => questions.value[currentIndex.value] || null);
const answeredCount = computed(
  () =>
    questions.value.filter((question, index) =>
      answerFor(question, index).trim(),
    ).length,
);
const canSubmit = computed(
  () => questions.value.length > 0 && answeredCount.value === questions.value.length,
);
const canAdvance = computed(() =>
  currentQuestion.value
    ? answerFor(currentQuestion.value, currentIndex.value).trim().length > 0
    : false,
);
const score = computed(() =>
  Math.round(Number(submitResult.value?.averageScore || 0)),
);
const isDiagnosticResult = computed(
  () => submitResult.value?.attemptType === "diagnostic",
);
const isSessionCompleted = computed(
  () => submitResult.value?.session?.status === "completed",
);
const resultStatusCopy = computed(() => {
  if (!submitResult.value) return "";
  if (isDiagnosticResult.value) {
    return "Assessment completed. GapAI has unlocked your first study path.";
  }
  if (submitResult.value.passed && isSessionCompleted.value) {
    return "You've completed every topic in this material. Nice work!";
  }
  if (submitResult.value.passed && submitResult.value.pathCompleted) {
    return "Path completed. The next path is now unlocked.";
  }
  if (submitResult.value.passed) {
    return "Stage completed. The next stage in this path is now unlocked.";
  }
  return "This path remains open. Review the feedback, then retake the practice when ready.";
});
const resultStateLabel = computed(() => {
  if (!submitResult.value) return "Study stream";
  if (isDiagnosticResult.value) return "Study path unlocked";
  if (!submitResult.value.passed) return "Current path remains open";
  if (isSessionCompleted.value) return "All topics complete";
  return submitResult.value.pathCompleted ? "Next path unlocked" : "Next stage unlocked";
});

const confettiCanvas = ref<HTMLCanvasElement | null>(null);
let celebrationStop: (() => void) | null = null;

// Renders the Lucide "handshake" icon (the same icon set used across the app)
// onto an offscreen canvas and samples it into particle target points.
// Vector-based, so the firework shape is pixel-identical on every platform —
// unlike emoji, which render differently per OS.
const HANDSHAKE_PATHS: Array<{ d: string; color: string }> = [
  { d: "m11 17l2 2a1 1 0 1 0 3-3", color: "#fde68a" },
  {
    d: "m14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4",
    color: "#fbbf24",
  },
  { d: "m21 3l1 11h-2M3 3L2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8", color: "#f59e0b" },
];

function sampleHandshakePoints(): Array<{ x: number; y: number; color: string }> {
  const size = 240;
  const iconScale = size / 24; // Lucide icons use a 24x24 viewBox
  const off = document.createElement("canvas");
  off.width = size;
  off.height = size;
  const octx = off.getContext("2d");
  if (!octx) return [];

  const points: Array<{ x: number; y: number; color: string }> = [];
  const step = 4;

  // Stroke each path separately so its sampled particles keep that path's color.
  for (const { d, color } of HANDSHAKE_PATHS) {
    octx.clearRect(0, 0, size, size);
    octx.save();
    octx.scale(iconScale, iconScale);
    octx.lineWidth = 2;
    octx.lineCap = "round";
    octx.lineJoin = "round";
    octx.strokeStyle = "#fff";
    octx.stroke(new Path2D(d));
    octx.restore();

    const data = octx.getImageData(0, 0, size, size).data;
    for (let y = 0; y < size; y += step) {
      for (let x = 0; x < size; x += step) {
        if ((data[(y * size + x) * 4 + 3] ?? 0) > 128) {
          points.push({ x: x - size / 2, y: y - size / 2, color });
        }
      }
    }
  }
  return points;
}

function startCelebration() {
  const canvas = confettiCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const w = canvas.width;
  const h = canvas.height;

  // Timeline (ms from start)
  const confettiEnd = 3200;
  const rocketEnd = confettiEnd + 700;
  const assembleEnd = rocketEnd + 800;
  const holdEnd = assembleEnd + 1400;
  const fadeEnd = holdEnd + 900;

  const colors = ["#7c3aed", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899"];
  const confetti = Array.from({ length: 280 }, () => ({
    x: Math.random() * w,
    y: -20 - Math.random() * h * 0.5,
    size: 6 + Math.random() * 7,
    color: colors[Math.floor(Math.random() * colors.length)] ?? "#7c3aed",
    speedY: 2.5 + Math.random() * 3.5,
    speedX: -1.5 + Math.random() * 3,
    rotation: Math.random() * 360,
    spin: -7 + Math.random() * 14,
  }));

  // Firework: shape particles fly from the burst point to their sampled targets.
  const shapeScale = Math.min(1.6, Math.max(1.0, w / 900));
  const burstX = w / 2;
  const burstY = h * 0.38;
  const shape = sampleHandshakePoints().map((p) => ({
    targetX: burstX + p.x * shapeScale,
    targetY: burstY + p.y * shapeScale,
    startX: burstX + (Math.random() - 0.5) * 30,
    startY: burstY + (Math.random() - 0.5) * 30,
    x: burstX,
    y: burstY,
    color: p.color,
    twinkle: Math.random() * Math.PI * 2,
    driftX: (Math.random() - 0.5) * 6,
    driftY: 1 + Math.random() * 3,
  }));

  // Loose sparks that shoot radially outward at the moment of the burst.
  const sparks = Array.from({ length: 90 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 6;
    return {
      x: burstX,
      y: burstY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)] ?? "#f59e0b",
      life: 600 + Math.random() * 500,
    };
  });

  const rocketTrail: Array<{ x: number; y: number }> = [];
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  const start = performance.now();
  let frameId = 0;
  let cancelled = false;
  celebrationStop = () => {
    cancelled = true;
    cancelAnimationFrame(frameId);
    ctx.clearRect(0, 0, w, h);
  };

  function frame(now: number) {
    if (cancelled || !ctx) return;
    const t = now - start;
    ctx.clearRect(0, 0, w, h);

    // Phase 1 — big confetti rain (fades out slightly past its window)
    if (t < confettiEnd + 600) {
      const confettiAlpha = t < confettiEnd ? 1 : 1 - (t - confettiEnd) / 600;
      ctx.globalAlpha = Math.max(0, confettiAlpha);
      for (const p of confetti) {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    // Phase 2 — rocket climbs from the bottom to the burst point
    if (t >= confettiEnd && t < rocketEnd) {
      const rp = easeOut((t - confettiEnd) / (rocketEnd - confettiEnd));
      const rx = burstX + Math.sin(rp * Math.PI * 2) * 12 * (1 - rp);
      const ry = h + 20 - (h + 20 - burstY) * rp;
      rocketTrail.push({ x: rx, y: ry });
      if (rocketTrail.length > 14) rocketTrail.shift();
      for (let i = 0; i < rocketTrail.length; i++) {
        const trailPoint = rocketTrail[i];
        if (!trailPoint) continue;
        ctx.globalAlpha = i / rocketTrail.length;
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(trailPoint.x, trailPoint.y, 2 + (i / rocketTrail.length) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff7ed";
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Burst flash right when the rocket arrives
    if (t >= rocketEnd && t < rocketEnd + 180) {
      const flash = 1 - (t - rocketEnd) / 180;
      ctx.globalAlpha = flash * 0.9;
      ctx.fillStyle = "#fffbeb";
      ctx.beginPath();
      ctx.arc(burstX, burstY, 18 + (1 - flash) * 90, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Phase 3 — loose sparks fly outward and die
    if (t >= rocketEnd) {
      const sparkT = t - rocketEnd;
      for (const s of sparks) {
        if (sparkT > s.life) continue;
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.06;
        ctx.globalAlpha = Math.max(0, 1 - sparkT / s.life);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Phase 3b/4/5 — handshake assembles from the burst, holds with a twinkle, then dissolves
    if (t >= rocketEnd && t < fadeEnd) {
      let shapeAlpha = 1;
      if (t >= holdEnd) shapeAlpha = Math.max(0, 1 - (t - holdEnd) / (fadeEnd - holdEnd));

      const assembleP = Math.min(1, (t - rocketEnd) / (assembleEnd - rocketEnd));
      const eased = easeOut(assembleP);

      for (const p of shape) {
        if (t < holdEnd) {
          p.x = p.startX + (p.targetX - p.startX) * eased;
          p.y = p.startY + (p.targetY - p.startY) * eased;
        } else {
          // dissolve: drift apart and sink like dying embers
          p.x += p.driftX * 0.4;
          p.y += p.driftY * 0.6;
        }
        const twinkle = 0.75 + 0.25 * Math.sin(t / 130 + p.twinkle);
        ctx.globalAlpha = shapeAlpha * twinkle;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.4 * shapeScale, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    if (t < fadeEnd) {
      frameId = requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, w, h);
    }
  }

  frameId = requestAnimationFrame(frame);
}

watch(isSessionCompleted, (completed) => {
  if (completed) {
    nextTick(() => startCelebration());
  }
});

onBeforeUnmount(() => {
  celebrationStop?.();
});
const activeNextPath = computed(
  () =>
    submitResult.value?.session?.topics?.find(
      (topic) => topic.status === "unlocked" && topic.isActive,
    ) || null,
);
const answerResults = computed(
  () =>
    submitResult.value?.items ||
    submitResult.value?.results ||
    submitResult.value?.questionResults ||
    [],
);
const loadProgress = computed(() => {
  if (typeof jobStatus.value?.progress === "number") {
    return Math.max(0, Math.min(100, Math.round(jobStatus.value.progress)));
  }

  const generated = Number(jobStatus.value?.generatedCount || 0);
  const total = Number(jobStatus.value?.totalCount || 0);
  if (total > 0) return Math.max(0, Math.min(100, Math.round((generated / total) * 100)));

  return 0;
});
const loadingDetail = computed(() => {
  if (jobFailed.value) {
    return failedJobMessage.value || "GapAI could not create a clean question set from this section yet.";
  }
  if (!jobStatus.value) return "GapAI is preparing the assessment.";
  if (jobStatus.value.status === "completed") return "Questions ready.";
  if (jobStatus.value.generatedCount !== undefined && jobStatus.value.totalCount) {
    return `${jobStatus.value.generatedCount} of ${jobStatus.value.totalCount} questions prepared.`;
  }
  return jobStatus.value.message || "Stay here while GapAI prepares the assessment.";
});

function questionKey(question: StudyQuestion, index: number) {
  return question.id || `question-${index + 1}`;
}

function answerFor(question: StudyQuestion, index: number) {
  return answers.value[questionKey(question, index)] || "";
}

function setAnswer(question: StudyQuestion, index: number, value: string) {
  answers.value = {
    ...answers.value,
    [questionKey(question, index)]: value,
  };
  queueDraftSave();
}

function questionTypeLabel(question: StudyQuestion) {
  if (question.type) return question.type.replace(/-/g, " ");
  return Array.isArray(question.options) && question.options.length
    ? "multiple choice"
    : "short answer";
}

function buildAttempts() {
  return questions.value.map((question, index) => ({
    question,
    userAnswer: answerFor(question, index),
  }));
}

function resultQuestionText(item: AnswerResultItem, index: number) {
  const matched = questions.value.find((question, questionIndex) => {
    const key = question.id || `question-${questionIndex + 1}`;
    return key === item.questionId;
  });

  return matched?.question || `Question ${index + 1}`;
}

function resultScoreLabel(item: AnswerResultItem) {
  if (item.score === undefined || item.score === null) return "Score unavailable";
  return `${Math.round(item.score)}%`;
}

// Concrete reading list after a failed attempt: one entry per weak answer,
// built from the marker's missing points (or feedback as fallback).
const reviewAreas = computed(() => {
  if (!submitResult.value || submitResult.value.passed) return [];
  return answerResults.value
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => (item.score ?? 0) < 70)
    .map(({ item, index }) => ({
      question: resultQuestionText(item, index),
      points:
        item.missingPoints?.length
          ? item.missingPoints
          : item.feedback
            ? [item.feedback]
            : [],
    }));
});

function performanceLabel(value?: string | null) {
  const labels: Record<string, string> = {
    strong: "Strong",
    mostly_correct: "Mostly correct",
    developing: "Developing",
    needs_revision: "Needs revision",
  };
  return labels[String(value || "").toLowerCase()] || "Result";
}

function performanceColor(value?: string | null) {
  const colors: Record<string, "success" | "primary" | "warning" | "error" | "neutral"> = {
    strong: "success",
    mostly_correct: "primary",
    developing: "warning",
    needs_revision: "error",
  };
  return colors[String(value || "").toLowerCase()] || "neutral";
}

function goPrevious() {
  currentIndex.value = Math.max(0, currentIndex.value - 1);
  queueDraftSave();
}

function goNext() {
  if (!canAdvance.value) return;
  currentIndex.value = Math.min(questions.value.length - 1, currentIndex.value + 1);
  queueDraftSave();
}

async function fetchJobStatus() {
  if (!sessionId.value || !jobId.value) return;

  const response = await $api.fetch<QuestionJobStatus>(
    `/api/study-sessions/${sessionId.value}/tests/${jobId.value}`,
  );
  jobStatus.value = response;
  if (response.status === "failed") {
    const message = failedQuestionSetMessage(response.message);
    const isGenerationError = !message.includes(INSUFFICIENT_CONTENT_MARKER);

    // Auto-retry once on generation-quality errors (model variance — second attempt often succeeds).
    // Insufficient-content errors are deterministic and must not be retried.
    if (isGenerationError && !hasAutoRetried.value && testType.value === "practice" && pathKey.value) {
      hasAutoRetried.value = true;
      loadMessage.value = "Retrying question generation…";
      await retryPractice();
      return;
    }

    jobFailed.value = true;
    failedJobMessage.value = message;
    loadMessage.value = "GapAI could not create a clean question set from this section yet.";
    isLoading.value = false;
    stopPolling();
    return;
  }
  loadMessage.value = response.message || statusMessage(response.status);
}

async function retryPractice() {
  if (!sessionId.value || !pathKey.value) {
    void router.push(`/study/${sessionId.value}`);
    return;
  }
  try {
    isAutoRetrying.value = true;
    const response = await $api.mutate<{ jobId?: string; status?: string }>(
      `/api/study-sessions/${sessionId.value}/paths/${encodeURIComponent(pathKey.value)}/practice`,
      {
        method: "POST",
        body: {
          sessionId: sessionId.value,
          pathKey: pathKey.value,
          mode: "next",
          studyLevel: "Auto",
          questionStyle: "exam-style",
        },
      },
    );
    if (response.jobId) {
      await router.push(
        `/study/${sessionId.value}/test/${response.jobId}?type=practice&pathKey=${encodeURIComponent(pathKey.value)}`,
      );
    } else {
      void router.push(`/study/${sessionId.value}`);
    }
  } catch {
    isAutoRetrying.value = false;
    void router.push(`/study/${sessionId.value}`);
  }
}

function statusMessage(status?: string) {
  if (status === "pending") return "Preparing next exam questions...";
  if (status === "running") return "Building your assessment...";
  if (status === "completed") return "Questions ready.";
  return "Preparing your exam questions...";
}

const INSUFFICIENT_CONTENT_MARKER = "does not contain enough clear learning evidence";

// "insufficient-content" = deterministic pre-AI check; retrying or changing level won't help.
// "generation-error" = post-AI validation failure; retrying may succeed.
const failureCategory = computed<"insufficient-content" | "generation-error">(() =>
  failedJobMessage.value.includes(INSUFFICIENT_CONTENT_MARKER)
    ? "insufficient-content"
    : "generation-error",
);

function failedQuestionSetMessage(message?: string | null) {
  const value = String(message || "").trim();
  if (value.includes(INSUFFICIENT_CONTENT_MARKER)) {
    return value;
  }
  if (value.toLowerCase().includes("trustworthy") || value.toLowerCase().includes("retry")) {
    return "GapAI rejected this generated set because the questions were not reliable enough. You can retry — the result may differ.";
  }
  if (
    value ===
    "Could not generate a high-quality question set from this source. Please try again or upload clearer material."
  ) {
    return "GapAI rejected this generated set because the questions were not reliable enough. Try again, or switch to an easier level.";
  }
  return value || "GapAI could not create a clean question set from this section yet.";
}

async function loadDraft() {
  if (!sessionId.value || !jobId.value || draftLoaded.value) return;

  try {
    const draft = await $api.fetch<TestDraft>(
      `/api/study-sessions/${sessionId.value}/tests/${jobId.value}/draft`,
    );
    answers.value = draft.answers || {};
    const nextIndex = Number(draft.currentQuestionIndex || 0);
    currentIndex.value = Math.max(0, Math.min(questions.value.length - 1, nextIndex));
  } catch {
    // Drafts are optional; a missing draft should not block a test.
  } finally {
    draftLoaded.value = true;
  }
}

let draftTimer: ReturnType<typeof setTimeout> | null = null;

function queueDraftSave() {
  if (!questions.value.length || submitResult.value) return;
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    void saveDraft();
  }, 500);
}

async function saveDraft() {
  if (!sessionId.value || !jobId.value || !questions.value.length || submitResult.value) return;

  try {
    isSavingDraft.value = true;
    await $api.mutate(`/api/study-sessions/${sessionId.value}/tests/${jobId.value}/draft`, {
      method: "PATCH",
      body: {
        sessionId: sessionId.value,
        jobId: jobId.value,
        currentQuestionIndex: currentIndex.value,
        answers: answers.value,
      },
    });
  } catch {
    // Avoid interrupting the exam flow for transient draft-save failures.
  } finally {
    isSavingDraft.value = false;
  }
}

async function fetchQuestionResult() {
  if (!sessionId.value || !jobId.value || jobFailed.value) return;

  try {
    await fetchJobStatus();
    if (jobFailed.value) return;
    const response = await $api.fetch<QuestionResult>(
      `/api/study-sessions/${sessionId.value}/tests/${jobId.value}/result`,
    );
    result.value = response;

    if (response.questions?.length) {
      if (!draftLoaded.value) await loadDraft();
      isLoading.value = false;
    } else if (response.status && response.status !== "completed") {
      loadMessage.value = response.message || statusMessage(response.status);
    }
  } catch (error: any) {
    const status = error?.statusCode || error?.status;
    if (status === 202 || status === 404) {
      loadMessage.value = jobStatus.value?.message || "Preparing next exam questions...";
      return;
    }
    failedJobMessage.value = failedQuestionSetMessage(
      error?.data?.message || error?.statusMessage || error?.message,
    );
    loadMessage.value = "GapAI could not create a clean question set from this section yet.";
    jobFailed.value = true;
    stopPolling();
    isLoading.value = false;
  }
}

async function refreshSubmittedSession() {
  try {
    const refreshedSession = await $api.fetch<StudySessionSnapshot>(
      `/api/study-sessions/${sessionId.value}`,
    );
    if (submitResult.value) {
      submitResult.value = {
        ...submitResult.value,
        session: refreshedSession,
      };
    }
  } catch {
    toast.add({
      title: "Answers saved",
      description: "The latest path state will refresh when you return to the study stream.",
      color: "warning",
    });
  }
}

async function submitAnswers() {
  if (!canSubmit.value || submitResult.value) return;

  try {
    isSubmitting.value = true;
    if (draftTimer) clearTimeout(draftTimer);
    await saveDraft();
    const body = {
      sessionId: sessionId.value,
      questionJobId: jobId.value,
      attempts: buildAttempts(),
    };

    if (testType.value === "practice" && pathKey.value) {
      submitResult.value = await $api.mutate<SubmitResponse>(
        `/api/study-sessions/${sessionId.value}/paths/${encodeURIComponent(pathKey.value)}/answers`,
        {
          method: "POST",
          body: {
            ...body,
            pathKey: pathKey.value,
          },
        },
      );
    } else {
      submitResult.value = await $api.mutate<SubmitResponse>(
        `/api/study-sessions/${sessionId.value}/diagnostic/answers`,
        {
          method: "POST",
          body,
        },
      );
    }

    await refreshSubmittedSession();
  } catch (error: any) {
    toast.add({
      title: "Could not submit answers",
      description: error?.data?.message || error?.message || "Please return to the study stream and try again.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function retryFromStream() {
  void router.push(`/study/${sessionId.value}`);
}

onMounted(async () => {
  await fetchQuestionResult();
  pollTimer = setInterval(() => {
    if (!jobFailed.value && !submitResult.value && !questions.value.length) {
      void fetchQuestionResult();
    }
  }, 2500);
});

onBeforeUnmount(() => {
  stopPolling();
  if (draftTimer) clearTimeout(draftTimer);
  void saveDraft();
});
</script>

<template>
  <canvas
    ref="confettiCanvas"
    class="pointer-events-none fixed inset-0 z-50"
    aria-hidden="true"
  />
  <div class="mx-auto max-w-5xl space-y-6">
    <header class="ga-surface-warm rounded-[2rem] border p-6 sm:p-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="ga-link text-xs font-bold uppercase tracking-[0.22em]">
            {{ testType === "practice" ? "Path practice" : "Assessment" }}
          </p>
          <h1 class="ga-heading mt-2 font-serif text-3xl font-semibold sm:text-5xl">
            Answer without checking the source
          </h1>
          <p class="ga-muted mt-3 max-w-2xl text-sm leading-6">
            This test measures what you understand now. GapAI uses the result to
            unlock the next useful path.
          </p>
        </div>
        <div class="ga-surface rounded-2xl border p-4 text-sm">
          <p class="ga-subtle font-semibold">Progress</p>
          <p class="ga-heading mt-1 text-2xl font-bold">
            {{ currentIndex + 1 }} / {{ questions.length }}
          </p>
        </div>
      </div>
    </header>

    <section
      v-if="isLoading || !questions.length"
      class="ga-surface rounded-[2rem] border p-8 text-center"
    >
      <template v-if="jobFailed">
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300"
        >
          <UIcon name="i-lucide-triangle-alert" class="h-6 w-6" />
        </div>
        <h2 class="ga-heading mt-4 font-serif text-3xl font-semibold">
          {{
            failureCategory === "insufficient-content"
              ? "Not enough content to assess this topic"
              : "GapAI could not build a question set"
          }}
        </h2>
        <p class="ga-muted mx-auto mt-3 max-w-2xl text-sm leading-6">
          {{ loadingDetail }}
        </p>

        <!-- Insufficient content: retrying or changing difficulty won't help — source is the problem -->
        <template v-if="failureCategory === 'insufficient-content'">
          <div class="mx-auto mt-6 flex max-w-sm flex-col gap-2">
            <UButton
              label="Choose a different topic"
              icon="i-lucide-arrow-left"
              color="primary"
              class="justify-center rounded-xl"
              @click="retryFromStream"
            />
            <UButton
              label="Upload clearer material"
              icon="i-lucide-file-up"
              color="neutral"
              variant="soft"
              class="justify-center rounded-xl"
              @click="router.push('/dashboard')"
            />
          </div>
        </template>

        <!-- Generation error: model-call variance — retrying may succeed -->
        <template v-else>
          <div class="mx-auto mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
            <UButton
              label="Retry"
              icon="i-lucide-refresh-cw"
              color="primary"
              class="justify-center rounded-xl"
              :loading="isAutoRetrying"
              @click="retryPractice"
            />
            <UButton
              label="Try easier questions"
              icon="i-lucide-arrow-down-circle"
              color="neutral"
              variant="soft"
              class="justify-center rounded-xl"
              @click="retryFromStream"
            />
            <UButton
              label="Change study level"
              icon="i-lucide-sliders-horizontal"
              color="neutral"
              variant="soft"
              class="justify-center rounded-xl"
              @click="retryFromStream"
            />
            <UButton
              label="Upload clearer material"
              icon="i-lucide-file-up"
              color="neutral"
              variant="soft"
              class="justify-center rounded-xl"
              @click="router.push('/dashboard')"
            />
          </div>
        </template>
      </template>
      <template v-else>
        <UIcon name="i-lucide-loader-circle" class="mx-auto h-10 w-10 animate-spin text-[var(--ga-primary)]" />
        <h2 class="ga-heading mt-4 font-serif text-3xl font-semibold">
          {{ loadMessage }}
        </h2>
        <p class="ga-muted mt-2">
          {{ loadingDetail }}
        </p>
        <UProgress
          v-if="loadProgress"
          :model-value="loadProgress"
          color="primary"
          class="mx-auto mt-5 max-w-md"
        />
        <UProgress
          v-else
          animation="carousel"
          color="primary"
          class="mx-auto mt-5 max-w-md"
        />
      </template>
    </section>

    <section v-else-if="submitResult" class="ga-surface relative overflow-hidden rounded-[2rem] border p-6 sm:p-8">
      <div
        v-if="submitResult.passed && !isDiagnosticResult"
        class="pointer-events-none absolute right-6 top-6 z-10 hidden sm:block"
      >
        <span
          class="inline-block -rotate-12 rounded-xl border-4 border-green-600/70 px-8 py-2 font-serif text-4xl font-black uppercase tracking-[0.35em] text-green-600/70"
        >
          Passed
        </span>
      </div>
      <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <UBadge
            :color="performanceColor(submitResult.performanceLabel)"
            variant="soft"
            class="rounded-full"
          >
            {{ performanceLabel(submitResult.performanceLabel) }}
          </UBadge>
          <h2 class="ga-heading mt-3 font-serif text-4xl font-semibold">
            Score: {{ score }}%
          </h2>
          <p class="ga-muted mt-3 max-w-2xl text-sm leading-6">
            {{ submitResult.recommendation?.reason || resultStatusCopy }}
          </p>
        </div>
        <div class="ga-surface-soft rounded-2xl border border-[var(--ga-border)] p-4">
          <p class="ga-subtle text-xs font-semibold">
            {{ resultStateLabel }}
          </p>
          <p class="ga-heading mt-1 text-lg font-semibold">
            {{ isSessionCompleted ? "All selected topics mastered" : activeNextPath?.topic || activeNextPath?.title || submitResult.recommendation?.nextTopic || "Study stream" }}
          </p>
        </div>
      </div>

      <div
        v-if="reviewAreas.length"
        class="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50/50 p-5 dark:bg-amber-950/20"
      >
        <p class="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
          Areas to review before retake
        </p>
        <ul class="mt-3 space-y-3">
          <li v-for="area in reviewAreas" :key="area.question">
            <p class="ga-heading text-sm font-semibold leading-6">{{ area.question }}</p>
            <ul v-if="area.points.length" class="ga-muted mt-1 list-disc space-y-1 pl-5 text-sm leading-6">
              <li v-for="point in area.points" :key="point">{{ point }}</li>
            </ul>
          </li>
        </ul>
      </div>

      <div v-if="answerResults.length" class="mt-8 space-y-3">
        <div>
          <p class="ga-subtle text-xs font-bold uppercase tracking-[0.2em]">
            Answer review
          </p>
          <h3 class="ga-heading mt-1 font-serif text-2xl font-semibold">
            Learn from each question
          </h3>
        </div>

        <article
          v-for="(item, index) in answerResults"
          :key="item.questionId || index"
          class="rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] p-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <UBadge
              :color="performanceColor(item.performanceLabel)"
              variant="soft"
              class="rounded-full"
            >
              {{ performanceLabel(item.performanceLabel) }}
            </UBadge>
            <UBadge color="neutral" variant="soft" class="rounded-full">
              {{ resultScoreLabel(item) }}
            </UBadge>
            <UBadge
              v-if="item.questionType"
              color="primary"
              variant="soft"
              class="rounded-full capitalize"
            >
              {{ item.questionType.replace(/-/g, " ") }}
            </UBadge>
            <UBadge
              v-if="item.difficulty"
              color="neutral"
              variant="outline"
              class="rounded-full capitalize"
            >
              {{ item.difficulty }}
            </UBadge>
          </div>

          <h4 class="ga-heading mt-3 text-sm font-semibold leading-6">
            {{ resultQuestionText(item, index) }}
          </h4>

          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <div class="rounded-xl border border-[var(--ga-border)] bg-[var(--ga-surface)] p-3">
              <p class="ga-subtle text-xs font-semibold">Your answer</p>
              <p class="ga-muted mt-1 whitespace-pre-wrap text-sm leading-6">
                {{ item.userAnswer || "No answer submitted." }}
              </p>
            </div>
            <div class="rounded-xl border border-[var(--ga-border)] bg-[var(--ga-surface)] p-3">
              <p class="ga-subtle text-xs font-semibold">Expected answer</p>
              <p v-if="item.correctAnswer" class="ga-muted mt-1 whitespace-pre-wrap text-sm leading-6">
                {{ item.correctAnswer }}
              </p>
              <ul
                v-if="item.correctAnswers?.length"
                class="ga-muted mt-2 list-disc space-y-1 pl-5 text-sm leading-6"
              >
                <li v-for="answer in item.correctAnswers" :key="answer">
                  {{ answer }}
                </li>
              </ul>
              <p v-if="!item.correctAnswer && !item.correctAnswers?.length" class="ga-muted mt-1 text-sm">
                No marking points returned.
              </p>
            </div>
          </div>

          <div
            v-if="item.feedback || item.strengths?.length || item.missingPoints?.length || item.improvementTip"
            class="mt-3 rounded-xl border border-[var(--ga-border)] bg-[var(--ga-surface)] p-3"
          >
            <p class="ga-subtle text-xs font-semibold">Feedback</p>
            <p v-if="item.feedback" class="ga-muted mt-1 whitespace-pre-wrap text-sm leading-6">
              {{ item.feedback }}
            </p>

            <div v-if="item.strengths?.length" class="mt-3">
              <p class="text-xs font-semibold text-green-700">
                <UIcon name="i-lucide-check" class="mr-1 inline h-3.5 w-3.5" />
                What you did well
              </p>
              <ul class="ga-muted mt-1 list-disc space-y-1 pl-5 text-sm leading-6">
                <li v-for="point in item.strengths" :key="point">{{ point }}</li>
              </ul>
            </div>

            <div v-if="item.missingPoints?.length" class="mt-3">
              <p class="text-xs font-semibold text-amber-700">
                <UIcon name="i-lucide-circle-alert" class="mr-1 inline h-3.5 w-3.5" />
                What was missing
              </p>
              <ul class="ga-muted mt-1 list-disc space-y-1 pl-5 text-sm leading-6">
                <li v-for="point in item.missingPoints" :key="point">{{ point }}</li>
              </ul>
            </div>

            <div v-if="item.improvementTip" class="mt-3">
              <p class="ga-subtle text-xs font-semibold">
                <UIcon name="i-lucide-lightbulb" class="mr-1 inline h-3.5 w-3.5" />
                Next time
              </p>
              <p class="ga-muted mt-1 text-sm leading-6">{{ item.improvementTip }}</p>
            </div>
          </div>
        </article>
      </div>

      <div class="mt-6 flex flex-wrap gap-2">
        <UButton
          label="Back to study stream"
          icon="i-lucide-arrow-left"
          color="primary"
          class="rounded-xl"
          @click="router.push(`/study/${sessionId}`)"
        />
        <UButton
          v-if="submitResult.recommendation?.suggestedActions?.length"
          :label="submitResult.recommendation.suggestedActions[0]"
          icon="i-lucide-route"
          color="neutral"
          variant="outline"
          class="rounded-xl"
          @click="router.push(`/study/${sessionId}`)"
        />
      </div>
    </section>

    <template v-else>
      <section v-if="currentQuestion" class="space-y-4">
        <article
          :key="questionKey(currentQuestion, currentIndex)"
          class="ga-surface rounded-[2rem] border p-5"
        >
          <div class="flex flex-wrap items-center gap-2">
            <UBadge color="neutral" variant="soft" class="rounded-full">
              Question {{ currentIndex + 1 }} of {{ questions.length }}
            </UBadge>
            <UBadge color="primary" variant="soft" class="rounded-full capitalize">
              {{ questionTypeLabel(currentQuestion) }}
            </UBadge>
            <UBadge
              v-if="currentQuestion.difficulty"
              color="neutral"
              variant="outline"
              class="rounded-full capitalize"
            >
              {{ currentQuestion.difficulty }}
            </UBadge>
          </div>

          <h2 class="ga-heading mt-4 text-lg font-semibold leading-7">
            {{ currentQuestion.question }}
          </h2>

          <div
            v-if="Array.isArray(currentQuestion.options) && currentQuestion.options.length"
            class="mt-5 grid gap-2"
          >
            <button
              v-for="(option, optionIndex) in currentQuestion.options"
              :key="option"
              type="button"
              :class="[
                'rounded-2xl border px-4 py-3 text-left text-sm transition',
                answerFor(currentQuestion, currentIndex) === option
                  ? 'border-[var(--ga-primary)] bg-[var(--ga-primary-soft)] text-[var(--ga-heading)]'
                  : 'border-[var(--ga-border)] bg-[var(--ga-surface-soft)] text-[var(--ga-text)] hover:border-[var(--ga-primary)]',
              ]"
              @click="setAnswer(currentQuestion, currentIndex, option)"
            >
              <span class="font-semibold">{{ String.fromCharCode(65 + optionIndex) }}.</span>
              {{ option }}
            </button>
          </div>

          <UTextarea
            v-else
            :model-value="answerFor(currentQuestion, currentIndex)"
            :rows="4"
            autoresize
            placeholder="Type your answer..."
            class="mt-5 w-full"
            @update:model-value="setAnswer(currentQuestion, currentIndex, String($event || ''))"
          />
        </article>
      </section>

      <footer class="sticky bottom-4 z-10">
        <div class="ga-surface mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border p-3 shadow-[0_24px_70px_-40px_rgba(53,63,51,0.75)] sm:flex-row sm:items-center sm:justify-between">
          <p class="ga-muted text-sm">
            {{ answeredCount }} of {{ questions.length }} answered.
            <span v-if="isSavingDraft" class="ga-subtle ml-2">Saving...</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              label="Previous"
              color="neutral"
              variant="outline"
              class="rounded-xl"
              :disabled="currentIndex === 0"
              @click="goPrevious"
            />
            <UButton
              v-if="currentIndex < questions.length - 1"
              label="Next question"
              trailing-icon="i-lucide-arrow-right"
              color="primary"
              class="rounded-xl"
              :disabled="!canAdvance"
              @click="goNext"
            />
            <UButton
              v-else
              label="Submit answers"
              icon="i-lucide-send"
              color="primary"
              class="rounded-xl"
              :disabled="!canSubmit"
              :loading="isSubmitting"
              @click="submitAnswers"
            />
          </div>
        </div>
      </footer>
    </template>
  </div>
</template>
