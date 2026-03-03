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
          :class="projectWithMetadata?.colorClass"
        >
          <UIcon
            :name="
              projectService.getIconName(
                projectWithMetadata?.icons as ProjectIcon,
              ) || 'i-lucide-folder'
            "
            class="h-6 w-6 text-white"
          />
        </div>
        <div>
          <h2 class="text-2xl md:text-3xl font-bold text-foreground">
            {{ projectWithMetadata?.title || "Project" }}
          </h2>
          <p
            class="text-xs md:text-base text-muted max-w-md overflow-hidden text-ellipsis whitespace-nowrap"
            :title="
              projectWithMetadata?.description || 'No description provided.'
            "
          >
            {{
              (projectWithMetadata?.description ?? "").length > 100
                ? (projectWithMetadata?.description ?? "").slice(0, 100) + "..."
                : projectWithMetadata?.description || "No description provided."
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
            Due {{ projectWithMetadata?.formattedDueDate || "N/A" }}
          </span>
        </div>
        <div class="flex items-center gap-2 px-4 py-2">
          <UIcon name="i-lucide-target" class="h-4 w-4 text-muted-foreground" />
          <span> {{ projectWithMetadata?.progress ?? 0 }}% complete </span>
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
    <component :is="currentTabComponent()" v-bind="currentTabProps" />
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

var currentTab = ref("overview");
const route = useRoute();
const documentId = route.params.id as string;
const projectStore = useProjectStore();
const projectService = new ProjectService();
const {
  projectWithMetadata,
  projectLibraries,
  ensureLibrariesLoaded,
} = useProjectRelationships(documentId);

try {
  if (!projectStore.getProjectById(documentId)) {
    await projectStore.fetchProject(documentId);
  }
} catch {}

try {
  await ensureLibrariesLoaded();
} catch {}

const icon = computed(
  () => PROJECT_TABS.find((item) => item.value === currentTab.value)?.icon,
);
const materialLibraries = computed(() =>
  projectLibraries.value.filter((item) => item && item.libraryType !== "note"),
);
const noteLibraries = computed(() =>
  projectLibraries.value.filter((item) => item && item.libraryType === "note"),
);

const tabUi = computed(() => {
  const colorClass = projectWithMetadata?.value?.colorClass || "";
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
      };
    case "materials":
      return {
        materials: materialLibraries.value,
      };
    case "notes":
      return {
        notes: noteLibraries.value,
      };
    case "settings":
      return {
        projectName: project?.title,
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

definePageMeta({
  layout: "dashboard",
});
</script>
