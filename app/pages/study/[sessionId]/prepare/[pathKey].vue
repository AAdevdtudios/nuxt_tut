<script setup lang="ts">
import { renderChatMarkdown } from "~/utils/chatMarkdown";

definePageMeta({ layout: "newdash" });

type PrepareSlide = {
  index?: number;
  title?: string;
  markdown?: string;
  sources?: string[];
};

type PrepareResponse = {
  sessionId?: string;
  topicKey?: string;
  topic?: string;
  title?: string;
  difficulty?: string;
  slides?: PrepareSlide[];
  message?: string;
};

type PracticeResponse = {
  sessionId?: string;
  jobId?: string;
  status?: string;
  focusTopicKey?: string;
  focusTopic?: string;
  difficulty?: string;
  numberOfQuestions?: number;
};

type StudyTopic = {
  key?: string;
  status?: string;
  isActive?: boolean;
};

type StudySession = {
  studyLevel?: string | null;
  questionStyle?: string | null;
  topics?: StudyTopic[];
};

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();

const sessionId = computed(() => String(route.params.sessionId || ""));
const pathKey = computed(() => String(route.params.pathKey || ""));
const slideIndex = ref(0);
const isLoading = ref(true);
const isStartingPractice = ref(false);
const prepareContent = ref<PrepareResponse | null>(null);

const slides = computed(() => prepareContent.value?.slides || []);
const currentSlide = computed(() => slides.value[slideIndex.value] || null);
const progress = computed(() =>
  slides.value.length ? Math.round(((slideIndex.value + 1) / slides.value.length) * 100) : 0,
);
const isLastSlide = computed(() => slideIndex.value >= slides.value.length - 1);
const pageTitle = computed(
  () => prepareContent.value?.topic || prepareContent.value?.title || "Prepare me",
);

function goPrevious() {
  slideIndex.value = Math.max(0, slideIndex.value - 1);
}

function goNext() {
  slideIndex.value = Math.min(slides.value.length - 1, slideIndex.value + 1);
}

async function fetchPrepareSlides() {
  if (!sessionId.value || !pathKey.value) return;

  try {
    isLoading.value = true;
    prepareContent.value = await $api.mutate<PrepareResponse>(
      `/api/study-sessions/${sessionId.value}/paths/${encodeURIComponent(pathKey.value)}/prepare`,
      {
        method: "POST",
        body: {
          sessionId: sessionId.value,
          pathKey: pathKey.value,
        },
      },
    );
    slideIndex.value = 0;
  } catch (error: any) {
    toast.add({
      title: "Could not prepare this path",
      description: error?.data?.message || error?.message || "Return to the study stream and try again.",
      color: "error",
    });
  } finally {
    isLoading.value = false;
  }
}

async function startPractice() {
  try {
    isStartingPractice.value = true;
    const latestSession = await $api.fetch<StudySession>(
      `/api/study-sessions/${sessionId.value}`,
    );
    const practicePath =
      latestSession.topics?.find((topic) => topic.isActive === true && topic.key) ||
      latestSession.topics?.find((topic) => topic.status === "unlocked" && topic.key);

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
          studyLevel: latestSession.studyLevel || "Auto",
          questionStyle: latestSession.questionStyle || "exam-style",
        },
      },
    );

    if (!response.jobId) {
      throw new Error("Practice job was not returned.");
    }

    await router.push(
      `/study/${sessionId.value}/test/${response.jobId}?type=practice&pathKey=${encodeURIComponent(practicePath.key)}`,
    );
  } catch (error: any) {
    toast.add({
      title: "Could not start practice",
      description: error?.data?.message || error?.message || "Return to the study stream and try again.",
      color: "error",
    });
  } finally {
    isStartingPractice.value = false;
  }
}

onMounted(() => {
  void fetchPrepareSlides();
});
</script>

<template>
  <div class="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col space-y-6">
    <header class="ga-surface-warm rounded-[2rem] border p-6 sm:p-8">
      <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="ga-link text-xs font-bold uppercase tracking-[0.22em]">
            Review topic
          </p>
          <h1 class="ga-heading mt-2 font-serif text-3xl font-semibold sm:text-5xl">
            {{ pageTitle }}
          </h1>
          <p class="ga-muted mt-3 max-w-2xl text-sm leading-6">
            This section helps you understand what you are about to face in your
            next practice. Read each slide, then start when you feel ready.
          </p>
        </div>
        <div class="ga-surface rounded-2xl border p-4">
          <p class="ga-subtle text-xs font-semibold">Slide</p>
          <p class="ga-heading mt-1 text-3xl font-bold">
            {{ slides.length ? slideIndex + 1 : 0 }} / {{ slides.length }}
          </p>
          <UProgress :model-value="progress" color="primary" class="mt-2 w-44" />
        </div>
      </div>
    </header>

    <section class="ga-surface flex flex-1 flex-col rounded-[2rem] border p-5 sm:p-8">
      <div v-if="isLoading" class="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <UIcon name="i-lucide-loader-circle" class="h-10 w-10 animate-spin text-[var(--ga-primary)]" />
        <h2 class="ga-heading mt-4 font-serif text-3xl font-semibold">
          Reviewing this topic...
        </h2>
        <p class="ga-muted mt-2 max-w-md">
          GapAI is building a short review of what you will face in your next practice.
        </p>
      </div>

      <div v-else-if="currentSlide" class="flex flex-1 flex-col">
        <p class="ga-subtle text-xs font-bold uppercase tracking-[0.2em]">
          Slide {{ currentSlide.index || slideIndex + 1 }}
        </p>
        <h2 class="ga-heading mt-2 font-serif text-4xl font-semibold">
          {{ currentSlide.title }}
        </h2>
        <div
          class="prose prose-lg mt-8 max-w-none text-[var(--ga-text)]"
          v-html="renderChatMarkdown(currentSlide.markdown || '')"
        />
      </div>

      <div v-else class="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <UIcon name="i-lucide-file-question" class="h-12 w-12 text-[var(--ga-primary)]" />
        <h2 class="ga-heading mt-4 font-serif text-3xl font-semibold">
          No prepare slides yet
        </h2>
        <p class="ga-muted mt-2 max-w-md">
          Return to the study stream and try preparing the active path again.
        </p>
      </div>

      <div class="mt-8 flex flex-col gap-3 border-t border-[var(--ga-border)] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <UButton
          label="Back to stream"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          class="rounded-xl"
          @click="router.push(`/study/${sessionId}`)"
        />
        <div class="flex flex-wrap gap-2">
          <UButton
            label="Previous"
            color="neutral"
            variant="outline"
            class="rounded-xl"
            :disabled="isLoading || slideIndex === 0"
            @click="goPrevious"
          />
          <UButton
            v-if="!isLastSlide"
            label="Next"
            trailing-icon="i-lucide-arrow-right"
            color="primary"
            class="rounded-xl"
            :disabled="isLoading || !slides.length"
            @click="goNext"
          />
          <UButton
            v-else
            label="Start practice"
            icon="i-lucide-play"
            color="primary"
            class="rounded-xl"
            :disabled="isLoading || !slides.length"
            :loading="isStartingPractice"
            @click="startPractice"
          />
        </div>
      </div>
    </section>
  </div>
</template>
