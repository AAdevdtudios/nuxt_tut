<script lang="ts" setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "~/stores/auth";
import { useLibraryStore } from "~/stores/libraries";
import { useProjectStore } from "~/stores/projects";

definePageMeta({
  layout: "dashboard",
});

type DashboardAnalytics = {
  streak: number;
  totalLibraryItems: number;
  totalProjects: number;
  questionsAnswered: number;
  recentActivities: Array<{
    name: string;
    data: string;
    time: string;
  }>;
};

const auth = useAuthStore();
const libraryStore = useLibraryStore();
const projectStore = useProjectStore();
const { $api } = useNuxtApp();
const { allLibraries } = storeToRefs(libraryStore);
const { allProjects } = storeToRefs(projectStore);
const hydratedNow = useState("dashboard-now", () => Date.now());

const analytics = ref<DashboardAnalytics | null>(null);

if (allLibraries.value.length === 0) {
  await libraryStore.fetchLibraries(1, 25);
}

if (allProjects.value.length === 0) {
  await projectStore.fetchProjects(1, 10);
}

try {
  analytics.value = await $api.fetch<DashboardAnalytics>("/api/analytics", {
    method: "GET",
  });
} catch {}

const dashboardTitle = computed(() => {
  const displayName = auth.currentUser?.displayName?.trim();
  return displayName ? `Welcome back, ${displayName}` : "Welcome back";
});

const recentLibraryItems = computed(() =>
  [...(allLibraries.value || [])]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() -
        new Date(a.updatedAt || a.createdAt).getTime(),
    )
    .slice(0, 5),
);

const recentActivities = computed(
  () => (analytics.value?.recentActivities ?? []).slice(0, 4),
);

const activeProjects = computed(() =>
  [...(allProjects.value || [])].sort(
    (a, b) => new Date(a.end).getTime() - new Date(b.end).getTime(),
  ),
);

const totalLibraryItems = computed(
  () => analytics.value?.totalLibraryItems ?? allLibraries.value.length,
);

const totalProjects = computed(
  () => analytics.value?.totalProjects ?? allProjects.value.length,
);

const getLibraryIcon = (type: "url" | "doc" | "note") => {
  if (type === "doc") return "i-lucide-file-text";
  if (type === "url") return "i-lucide-link";
  return "i-lucide-sticky-note";
};

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });

const calculateProjectProgress = (start: string, end: string) => {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const now = hydratedNow.value;

  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
    return 0;
  }

  if (now <= startTime) return 0;
  if (now >= endTime) return 100;

  return Math.max(
    0,
    Math.min(100, Math.round(((now - startTime) / (endTime - startTime)) * 100)),
  );
};
</script>

<template>
  <DashboardBodyLayout
    :title="dashboardTitle"
    description="Here's your learning overview for today"
  >
    <template #actions>
      <AddProjectBtn />
    </template>

    <div class="space-y-10">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Library Items"
          :value="totalLibraryItems"
          icon="i-lucide-book-open"
        />
        <DashboardCard
          title="Active Projects"
          :value="totalProjects"
          icon="i-lucide-briefcase"
        />
        <DashboardCard
          title="Questions Answered"
          :value="analytics?.questionsAnswered ?? 0"
          icon="i-lucide-bot"
        />
        <DashboardCard
          title="Study Streak"
          :value="`${analytics?.streak ?? 0} Days`"
          icon="i-lucide-chart-no-axes-combined"
        />
      </div>

      <div class="grid grid-cols-1 gap-10 lg:grid-cols-3">
        <UCard class="lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between">
              <p class="text-lg font-medium text-muted-foreground">
                Recent Library Items
              </p>
              <ULink to="/dashboard/library" class="text-sm font-medium text-primary">
                View All
              </ULink>
            </div>
          </template>

          <ul v-if="recentLibraryItems.length" class="divide-y divide-default">
            <li
              v-for="item in recentLibraryItems"
              :key="item.documentId"
              class="flex items-center justify-between py-3"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <UIcon
                    :name="getLibraryIcon(item.libraryType)"
                    size="20"
                    class="text-primary"
                  />
                </div>
                <div>
                  <p class="font-medium text-foreground">{{ item.title }}</p>
                  <p class="text-sm text-muted-foreground">
                    Updated {{ formatTimestamp(item.updatedAt || item.createdAt) }}
                  </p>
                </div>
              </div>
            </li>
          </ul>

          <p v-else class="text-sm text-muted-foreground">
            No library items yet.
          </p>
        </UCard>

        <UCard class="lg:col-span-1">
          <template #header>
            <p class="text-lg font-medium text-muted-foreground">
              Recent Activities
            </p>
          </template>

          <ul v-if="recentActivities.length" class="divide-y divide-default">
            <li
              v-for="activity in recentActivities"
              :key="`${activity.name}-${activity.time}-${activity.data}`"
              class="py-3"
            >
              <p class="font-medium text-foreground">{{ activity.name }}</p>
              <p class="text-sm text-muted-foreground">{{ activity.data }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ formatTimestamp(activity.time) }}
              </p>
            </li>
          </ul>

          <p v-else class="text-sm text-muted-foreground">
            No recent activity yet.
          </p>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-lg font-medium text-muted-foreground">
              Active Projects
            </p>
            <ULink to="/dashboard/projects" class="text-sm font-medium text-primary">
              View All
            </ULink>
          </div>
        </template>

        <div v-if="activeProjects.length" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <UCard
            v-for="project in activeProjects"
            :key="project.documentId"
            :ui="{ header: 'border-0' }"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0">
                <p class="truncate font-medium text-foreground">{{ project.title }}</p>
                <p class="text-sm text-muted-foreground">
                  Due {{ formatTimestamp(project.end) }}
                </p>
                <p class="text-sm text-muted-foreground">
                  {{ project.librariesCount }} materials • {{ project.notesCount }} notes
                </p>
              </div>
              <UButton
                size="sm"
                variant="outline"
                :to="`/dashboard/projects/${project.documentId}`"
              >
                View
              </UButton>
            </div>

            <div class="mt-8">
              <UProgress :model-value="calculateProjectProgress(project.start, project.end)" />
              <p class="mt-1 text-sm text-muted-foreground">
                {{ calculateProjectProgress(project.start, project.end) }}% Complete
              </p>
            </div>
          </UCard>
        </div>

        <p v-else class="text-sm text-muted-foreground">
          No active projects yet.
        </p>
      </UCard>
    </div>
  </DashboardBodyLayout>
</template>
