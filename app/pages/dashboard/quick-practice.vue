<script setup lang="ts">
definePageMeta({ layout: "newdash" });
useHead({ title: "Quick Practice | GapAI" });

type SourceMode = "file" | "text" | "url";
type Question = { id?: string; question?: string; type?: string; options?: string[] | null; difficulty?: string };
type Job = { status?: string; progress?: number; generatedCount?: number; totalCount?: number; message?: string };
type Review = { questionId?: string; userAnswer?: string; correct?: boolean; isCorrect?: boolean; score?: number; feedback?: string; correctAnswer?: string; expectedAnswer?: string; correctAnswers?: string[] };
type Submission = { score?: number; averageScore?: number; passed?: boolean; feedback?: string; message?: string; items?: Review[]; results?: Review[]; questionResults?: Review[] };

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();
const sourceMode = ref<SourceMode>("file");
const file = ref<File | null>(null);
const sourceText = ref("");
const sourceUrl = ref("");
const title = ref("");
const focusTopic = ref("");
const studyLevel = ref("");
const questionStyle = ref("exam-style");
const difficulty = ref("mixed");
const questionType = ref("mixed");
const practiceId = ref("");
const jobId = ref("");
const job = ref<Job | null>(null);
const questions = ref<Question[]>([]);
const answers = ref<Record<string, string>>({});
const currentIndex = ref(0);
const submission = ref<Submission | null>(null);
const isGenerating = ref(false);
const isSubmitting = ref(false);
const isDeleting = ref(false);
const failedMessage = ref<string | null>(null);
const isRetrying = ref(false);
let pollTimer: ReturnType<typeof setTimeout> | null = null;

// "insufficient content" = deterministic pre-AI check; retrying won't help.
// "generation error" = post-AI validation failure; retrying may succeed.
const INSUFFICIENT_CONTENT_MARKER = "does not contain enough clear learning evidence";
const failureType = computed<"insufficient-content" | "generation-error" | null>(() =>
  failedMessage.value === null
    ? null
    : failedMessage.value.includes(INSUFFICIENT_CONTENT_MARKER)
      ? "insufficient-content"
      : "generation-error",
);

const sourceModes = [
  { value: "file" as const, label: "Upload file", icon: "i-lucide-file-up" },
  { value: "text" as const, label: "Paste text", icon: "i-lucide-text-cursor-input" },
  { value: "url" as const, label: "Add link", icon: "i-lucide-link" },
];
const levelOptions = ["", "GCSE", "A-Level", "undergraduate", "masters"].map((value) => ({ label: value || "Auto", value }));
const styleOptions = ["exam-style", "UK exam-style", "short-answer", "mixed"].map((value) => ({ label: value.replace(/-/g, " "), value }));
const difficultyOptions = ["mixed", "easy", "medium", "hard"].map((value) => ({ label: value, value }));
const typeOptions = ["mixed", "multiple-choice", "short-answer"].map((value) => ({ label: value.replace(/-/g, " "), value }));

const validUrl = computed(() => {
  try {
    const parsed = new URL(sourceUrl.value.trim());
    return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname.includes(".");
  } catch { return false; }
});
const sourceReady = computed(() => sourceMode.value === "file" ? !!file.value : sourceMode.value === "text" ? !!sourceText.value.trim() : validUrl.value);
const progress = computed(() => job.value?.progress ?? (job.value?.totalCount ? Math.round(Number(job.value.generatedCount || 0) / job.value.totalCount * 100) : 0));
const currentQuestion = computed(() => questions.value[currentIndex.value] || null);
const answeredCount = computed(() => questions.value.filter((question, index) => answerFor(question, index).trim()).length);
const canSubmit = computed(() => questions.value.length === 5 && answeredCount.value === 5);
const reviews = computed(() => submission.value?.items || submission.value?.results || submission.value?.questionResults || []);
const finalScore = computed(() => Math.round(Number(submission.value?.averageScore ?? submission.value?.score ?? 0)));

function keyFor(question: Question, index: number) { return question.id || `question-${index + 1}`; }
function answerFor(question: Question, index: number) { return answers.value[keyFor(question, index)] || ""; }
function setAnswer(question: Question, index: number, value: string) { answers.value = { ...answers.value, [keyFor(question, index)]: value }; }
function switchSource(mode: SourceMode) { sourceMode.value = mode; file.value = null; sourceText.value = ""; sourceUrl.value = ""; }
function selectFile(files: FileList | null) { file.value = files?.[0] || null; }
function reviewQuestion(item: Review, index: number) { return questions.value.find((question, questionIndex) => keyFor(question, questionIndex) === item.questionId)?.question || `Question ${index + 1}`; }
function reviewAnswer(item: Review, index: number) { return item.userAnswer || answerFor(questions.value[index] || {}, index) || "No answer submitted."; }

async function createPractice() {
  if (!sourceReady.value || isGenerating.value) return;
  try {
    isGenerating.value = true;
    failedMessage.value = null;
    const form = new FormData();
    if (sourceMode.value === "file" && file.value) form.append("File", file.value);
    if (sourceMode.value === "text") form.append("Text", sourceText.value.trim());
    if (sourceMode.value === "url") form.append("Url", sourceUrl.value.trim());
    if (title.value.trim()) form.append("Title", title.value.trim());
    if (focusTopic.value.trim()) form.append("FocusTopic", focusTopic.value.trim());
    if (studyLevel.value) form.append("StudyLevel", studyLevel.value);
    form.append("QuestionStyle", questionStyle.value);
    form.append("Difficulty", difficulty.value);
    form.append("QuestionType", questionType.value);
    const response = await $api.mutate<{ practiceId?: string; jobId?: string }>("/api/quick-practice", { method: "POST", body: form });
    if (!response.practiceId || !response.jobId) throw new Error("Practice job was not returned.");
    practiceId.value = response.practiceId;
    jobId.value = response.jobId;
    await router.replace({ query: { practiceId: practiceId.value, jobId: jobId.value } });
    await pollJob();
  } catch (error: any) {
    isGenerating.value = false;
    toast.add({ title: "Could not create quick practice", description: error?.data?.message || error?.message || "Please try again.", color: "error" });
  }
}

async function pollJob() {
  if (!jobId.value) return;
  try {
    job.value = await $api.fetch<Job>(`/api/quick-practice/jobs/${jobId.value}`);
    if (job.value.status === "failed") {
      isGenerating.value = false;
      failedMessage.value = job.value.message || "Generation failed.";
      return;
    }
    if (job.value.status === "completed") {
      const result = await $api.fetch<{ questions?: Question[] }>(`/api/quick-practice/jobs/${jobId.value}/result`);
      questions.value = result.questions || [];
      isGenerating.value = false;
      return;
    }
    pollTimer = setTimeout(() => void pollJob(), 1800);
  } catch (error: any) {
    if ([202, 404].includes(Number(error?.statusCode || error?.status))) { pollTimer = setTimeout(() => void pollJob(), 1800); return; }
    isGenerating.value = false;
    failedMessage.value = error?.data?.message || error?.message || "Generation failed.";
  }
}

async function submitPractice() {
  if (!canSubmit.value || !jobId.value) return;
  try {
    isSubmitting.value = true;
    submission.value = await $api.mutate<Submission>(`/api/quick-practice/jobs/${jobId.value}/submit`, {
      method: "POST",
      body: { answers: questions.value.map((question, index) => ({ questionId: keyFor(question, index), userAnswer: answerFor(question, index) })) },
    });
  } catch (error: any) {
    toast.add({ title: "Could not submit practice", description: error?.data?.message || error?.message || "Please try again.", color: "error" });
  } finally { isSubmitting.value = false; }
}

async function deletePractice() {
  if (!practiceId.value || !confirm("Delete this temporary practice and its source?")) return;
  try {
    isDeleting.value = true;
    await $api.mutate(`/api/quick-practice/${practiceId.value}`, { method: "DELETE" });
    resetPractice();
  } catch (error: any) {
    toast.add({ title: "Could not delete practice", description: error?.data?.message || error?.message || "Please try again.", color: "error" });
  } finally { isDeleting.value = false; }
}
async function retryGeneration() {
  if (!jobId.value || isRetrying.value) return;
  try {
    isRetrying.value = true;
    isGenerating.value = true;
    failedMessage.value = null;
    const response = await $api.mutate<{ jobId?: string; status?: string }>(
      `/api/quick-practice/jobs/${jobId.value}/retry`,
      { method: "POST" },
    );
    if (!response.jobId) throw new Error("Retry did not return a new job.");
    jobId.value = response.jobId;
    await router.replace({ query: { practiceId: practiceId.value, jobId: jobId.value } });
    await pollJob();
  } catch (error: any) {
    isGenerating.value = false;
    failedMessage.value = error?.data?.message || error?.message || "Retry failed. Please start over.";
  } finally {
    isRetrying.value = false;
  }
}

function resetPractice() {
  if (pollTimer) clearTimeout(pollTimer);
  practiceId.value = ""; jobId.value = ""; job.value = null; questions.value = []; answers.value = {}; submission.value = null; currentIndex.value = 0; isGenerating.value = false; failedMessage.value = null; isRetrying.value = false;
  void router.replace({ query: {} });
}
onMounted(() => {
  if (typeof route.query.jobId === "string") {
    jobId.value = route.query.jobId;
    practiceId.value = typeof route.query.practiceId === "string" ? route.query.practiceId : "";
    isGenerating.value = true;
    void pollJob();
  }
});
onBeforeUnmount(() => { if (pollTimer) clearTimeout(pollTimer); });
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <header class="ga-surface-warm rounded-[2rem] border p-6 sm:p-9">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="ga-link text-xs font-bold uppercase tracking-[0.22em]">One-off assessment</p>
          <h1 class="ga-heading mt-3 font-serif text-4xl font-semibold sm:text-6xl">Quick Practice</h1>
          <p class="ga-muted mt-3 max-w-2xl text-sm leading-6 sm:text-base">
            Add one source and get a focused set of practice questions without creating a study stream or changing mastery.
          </p>
        </div>
        <UBadge color="primary" variant="soft" class="w-fit rounded-full">No study stream needed</UBadge>
      </div>
    </header>

    <section v-if="failedMessage" class="ga-surface rounded-[2rem] border p-6 sm:p-8">
      <div class="flex flex-col items-start gap-4">
        <UIcon name="i-lucide-circle-alert" class="h-8 w-8 text-red-500" />
        <div>
          <h2 class="ga-heading font-serif text-2xl font-semibold">
            {{ failureType === "insufficient-content" ? "Not enough content to assess" : "Generation failed" }}
          </h2>
          <p class="ga-muted mt-2 max-w-2xl text-sm leading-6">{{ failedMessage }}</p>
        </div>
        <div class="flex flex-wrap gap-3 pt-2">
          <template v-if="failureType === 'insufficient-content'">
            <UButton
              label="Try different material"
              icon="i-lucide-upload"
              color="primary"
              class="rounded-xl"
              @click="resetPractice"
            />
          </template>
          <template v-else>
            <UButton
              label="Retry"
              icon="i-lucide-rotate-ccw"
              color="primary"
              class="rounded-xl"
              :loading="isRetrying"
              @click="retryGeneration"
            />
            <UButton
              label="Start over"
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              class="rounded-xl"
              @click="resetPractice"
            />
          </template>
        </div>
      </div>
    </section>

    <section v-else-if="!questions.length && !isGenerating" class="ga-surface rounded-[2rem] border p-5 sm:p-7">
      <div class="flex gap-2 overflow-x-auto pb-1">
        <UButton
          v-for="mode in sourceModes"
          :key="mode.value"
          :label="mode.label"
          :icon="mode.icon"
          :color="sourceMode === mode.value ? 'primary' : 'neutral'"
          :variant="sourceMode === mode.value ? 'solid' : 'ghost'"
          class="shrink-0 rounded-xl"
          @click="switchSource(mode.value)"
        />
      </div>

      <div class="mt-6">
        <UFormField v-if="sourceMode === 'file'" label="Study file" required>
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md,.markdown"
            class="ga-muted mt-2 block w-full rounded-2xl border border-dashed border-[var(--ga-border)] bg-[var(--ga-surface-soft)] p-5 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--ga-primary)] file:px-4 file:py-2 file:font-semibold file:text-white"
            @change="selectFile(($event.target as HTMLInputElement).files)"
          />
        </UFormField>
        <UFormField v-else-if="sourceMode === 'text'" label="Study text" required>
          <UTextarea v-model="sourceText" :rows="7" autoresize class="mt-2 w-full" placeholder="Paste the material you want to practise..." />
        </UFormField>
        <UFormField v-else label="Study URL" required>
          <UInput v-model="sourceUrl" type="url" class="mt-2 w-full" placeholder="https://example.com/article-or-pdf" />
          <p v-if="sourceUrl.trim() && !validUrl" class="mt-2 text-xs font-medium text-red-600">Enter a complete http:// or https:// URL.</p>
        </UFormField>
      </div>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <UFormField label="Title" hint="Optional"><UInput v-model="title" class="w-full" placeholder="Cell respiration check" /></UFormField>
        <UFormField label="Focus topic" hint="Optional"><UInput v-model="focusTopic" class="w-full" placeholder="ATP production" /></UFormField>
        <UFormField label="Study level"><USelect v-model="studyLevel" :items="levelOptions" class="w-full capitalize" /></UFormField>
        <UFormField label="Question style"><USelect v-model="questionStyle" :items="styleOptions" class="w-full capitalize" /></UFormField>
        <UFormField label="Difficulty"><USelect v-model="difficulty" :items="difficultyOptions" class="w-full capitalize" /></UFormField>
        <UFormField label="Question type"><USelect v-model="questionType" :items="typeOptions" class="w-full capitalize" /></UFormField>
      </div>
      <div class="mt-7 flex justify-end border-t border-[var(--ga-border)] pt-5">
        <UButton label="Generate quick practice" icon="i-lucide-sparkles" color="primary" class="w-full justify-center rounded-xl sm:w-auto" :disabled="!sourceReady" @click="createPractice" />
      </div>
    </section>

    <section v-else-if="isGenerating" class="ga-surface rounded-[2rem] border p-8 text-center">
      <UIcon name="i-lucide-loader-circle" class="mx-auto h-10 w-10 animate-spin text-[var(--ga-primary)]" />
      <h2 class="ga-heading mt-4 font-serif text-3xl font-semibold">Preparing five questions...</h2>
      <p class="ga-muted mt-2">{{ job?.message || "Reading your source and building the assessment." }}</p>
      <UProgress v-if="progress" :model-value="progress" color="primary" class="mx-auto mt-5 max-w-lg" />
      <UProgress v-else animation="carousel" color="primary" class="mx-auto mt-5 max-w-lg" />
    </section>

    <section v-else-if="submission" class="ga-surface rounded-[2rem] border p-6 sm:p-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <UBadge :color="submission.passed ? 'success' : 'warning'" variant="soft">{{ submission.passed ? "Passed" : "Keep practising" }}</UBadge>
          <h2 class="ga-heading mt-3 font-serif text-5xl font-semibold">{{ finalScore }}%</h2>
          <p class="ga-muted mt-2 max-w-2xl text-sm leading-6">{{ submission.feedback || submission.message || "Review each answer below." }}</p>
        </div>
        <UButton label="Delete practice" icon="i-lucide-trash-2" color="error" variant="ghost" :loading="isDeleting" @click="deletePractice" />
      </div>

      <div class="mt-8 space-y-4">
        <article v-for="(item, index) in reviews" :key="item.questionId || index" class="rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] p-5">
          <div class="flex gap-2">
            <UBadge :color="(item.correct ?? item.isCorrect) ? 'success' : 'error'" variant="soft">{{ (item.correct ?? item.isCorrect) ? "Correct" : "Review" }}</UBadge>
            <UBadge v-if="item.score != null" color="neutral" variant="soft">{{ Math.round(item.score) }}%</UBadge>
          </div>
          <h3 class="ga-heading mt-3 font-semibold">{{ reviewQuestion(item, index) }}</h3>
          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <div class="ga-surface rounded-xl border p-3"><p class="ga-subtle text-xs font-semibold">Your answer</p><p class="ga-muted mt-1 whitespace-pre-wrap text-sm leading-6">{{ reviewAnswer(item, index) }}</p></div>
            <div class="ga-surface rounded-xl border p-3">
              <p class="ga-subtle text-xs font-semibold">Expected answer</p>
              <p v-if="item.correctAnswer || item.expectedAnswer" class="ga-muted mt-1 whitespace-pre-wrap text-sm leading-6">{{ item.correctAnswer || item.expectedAnswer }}</p>
              <ul v-if="item.correctAnswers?.length" class="ga-muted mt-2 list-disc space-y-1 pl-5 text-sm"><li v-for="answer in item.correctAnswers" :key="answer">{{ answer }}</li></ul>
            </div>
          </div>
          <div v-if="item.feedback" class="ga-surface mt-3 rounded-xl border p-3"><p class="ga-subtle text-xs font-semibold">Feedback</p><p class="ga-muted mt-1 text-sm leading-6">{{ item.feedback }}</p></div>
        </article>
      </div>
      <UButton label="Create another practice" icon="i-lucide-rotate-ccw" color="primary" class="mt-6 rounded-xl" @click="resetPractice" />
    </section>

    <template v-else-if="currentQuestion">
      <section class="ga-surface rounded-[2rem] border p-5 sm:p-8">
        <div class="flex items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2"><UBadge color="primary" variant="soft">Question {{ currentIndex + 1 }} of {{ questions.length }}</UBadge><UBadge v-if="currentQuestion.difficulty" color="neutral" variant="outline" class="capitalize">{{ currentQuestion.difficulty }}</UBadge></div>
          <span class="ga-subtle text-xs font-semibold">{{ answeredCount }}/5 answered</span>
        </div>
        <UProgress :model-value="((currentIndex + 1) / questions.length) * 100" color="primary" class="mt-4" />
        <h2 class="ga-heading mt-8 text-xl font-semibold leading-8">{{ currentQuestion.question }}</h2>
        <div v-if="currentQuestion.options?.length" class="mt-6 grid gap-2">
          <button v-for="option in currentQuestion.options" :key="option" type="button" :class="['rounded-xl border p-4 text-left text-sm transition', answerFor(currentQuestion, currentIndex) === option ? 'border-[var(--ga-primary)] bg-[var(--ga-primary-soft)] text-[var(--ga-primary)]' : 'border-[var(--ga-border)] bg-[var(--ga-surface-soft)]']" @click="setAnswer(currentQuestion, currentIndex, option)">{{ option }}</button>
        </div>
        <UTextarea v-else :model-value="answerFor(currentQuestion, currentIndex)" :rows="5" autoresize class="mt-6 w-full" placeholder="Write your answer..." @update:model-value="setAnswer(currentQuestion, currentIndex, String($event || ''))" />
      </section>
      <div class="ga-surface flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row sm:items-center sm:justify-between">
        <UButton label="Previous" icon="i-lucide-arrow-left" color="neutral" variant="ghost" :disabled="currentIndex === 0" @click="currentIndex--" />
        <UButton v-if="currentIndex < questions.length - 1" label="Next question" trailing-icon="i-lucide-arrow-right" color="primary" :disabled="!answerFor(currentQuestion, currentIndex).trim()" @click="currentIndex++" />
        <UButton v-else label="Submit five answers" icon="i-lucide-send" color="primary" :disabled="!canSubmit" :loading="isSubmitting" @click="submitPractice" />
      </div>
    </template>
  </div>
</template>
