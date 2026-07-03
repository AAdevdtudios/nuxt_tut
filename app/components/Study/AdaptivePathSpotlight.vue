<script setup lang="ts">
type SelectOption = {
  label: string;
  value: string;
};

type StudyPath = {
  key: string;
  topic?: string;
  title?: string;
  description?: string;
  currentScore?: number;
  status: string;
  completedStageCount?: number;
  totalStageCount?: number;
  totalAttemptCount?: number;
};

type StudySubPath = {
  key: string;
  title?: string;
  description?: string | null;
  status: string;
  isActive?: boolean;
  type?: string;
  attemptCount?: number | null;
  latestScore?: number | null;
  bestScore?: number | null;
  lastAttemptAtUtc?: string | null;
};

const props = defineProps<{
  status: string;
  activePath: StudyPath | null;
  branches: StudySubPath[];
  pathPosition: number;
  pathCount: number;
  recommendationTitle?: string | null;
  recommendationReason?: string | null;
  studyLevelOptions: SelectOption[];
  questionStyleOptions: SelectOption[];
  isSavingPreferences: boolean;
  preferenceNotice?: string;
  diagnosticButtonLabel: string;
  diagnosticJobId?: string | null;
  isPreparingDiagnostic: boolean;
  diagnosticStatusMessage?: string;
  diagnosticError?: string;
  diagnosticProgress: number;
  isPreparing: boolean;
  isStartingPractice: boolean;
}>();

const emit = defineEmits<{
  openDiagnostic: [];
  prepare: [];
  startPractice: [];
}>();

const studyLevel = defineModel<string>("studyLevel", { required: true });
const questionStyle = defineModel<string>("questionStyle", { required: true });

const isSettingsOpen = ref(false);
function closeSettings() {
  isSettingsOpen.value = false;
}
const studyLevelLabel = computed(
  () => props.studyLevelOptions.find((o) => o.value === studyLevel.value)?.label || studyLevel.value || "Auto",
);
const questionStyleLabel = computed(
  () => props.questionStyleOptions.find((o) => o.value === questionStyle.value)?.label || questionStyle.value || "Adaptive",
);

const isDiagnosticReady = computed(() => props.status === "diagnostic_ready");
const isComplete = computed(() => props.status === "completed" || (!isDiagnosticReady.value && !props.activePath));
const completedStageCount = computed(() => {
  if (props.activePath?.completedStageCount !== undefined) {
    return Number(props.activePath.completedStageCount);
  }
  return props.branches.filter((branch) => branch.status === "completed").length;
});
const totalStageCount = computed(() => {
  if (props.activePath?.totalStageCount !== undefined) {
    return Number(props.activePath.totalStageCount);
  }
  return props.branches.length;
});
const hasPathProgress = computed(() => totalStageCount.value > 0);
const pathProgress = computed(() => {
  if (!hasPathProgress.value) return 0;
  return Math.round((completedStageCount.value / totalStageCount.value) * 100);
});
const stageCountLabel = computed(() => {
  const count = props.branches.length;
  if (count === 1) return "One decisive stage.";
  return `${count || "Your"} decisive stages.`;
});
const headline = computed(() => {
  if (isDiagnosticReady.value) return "Start with one clear diagnostic.";
  if (isComplete.value) return "All selected topics mastered.";
  return `One path. ${stageCountLabel.value}`;
});
const pathName = computed(
  () => props.activePath?.topic || props.activePath?.title || props.recommendationTitle || "Active study path",
);

const supportingCopy = computed(() => {
  const recommendationCopy = String(props.recommendationReason || "").trim();
  if (recommendationCopy) return recommendationCopy;
  if (props.activePath?.description) return props.activePath.description;
  if (isDiagnosticReady.value) {
    return "Complete the diagnostic so GapAI can place you at the right starting point.";
  }
  return "GapAI turns your source material into a focused route from first scan to final exam check.";
});

function branchTitle(branch: StudySubPath) {
  if (branch.title) return branch.title;
  if (branch.type === "exam-check") return "Retest";
  return branch.key;
}

function branchIcon(branch: StudySubPath) {
  if (branch.status === "completed") return "i-lucide-check";
  if (branch.isActive) return "i-lucide-arrow-right";
  return "i-lucide-lock";
}
</script>

<template>
  <section class="ga-surface-warm overflow-hidden rounded-[2rem] border px-5 py-7 sm:px-8 sm:py-10 lg:px-10">
    <div class="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-12">
      <div class="flex flex-col lg:py-2">
        <p class="ga-link text-xs font-bold uppercase tracking-[0.22em]">
          Your adaptive study path
        </p>
        <h2 class="ga-heading mt-5 max-w-xl font-serif text-4xl font-semibold leading-[0.98] sm:text-5xl lg:text-6xl">
          {{ headline }}
        </h2>
        <p class="ga-muted mt-6 max-w-xl text-base leading-7 sm:text-lg">
          {{ supportingCopy }}
        </p>

        <div v-if="activePath" class="mt-6 flex flex-wrap items-center gap-2">
          <UBadge color="primary" variant="soft" class="rounded-full">
            Path {{ pathPosition }} of {{ pathCount }}
          </UBadge>
          <span class="ga-heading text-sm font-semibold">{{ pathName }}</span>
        </div>

        <div v-if="isDiagnosticReady || !isComplete" class="ga-surface mt-8 rounded-2xl border p-4 sm:p-5">
          <div class="flex items-center justify-between gap-4 text-sm font-semibold">
            <span class="ga-heading">{{ isDiagnosticReady ? "Diagnostic setup" : "Path progress" }}</span>
            <div class="flex items-center gap-2">
              <span v-if="!isDiagnosticReady && hasPathProgress" class="ga-heading">
                {{ completedStageCount }} of {{ totalStageCount }} complete
              </span>
              <span v-else-if="!isDiagnosticReady" class="ga-subtle">
                Progress pending
              </span>
              <UModal v-if="!isDiagnosticReady" v-model:open="isSettingsOpen">
                <UButton
                  icon="i-lucide-settings"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="rounded-full"
                  aria-label="Session settings"
                />
                <template #content>
                  <div class="p-6">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <h3 class="ga-heading font-serif text-xl font-semibold">Session settings</h3>
                        <p class="ga-muted mt-1 text-sm leading-6">
                          Configure how GapAI generates questions for this session.
                        </p>
                      </div>
                      <UButton
                        icon="i-lucide-x"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        class="rounded-full"
                        aria-label="Close settings"
                        @click="closeSettings"
                      />
                    </div>
                    <div class="mt-5 grid gap-4">
                      <UFormField label="Study level">
                        <USelect v-model="studyLevel" :items="studyLevelOptions" class="w-full" />
                      </UFormField>
                      <UFormField label="Question style">
                        <USelect v-model="questionStyle" :items="questionStyleOptions" class="w-full" />
                      </UFormField>
                    </div>
                    <p class="ga-subtle mt-3 text-xs leading-5">
                      <span v-if="isSavingPreferences">Saving exam setup...</span>
                      <span v-else-if="preferenceNotice">{{ preferenceNotice }}</span>
                      <span v-else>Changes apply to future generated questions.</span>
                    </p>
                    <UButton
                      label="Done"
                      color="primary"
                      class="mt-5 w-full justify-center rounded-xl"
                      @click="closeSettings"
                    />
                  </div>
                </template>
              </UModal>
            </div>
          </div>
          <UProgress
            v-if="!isDiagnosticReady && hasPathProgress"
            :model-value="pathProgress"
            color="primary"
            class="mt-3"
          />

          <div v-if="!isDiagnosticReady" class="mt-4 grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <p class="ga-subtle font-semibold uppercase tracking-wide">Study level</p>
              <p class="ga-heading mt-0.5 text-sm font-medium">{{ studyLevelLabel }}</p>
            </div>
            <div>
              <p class="ga-subtle font-semibold uppercase tracking-wide">Question style</p>
              <p class="ga-heading mt-0.5 text-sm font-medium">{{ questionStyleLabel }}</p>
            </div>
          </div>
          <p v-if="!isDiagnosticReady" class="ga-subtle mt-3 text-xs leading-5">
            <span v-if="isSavingPreferences">Saving exam setup...</span>
            <span v-else-if="preferenceNotice">{{ preferenceNotice }}</span>
            <span v-else>Changes apply to future generated questions.</span>
          </p>

          <div v-if="isDiagnosticReady" class="mt-5 grid gap-3 sm:grid-cols-2">
            <UFormField label="Study level">
              <USelect v-model="studyLevel" :items="studyLevelOptions" class="w-full" />
            </UFormField>
            <UFormField label="Question style">
              <USelect v-model="questionStyle" :items="questionStyleOptions" class="w-full" />
            </UFormField>
          </div>
          <p v-if="isDiagnosticReady" class="ga-subtle mt-3 text-xs leading-5">
            <span v-if="isSavingPreferences">Saving exam setup...</span>
            <span v-else-if="preferenceNotice">{{ preferenceNotice }}</span>
            <span v-else>Changes apply to future generated questions.</span>
          </p>

          <div v-if="isDiagnosticReady" class="mt-5">
            <UButton
              :label="diagnosticButtonLabel"
              icon="i-lucide-clipboard-check"
              color="primary"
              class="w-full justify-center rounded-xl"
              :loading="isPreparingDiagnostic"
              :disabled="!diagnosticJobId || isPreparingDiagnostic"
              @click="emit('openDiagnostic')"
            />
            <div
              v-if="diagnosticError"
              class="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4"
            >
              <div class="flex gap-3">
                <UIcon name="i-lucide-triangle-alert" class="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
                <div>
                  <p class="ga-heading text-sm font-semibold">
                    GapAI could not create a clean question set from this section yet.
                  </p>
                  <p class="ga-muted mt-1 text-xs leading-5">
                    {{ diagnosticError }}
                  </p>
                </div>
              </div>
              <div class="mt-4 grid gap-2 sm:grid-cols-2">
                <UButton
                  label="Retry"
                  icon="i-lucide-refresh-cw"
                  color="primary"
                  size="sm"
                  class="justify-center rounded-xl"
                  :loading="isPreparingDiagnostic"
                  @click="emit('openDiagnostic')"
                />
                <UButton
                  label="Try easier questions"
                  icon="i-lucide-arrow-down-circle"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  class="justify-center rounded-xl"
                  @click="emit('openDiagnostic')"
                />
                <UButton
                  label="Change study level"
                  icon="i-lucide-sliders-horizontal"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  class="justify-center rounded-xl"
                />
                <UButton
                  label="Upload clearer material"
                  icon="i-lucide-file-up"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  to="/dashboard"
                  class="justify-center rounded-xl"
                />
              </div>
            </div>
            <div v-else-if="diagnosticStatusMessage" class="mt-3">
              <div class="flex items-center justify-between gap-3">
                <p class="ga-muted text-xs leading-5">{{ diagnosticStatusMessage }}</p>
                <span v-if="diagnosticProgress" class="ga-subtle text-xs font-semibold">
                  {{ diagnosticProgress }}%
                </span>
              </div>
              <UProgress
                v-if="diagnosticProgress"
                :model-value="diagnosticProgress"
                color="primary"
                class="mt-2"
              />
            </div>
          </div>

        </div>
      </div>

      <div class="space-y-4">
        <article
          v-if="isDiagnosticReady"
          class="ga-surface flex min-h-44 items-center gap-4 rounded-[1.75rem] border p-5 sm:p-7"
        >
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--ga-primary)] text-white">
            <UIcon name="i-lucide-clipboard-check" class="h-6 w-6" />
          </div>
          <div>
            <UBadge color="primary" variant="soft" class="rounded-full">Ready</UBadge>
            <h3 class="ga-heading mt-3 font-serif text-2xl font-semibold sm:text-3xl">
              Diagnostic test
            </h3>
            <p class="ga-muted mt-1 text-sm leading-6">
              Answer from memory. GapAI will use the result to reveal your first path.
            </p>
          </div>
        </article>

        <template v-else-if="branches.length">
          <article
            v-for="branch in branches"
            :key="branch.key"
            :class="[
              'ga-surface group rounded-[1.75rem] border p-5 transition sm:p-7',
              branch.isActive
                ? 'border-[var(--ga-warm)] bg-[var(--ga-warm-soft)] shadow-[0_22px_50px_-38px_rgba(151,87,37,0.8)] ring-1 ring-[var(--ga-warm)]'
                : branch.status === 'locked'
                  ? 'opacity-60'
                  : '',
            ]"
          >
            <div class="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div
                :class="[
                  'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                  branch.status === 'completed'
                    ? 'bg-[var(--ga-primary)] text-white'
                    : branch.isActive
                      ? 'bg-[var(--ga-warm)] text-white'
                      : 'bg-[var(--ga-surface-soft)] text-[var(--ga-text-muted)]',
                ]"
              >
                <UIcon :name="branchIcon(branch)" class="h-6 w-6" />
              </div>

              <div class="min-w-0 flex-1">
                <h3 class="ga-heading font-serif text-2xl font-semibold sm:text-3xl">
                  {{ branchTitle(branch) }}
                </h3>
                <p class="ga-muted mt-1 text-sm font-medium leading-6">
                  {{ branch.description || "Complete this stage to continue your path." }}
                </p>
                <UBadge
                  v-if="branch.type"
                  color="neutral"
                  variant="soft"
                  class="mt-3 rounded-full uppercase tracking-wide"
                >
                  {{ branch.type.replace(/-/g, " ") }}
                </UBadge>
              </div>

              <div class="flex shrink-0 items-center gap-4 sm:min-w-40 sm:border-l sm:border-[var(--ga-border)] sm:pl-6">
                <div>
                  <UBadge
                    :color="branch.isActive ? 'primary' : branch.status === 'completed' ? 'success' : 'neutral'"
                    variant="soft"
                    class="rounded-full uppercase tracking-wide"
                  >
                    {{ branch.isActive ? "Active" : branch.status }}
                  </UBadge>
                  <p v-if="branch.latestScore != null" class="ga-heading mt-2 font-serif text-3xl font-semibold">
                    {{ Math.round(branch.latestScore) }}%
                  </p>
                  <p v-if="branch.bestScore != null" class="ga-subtle mt-1 text-xs font-semibold">
                    Best: {{ Math.round(branch.bestScore) }}%
                  </p>
                </div>
              </div>
            </div>
          </article>
        </template>

        <article
          v-if="isComplete"
          class="ga-surface flex min-h-44 items-center gap-4 rounded-[1.75rem] border p-5 sm:p-7"
        >
          <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--ga-primary)] text-white">
            <UIcon name="i-lucide-trophy" class="h-6 w-6" />
          </div>
          <div>
            <UBadge color="success" variant="soft" class="rounded-full">Complete</UBadge>
            <h3 class="ga-heading mt-3 font-serif text-3xl font-semibold">Study stream complete</h3>
            <p class="ga-muted mt-1 text-sm leading-6">You mastered all selected topics. Upload new material to keep going.</p>
          </div>
        </article>

        <div
          v-if="activePath && !isDiagnosticReady"
          class="ga-surface rounded-[1.75rem] border p-5 sm:p-6"
        >
          <div class="grid gap-2 sm:grid-cols-2">
            <UButton
              label="Review topic"
              icon="i-lucide-panels-top-left"
              color="neutral"
              variant="outline"
              class="justify-center rounded-xl"
              :loading="isPreparing"
              @click="emit('prepare')"
            />
            <UButton
              label="Start practice"
              icon="i-lucide-play"
              color="primary"
              class="justify-center rounded-xl"
              :loading="isStartingPractice"
              @click="emit('startPractice')"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
