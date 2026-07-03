<template>
  <DashboardBodyLayout
    title="Practice Session"
    description="Answer generated project questions and submit for grading."
  >
    <template #leading-icon>
      <UIcon name="i-lucide-file-question-mark" class="h-8 w-8 text-primary" />
    </template>

    <div v-if="!questions.length" class="space-y-4">
      <UEmpty
        icon="i-lucide-file-question-mark"
        title="No generated questions"
        description="Generate questions from the Project Practice tab first."
      />
      <div class="flex justify-center">
        <UButton
          color="primary"
          icon="i-lucide-arrow-left"
          :to="`/dashboard/projects/${projectId}`"
        >
          Back to Project
        </UButton>
      </div>
    </div>

    <div v-else class="space-y-6">
      <UCard v-if="!evaluationResult">
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span
              >Question {{ currentIndex + 1 }} of {{ questions.length }}</span
            >
            <span>{{ Math.round(progressPercent) }}% complete</span>
          </div>
          <UProgress :model-value="progressPercent" :max="100" />
        </div>
      </UCard>

      <UCard v-if="currentQuestion && !evaluationResult">
        <template #header>
          <div class="flex items-center gap-2">
            <UBadge color="primary" variant="soft" class="capitalize">
              {{ currentQuestion.type }}
            </UBadge>
            <UBadge
              v-if="currentQuestion.difficulty"
              color="neutral"
              variant="soft"
              class="capitalize"
            >
              {{ currentQuestion.difficulty }}
            </UBadge>
          </div>
          <p class="text-lg font-semibold mt-2">
            {{ currentQuestion.question }}
          </p>
        </template>

        <div class="space-y-4">
          <URadioGroup
            v-if="
              currentQuestion.type === 'multiple-choice' &&
              Array.isArray(currentQuestion.options)
            "
            v-model="answerInput"
            :items="
              currentQuestion.options.map((option, index) => ({
                label: `${String.fromCharCode(65 + index)}. ${option}`,
                value: option,
              }))
            "
            class="w-full"
          />
          <UTextarea
            v-else
            v-model="answerInput"
            :rows="4"
            placeholder="Type your answer..."
            class="w-full"
          />

          <div class="flex items-center justify-between">
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-arrow-left"
              :disabled="currentIndex === 0"
              @click="goPrevious"
            >
              Previous
            </UButton>

            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="outline"
                :disabled="!answerInput.trim()"
                @click="saveCurrentAnswer"
              >
                Save Answer
              </UButton>
              <UButton
                v-if="currentIndex < questions.length - 1"
                color="primary"
                icon="i-lucide-arrow-right"
                :disabled="!canMoveNext"
                @click="goNext"
              >
                Next
              </UButton>
              <UButton
                v-else
                color="primary"
                icon="i-lucide-check"
                :loading="isSubmitting"
                :disabled="!canSubmit"
                @click="submitForGrading"
              >
                Submit for Grading
              </UButton>
            </div>
          </div>
        </div>
      </UCard>

      <UCard v-if="evaluationResult">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="font-semibold">Evaluation Result</div>
            <UButton
              color="neutral"
              variant="outline"
              icon="i-lucide-arrow-left"
              @click="backToProject"
            >
              Back to Project
            </UButton>
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div class="rounded-lg border border-default p-4 text-center">
            <div class="text-2xl font-bold">
              {{ evaluationResult.correctCount }}
            </div>
            <p class="text-sm text-muted-foreground">Correct Answers</p>
          </div>
          <div class="rounded-lg border border-default p-4 text-center">
            <div class="text-2xl font-bold">
              {{ evaluationResult.totalQuestions }}
            </div>
            <p class="text-sm text-muted-foreground">Total Questions</p>
          </div>
          <div class="rounded-lg border border-default p-4 text-center">
            <div class="text-2xl font-bold">
              {{ evaluationResult.averageScore }}
            </div>
            <p class="text-sm text-muted-foreground">Average Score</p>
          </div>
        </div>

        <div
          v-if="evaluationResult.progress"
          class="mb-4 rounded-lg border border-default p-4"
        >
          <p class="font-medium">Updated Project Progress</p>
          <p class="text-sm text-muted-foreground mt-1">
            Level: {{ evaluationResult.progress.progressLevel }}%
          </p>
        </div>

        <div class="space-y-4">
          <div
            v-for="(question, index) in questions"
            :key="question.id"
            class="rounded-lg border border-default p-4 space-y-3"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="font-medium">
                Q{{ index + 1 }}. {{ question.question }}
              </p>
              <UBadge
                :color="
                  reviewResult(question.id)?.correct ? 'success' : 'error'
                "
                variant="soft"
              >
                {{
                  reviewResult(question.id)?.correct ? "Correct" : "Incorrect"
                }}
              </UBadge>
            </div>

            <p class="text-sm">
              <span class="font-medium">Your answer:</span>
              <span class="text-muted-foreground">
                {{ reviewResult(question.id)?.userAnswer || "-" }}
              </span>
            </p>

            <p class="text-sm">
              <span class="font-medium">Expected answer:</span>
              <span class="text-muted-foreground">
                {{ expectedAnswer(question) }}
              </span>
            </p>

            <p v-if="question.reason" class="text-sm">
              <span class="font-medium">Reason:</span>
              <span class="text-muted-foreground"> {{ question.reason }} </span>
            </p>

            <p class="text-sm text-muted-foreground">
              Score: {{ reviewResult(question.id)?.score ?? 0 }}
              <span v-if="reviewResult(question.id)?.feedback">
                • {{ reviewResult(question.id)?.feedback }}
              </span>
            </p>
          </div>
        </div>
      </UCard>

      <UCard v-if="evaluationResult">
        <template #header>
          <div class="font-semibold">What To Do Next</div>
        </template>
        <div class="flex flex-wrap gap-2">
          <UButton
            color="primary"
            icon="i-lucide-sparkles"
            @click="startNewSet"
          >
            Generate New Questions
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-arrow-left"
            @click="backToProject"
          >
            Back to Project
          </UButton>
        </div>
      </UCard>
    </div>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  usePracticeJobsStore,
  type PracticeQuestion,
} from "~/stores/practiceJobs";
import { useProjectStore } from "~/stores/projects";

definePageMeta({ layout: "newdash" });

type EvaluateResultItem = {
  questionId: string;
  questionType: string;
  difficulty: string | null;
  userAnswer: string;
  correct: boolean;
  score: number;
  feedback: string;
};

type EvaluateResponse = {
  projectId: string;
  libraryItemId: string | null;
  totalQuestions: number;
  correctCount: number;
  averageScore: number;
  results: EvaluateResultItem[];
  progress?: {
    progressLevel: number;
  };
};

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { $api } = useNuxtApp();
const practiceJobs = usePracticeJobsStore();
const projectStore = useProjectStore();

const projectId = computed(() => String(route.params.id || ""));
const currentJob = computed(() =>
  projectId.value ? practiceJobs.ensureProjectJob(projectId.value) : null,
);
const questions = computed<PracticeQuestion[]>(
  () => currentJob.value?.questions || [],
);

const currentIndex = ref(0);
const answerInput = ref("");
const answersById = ref<Record<string, string>>({});
const isSubmitting = ref(false);
const evaluationResult = ref<EvaluateResponse | null>(null);

const reviewByQuestionId = computed(() => {
  const mapped = new Map<string, EvaluateResultItem>();
  for (const item of evaluationResult.value?.results || []) {
    mapped.set(item.questionId, item);
  }
  return mapped;
});

const currentQuestion = computed(
  () => questions.value[currentIndex.value] || null,
);
const progressPercent = computed(() =>
  questions.value.length === 0
    ? 0
    : ((currentIndex.value + 1) / questions.value.length) * 100,
);
const answeredCount = computed(
  () =>
    questions.value.filter((q) => Boolean(answersById.value[q.id]?.trim()))
      .length,
);
const canMoveNext = computed(() => Boolean(answerInput.value.trim()));
const canSubmit = computed(
  () =>
    questions.value.length > 0 &&
    answeredCount.value === questions.value.length &&
    Boolean(answerInput.value.trim()),
);

function reviewResult(questionId: string) {
  return reviewByQuestionId.value.get(questionId);
}

function expectedAnswer(question: PracticeQuestion) {
  if (question.answer) return question.answer;
  if (
    Array.isArray(question.correctAnswers) &&
    question.correctAnswers.length
  ) {
    return question.correctAnswers.join(" / ");
  }
  return "See reason below";
}

function backToProject() {
  if (
    projectId.value &&
    questions.value.length > 0 &&
    answeredCount.value === questions.value.length
  ) {
    practiceJobs.clearProjectJob(projectId.value);
  }
  router.push(`/dashboard/projects/${projectId.value}`);
}

function startNewSet() {
  if (!projectId.value) return;
  practiceJobs.clearProjectJob(projectId.value);
  evaluationResult.value = null;
  answersById.value = {};
  currentIndex.value = 0;
  answerInput.value = "";
  backToProject();
}

watch(
  () => currentQuestion.value?.id,
  (id) => {
    if (!id) {
      answerInput.value = "";
      return;
    }
    answerInput.value = answersById.value[id] || "";
  },
  { immediate: true },
);

function saveCurrentAnswer() {
  if (!currentQuestion.value) return;
  answersById.value[currentQuestion.value.id] = answerInput.value.trim();
  toast.add({
    title: "Answer saved",
    color: "success",
  });
}

function goNext() {
  if (!currentQuestion.value) return;
  if (!answerInput.value.trim()) return;

  answersById.value[currentQuestion.value.id] = answerInput.value.trim();
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value += 1;
  }
}

function goPrevious() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
  }
}

async function submitForGrading() {
  if (!projectId.value || !questions.value.length || !currentQuestion.value)
    return;

  answersById.value[currentQuestion.value.id] = answerInput.value.trim();

  const attempts = questions.value.map((question) => ({
    question,
    userAnswer: answersById.value[question.id] || "",
  }));

  if (attempts.some((entry) => !entry.userAnswer.trim())) {
    toast.add({
      title: "Incomplete answers",
      description: "Please answer all questions before grading.",
      color: "warning",
    });
    return;
  }

  try {
    isSubmitting.value = true;

    const response = await $api.mutate<EvaluateResponse>(
      `/api/projects/${projectId.value}/adaptive/questions/evaluate`,
      {
        method: "POST",
        body: {
          projectId: projectId.value,
          libraryItemId:
            currentJob.value?.sourceMode === "single"
              ? currentJob.value?.libraryItemId
              : null,
          attempts,
        },
      },
    );

    evaluationResult.value = response;

    if (response.progress?.progressLevel !== undefined) {
      await projectStore.fetchProject(projectId.value);
    }

    toast.add({
      title: "Grading completed",
      description: `Average score: ${response.averageScore}`,
      color: "success",
    });
  } catch (error: any) {
    toast.add({
      title: "Grading failed",
      description: error?.message || "Could not grade your answers.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}
</script>
