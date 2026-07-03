<script setup lang="ts">
import { computed } from "vue";

type ActivityItem = {
  name: string;
  data: string;
  time: string;
};

const props = withDefaults(
  defineProps<{
    activities?: ActivityItem[];
  }>(),
  {
    activities: () => [],
  },
);

const weekdayToken = (date: Date) =>
  ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][date.getDay()] || "—";

const dayOfMonth = (date: Date) => date.getDate().toString().padStart(2, "0");

const displayedActivities = computed(() => props.activities.slice(0, 3));
const hasActivities = computed(() => displayedActivities.value.length > 0);

const formattedActivities = computed(() =>
  displayedActivities.value.map((activity) => {
    const parsed = new Date(activity.time);
    const valid = !Number.isNaN(parsed.getTime());
    const isRecent =
      valid && Date.now() - parsed.getTime() <= 24 * 60 * 60 * 1000;

    return {
      ...activity,
      day: valid ? weekdayToken(parsed) : "—",
      date: valid ? dayOfMonth(parsed) : "--",
      isRecent,
    };
  }),
);
</script>

<template>
  <aside class="h-fit rounded-xl bg-surface-container-low lg:col-span-4">
    <h3 class="mb-8 text-xl font-bold">Recent Activity</h3>

    <div v-if="hasActivities" class="space-y-8">
      <div
        v-for="activity in formattedActivities"
        :key="`${activity.name}-${activity.time}`"
        class="group flex cursor-pointer items-start gap-4"
      >
        <div class="flex flex-col items-center">
          <span
            class="text-xs font-bold"
            :class="activity.isRecent ? 'text-primary' : 'ga-subtle'"
            >{{ activity.day }}</span
          >
          <span class="text-xl font-black text-on-surface">{{
            activity.date
          }}</span>
        </div>

        <div class="pt-1">
          <h5
            class="text-sm font-bold text-on-surface transition-colors group-hover:text-primary"
          >
            {{ activity.name }}
          </h5>
          <p class="ga-muted mt-1 text-xs">
            {{ activity.data || "Activity update logged." }}
          </p>
          <div v-if="activity.isRecent" class="mt-2 flex gap-2">
            <span
              class="rounded bg-secondary-container px-2 py-0.5 text-[8px] font-bold uppercase text-on-secondary"
              >New</span
            >
          </div>
        </div>
      </div>
    </div>
    <UEmpty
      v-else
      icon="i-lucide-history"
      title="No recent activity"
      description="Recent actions will show up here once you start working."
      class="rounded-xl bg-surface-container-lowest py-10"
    />
  </aside>
</template>
