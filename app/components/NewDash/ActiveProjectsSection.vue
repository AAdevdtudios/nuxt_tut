<script setup lang="ts">
import { computed } from "vue";
import { navigateTo } from "#app";

type ProjectCard = {
  documentId: string;
  title: string;
  description?: string | null;
  progressLevel?: number | null;
  icon?: string;
  endDate?: string;
};

const props = withDefaults(
  defineProps<{
    projects?: ProjectCard[];
    icon?: string;
    emptyIcon?: string;
  }>(),
  {
    projects: () => [],
    icon: "i-lucide-folder-open",
    emptyIcon: "i-lucide-folder-open",
  },
);

const displayedProjects = computed(() => props.projects.slice(0, 2));
const hasProjects = computed(() => displayedProjects.value.length > 0);

const safeProgress = (value?: number | null) =>
  Math.max(0, Math.min(100, Number(value || 0)));
</script>

<template>
  <div class="space-y-6 lg:col-span-8">
    <div class="flex items-end justify-between gap-3">
      <div>
        <h3 class="text-xl font-bold">Active Projects</h3>
        <p class="ga-muted text-xs">
          Your multi-disciplinary knowledge clusters
        </p>
      </div>
      <UButton
        label="View All"
        trailing-icon="i-lucide-arrow-right"
        variant="link"
        color="neutral"
        @click="navigateTo('/dashboard/project')"
      />
    </div>

    <div v-if="hasProjects" class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <UCard
        v-for="project in displayedProjects"
        :key="project.documentId"
        :ui="{ header: 'border-0', body: 'border-0' }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <UIcon :name="project.icon" class="size-5 text-tertiary" />
            <UBadge :label="project.endDate" class="ga-muted" />
          </div>
        </template>

        <div class="flex min-h-8 flex-col gap-2">
          <h2 class="text-lg font-bold">{{ project.title }}</h2>
          <p
            class="ga-muted line-clamp-2 text-xs font-medium leading-relaxed"
          >
            {{
              project.description ||
              "Project workspace is ready for notes and materials."
            }}
          </p>
        </div>

        <template #footer>
          <div class="ga-subtle grid grid-cols-4 text-[10px] font-bold">
            <div class="col-span-3 flex flex-col gap-2 uppercase">
              <span>Progress</span>
              <UProgress
                :model-value="safeProgress(project.progressLevel)"
                :max="100"
                class="w-full"
              />
            </div>
            <span class="col-span-1 flex items-end justify-end">
              {{ safeProgress(project.progressLevel) }}%
            </span>
          </div>
        </template>
      </UCard>
    </div>

    <UEmpty
      v-else
      title="No active projects yet"
      description="Create a project to start tracking progress."
      :icon="props.icon || props.emptyIcon"
      class="rounded-xl bg-surface-container-lowest py-12"
    />

    <div
      class="flex flex-col items-center gap-6 rounded-3xl border-none bg-tertiary-container/10 p-6 md:flex-row"
    >
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary-container"
      >
        <UIcon name="i-lucide-zap" class="size-5 text-tertiary" />
      </div>
      <div class="flex-1 text-center md:text-left">
        <p
          class="mb-1 text-xs font-bold uppercase tracking-widest text-tertiary"
        >
          Study Insight
        </p>
        <p class="text-sm leading-tight text-on-surface-variant">
          Your retention is higher when you review your most active project in
          morning focus blocks.
        </p>
      </div>
      <UButton
        label="Optimize Calendar"
        class="rounded-full px-6 py-2 text-xs font-bold"
        color="neutral"
      />
    </div>
  </div>
</template>
