<script setup lang="ts">
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

type AdaptiveProgressReport = {
  current?: {
    contributingSignalsCount?: number;
  };
  attemptsInLast30Days?: number;
  averageScoreInLast30Days?: number;
  correctAnswersInLast30Days?: number;
  totalAnswersInLast30Days?: number;
};

const props = withDefaults(
  defineProps<{
    project?: ProjectOverviewData | null;
    materials?: LibraryItem[];
    notes?: LibraryItem[];
    recentActivities?: Array<{ name: string; data: string; time: string }>;
    progressReport?: AdaptiveProgressReport | null;
  }>(),
  {
    project: null,
    materials: () => [],
    notes: () => [],
    recentActivities: () => [],
    progressReport: null,
  },
);

const emit = defineEmits<{ openTab: [tab: string] }>();
const progress = computed(() => props.project?.progress ?? 0);
const materialsCount = computed(() => props.project?.librariesCount ?? props.materials.length);
const notesCount = computed(() => props.project?.notesCount ?? props.notes.length);
const readyToPractice = computed(() => materialsCount.value + notesCount.value > 0);
const recentActivityItems = computed(() => props.recentActivities.slice(0, 4));
const hasPracticeSignals = computed(
  () => Number(props.progressReport?.current?.contributingSignalsCount || 0) > 0,
);
const formatActivityTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
</script>

<template>
  <div class="space-y-6">
    <section class="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <div class="ga-surface rounded-2xl border p-6 shadow-sm">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="ga-subtle text-xs font-bold uppercase tracking-[0.18em]">Learning progress</p>
            <h2 class="ga-heading mt-2 font-serif text-3xl font-semibold">{{ progress }}% complete</h2>
            <p class="ga-muted mt-2 max-w-xl text-sm leading-6">
              This project becomes more useful as you attach material, refine notes,
              and practise against your own sources.
            </p>
          </div>
          <span class="rounded-full bg-[var(--ga-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--ga-primary-strong)]">
            {{ project?.status || "Active" }}
          </span>
        </div>
        <div class="mt-6 h-2 overflow-hidden rounded-full bg-[var(--ga-primary-soft)]">
          <div class="h-full rounded-full bg-[var(--ga-primary)] transition-all" :style="{ width: `${progress}%` }" />
        </div>
        <div class="mt-6 grid grid-cols-3 gap-3">
          <div class="ga-surface-soft rounded-xl p-3">
            <p class="ga-heading text-2xl font-semibold">{{ materialsCount }}</p>
            <p class="ga-muted mt-1 text-xs">Materials</p>
          </div>
          <div class="ga-surface-soft rounded-xl p-3">
            <p class="ga-heading text-2xl font-semibold">{{ notesCount }}</p>
            <p class="ga-muted mt-1 text-xs">Notes</p>
          </div>
          <div class="ga-surface-soft rounded-xl p-3">
            <p class="ga-heading text-lg font-semibold">{{ project?.formattedDueDate || "Open" }}</p>
            <p class="ga-muted mt-1 text-xs">Due date</p>
          </div>
        </div>
      </div>

      <div class="ga-surface-accent rounded-2xl border p-6">
        <p class="ga-link text-xs font-bold uppercase tracking-[0.18em]">Recommended next action</p>
        <div class="ga-icon-box-strong mt-5 flex h-11 w-11 items-center justify-center rounded-xl">
          <UIcon :name="readyToPractice ? 'i-lucide-brain-circuit' : 'i-lucide-paperclip'" class="h-5 w-5" />
        </div>
        <h3 class="ga-heading mt-5 font-serif text-2xl font-semibold">
          {{ readyToPractice ? "Test your understanding" : "Add your first source" }}
        </h3>
        <p class="ga-muted mt-2 text-sm leading-6">
          {{ readyToPractice ? "Generate focused questions from this project's notes and materials." : "Attach a note, PDF, or link so GapAI can learn your project context." }}
        </p>
        <UButton
          class="mt-5"
          :label="readyToPractice ? 'Start practice' : 'Add material'"
          trailing-icon="i-lucide-arrow-right"
          @click="emit('openTab', readyToPractice ? 'practice' : 'materials')"
        />
      </div>
    </section>

    <section class="grid gap-5 lg:grid-cols-3">
      <button class="ga-surface ga-hover-card rounded-2xl border p-5 text-left" @click="emit('openTab', 'materials')">
        <UIcon name="i-lucide-library-big" class="ga-icon h-5 w-5" />
        <h3 class="ga-heading mt-6 font-semibold">Materials & notes</h3>
        <p class="ga-muted mt-1 text-sm leading-6">Manage the sources that make your project AI smarter.</p>
      </button>
      <button class="ga-surface ga-hover-card rounded-2xl border p-5 text-left" @click="emit('openTab', 'ai_tutor')">
        <UIcon name="i-lucide-message-circle" class="ga-icon h-5 w-5" />
        <h3 class="ga-heading mt-6 font-semibold">Ask your tutor</h3>
        <p class="ga-muted mt-1 text-sm leading-6">Discuss difficult concepts using this project as context.</p>
      </button>
      <button class="ga-surface ga-hover-card rounded-2xl border p-5 text-left" @click="emit('openTab', 'tools')">
        <UIcon name="i-lucide-scan-search" class="ga-icon h-5 w-5" />
        <h3 class="ga-heading mt-6 font-semibold">Deepen your research</h3>
        <p class="ga-muted mt-1 text-sm leading-6">Generate grounded reports and explore your sources further.</p>
      </button>
    </section>

    <section class="grid gap-5 xl:grid-cols-[0.7fr_1.3fr]">
      <div class="rounded-2xl border border-[var(--ga-border-strong)] bg-[var(--ga-surface-warm-soft)] p-5">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-[var(--ga-warm)]">Weak areas</p>
        <h3 class="ga-heading mt-3 font-serif text-xl font-semibold">
          {{ hasPracticeSignals ? "Practice evidence" : "Build evidence through practice" }}
        </h3>
        <p class="ga-muted mt-2 text-sm leading-6">
          {{
            hasPracticeSignals
              ? `${progressReport?.attemptsInLast30Days || 0} attempts in the last 30 days with an average score of ${Math.round(progressReport?.averageScoreInLast30Days || 0)}%.`
              : "Weak-area insights appear as you answer more project questions. Start a practice set to reveal where to focus."
          }}
        </p>
        <p v-if="hasPracticeSignals" class="ga-subtle mt-3 text-xs">
          {{ progressReport?.correctAnswersInLast30Days || 0 }} of
          {{ progressReport?.totalAnswersInLast30Days || 0 }} answers correct.
        </p>
      </div>
      <div class="ga-surface rounded-2xl border p-5">
        <div class="flex items-center justify-between">
          <div>
            <p class="ga-subtle text-xs font-bold uppercase tracking-[0.18em]">Recent activity</p>
            <h3 class="ga-heading mt-1 font-serif text-2xl font-semibold">What changed recently</h3>
          </div>
        </div>
        <div class="mt-4 space-y-2">
          <div v-for="(activity, index) in recentActivityItems" :key="`${activity.name}-${index}`" class="ga-surface-soft flex items-center gap-3 rounded-xl p-3">
            <UIcon name="i-lucide-sparkles" class="ga-icon h-4 w-4" />
            <div class="min-w-0 flex-1">
              <p class="ga-heading truncate text-sm font-medium">{{ activity.name }}</p>
              <p class="ga-muted truncate text-xs">{{ activity.data }}</p>
            </div>
            <span class="ga-subtle text-xs">{{ formatActivityTime(activity.time) }}</span>
          </div>
          <p v-if="!recentActivityItems.length" class="ga-muted py-6 text-center text-sm">Project activity will appear here as you work.</p>
        </div>
      </div>
    </section>
  </div>
</template>
