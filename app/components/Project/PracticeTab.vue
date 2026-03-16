<template>
  <div class="px-2 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold">Project Practice</h2>
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          :loading="isPolling"
          @click="refreshStatus"
        >
          Refresh Status
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-trash-2"
          @click="clearPracticeJob"
        >
          Clear
        </UButton>
      </div>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-sparkles" class="h-5 w-5" />
          Generate Adaptive Questions
        </div>
        <p class="text-sm text-muted-foreground mt-1">
          Generate practice questions from project libraries and track job
          progress.
        </p>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UFormField label="Number of Questions" required>
          <USelect
            v-model="form.numberOfQuestions"
            :items="numberOptions"
            placeholder="Select Number of Questions"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Source Mode" required>
          <USelect
            v-model="form.sourceMode"
            :items="sourceModeOptions"
            placeholder="Select Source Mode"
            class="w-full"
          />
        </UFormField>
      </div>

      <UFormField
        v-if="form.sourceMode === 'single'"
        label="Source Material"
        required
        class="mt-4"
      >
        <USelect
          v-model="form.libraryItemId"
          :items="materialOptions"
          placeholder="Select one library item"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Focus Area (Optional)" class="mt-4">
        <UInput
          v-model="form.focusArea"
          placeholder="e.g., Graph algorithms, chapter 3"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Additional Instructions (Optional)" class="mt-4">
        <UTextarea
          v-model="form.additionalInstructions"
          :rows="3"
          placeholder="Tell AI how to shape the practice set..."
          class="w-full"
        />
      </UFormField>

      <div class="mt-4">
        <UButton
          color="primary"
          icon="i-lucide-play"
          :loading="isSubmitting"
          :disabled="
            isSubmitting ||
            isPolling ||
            isGenerationLocked ||
            !projectId ||
            !hasEligibleSource
          "
          @click="startGeneration"
        >
          Generate Practice Questions
        </UButton>
        <p v-if="!hasEligibleSource" class="mt-2 text-xs text-muted-foreground">
          Attach at least one document, note, or link to this project to generate
          practice questions.
        </p>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="font-semibold">Generation Status</div>
          <UBadge :color="statusBadgeColor" variant="soft" class="capitalize">
            {{ currentJob.status }}
          </UBadge>
        </div>
      </template>

      <div class="space-y-4">
        <div>
          <div class="flex items-center justify-between text-sm mb-1">
            <span>Progress</span>
            <span>{{ currentJob.progress }}%</span>
          </div>
          <UProgress :model-value="currentJob.progress" :max="100" />
        </div>

        <p class="text-sm text-muted-foreground">
          {{ currentJob.message || "No active generation yet." }}
        </p>

        <div class="flex items-center gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-loader-circle"
            :loading="isPolling"
            :disabled="!currentJob.jobId"
            @click="refreshStatus"
          >
            Check Progress
          </UButton>
          <UButton
            color="primary"
            variant="outline"
            icon="i-lucide-download"
            :disabled="!currentJob.jobId"
            @click="fetchResult"
          >
            Get Result
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard v-if="currentJob.questions.length">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="font-semibold">
            Generated Questions ({{ currentJob.questions.length }})
          </div>
          <UButton
            color="primary"
            variant="soft"
            icon="i-lucide-arrow-right"
            :disabled="!projectId"
            @click="openPracticeSession"
          >
            Open Practice Session
          </UButton>
        </div>
      </template>

      <div class="space-y-3">
        <div
          v-for="question in previewQuestions"
          :key="question.id"
          class="rounded-lg border border-default p-3"
        >
          <p class="font-medium">{{ question.question }}</p>
          <p class="text-xs text-muted-foreground mt-1 capitalize">
            {{ question.type }}
            <span v-if="question.difficulty"> • {{ question.difficulty }}</span>
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { LibraryItem } from "~/types";
import { usePracticeJobsStore } from "~/stores/practiceJobs";

const props = withDefaults(
  defineProps<{
    projectId?: string;
    materials?: LibraryItem[];
  }>(),
  {
    projectId: "",
    materials: () => [],
  },
);

const { $api } = useNuxtApp();
const router = useRouter();
const toast = useToast();
const practiceJobs = usePracticeJobsStore();

const pollTimer = ref<ReturnType<typeof setInterval> | null>(null);
const isSubmitting = ref(false);
const isPolling = ref(false);

const projectId = computed(() => props.projectId || "");
const emptyJob = {
  projectId: "",
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
} as const;
const currentJob = computed(() => {
  if (!projectId.value) {
    return emptyJob;
  }
  return practiceJobs.ensureProjectJob(projectId.value);
});

const form = ref({
  numberOfQuestions: 10,
  sourceMode: "random" as "random" | "single",
  libraryItemId: null as string | null,
  focusArea: "",
  additionalInstructions: "",
});

const numberOptions = [5, 10, 15, 20, 25, 30].map((count) => ({
  label: `${count} questions`,
  value: count,
}));

const sourceModeOptions = [
  { label: "Random from project materials", value: "random" },
  { label: "Single selected material", value: "single" },
];

const eligiblePracticeSources = computed(() =>
  (props.materials || []).filter((item) => {
    if (!item) return false;
    if (item.libraryType === "note") return true;
    if (item.libraryType === "doc") return true;
    if (item.libraryType === "url") return Boolean(item.url);
    return false;
  }),
);

const materialOptions = computed(() =>
  eligiblePracticeSources.value.map((item) => ({
    label: item.title,
    value: String(item.id || item.documentId),
  })),
);

const previewQuestions = computed(() => currentJob.value.questions.slice(0, 4));
const isGenerationLocked = computed(() =>
  ["pending", "running"].includes(currentJob.value.status),
);
const hasEligibleSource = computed(() => eligiblePracticeSources.value.length > 0);

const statusBadgeColor = computed(() => {
  switch (currentJob.value.status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "running":
      return "warning";
    case "pending":
      return "primary";
    default:
      return "neutral";
  }
});

function stopPolling() {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
  isPolling.value = false;
}

function startPolling() {
  if (!projectId.value || !currentJob.value.jobId) return;

  stopPolling();
  isPolling.value = true;

  pollTimer.value = setInterval(async () => {
    await refreshStatus();
  }, 3000);
}

async function startGeneration() {
  if (!projectId.value) return;
  if (isGenerationLocked.value) return;
  if (!hasEligibleSource.value) {
    toast.add({
      title: "No valid source",
      description: "Attach at least one document, note, or link before generating.",
      color: "warning",
    });
    return;
  }

  if (form.value.sourceMode === "single" && !form.value.libraryItemId) {
    toast.add({
      title: "Source material required",
      description: "Select one material when using single source mode.",
      color: "warning",
    });
    return;
  }

  try {
    isSubmitting.value = true;

    const payload = {
      projectId: projectId.value,
      numberOfQuestions: Number(form.value.numberOfQuestions),
      focusArea: form.value.focusArea || null,
      additionalInstructions: form.value.additionalInstructions || null,
      sourceMode: form.value.sourceMode,
      libraryItemId:
        form.value.sourceMode === "single" ? form.value.libraryItemId : null,
    };

    const response = await $api.mutate<any>(
      `/api/projects/${projectId.value}/adaptive/questions`,
      {
        method: "POST",
        body: payload,
      },
    );

    const jobId = String(response?.jobId || "");
    if (!jobId) {
      throw new Error("No job ID returned");
    }

    practiceJobs.setJobRequested(projectId.value, {
      jobId,
      status: response?.status || "pending",
      sourceMode: payload.sourceMode,
      libraryItemId: payload.libraryItemId,
      numberOfQuestions: payload.numberOfQuestions,
      focusArea: form.value.focusArea,
      additionalInstructions: form.value.additionalInstructions,
    });

    toast.add({
      title: "Generation started",
      description: "Question generation job has been queued.",
      color: "success",
    });

    startPolling();
  } catch (error: any) {
    practiceJobs.setJobStatus(projectId.value, {
      status: "failed",
      message: error?.message || "Failed to start question generation.",
    });
    toast.add({
      title: "Generation failed",
      description: error?.message || "Could not start generation job.",
      color: "error",
    });
  } finally {
    isSubmitting.value = false;
  }
}

async function refreshStatus() {
  if (!projectId.value || !currentJob.value.jobId) return;

  try {
    isPolling.value = true;
    const response = await $api.fetch<any>(
      `/api/projects/${projectId.value}/adaptive/questions/status/${currentJob.value.jobId}`,
      { method: "GET" },
    );

    const status = String(response?.status || "running").toLowerCase();
    const normalizedStatus =
      status === "completed" || status === "failed" || status === "pending"
        ? status
        : "running";

    practiceJobs.setJobStatus(projectId.value, {
      status: normalizedStatus,
      progress: Number(response?.progress ?? currentJob.value.progress),
      message: response?.message || currentJob.value.message,
    });

    if (normalizedStatus === "completed") {
      stopPolling();
      await fetchResult(true);
    } else if (normalizedStatus === "failed") {
      stopPolling();
      toast.add({
        title: "Generation failed",
        description: response?.message || "Question job failed.",
        color: "error",
      });
    }
  } catch (error: any) {
    stopPolling();
    practiceJobs.setJobStatus(projectId.value, {
      status: "failed",
      message: error?.message || "Failed to check generation status.",
    });
    toast.add({
      title: "Status check failed",
      description: error?.message || "Could not refresh job status.",
      color: "error",
    });
  }
}

async function fetchResult(silent = false) {
  if (!projectId.value || !currentJob.value.jobId) return;

  try {
    const response = await $api.fetch<any>(
      `/api/projects/${projectId.value}/adaptive/questions/result/${currentJob.value.jobId}`,
      { method: "GET" },
    );

    const questions = Array.isArray(response?.questions)
      ? response.questions
      : [];
    if (questions.length === 0) {
      if (!silent) {
        toast.add({
          title: "Result not ready",
          description: "Questions are still being generated.",
          color: "warning",
        });
      }
      return;
    }

    practiceJobs.setJobQuestions(
      projectId.value,
      questions,
      response?.message || "Questions generated successfully.",
    );

    if (!silent) {
      toast.add({
        title: "Questions ready",
        description: `Generated ${questions.length} practice questions.`,
        color: "success",
      });
    } else {
      toast.add({
        title: "Questions ready",
        description: `Generated ${questions.length} practice questions.`,
        color: "success",
      });
    }
  } catch (error: any) {
    if (!silent) {
      toast.add({
        title: "Result fetch failed",
        description: error?.message || "Could not fetch generated questions.",
        color: "error",
      });
    }
  }
}

function clearPracticeJob() {
  if (!projectId.value) return;
  stopPolling();
  practiceJobs.clearProjectJob(projectId.value);
}

async function openPracticeSession() {
  if (!projectId.value) return;
  const target = `/dashboard/projects/${projectId.value}/practice`;
  const resolved = router.resolve(target);

  if (!resolved?.matched?.length) {
    toast.add({
      title: "Route not found",
      description:
        "Practice session page route is not registered yet. Restart dev server.",
      color: "error",
    });
    return;
  }

  await navigateTo(target);
}

onMounted(() => {
  if (
    currentJob.value.jobId &&
    ["pending", "running"].includes(currentJob.value.status)
  ) {
    startPolling();
  }
});

watch(
  () => form.value.sourceMode,
  (mode) => {
    if (mode !== "single") {
      form.value.libraryItemId = null;
    }
  },
);

onBeforeUnmount(() => {
  stopPolling();
});
</script>
