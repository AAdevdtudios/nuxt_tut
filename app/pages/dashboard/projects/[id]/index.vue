<template>
  <DashboardBodyLayout title="">
    <div class="ga-surface-warm mb-6 rounded-[1.75rem] border p-5 sm:p-7">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-2">
        <UButton
          variant="ghost"
          :to="`/dashboard/projects`"
          icon="i-lucide-arrow-left"
        />
        <div
          class="flex items-center justify-center rounded-xl p-2 md:p-3"
          :class="displayProject?.colorClass"
        >
          <UIcon
            :name="
              projectService.getIconName(
                displayProject?.icons as ProjectIcon,
              ) || 'i-lucide-folder'
            "
            class="h-6 w-6 text-white"
          />
        </div>
        <div>
          <p class="ga-subtle mb-1 text-[10px] font-bold uppercase tracking-[0.2em]">Project workspace</p>
          <h2 class="ga-heading font-serif text-3xl font-semibold md:text-4xl">
            {{ displayProject?.title || "Project" }}
          </h2>
          <p
            class="ga-muted max-w-md overflow-hidden text-ellipsis whitespace-nowrap text-xs md:text-sm"
            :title="displayProject?.description || 'No description provided.'"
          >
            {{
              (displayProject?.description ?? "").length > 100
                ? (displayProject?.description ?? "").slice(0, 100) + "..."
                : displayProject?.description || "No description provided."
            }}
          </p>
        </div>
      </div>
      <div class="flex flex-wrap gap-2 md:mt-0">
        <div class="ga-surface ga-muted flex items-center gap-2 rounded-full border px-4 py-2 text-xs">
          <UIcon
            name="i-lucide-calendar"
            class="h-4 w-4 text-muted-foreground"
          />
          <span> Due {{ displayProject?.formattedDueDate || "N/A" }} </span>
        </div>
        <div class="ga-surface ga-muted flex items-center gap-2 rounded-full border px-4 py-2 text-xs">
          <UIcon name="i-lucide-target" class="h-4 w-4 text-muted-foreground" />
          <span> {{ displayProject?.progress ?? 0 }}% complete </span>
        </div>
      </div>
      </div>
    </div>
    <USelect
      v-if="isMobile"
      v-model="currentTab"
      variant="soft"
      :icon="icon"
      size="xl"
      :items="tabItems"
      class="mb-3 w-full"
    />
    <component
      :is="currentTabComponent"
      v-bind="currentTabProps"
      :key="currentTab"
      @materials-attached="handleMaterialsAttached"
      @notes-attached="handleNotesAttached"
      @project-preview-changed="handleProjectPreviewChanged"
      @open-tab="currentTab = $event"
    />
  </DashboardBodyLayout>
</template>
<script setup lang="ts">
import { useIsMobile } from "~/composable/useIsMobile";
import { PROJECT_TABS } from "~/constants/projects.const";
const { isMobile } = useIsMobile();
import { useRoute } from "vue-router";
import { useProjectRelationships } from "~/composables/useProjectRelationships";
import { ProjectService } from "~/services/projectService";
import type { ProjectIcon } from "~/types/project.types";
import { useProjectStore } from "~/stores/projects";
import { useLibraryStore } from "~/stores/libraries";

const { $api } = useNuxtApp();
const route = useRoute();
const currentTab = ref<string>(
  typeof route.query.tab === "string" ? route.query.tab : "overview",
);
const documentId = route.params.id as string;
const projectStore = useProjectStore();
const libraryStore = useLibraryStore();
const projectService = new ProjectService();
const { projectWithMetadata, projectLibraries, ensureLibrariesLoaded } =
  useProjectRelationships(documentId);
const projectPreview = ref<
  Partial<{
    title: string;
    description: string | null;
    icons: ProjectIcon;
    color: string;
    start: string;
    end: string;
  }>
>({});

const displayProject = computed(() => {
  const base = projectWithMetadata.value;
  if (!base) return null;

  const merged = {
    ...base,
    ...projectPreview.value,
  };

  return {
    ...merged,
    formattedDueDate: projectService.formatDate(merged.end),
    formattedDateRange: projectService.formatDateRange(
      merged.start,
      merged.end,
    ),
    colorClass: projectService.getColorClass(merged.color),
  };
});

async function syncProjectData() {
  try {
    await projectStore.fetchProject(documentId);
  } catch {}

  try {
    await ensureLibrariesLoaded();
  } catch {}

  await fetchProjectAnalytics();
  await fetchAdaptiveProgressReport();
}

const icon = computed(
  () => PROJECT_TABS.find((item) => item.value === currentTab.value)?.icon,
);

const tabItems = computed(() =>
  PROJECT_TABS.map((item) => ({
    label: item.label,
    value: item.value,
    icon: item.icon,
  })),
);
const materialLibraries = computed(() =>
  projectLibraries.value.filter((item) => item && item.libraryType !== "note"),
);
const noteLibraries = computed(() =>
  projectLibraries.value.filter((item) => item && item.libraryType === "note"),
);

type ProjectAnalytics = {
  recentActivities?: Array<{
    name: string;
    data: string;
    time: string;
  }>;
};

const projectAnalytics = ref<ProjectAnalytics | null>(null);
type AdaptiveProgressReport = {
  current?: {
    progressLevel?: number;
    progressScore?: number;
    contributingSignalsCount?: number;
  };
  attemptsInLast30Days?: number;
  averageScoreInLast30Days?: number;
  correctAnswersInLast30Days?: number;
  totalAnswersInLast30Days?: number;
};

const adaptiveProgressReport = ref<AdaptiveProgressReport | null>(null);

async function fetchProjectAnalytics() {
  try {
    const analyticsResponse = await $api.fetch<any>(
      `/api/projects/${documentId}/analytics`,
      {
        method: "GET",
      },
    );
    projectAnalytics.value =
      analyticsResponse?.data && typeof analyticsResponse.data === "object"
        ? (analyticsResponse.data as ProjectAnalytics)
        : (analyticsResponse as ProjectAnalytics);
  } catch {
    projectAnalytics.value = null;
  }
}

async function fetchAdaptiveProgressReport() {
  try {
    adaptiveProgressReport.value = await $api.fetch<AdaptiveProgressReport>(
      `/api/projects/${documentId}/adaptive/progress/report`,
      { method: "GET" },
    );
  } catch {
    adaptiveProgressReport.value = null;
  }
}

await syncProjectData();

watch(
  () => libraryStore.refreshVersion,
  async () => {
    await syncProjectData();
  },
);

const currentTabProps = computed<Record<string, any>>(() => {
  const project = projectWithMetadata.value;

  switch (currentTab.value) {
    case "overview":
      return {
        project,
        materials: materialLibraries.value,
        notes: noteLibraries.value,
        recentActivities: projectAnalytics.value?.recentActivities ?? [],
        progressReport: adaptiveProgressReport.value,
      };
    case "materials":
      return {
        materials: materialLibraries.value,
        notes: noteLibraries.value,
        notesCount: project?.notesCount ?? 0,
        projectId: documentId,
        attachedLibraryIds: project?.libraryIds ?? [],
      };
    case "settings":
      return {
        projectId: documentId,
        projectName: project?.title,
        project: projectStore.getProjectById(documentId) || null,
      };
    case "practice":
      return {
        projectId: documentId,
        materials: projectLibraries.value,
      };
    case "tools":
      return {
        projectId: documentId,
        materials: projectLibraries.value,
      };
    case "ai_tutor":
      return {
        projectId: documentId,
        projectName: project?.title || "this project",
      };
    default:
      return {};
  }
});

const currentTabComponent = computed<any>(() => {
  return PROJECT_TABS.find((item) => item.value === currentTab.value)
    ?.component;
});

async function handleMaterialsAttached() {
  await syncProjectData();
}

async function handleNotesAttached() {
  await syncProjectData();
}

function handleProjectPreviewChanged(
  value: Partial<{
    title: string;
    description: string | null;
    icons: ProjectIcon;
    color: string;
    start: string;
    end: string;
  }>,
) {
  projectPreview.value = value || {};
}

definePageMeta({
  layout: "newdash",
});

watch(
  () => route.query.tab,
  (tab) => {
    const nextTab = typeof tab === "string" ? tab : "overview";
    if (
      PROJECT_TABS.some((item) => item.value === nextTab) &&
      currentTab.value !== nextTab
    ) {
      currentTab.value = nextTab;
    }
  },
);

watch(currentTab, async (tab) => {
  const routeTab =
    typeof route.query.tab === "string" ? route.query.tab : "overview";
  if (tab === routeTab) return;

  await navigateTo({
    path: route.path,
    query: {
      ...route.query,
      tab,
    },
  });
});
</script>
