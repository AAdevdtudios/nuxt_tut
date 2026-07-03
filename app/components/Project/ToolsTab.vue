<template>
  <div class="px-2 space-y-6">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-2xl font-semibold">Tools</h2>
        <p class="text-sm text-muted-foreground">
          Generate academically written reports grounded in your project
          materials, optional links, and web research.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          :disabled="!projectId || !activeReportId"
          :loading="isRefreshing"
          @click="refreshReport"
        >
          Refresh
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-trash-2"
          :disabled="!activeReportId"
          @click="clearSavedReport"
        >
          Clear
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-pen-line" class="h-5 w-5" />
            Create report
          </div>
          <p class="mt-1 text-sm text-muted-foreground">
            Give a topic. Optionally add an objective, choose a library item,
            paste supporting URLs, and enable web research.
          </p>
        </template>

        <div class="space-y-4">
          <UFormField label="Topic" required>
            <UInput
              v-model="form.topic"
              placeholder="e.g., Cell respiration report"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Objective">
            <UTextarea
              v-model="form.objective"
              :rows="2"
              placeholder="e.g., Explain the topic clearly for WAEC students."
              class="w-full"
            />
          </UFormField>

          <UFormField label="Use project library (optional)">
            <USelect
              v-model="form.libraryItemId"
              :items="libraryOptions"
              placeholder="None"
              :disabled="!libraryOptions.length"
              class="w-full"
            />
          </UFormField>
          <p v-if="!libraryOptions.length" class="text-xs text-muted-foreground">
            No project materials are attached yet.
          </p>

          <UFormField label="URLs (optional)">
            <UTextarea
              v-model="urlsInput"
              :rows="3"
              placeholder="Paste one URL per line"
              class="w-full"
            />
          </UFormField>

          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div
              class="flex items-center justify-between rounded-lg border border-default p-3"
            >
              <div>
                <p class="text-sm font-medium">Include web research</p>
                <p class="text-xs text-muted-foreground">
                  Uses web sources to strengthen the report when enabled.
                </p>
              </div>
              <USwitch v-model="form.includeWeb" />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              color="primary"
              icon="i-lucide-sparkles"
              :loading="isCreating"
              :disabled="!canCreate"
              @click="createReport"
            >
              Generate report
            </UButton>
            <p v-if="createError" class="text-sm text-red-600">
              {{ createError }}
            </p>
          </div>

          <div
            v-if="currentJob"
            class="space-y-2 rounded-lg border border-default bg-muted/30 p-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium">
                  {{ currentJob.operation === "edit" ? "Updating report" : "Generating report" }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ currentJob.message || "Queued..." }}
                </p>
              </div>
              <UBadge variant="soft" color="neutral">
                {{ currentJob.status }}
              </UBadge>
            </div>
            <UProgress
              v-if="typeof currentJob.progress === 'number'"
              :model-value="currentJob.progress"
              :max="100"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-file-text" class="h-5 w-5" />
                <p class="font-semibold">Report</p>
              </div>
              <p class="mt-1 truncate text-sm text-muted-foreground">
                {{ reportHeader }}
              </p>
            </div>
            <UBadge v-if="report?.status" variant="soft" color="neutral">
              {{ report.status }}
            </UBadge>
          </div>
        </template>

        <div
          v-if="!report && !currentJob"
          class="py-12 text-center text-sm text-muted-foreground"
        >
          Generate a report to see output here.
        </div>

        <div
          v-else-if="!report && currentJob"
          class="space-y-3 py-12 text-center text-sm text-muted-foreground"
        >
          <div class="mx-auto max-w-sm space-y-2">
            <p class="font-medium text-foreground">
              {{
                currentJob.operation === "edit"
                  ? "Applying your edit..."
                  : "Generating your report..."
              }}
            </p>
            <p>{{ currentJob.message || "This usually takes a short while." }}</p>
            <UProgress
              v-if="typeof currentJob.progress === 'number'"
              :model-value="currentJob.progress"
              :max="100"
            />
          </div>
        </div>

        <div v-else class="space-y-4">
          <div
            class="prose prose-sm max-w-none rounded-lg border border-default bg-background/60 p-4"
            v-html="renderedMarkdown"
          />

          <div v-if="reportSources.length" class="space-y-2">
            <p
              class="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Sources
            </p>
            <div class="space-y-1">
              <a
                v-for="(source, index) in reportSources"
                :key="String(source.sourceId || source.url || index)"
                :href="source.url"
                target="_blank"
                rel="noopener noreferrer"
                class="block truncate text-sm text-primary hover:underline"
                :title="source.title || source.url"
              >
                {{ source.title || source.url }}
              </a>
            </div>
          </div>

          <div class="border-t border-default pt-4 space-y-3">
            <UFormField label="Refine / edit (creates a new version)">
              <UTextarea
                v-model="editInstruction"
                :rows="3"
                placeholder="e.g., Add a clearer introduction and include a simple chart if helpful."
                class="w-full"
              />
            </UFormField>
            <div class="flex items-center gap-2">
              <UButton
                color="primary"
                variant="outline"
                icon="i-lucide-wand-2"
                :loading="isEditing"
                :disabled="!canEdit"
                @click="editReport"
              >
                Apply edit
              </UButton>
              <p v-if="editError" class="text-sm text-red-600">
                {{ editError }}
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import type { LibraryItem } from "~/types";
import { renderChatMarkdown } from "~/utils/chatMarkdown";

type ReportSource = {
  sourceId?: string;
  sourceType?: string;
  url?: string;
  title?: string | null;
  snippet?: string | null;
  libraryItemId?: string | null;
};

type ReportPayload = {
  reportId: string;
  version?: number;
  noteId?: string | null;
  title?: string | null;
  status?: string | null;
  markdown: string;
  sources?: ReportSource[];
  charts?: unknown[];
  validation?: unknown;
  createdAtUtc?: string;
  updatedAtUtc?: string;
};

type ReportJobResponse = {
  jobId: string;
  status?: string;
  operation?: "create" | "edit" | string;
};

type ReportJobStatus = ReportJobResponse & {
  progress?: number;
  message?: string | null;
  createdAtUtc?: string | null;
  completedAtUtc?: string | null;
};

type ReportJobResult = ReportJobResponse & {
  message?: string | null;
  report?: ReportPayload | null;
};

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

const projectId = computed(() => props.projectId || "");
const storageKey = computed(() =>
  projectId.value ? `project-report:${projectId.value}` : "project-report",
);

const isCreating = ref(false);
const isEditing = ref(false);
const isRefreshing = ref(false);
const createError = ref<string | null>(null);
const editError = ref<string | null>(null);

const urlsInput = ref("");
const editInstruction = ref("");
const activeReportId = ref<string | null>(null);
const report = ref<ReportPayload | null>(null);
const currentJob = ref<ReportJobStatus | null>(null);
let pollTimer: ReturnType<typeof setTimeout> | null = null;

const form = ref({
  topic: "",
  objective: "",
  libraryItemId: "" as string | "",
  includeWeb: true,
});

const reportSourceItems = computed(() =>
  (props.materials || []).filter((item) => {
    if (!item?.id) return false;
    if (item.libraryType === "doc") return true;
    if (item.libraryType === "note") return true;
    if (item.libraryType === "url") return Boolean(item.url);
    return false;
  }),
);

const libraryOptions = computed(() =>
  reportSourceItems.value.map((item) => ({
    label: `${item.title || "Untitled"} • ${String(item.libraryType || "").toUpperCase()}`,
    value: String(item.id),
  })),
);

const canCreate = computed(() => {
  if (!projectId.value) return false;
  return form.value.topic.trim().length >= 3;
});

const canEdit = computed(() => {
  if (!projectId.value) return false;
  if (!activeReportId.value) return false;
  return editInstruction.value.trim().length >= 5;
});

const renderedMarkdown = computed(() =>
  renderChatMarkdown(report.value?.markdown || ""),
);

const reportSources = computed(() => report.value?.sources || []);

const reportHeader = computed(() => {
  if (!report.value) return "No report generated yet.";
  const title = report.value.title || "Untitled";
  const version =
    typeof report.value.version === "number"
      ? `v${report.value.version}`
      : null;
  return [title, version].filter(Boolean).join(" • ");
});

function parseUrls(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function saveActiveReportId(reportId: string | null) {
  if (!process.client) return;
  try {
    if (!reportId) {
      localStorage.removeItem(storageKey.value);
      return;
    }
    localStorage.setItem(storageKey.value, reportId);
  } catch {}
}

function loadActiveReportId(): string | null {
  if (!process.client) return null;
  try {
    return localStorage.getItem(storageKey.value);
  } catch {
    return null;
  }
}

function stopPolling() {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
}

function normalizeReport(payload: ReportPayload | null | undefined) {
  if (!payload?.reportId) return null;

  return {
    ...payload,
    sources: Array.isArray(payload.sources) ? payload.sources : [],
    charts: Array.isArray(payload.charts) ? payload.charts : [],
  } satisfies ReportPayload;
}

async function fetchReport(reportId: string) {
  const payload = await $api.fetch<ReportPayload>(
    `/api/projects/${projectId.value}/reports/${reportId}`,
    { method: "GET" },
  );
  report.value = normalizeReport(payload);
  activeReportId.value = payload?.reportId || reportId;
  saveActiveReportId(activeReportId.value);
}

async function fetchJobResult(jobId: string, silent = false) {
  const response = await $api.fetch<ReportJobResult>(
    `/api/projects/${projectId.value}/reports/result/${jobId}`,
    { method: "GET" },
  );

  const nextReport = normalizeReport(response?.report);
  if (!nextReport) {
    if (!silent) {
      throw new Error(response?.message || "Report result is not ready yet.");
    }
    return false;
  }

  report.value = nextReport;
  activeReportId.value = nextReport.reportId;
  saveActiveReportId(activeReportId.value);
  currentJob.value = {
    jobId,
    operation: response?.operation || currentJob.value?.operation || "create",
    status: response?.status || "completed",
    progress: 100,
    message: response?.message || "Completed",
  };
  return true;
}

async function refreshJobStatus(jobId: string) {
  const response = await $api.fetch<ReportJobStatus>(
    `/api/projects/${projectId.value}/reports/status/${jobId}`,
    { method: "GET" },
  );

  const rawStatus = String(response?.status || "running").toLowerCase();
  const normalizedStatus =
    rawStatus === "completed" ||
    rawStatus === "failed" ||
    rawStatus === "pending"
      ? rawStatus
      : "running";

  currentJob.value = {
    jobId,
    operation: response?.operation || currentJob.value?.operation || "create",
    status: normalizedStatus,
    progress:
      typeof response?.progress === "number"
        ? response.progress
        : currentJob.value?.progress,
    message: response?.message || currentJob.value?.message || null,
    createdAtUtc: response?.createdAtUtc || null,
    completedAtUtc: response?.completedAtUtc || null,
  };

  if (normalizedStatus === "completed") {
    stopPolling();
    const hasResult = await fetchJobResult(jobId, true);
    if (hasResult) {
      currentJob.value = null;
    }
    return;
  }

  if (normalizedStatus === "failed") {
    stopPolling();
    throw new Error(response?.message || "Report job failed.");
  }

  stopPolling();
  pollTimer = setTimeout(() => {
    void refreshJobStatus(jobId).catch((error: any) => {
      createError.value = error?.message || "Failed to refresh report status.";
      editError.value = error?.message || "Failed to refresh report status.";
    });
  }, 2000);
}

function startPolling(jobId: string) {
  stopPolling();
  pollTimer = setTimeout(() => {
    void refreshJobStatus(jobId).catch((error: any) => {
      createError.value = error?.message || "Failed to refresh report status.";
      editError.value = error?.message || "Failed to refresh report status.";
    });
  }, 1200);
}

async function refreshReport() {
  if (currentJob.value?.jobId) {
    try {
      isRefreshing.value = true;
      await refreshJobStatus(currentJob.value.jobId);
    } finally {
      isRefreshing.value = false;
    }
    return;
  }

  if (!activeReportId.value) return;
  try {
    isRefreshing.value = true;
    await fetchReport(activeReportId.value);
  } finally {
    isRefreshing.value = false;
  }
}

async function createReport() {
  createError.value = null;
  editError.value = null;

  try {
    isCreating.value = true;
    const payload = await $api.mutate<ReportJobResponse>(
      `/api/projects/${projectId.value}/reports`,
      {
        method: "POST",
        body: {
          topic: form.value.topic.trim(),
          objective: form.value.objective.trim() || null,
          libraryItemId: form.value.libraryItemId || null,
          urls: parseUrls(urlsInput.value),
          includeWeb: Boolean(form.value.includeWeb),
        },
      },
    );

    if (!payload?.jobId) {
      throw new Error("No report job ID returned.");
    }

    currentJob.value = {
      jobId: payload.jobId,
      operation: payload.operation || "create",
      status: payload.status || "pending",
      progress: 0,
      message: "Queued for generation",
    };
    report.value = null;
    activeReportId.value = null;
    saveActiveReportId(null);
    editInstruction.value = "";
    startPolling(payload.jobId);
  } catch (error: any) {
    createError.value = error?.message || "Failed to create report.";
  } finally {
    isCreating.value = false;
  }
}

async function editReport() {
  if (!activeReportId.value) return;
  editError.value = null;

  try {
    isEditing.value = true;
    const payload = await $api.mutate<ReportJobResponse>(
      `/api/projects/${projectId.value}/reports/${activeReportId.value}/edit`,
      {
        method: "POST",
        body: {
          instruction: editInstruction.value.trim(),
        },
      },
    );

    if (!payload?.jobId) {
      throw new Error("No report job ID returned.");
    }

    currentJob.value = {
      jobId: payload.jobId,
      operation: payload.operation || "edit",
      status: payload.status || "pending",
      progress: 0,
      message: "Queued for update",
    };
    editInstruction.value = "";
    startPolling(payload.jobId);
  } catch (error: any) {
    editError.value = error?.message || "Failed to edit report.";
  } finally {
    isEditing.value = false;
  }
}

function clearSavedReport() {
  report.value = null;
  activeReportId.value = null;
  editInstruction.value = "";
  urlsInput.value = "";
  form.value.libraryItemId = "";
  createError.value = null;
  editError.value = null;
  currentJob.value = null;
  stopPolling();
  saveActiveReportId(null);
}

onMounted(async () => {
  if (!projectId.value) return;
  const saved = loadActiveReportId();
  if (!saved) return;
  try {
    await fetchReport(saved);
  } catch {
    saveActiveReportId(null);
  }
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>
