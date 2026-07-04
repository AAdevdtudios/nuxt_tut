<script setup lang="ts">
definePageMeta({ layout: "newdash" });

type StudySessionCreateResponse = {
  sessionId?: string;
  id?: string;
  status?: string;
  message?: string;
};

type QuickPracticeCreateResponse = {
  practiceId?: string;
  jobId?: string;
};

type StudySessionListItem = {
  id: string;
  sourceLibraryItemId?: string | null;
  title?: string;
  status?: string;
  masteryScore?: number;
  currentDifficulty?: string | null;
  activePathKey?: string | null;
  topicsAnalyzedAtUtc?: string | null;
  createdAtUtc?: string | null;
  updatedAtUtc?: string | null;
};

type StudySessionListResponse = {
  count?: number;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  items?: StudySessionListItem[];
};

const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();
const auth = useAuthStore();

const selectedFile = ref<File | null>(null);
const sourceUrl = ref("");
const title = ref("");
const isDragging = ref(false);
const isStarting = ref(false);
const isStartingQuickPractice = ref(false);
const isLoadingSessions = ref(true);
const deletingSessionId = ref("");
const studySessions = ref<StudySessionListItem[]>([]);

const supportedFilePattern = /\.(pdf|docx|txt|md|markdown)$/i;
const blockedSourceExtensions = /\.(epub|mobi|azw3|zip|rar|7z|exe|dmg)(\?|#|$)/i;

const firstName = computed(() => {
  const name =
    auth.currentUser?.name || auth.currentUser?.displayName || "Student";
  return name.trim().split(/\s+/)[0];
});

const normalizedUrl = computed(() => sourceUrl.value.trim());
const urlValidation = computed(() => validateUrl(normalizedUrl.value));
const canStart = computed(() => Boolean(selectedFile.value || urlValidation.value.valid));
const materialTitle = computed(() => {
  if (title.value.trim()) return title.value.trim();
  if (selectedFile.value) return selectedFile.value.name.replace(/\.[^.]+$/, "");
  if (urlValidation.value.valid) {
    try {
      return new URL(normalizedUrl.value).hostname;
    } catch {}
  }
  return "Study material";
});
const fileSize = computed(() => {
  if (!selectedFile.value) return "";
  return `${Math.max(0.1, selectedFile.value.size / 1024 / 1024).toFixed(1)} MB`;
});
const materialTypeLabel = computed(() => {
  if (selectedFile.value) {
    if (/\.pdf$/i.test(selectedFile.value.name)) return "PDF source";
    if (/\.(docx|txt|md|markdown)$/i.test(selectedFile.value.name)) {
      return "Document source";
    }
    return "Study material";
  }

  if (normalizedUrl.value) return "Website or PDF link";
  return "No material selected";
});

const streamSteps = [
  {
    title: "Upload your notes",
    description: "PDF, document, or a link.",
    icon: "i-lucide-file-up",
  },
  {
    title: "Take a short test",
    description: "GapAI finds your real level.",
    icon: "i-lucide-clipboard-check",
  },
  {
    title: "Unlock topic by topic",
    description: "Pass each stage to move on.",
    icon: "i-lucide-route",
  },
];

const suggestedActions = computed(() => [
  {
    title: "Start a new stream",
    description: "Drop material above and let GapAI create the diagnostic.",
    icon: "i-lucide-sparkles",
    action: () => openFilePicker(),
  },
  {
    title: "Quick practice",
    description: "Use the material above to generate five standalone questions.",
    icon: "i-lucide-file-question",
    action: () => startQuickPractice(),
  },
  {
    title: "See what is coming",
    description: "Preview the roadmap for exams and deeper analytics.",
    icon: "i-lucide-sparkles",
    action: () => router.push("/dashboard/coming-soon"),
  },
  {
    title: "Get help",
    description: "Open support, FAQs, and contact options if something blocks you.",
    icon: "i-lucide-life-buoy",
    action: () => router.push("/dashboard/help"),
  },
]);

const hasStudySessions = computed(() => studySessions.value.length > 0);

function validateUrl(value: string): { valid: boolean; message?: string } {
  if (!value) return { valid: false };

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return {
      valid: false,
      message: "Paste a valid website or PDF URL starting with http:// or https://.",
    };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, message: "Only http:// and https:// links are supported." };
  }

  if (!parsed.hostname.includes(".")) {
    return {
      valid: false,
      message: "Use a complete URL, for example https://example.com/article.",
    };
  }

  if (blockedSourceExtensions.test(parsed.pathname)) {
    return {
      valid: false,
      message: "That file type is not supported. Use a website, PDF, DOCX, TXT, or MD source.",
    };
  }

  return { valid: true };
}

function handleFiles(files: FileList | null) {
  const file = files?.[0];
  if (!file) return;

  if (!supportedFilePattern.test(file.name)) {
    toast.add({
      title: "Unsupported file",
      description: "Upload PDF, DOCX, TXT, or Markdown only.",
      color: "warning",
    });
    return;
  }

  selectedFile.value = file;
  sourceUrl.value = "";
}

function handleDrop(event: DragEvent) {
  isDragging.value = false;
  handleFiles(event.dataTransfer?.files || null);
}

function openFilePicker() {
  document.getElementById("dashboard-study-session-file")?.click();
}

function formatSessionDate(value?: string | null) {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function masteryLabel(value?: number) {
  if (value === undefined || value === null) return "0%";
  return `${Math.round(Number(value) * 100)}%`;
}

async function fetchStudySessions() {
  try {
    isLoadingSessions.value = true;
    const response = await $api.fetch<StudySessionListResponse>(
      "/api/study-sessions?page=1&pageSize=6",
    );
    studySessions.value = response.items || [];
  } catch (error: any) {
    toast.add({
      title: "Could not load study sessions",
      description: error?.data?.message || error?.statusMessage || error?.message || "Please try again.",
      color: "error",
    });
  } finally {
    isLoadingSessions.value = false;
  }
}

async function startStudySession() {
  if (!canStart.value) {
    toast.add({
      title: "Add study material",
      description: "Drop a supported file or paste a valid link first.",
      color: "warning",
    });
    return;
  }

  if (!selectedFile.value && !urlValidation.value.valid) {
    toast.add({
      title: "Invalid link",
      description: urlValidation.value.message || "Paste a valid URL.",
      color: "warning",
    });
    return;
  }

  try {
    isStarting.value = true;
    const form = new FormData();
    form.append("Title", materialTitle.value);
    if (selectedFile.value) form.append("File", selectedFile.value);
    if (!selectedFile.value && normalizedUrl.value) {
      form.append("Url", normalizedUrl.value);
    }

    const response = await $api.mutate<StudySessionCreateResponse>(
      "/api/study-sessions",
      {
        method: "POST",
        body: form,
      },
    );
    const sessionId = response.sessionId || response.id;
    if (!sessionId) throw new Error("No study session was returned.");
    selectedFile.value = null;
    sourceUrl.value = "";
    title.value = "";
    void fetchStudySessions();
    await router.push(`/study/${sessionId}`);
  } catch (error: any) {
    toast.add({
      title: "Could not start study stream",
      description: error?.statusMessage || error?.message || "Please try again.",
      color: "error",
    });
  } finally {
    isStarting.value = false;
  }
}

async function startQuickPractice() {
  if (!canStart.value) {
    toast.add({
      title: "Add study material",
      description: "Drop a supported file or paste a valid link first.",
      color: "warning",
    });
    openFilePicker();
    return;
  }

  if (!selectedFile.value && !urlValidation.value.valid) {
    toast.add({
      title: "Invalid link",
      description: urlValidation.value.message || "Paste a valid URL.",
      color: "warning",
    });
    return;
  }

  try {
    isStartingQuickPractice.value = true;
    const form = new FormData();
    form.append("Title", materialTitle.value);
    form.append("QuestionStyle", "exam-style");
    form.append("Difficulty", "mixed");
    form.append("QuestionType", "mixed");
    if (selectedFile.value) form.append("File", selectedFile.value);
    if (!selectedFile.value && normalizedUrl.value) {
      form.append("Url", normalizedUrl.value);
    }

    const response = await $api.mutate<QuickPracticeCreateResponse>(
      "/api/quick-practice",
      {
        method: "POST",
        body: form,
      },
    );

    if (!response.practiceId || !response.jobId) {
      throw new Error("No quick practice job was returned.");
    }

    await router.push({
      path: "/dashboard/quick-practice",
      query: {
        practiceId: response.practiceId,
        jobId: response.jobId,
      },
    });
  } catch (error: any) {
    toast.add({
      title: "Could not start quick practice",
      description: error?.data?.message || error?.statusMessage || error?.message || "Please try again.",
      color: "error",
    });
  } finally {
    isStartingQuickPractice.value = false;
  }
}

async function deleteStudySession(session: StudySessionListItem) {
  if (!confirm(`Delete "${session.title || "this study session"}"? This also deletes the source material created for this session.`)) {
    return;
  }

  try {
    deletingSessionId.value = session.id;
    await $api.mutate(`/api/study-sessions/${session.id}?deleteSource=true`, {
      method: "DELETE",
    });
    await fetchStudySessions();
    toast.add({
      title: "Study session deleted",
      description: "The session was removed from your study stream.",
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Could not delete study session",
      description: error?.data?.message || error?.statusMessage || error?.message || "Please try again.",
      color: "error",
    });
  } finally {
    deletingSessionId.value = "";
  }
}

onMounted(() => {
  void fetchStudySessions();
});

</script>

<template>
  <div class="mx-auto max-w-7xl space-y-8 sm:space-y-10">
    <section
      class="ga-surface-warm relative overflow-hidden rounded-[1.5rem] border px-4 py-8 sm:rounded-[2rem] sm:px-10 sm:py-10 lg:px-16 lg:py-16"
    >
      <div
        class="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[var(--ga-glow-primary)] blur-3xl"
      />
      <div
        class="pointer-events-none absolute -bottom-28 left-1/3 h-60 w-60 rounded-full bg-[var(--ga-glow-warm)] blur-3xl"
      />

      <div class="relative mx-auto max-w-4xl text-center">
        <div>
          <p class="ga-link mb-3 text-xs font-bold uppercase tracking-[0.24em]">
            Start here
          </p>
          <h1
            class="ga-heading mx-auto max-w-3xl font-serif text-2xl font-semibold leading-tight sm:text-4xl lg:text-5xl"
          >
            Upload your material, {{ firstName }}. GapAI tests you first.
          </h1>
          <p class="ga-muted mx-auto mt-3 max-w-xl text-sm leading-6">
            No setup, no choices to get wrong. Drop in your notes and GapAI
            takes it from there.
          </p>

          <div class="mx-auto mt-6 flex max-w-2xl flex-col justify-center gap-2 sm:flex-row sm:gap-3">
            <div
              v-for="(step, index) in streamSteps"
              :key="step.title"
              class="flex flex-1 items-center gap-2.5 rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface)] px-3 py-2.5 text-left"
            >
              <span
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ga-primary)] text-xs font-bold text-white"
              >
                {{ index + 1 }}
              </span>
              <div class="min-w-0">
                <p class="ga-heading text-xs font-semibold">{{ step.title }}</p>
                <p class="ga-subtle text-[11px] leading-4">{{ step.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <div
          :class="[
            'ga-surface mx-auto mt-8 max-w-3xl rounded-3xl border p-3 text-left shadow-[0_24px_70px_-40px_rgba(53,63,51,0.65)] transition sm:p-4',
            isDragging
              ? 'border-[var(--ga-primary)] ring-4 ring-[var(--ga-primary-soft-strong)]'
              : '',
          ]"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <input
            id="dashboard-study-session-file"
            type="file"
            class="hidden"
            accept=".pdf,.docx,.txt,.md,.markdown"
            @change="handleFiles(($event.target as HTMLInputElement).files)"
          />

          <button
            type="button"
            class="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--ga-border)] bg-[var(--ga-surface-soft)] px-4 py-9 text-center transition hover:border-[var(--ga-primary)] hover:bg-[var(--ga-primary-soft)]"
            @click="openFilePicker"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ga-warm-soft)] text-[var(--ga-warm)]"
            >
              <UIcon name="i-lucide-file-up" class="h-7 w-7" />
            </div>
            <p class="ga-heading mt-4 text-base font-semibold">
              {{ selectedFile ? selectedFile.name : "Drop your material here" }}
            </p>
            <p class="ga-muted mt-1 max-w-md text-sm leading-6">
              PDF, DOCX, TXT, or MD. GapAI starts with a short placement test
              so your first topic opens at the right level.
            </p>
          </button>

          <div v-if="selectedFile || sourceUrl.trim()" class="mt-3 flex flex-wrap gap-2">
            <div
              v-if="selectedFile"
              class="inline-flex max-w-full items-center gap-2 rounded-xl border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--ga-text)]"
            >
              <UIcon
                name="i-lucide-file-text"
                class="h-4 w-4 shrink-0 text-[var(--ga-warm)]"
              />
              <span class="max-w-48 truncate">{{ selectedFile.name }}</span>
              <span class="ga-subtle shrink-0">{{ fileSize }}</span>
              <button
                type="button"
                class="rounded-full p-0.5 transition hover:bg-[var(--ga-warm-soft)]"
                aria-label="Remove file"
                @click="selectedFile = null"
              >
                <UIcon name="i-lucide-x" class="h-3.5 w-3.5" />
              </button>
            </div>
            <div
              v-if="sourceUrl.trim()"
              class="inline-flex max-w-full items-center gap-2 rounded-xl border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] px-3 py-2 text-xs font-semibold text-[var(--ga-text)]"
            >
              <UIcon
                name="i-lucide-link"
                class="h-4 w-4 shrink-0 text-[var(--ga-warm)]"
              />
              <span class="max-w-56 truncate">{{ sourceUrl }}</span>
              <button
                type="button"
                class="rounded-full p-0.5 transition hover:bg-[var(--ga-warm-soft)]"
                aria-label="Remove link"
                @click="sourceUrl = ''"
              >
                <UIcon name="i-lucide-x" class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div class="mt-3 grid gap-3">
            <div
              class="rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface)] px-3 py-2"
            >
              <label class="ga-subtle text-xs font-semibold">Optional title</label>
              <input
                v-model="title"
                type="text"
                placeholder="Cell respiration"
                class="ga-text mt-1 w-full bg-transparent py-1 text-[16px] outline-none placeholder:text-[var(--ga-text-subtle)] lg:text-sm"
              />
            </div>

            <div
              class="rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface)] px-3 py-2"
            >
              <label class="ga-subtle text-xs font-semibold">Or add a link</label>
              <input
                v-model="sourceUrl"
                type="url"
                :disabled="Boolean(selectedFile)"
                placeholder="https://example.com/article-or-pdf"
                class="ga-text mt-1 w-full bg-transparent py-1 text-[16px] outline-none placeholder:text-[var(--ga-text-subtle)] disabled:opacity-50 lg:text-sm"
              />
              <p
                v-if="normalizedUrl && !urlValidation.valid"
                class="mt-1 text-xs font-medium text-[var(--ga-danger,#b42318)]"
              >
                {{ urlValidation.message }}
              </p>
            </div>
          </div>

          <div class="mt-3 rounded-2xl border border-[var(--ga-border)] bg-[var(--ga-surface-soft)] p-4">
            <p class="text-xs font-semibold text-[var(--ga-text-subtle)] uppercase tracking-wide mb-2">Best results with</p>
            <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              <div class="flex items-start gap-1.5">
                <UIcon name="i-lucide-check" class="mt-0.5 h-3 w-3 shrink-0 text-[var(--ga-success,#22c55e)]" />
                <span class="ga-text">Typed revision notes</span>
              </div>
              <div class="flex items-start gap-1.5">
                <UIcon name="i-lucide-check" class="mt-0.5 h-3 w-3 shrink-0 text-[var(--ga-success,#22c55e)]" />
                <span class="ga-text">Topic summaries</span>
              </div>
              <div class="flex items-start gap-1.5">
                <UIcon name="i-lucide-check" class="mt-0.5 h-3 w-3 shrink-0 text-[var(--ga-success,#22c55e)]" />
                <span class="ga-text">Past-paper mark schemes</span>
              </div>
              <div class="flex items-start gap-1.5">
                <UIcon name="i-lucide-check" class="mt-0.5 h-3 w-3 shrink-0 text-[var(--ga-success,#22c55e)]" />
                <span class="ga-text">Text-heavy PDFs</span>
              </div>
              <div class="flex items-start gap-1.5">
                <UIcon name="i-lucide-alert-triangle" class="mt-0.5 h-3 w-3 shrink-0 text-[var(--ga-warning,#f59e0b)]" />
                <span class="ga-muted">Diagram-heavy textbooks</span>
              </div>
              <div class="flex items-start gap-1.5">
                <UIcon name="i-lucide-alert-triangle" class="mt-0.5 h-3 w-3 shrink-0 text-[var(--ga-warning,#f59e0b)]" />
                <span class="ga-muted">Handwritten or scanned notes</span>
              </div>
              <div class="flex items-start gap-1.5">
                <UIcon name="i-lucide-alert-triangle" class="mt-0.5 h-3 w-3 shrink-0 text-[var(--ga-warning,#f59e0b)]" />
                <span class="ga-muted">Chemistry mechanisms &amp; Maths formula sheets</span>
              </div>
            </div>
          </div>

          <div
            class="mt-3 flex flex-col gap-3 border-t border-[var(--ga-border)] pt-3 lg:flex-row lg:items-center lg:justify-between"
          >
            <UBadge color="neutral" variant="soft" class="w-fit rounded-full">
              {{ materialTypeLabel }}
            </UBadge>
            <div class="grid gap-2 sm:grid-cols-2 lg:flex lg:justify-end">
              <UButton
                icon="i-lucide-file-question"
                :label="isStartingQuickPractice ? 'Preparing questions...' : 'Quick practice (5 questions)'"
                color="neutral"
                variant="soft"
                class="w-full justify-center rounded-xl lg:w-auto"
                :loading="isStartingQuickPractice"
                :disabled="isStarting || isStartingQuickPractice || !canStart"
                @click="() => startQuickPractice()"
              />
              <UButton
                icon="i-lucide-arrow-up"
                :label="isStarting ? 'Setting things up...' : 'Start studying'"
                color="primary"
                class="w-full justify-center rounded-xl lg:w-auto"
                :loading="isStarting"
                :disabled="isStarting || isStartingQuickPractice || !canStart"
                @click="() => startStudySession()"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
      <div>
        <div class="mb-4 flex items-end justify-between">
          <div>
            <p class="ga-subtle text-xs font-bold uppercase tracking-[0.2em]">
              Continue exam prep
            </p>
            <h2 class="ga-heading mt-1 font-serif text-2xl font-semibold">
              Study sessions
            </h2>
          </div>
          <UButton
            label="New session"
            color="neutral"
            variant="ghost"
            trailing-icon="i-lucide-plus"
            @click="openFilePicker"
          />
        </div>

        <div v-if="isLoadingSessions" class="grid gap-3 md:grid-cols-2">
          <USkeleton v-for="item in 2" :key="item" class="h-40 rounded-2xl" />
        </div>

        <div v-else-if="hasStudySessions" class="grid gap-3 md:grid-cols-2">
          <div
            v-for="session in studySessions"
            :key="session.id"
            class="ga-surface ga-hover-card rounded-2xl border p-4"
          >
            <div class="flex items-start justify-between gap-3">
              <button
                type="button"
                class="min-w-0 flex-1 text-left"
                @click="router.push(`/study/${session.id}`)"
              >
                <div class="flex items-center gap-2">
                  <UBadge color="primary" variant="soft" class="rounded-full">
                    {{ session.status || "active" }}
                  </UBadge>
                  <UBadge
                    v-if="session.currentDifficulty"
                    color="neutral"
                    variant="soft"
                    class="rounded-full capitalize"
                  >
                    {{ session.currentDifficulty }}
                  </UBadge>
                </div>
                <h3 class="ga-heading mt-5 line-clamp-2 font-semibold">
                  {{ session.title || "Study session" }}
                </h3>
                <p class="ga-subtle mt-2 text-xs">
                  Started {{ formatSessionDate(session.createdAtUtc) }}
                </p>
                <div class="mt-4">
                  <div class="flex items-center justify-between text-xs">
                    <span class="ga-subtle font-semibold">Mastery</span>
                    <span class="ga-heading font-semibold">
                      {{ masteryLabel(session.masteryScore) }}
                    </span>
                  </div>
                  <UProgress
                    :model-value="Math.round(Number(session.masteryScore || 0) * 100)"
                    color="primary"
                    class="mt-2"
                  />
                </div>
              </button>
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                class="rounded-xl opacity-70 transition hover:opacity-100"
                :loading="deletingSessionId === session.id"
                :aria-label="`Delete ${session.title || 'study session'}`"
                @click.stop="deleteStudySession(session)"
              />
            </div>
          </div>
        </div>

        <div
          v-else
          class="ga-surface rounded-2xl border border-dashed border-[var(--ga-border)] p-8 text-center"
        >
          <div
            class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ga-primary-soft)] text-[var(--ga-primary)]"
          >
            <UIcon name="i-lucide-route" class="h-6 w-6" />
          </div>
          <h3 class="ga-heading mt-4 font-serif text-2xl font-semibold">
            No study sessions yet
          </h3>
          <p class="ga-muted mx-auto mt-2 max-w-md text-sm leading-6">
            Upload your first material above and it will appear here.
          </p>
        </div>
      </div>

      <div>
        <p class="ga-subtle text-xs font-bold uppercase tracking-[0.2em]">
          A clear next step
        </p>
        <h2 class="ga-heading mt-1 font-serif text-2xl font-semibold">
          Suggested actions
        </h2>
        <div class="mt-4 space-y-3">
          <button
            v-for="item in suggestedActions"
            :key="item.title"
            class="ga-surface ga-hover-card flex w-full items-center gap-3 rounded-2xl border p-3 text-left"
            @click="item.action"
          >
            <div
              class="ga-icon-box flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            >
              <UIcon :name="item.icon" class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="ga-heading text-sm font-semibold">{{ item.title }}</p>
              <p class="ga-subtle truncate text-xs">{{ item.description }}</p>
            </div>
            <UIcon
              name="i-lucide-chevron-right"
              class="ga-subtle ml-auto h-4 w-4"
            />
          </button>
        </div>
      </div>
    </section>

  </div>
</template>
