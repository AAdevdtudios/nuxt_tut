<template>
  <DashboardBodyLayout title="">
    <div
      class="mb-4 flex flex-col md:flex-row gap-2 items-center md:justify-between"
    >
      <div class="flex items-center gap-2">
        <UButton
          variant="ghost"
          :to="`/dashboard/projects`"
          icon="i-lucide-arrow-left"
        />
        <div
          class="p-1 md:p-3 rounded-lg items-center justify-center flex"
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
          <h2 class="text-2xl md:text-3xl font-bold text-foreground">
            {{ displayProject?.title || "Project" }}
          </h2>
          <p
            class="text-xs md:text-base text-muted max-w-md overflow-hidden text-ellipsis whitespace-nowrap"
            :title="
              displayProject?.description || 'No description provided.'
            "
          >
            {{
              (displayProject?.description ?? "").length > 100
                ? (displayProject?.description ?? "").slice(0, 100) + "..."
                : displayProject?.description || "No description provided."
            }}
          </p>
        </div>
      </div>
      <div class="flex gap-2 mt-2 md:mt-0">
        <div class="flex items-center gap-2 px-4 py-2">
          <UIcon
            name="i-lucide-calendar"
            class="h-4 w-4 text-muted-foreground"
          />
          <span>
            Due {{ displayProject?.formattedDueDate || "N/A" }}
          </span>
        </div>
        <div class="flex items-center gap-2 px-4 py-2">
          <UIcon name="i-lucide-target" class="h-4 w-4 text-muted-foreground" />
          <span> {{ displayProject?.progress ?? 0 }}% complete </span>
        </div>
      </div>
    </div>
    <UTabs
      v-if="!isMobile"
      :model-value="currentTab"
      @update:model-value="getCurrentTab"
      :items="PROJECT_TABS"
      class="mb-3 mt-2"
      :ui="tabUi"
    />
    <USelect
      v-else
      v-model="currentTab"
      default-value="overview"
      variant="soft"
      :icon="icon"
      size="xl"
      :items="PROJECT_TABS"
      class="mb-3 w-full"
    />
    <component
      :is="currentTabComponent()"
      v-bind="currentTabProps"
      @materials-attached="handleMaterialsAttached"
      @notes-attached="handleNotesAttached"
      @project-preview-changed="handleProjectPreviewChanged"
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

var currentTab = ref("overview");
const { $api } = useNuxtApp();
const route = useRoute();
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
    formattedDateRange: projectService.formatDateRange(merged.start, merged.end),
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
}

const icon = computed(
  () => PROJECT_TABS.find((item) => item.value === currentTab.value)?.icon,
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

await syncProjectData();

watch(
  () => libraryStore.refreshVersion,
  async () => {
    await syncProjectData();
  },
);

const tabUi = computed(() => {
  const colorClass = displayProject?.value?.colorClass || "";
  return {
    indicator: `${colorClass}`,
  };
});

const currentTabProps = computed(() => {
  const project = projectWithMetadata.value;

  switch (currentTab.value) {
    case "overview":
      return {
        project,
        materials: materialLibraries.value,
        notes: noteLibraries.value,
        recentActivities: projectAnalytics.value?.recentActivities ?? [],
      };
    case "materials":
      return {
        materials: materialLibraries.value,
        projectId: documentId,
        attachedLibraryIds: project?.libraryIds ?? [],
      };
    case "notes":
      return {
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
    case "ai_tutor":
      return {
        projectId: documentId,
        projectName: project?.title || "this project",
      };
    default:
      return {};
  }
});

function getCurrentTab(val: string | number) {
  currentTab.value = String(val);
  currentTabComponent();
}
function currentTabComponent() {
  return PROJECT_TABS.find((item) => item.value === currentTab.value)
    ?.component;
}

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
  layout: "dashboard",
});
</script>
