<template>
  <div class="flex flex-col gap-6 px-2">
    <div class="flex flex-col border border-muted/50 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-2">Project Overview</h2>
      <span class="text-sm text-muted flex justify-between w-full">
        Overall Completion
        <span>{{ progress }}%</span>
      </span>
      <UProgress :model-value="progress" :max="100" class="mt-2 mb-6" />
      <div class="grid grid-cols-2 gap-10 md:grid-cols-4">
        <div
          class="flex flex-col items-center border border-muted/50 rounded-lg p-4"
        >
          <span class="text-lg lg:text-2xl font-bold text-foreground">{{
            materialsCount
          }}</span>
          <span class="text-sm text-muted">Materials</span>
        </div>
        <div
          class="flex flex-col items-center border border-muted/50 rounded-lg p-4"
        >
          <span class="text-lg lg:text-2xl font-bold text-foreground">{{
            notesCount
          }}</span>
          <span class="text-sm text-muted">Notes</span>
        </div>
        <div
          class="flex flex-col items-center border border-muted/50 rounded-lg p-4"
        >
          <span class="text-lg lg:text-2xl font-bold text-foreground">{{
            statusLabel
          }}</span>
          <span class="text-sm text-muted">Status</span>
        </div>
        <div
          class="flex flex-col items-center border border-muted/50 rounded-lg p-4"
        >
          <span class="text-lg lg:text-2xl font-bold text-foreground">{{
            dueDateLabel
          }}</span>
          <span class="text-sm text-muted">Due Date</span>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
      <div
        class="px-10 py-5 flex flex-col col-span-1 items-center border border-muted/50 rounded-lg hover:border-primary cursor-pointer"
      >
        <UAvatar icon="i-lucide-play" size="3xl" />
        <h3 class="font-medium text-md md:text-lg">Start Practice</h3>
        <p class="text-xs md:text-sm text-muted text-center mt-2">
          Generate questions from your materials
        </p>
      </div>
      <div
        class="px-10 py-5 flex flex-col col-span-1 items-center border border-muted/50 rounded-lg hover:border-primary cursor-pointer"
      >
        <UAvatar icon="i-lucide-message-circle" size="3xl" />
        <h3 class="font-medium text-md md:text-lg">Ask AI Tutor</h3>
        <p class="text-xs md:text-sm text-muted text-center mt-2">
          Ask follow-up questions using this project context
        </p>
      </div>
      <div
        class="px-10 py-5 flex flex-col col-span-2 md:col-span-1 items-center border border-muted/50 rounded-lg hover:border-primary cursor-pointer"
      >
        <UAvatar icon="i-lucide-notebook" size="3xl" />
        <h3 class="font-medium text-md md:text-lg">Add Notes</h3>
        <p class="text-xs md:text-sm text-muted text-center mt-2">
          Capture ideas and revision notes for this project
        </p>
      </div>
    </div>
    <UAlert
      color="neutral"
      variant="subtle"
      :title="goalTitle"
      :description="goalDescription"
      :avatar="{
        icon: 'i-lucide-target',
      }"
    />
    <div class="flex flex-col border border-muted/50 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
      <div class="space-y-4">
        <template v-if="recentActivityItems.length">
          <div
            v-for="(activity, index) in recentActivityItems"
            :key="`${activity.name}-${activity.time}-${index}`"
            class="flex items-center justify-between gap-4"
          >
            <div class="flex items-center gap-4">
              <UIcon name="i-lucide-file-text" class="h-6 w-6 text-primary" />
              <div>
                <p class="text-foreground">{{ activity.name }}</p>
                <span class="text-sm text-muted">{{ activity.data }}</span>
                <p class="text-xs text-muted mt-1">
                  {{ formatActivityTime(activity.time) }}
                </p>
              </div>
            </div>
            <UButton icon="i-lucide-arrow-right" variant="ghost" size="sm" />
          </div>
        </template>
        <div v-else class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <UIcon name="i-lucide-file-text" class="h-6 w-6 text-primary" />
            <div>
              <p class="text-foreground">{{ activityTitle }}</p>
              <span class="text-sm text-muted">{{ activityDescription }}</span>
            </div>
          </div>
          <UButton icon="i-lucide-arrow-right" variant="ghost" size="sm" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LibraryItem } from "~/types";

type ProjectOverviewData = {
  title: string;
  progress: number;
  status?: string;
  daysRemaining?: number;
  formattedDueDate?: string;
  librariesCount?: number;
  notesCount?: number;
};

const props = withDefaults(
  defineProps<{
    project?: ProjectOverviewData | null;
    materials?: LibraryItem[];
    notes?: LibraryItem[];
    recentActivities?: Array<{
      name: string;
      data: string;
      time: string;
    }>;
  }>(),
  {
    project: null,
    materials: () => [],
    notes: () => [],
    recentActivities: () => [],
  },
);

const progress = computed(() => props.project?.progress ?? 0);
const materialsCount = computed(
  () => props.project?.librariesCount ?? props.materials.length,
);
const notesCount = computed(
  () => props.project?.notesCount ?? props.notes.length,
);
const dueDateLabel = computed(() => props.project?.formattedDueDate ?? "N/A");
const statusLabel = computed(() => {
  const status = props.project?.status;
  if (!status) return "Unknown";

  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
});
const goalTitle = computed(() =>
  props.project?.daysRemaining !== undefined && props.project.daysRemaining >= 0
    ? `${props.project.daysRemaining} days remaining`
    : "Project timeline",
);
const goalDescription = computed(() => {
  if (!props.project) {
    return "Connect project data to see progress insights.";
  }

  if (props.project.daysRemaining !== undefined && props.project.daysRemaining <= 0) {
    return "The due date has passed. Review the project status and next actions.";
  }

  return `You currently have ${materialsCount.value} materials and ${notesCount.value} notes linked to this project.`;
});
const activityTitle = computed(() => {
  if (props.materials.length > 0) {
    return `Latest material: "${props.materials[0]?.title}"`;
  }

  if (props.notes.length > 0) {
    return `Latest note: "${props.notes[0]?.title}"`;
  }

  return "No recent project activity yet";
});
const activityDescription = computed(() => {
  if (props.materials.length > 0 || props.notes.length > 0) {
    return `${props.materials.length} materials and ${props.notes.length} notes currently attached.`;
  }

  return "Add materials or notes to start building project activity.";
});

const recentActivityItems = computed(() =>
  (props.recentActivities || []).slice(0, 4),
);

const formatActivityTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
</script>
