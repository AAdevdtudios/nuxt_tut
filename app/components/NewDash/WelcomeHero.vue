<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "~/stores/auth";

const props = withDefaults(
  defineProps<{
    name?: string;
    clarity?: number;
    moduleName?: string;
    streakDays?: number;
  }>(),
  {
    clarity: 84,
    moduleName: "Quantum Linguistics",
    streakDays: 16,
  },
);

const auth = useAuthStore();

const resolvedName = computed(() => {
  if (props.name) return props.name;
  const value =
    auth.currentUser?.name?.trim() || auth.currentUser?.displayName?.trim();
  return value || "User";
});
</script>

<template>
  <div class="grid grid-cols-1 gap-8 items-end md:grid-cols-12">
    <div class="col-span-8">
      <h2
        class="text-display-lg mb-2 text-4xl font-extrabold tracking-tight text-on-surface"
      >
        Welcome back, {{ resolvedName }}.
      </h2>
      <span
        class="ga-muted mt-1.5 text-[10px] uppercase tracking-[0.18em]"
      >
        Your cognitive clarity is at {{ props.clarity }}% today. Perfect
        conditions for tackling the {{ props.moduleName }} module.
      </span>
    </div>

    <div class="col-span-4 flex flex-col items-end">
      <div
        class="flex items-center gap-3 rounded-xl bg-md3-tertiary/10 px-6 py-4"
      >
        <div class="flex flex-col items-start">
          <span class="text-sm xl:text-base">Content Streak</span>
          <h4 class="ga-muted text-lg font-bold xl:text-2xl">
            {{ props.streakDays }} Days
          </h4>
        </div>
        <UIcon name="i-lucide-flame" class="size-7 xl:size-11 text-red-700" />
      </div>
    </div>
  </div>
</template>
