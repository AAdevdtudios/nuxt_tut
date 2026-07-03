<template>
  <DashboardBodyLayout
    title="Smart Timetable Generator"
    description="Create and manage your personalized study schedule with AI assistance"
  >
    <template #leading-icon>
      <UIcon name="i-lucide-calendar" class="h-8 w-8 text-primary" />
    </template>
    <template #actions>
      <TimetableModal />
      <UButton
        label="Add Entry"
        icon="i-lucide-plus"
        variant="outline"
        disabled
      />
    </template>

    <div v-if="generatedTimetable" class="space-y-6">
      <UCard
        class="overflow-hidden border-default"
        :ui="{
          body: 'p-0',
          header: 'border-b border-default px-6 py-5',
        }"
      >
        <template #header>
          <div
            class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
          >
            <div class="space-y-2">
              <div
                class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
              >
                <UIcon name="i-lucide-sparkles" class="h-3.5 w-3.5" />
                AI Generated Plan
              </div>
              <h3 class="text-xl font-semibold">Study Calendar</h3>
              <p class="max-w-2xl text-sm text-muted-foreground">
                {{ generatedTimetable.notes }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm lg:min-w-[22rem]">
              <div
                v-for="metric in validationMetrics"
                :key="metric.label"
                class="rounded-2xl border border-default bg-muted/30 p-3"
              >
                <p
                  class="text-xs uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {{ metric.label }}
                </p>
                <p class="mt-2 text-xl font-semibold">{{ metric.value }}</p>
              </div>
            </div>
          </div>
        </template>

        <div class="grid gap-6 px-6 py-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-4">
            <div class="rounded-3xl border border-default bg-background p-4">
              <div
                class="mb-4 flex items-center justify-between gap-4 border-b border-default pb-4"
              >
                <div>
                  <p
                    class="text-xs font-medium uppercase tracking-[0.18em] text-primary/80"
                  >
                    Calendar View
                  </p>
                  <h3 class="mt-1 text-lg font-semibold">
                    {{ activeMonthLabel }}
                  </h3>
                </div>
                <div class="flex items-center gap-2">
                  <UButton
                    icon="i-lucide-download"
                    color="primary"
                    variant="soft"
                    size="sm"
                    @click="downloadIcs"
                  >
                    Export .ics
                  </UButton>
                  <UButton
                    icon="i-lucide-calendar-plus"
                    color="neutral"
                    variant="outline"
                    size="sm"
                    :disabled="!selectedDay"
                    @click="openSelectedDayInGoogleCalendar"
                  >
                    Google Calendar
                  </UButton>
                  <UButton
                    icon="i-lucide-chevron-left"
                    color="neutral"
                    variant="outline"
                    :disabled="currentMonthIndex <= 0"
                    @click="goToPreviousMonth"
                  />
                  <div
                    class="rounded-full border border-default bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {{ currentMonthDays.length }} days
                  </div>
                  <UButton
                    icon="i-lucide-chevron-right"
                    color="neutral"
                    variant="outline"
                    :disabled="currentMonthIndex >= availableMonths.length - 1"
                    @click="goToNextMonth"
                  />
                </div>
              </div>

              <div
                class="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
              >
                <div v-for="day in weekdayHeaders" :key="day">{{ day }}</div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="(week, weekIndex) in calendarWeeks"
                  :key="`week-${weekIndex}`"
                  class="grid grid-cols-7 gap-2"
                >
                  <button
                    v-for="cell in week"
                    :key="cell.key"
                    type="button"
                    class="min-h-[110px] rounded-2xl border p-3 text-left transition"
                    :class="getCalendarCellClasses(cell)"
                    :disabled="!cell.day"
                    @click="selectDay(cell.day)"
                  >
                    <template v-if="cell.day">
                      <div class="flex items-start justify-between gap-2">
                        <div>
                          <p
                            class="text-xs uppercase tracking-[0.16em] text-muted-foreground"
                          >
                            {{ cell.day.day }}
                          </p>
                          <p class="mt-1 text-lg font-semibold">
                            {{ dayOfMonth(cell.day.date) }}
                          </p>
                        </div>
                        <span
                          class="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {{ cell.day.blocks.length }}
                        </span>
                      </div>

                      <div class="mt-3 space-y-1.5">
                        <div
                          v-for="preview in cell.day.blocks.slice(0, 2)"
                          :key="`${cell.day.date}-${preview.start}-${preview.end}`"
                          class="truncate rounded-full px-2 py-1 text-[11px] font-medium"
                          :class="getPreviewClasses(preview.type)"
                        >
                          {{ preview.subject || "Break" }}
                        </div>
                        <div
                          v-if="cell.day.blocks.length > 2"
                          class="text-[11px] font-medium text-muted-foreground"
                        >
                          +{{ cell.day.blocks.length - 2 }} more
                        </div>
                      </div>
                    </template>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div
              class="overflow-hidden rounded-3xl border border-default bg-gradient-to-br from-primary/10 via-background to-background"
            >
              <div class="border-b border-default px-5 py-5">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <p
                      class="text-xs font-medium uppercase tracking-[0.18em] text-primary/80"
                    >
                      Selected Day
                    </p>
                    <h3 class="mt-1 text-xl font-semibold">
                      {{ selectedDayLabel }}
                    </h3>
                    <p class="mt-1 text-sm text-muted-foreground">
                      {{ selectedDay?.blocks.length || 0 }} activities planned
                    </p>
                  </div>
                  <div
                    class="rounded-full border border-default bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {{ selectedDay?.date }}
                  </div>
                </div>
              </div>

              <div v-if="selectedDay" class="space-y-4 p-5">
                <div
                  v-for="block in selectedDay.blocks"
                  :key="`${selectedDay.date}-${block.start}-${block.end}-${block.subject || block.type}`"
                  class="grid grid-cols-[82px_1fr] gap-4"
                >
                  <div
                    class="pt-1 text-right text-xs font-semibold tracking-wide text-muted-foreground"
                  >
                    {{ block.start }}
                  </div>

                  <div class="relative pb-4">
                    <div
                      class="absolute bottom-0 left-[0.7rem] top-0 w-px bg-border"
                      :class="{
                        'opacity-0': isLastBlock(selectedDay.blocks, block),
                      }"
                    />
                    <div
                      class="relative rounded-2xl border px-4 py-4 shadow-sm"
                      :class="getBlockClasses(block.type)"
                    >
                      <div
                        class="absolute left-[-0.05rem] top-6 h-3 w-3 rounded-full ring-4 ring-background"
                        :class="getBlockDotClasses(block.type)"
                      />
                      <div class="flex items-start justify-between gap-4">
                        <div>
                          <p class="text-base font-semibold">
                            {{ block.subject || "Break" }}
                          </p>
                          <p
                            class="mt-1 text-xs font-medium uppercase tracking-[0.16em]"
                            :class="getBlockLabelClasses(block.type)"
                          >
                            {{ block.type }}
                          </p>
                          <p class="mt-3 text-sm text-muted-foreground">
                            {{
                              block.subject
                                ? "Focus on this subject during the time block shown."
                                : "Use this slot to rest and reset before the next study session."
                            }}
                          </p>
                        </div>
                        <div
                          class="rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                        >
                          {{ block.start }} - {{ block.end }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-3xl border border-default bg-muted/30 p-5">
              <div class="flex items-center gap-2">
                <UIcon
                  name="i-lucide-calendar-range"
                  class="h-4 w-4 text-primary"
                />
                <h3 class="font-semibold">Schedule Snapshot</h3>
              </div>
              <div class="mt-4 space-y-4 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <span class="text-muted-foreground">Date range</span>
                  <span class="font-medium">{{ calendarRangeLabel }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-muted-foreground">Study sessions</span>
                  <span class="font-medium">{{ studyBlockCount }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-muted-foreground">Break sessions</span>
                  <span class="font-medium">{{ breakBlockCount }}</span>
                </div>
                <div class="flex items-center justify-between gap-3">
                  <span class="text-muted-foreground">Subjects covered</span>
                  <span class="font-medium">{{ distinctSubjects.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <UEmpty
      v-else
      icon="i-lucide-file"
      title="No Timetable Entries"
      :ui="{
        description: 'font-medium text-center text-xs text-muted',
      }"
      description="Start by using AI to generate your personalized timetable."
    />
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useTimetableGenerator } from "~/composables/useTimetableGenerator";
import type {
  TimetableBlock,
  TimetableDaySchedule,
} from "~/types/timetable.types";

definePageMeta({ layout: "newdash" });

const { generatedTimetable } = useTimetableGenerator();
const selectedDate = ref<string | null>(null);
const currentMonthKey = ref<string | null>(null);

const weekdayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const validationMetrics = computed(() => {
  if (!generatedTimetable.value) return [];

  return [
    {
      label: "Days validated",
      value: generatedTimetable.value.validation.daysValidated,
    },
    {
      label: "Failed rules",
      value: generatedTimetable.value.validation.failedRules,
    },
    {
      label: "Deviation",
      value: `${generatedTimetable.value.validation.allocationDeviationPercent}%`,
    },
    {
      label: "Repair attempts",
      value: generatedTimetable.value.validation.repairAttempts,
    },
  ];
});

const allBlocks = computed(
  () => generatedTimetable.value?.schedule.flatMap((day) => day.blocks) ?? [],
);

const distinctSubjects = computed(
  () =>
    [
      ...new Set(allBlocks.value.map((block) => block.subject).filter(Boolean)),
    ] as string[],
);

const studyBlockCount = computed(
  () => allBlocks.value.filter((block) => block.type !== "break").length,
);

const breakBlockCount = computed(
  () => allBlocks.value.filter((block) => block.type === "break").length,
);

const scheduleMap = computed(() => {
  const entries = generatedTimetable.value?.schedule ?? [];
  return new Map(entries.map((day) => [day.date, day]));
});

const availableMonths = computed(() => {
  const schedule = generatedTimetable.value?.schedule ?? [];
  const seen = new Map<string, { key: string; label: string }>();

  for (const day of schedule) {
    const key = day.date.slice(0, 7);

    if (!seen.has(key)) {
      seen.set(key, {
        key,
        label: new Date(`${day.date}T00:00:00`).toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
        }),
      });
    }
  }

  return [...seen.values()];
});

const currentMonthIndex = computed(() =>
  availableMonths.value.findIndex(
    (month) => month.key === currentMonthKey.value,
  ),
);

const currentMonthDays = computed(() => {
  const schedule = generatedTimetable.value?.schedule ?? [];
  const monthKey = currentMonthKey.value;

  if (!monthKey) {
    return schedule;
  }

  return schedule.filter((day) => day.date.startsWith(monthKey));
});

const selectedDay = computed(() => {
  if (!selectedDate.value) return generatedTimetable.value?.schedule[0] ?? null;
  return scheduleMap.value.get(selectedDate.value) ?? null;
});

const selectedDayLabel = computed(() =>
  selectedDay.value ? formatFullDay(selectedDay.value.date) : "No day selected",
);

const calendarRangeLabel = computed(() => {
  const schedule = generatedTimetable.value?.schedule ?? [];
  if (schedule.length === 0) return "No schedule";

  const first = schedule[0];
  const last = schedule[schedule.length - 1];
  if (!first || !last) return "No schedule";

  return `${formatDayLabel(first.date)} - ${formatDayLabel(last.date)}`;
});

const activeMonthLabel = computed(() => {
  const active = availableMonths.value[currentMonthIndex.value];
  return active?.label || calendarRangeLabel.value;
});

const calendarWeeks = computed(() => {
  const schedule = currentMonthDays.value;
  if (schedule.length === 0) return [];

  const firstDay = schedule[0];
  if (!firstDay) return [];

  const firstDate = new Date(`${firstDay.date}T00:00:00`);
  const leadingBlanks = (firstDate.getDay() + 6) % 7;

  const cells: Array<{
    key: string;
    day: TimetableDaySchedule | null;
  }> = [];

  for (let index = 0; index < leadingBlanks; index += 1) {
    cells.push({ key: `blank-start-${index}`, day: null });
  }

  for (const day of schedule) {
    cells.push({ key: day.date, day });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `blank-end-${cells.length}`, day: null });
  }

  const weeks = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }

  return weeks;
});

watch(
  () => generatedTimetable.value?.schedule,
  (schedule) => {
    if (!schedule?.length) {
      selectedDate.value = null;
      currentMonthKey.value = null;
      return;
    }

    if (
      !currentMonthKey.value ||
      !availableMonths.value.some(
        (month) => month.key === currentMonthKey.value,
      )
    ) {
      currentMonthKey.value = availableMonths.value[0]?.key ?? null;
    }

    if (!selectedDate.value || !scheduleMap.value.has(selectedDate.value)) {
      selectedDate.value = schedule[0]?.date ?? null;
    }
  },
  { immediate: true },
);

watch(currentMonthKey, (monthKey) => {
  if (!monthKey) return;

  if (!selectedDate.value?.startsWith(monthKey)) {
    selectedDate.value = currentMonthDays.value[0]?.date ?? selectedDate.value;
  }
});

const selectDay = (day: TimetableDaySchedule | null) => {
  if (!day) return;
  selectedDate.value = day.date;
};

const goToPreviousMonth = () => {
  if (currentMonthIndex.value <= 0) return;
  currentMonthKey.value =
    availableMonths.value[currentMonthIndex.value - 1]?.key ?? null;
};

const goToNextMonth = () => {
  if (currentMonthIndex.value >= availableMonths.value.length - 1) return;
  currentMonthKey.value =
    availableMonths.value[currentMonthIndex.value + 1]?.key ?? null;
};

const formatDayLabel = (value?: string) => {
  if (!value) return "N/A";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
};

const formatFullDay = (value?: string) => {
  if (!value) return "N/A";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

const dayOfMonth = (value: string) =>
  new Date(`${value}T00:00:00`).getDate().toString();

const isLastBlock = (blocks: TimetableBlock[], current: TimetableBlock) =>
  blocks[blocks.length - 1] === current;

const isSelectedDay = (day: TimetableDaySchedule | null) =>
  Boolean(day && selectedDate.value === day.date);

const getCalendarCellClasses = (cell: { day: TimetableDaySchedule | null }) => {
  if (!cell.day) {
    return "border-transparent bg-transparent p-0 opacity-0 pointer-events-none";
  }

  return isSelectedDay(cell.day)
    ? "border-primary bg-primary/8 shadow-sm"
    : "border-default bg-muted/20 hover:border-primary/40 hover:bg-primary/5";
};

const getBlockClasses = (type: string) => {
  if (type === "break") {
    return "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/30";
  }

  return "border-primary/20 bg-primary/5 dark:border-primary/30 dark:bg-primary/10";
};

const getBlockDotClasses = (type: string) =>
  type === "break" ? "bg-amber-500" : "bg-primary";

const getBlockLabelClasses = (type: string) =>
  type === "break" ? "text-amber-700 dark:text-amber-300" : "text-primary";

const getPreviewClasses = (type: string) =>
  type === "break"
    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
    : "bg-primary/10 text-primary";

const toIcsDateTime = (date: string, time: string) => {
  const [hours, minutes] = time.split(":").map((part) => Number(part || 0));
  const dateObj = new Date(`${date}T00:00:00`);
  dateObj.setHours(hours ?? 0, minutes ?? 0, 0, 0);

  const pad = (value: number) => String(value).padStart(2, "0");
  const year = dateObj.getFullYear();
  const month = pad(dateObj.getMonth() + 1);
  const day = pad(dateObj.getDate());
  const hour = pad(dateObj.getHours());
  const minute = pad(dateObj.getMinutes());

  return `${year}${month}${day}T${hour}${minute}00`;
};

const escapeIcs = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const buildIcs = () => {
  const blocks =
    generatedTimetable.value?.schedule.flatMap((day) =>
      day.blocks
        .filter((block) => block.type !== "break")
        .map((block) => ({ day, block })),
    ) ?? [];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GapAI//Timetable//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const { day, block } of blocks) {
    const start = toIcsDateTime(day.date, block.start);
    const end = toIcsDateTime(day.date, block.end);
    const summary = escapeIcs(block.subject || "Study Session");
    const description = escapeIcs(
      `Type: ${block.type}\nGenerated by GapAI timetable.`,
    );
    const uid = `${day.date}-${block.start}-${summary}@gapai`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
};

const downloadIcs = () => {
  const ics = buildIcs();
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "gapai-study-timetable.ics";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const openSelectedDayInGoogleCalendar = () => {
  if (!selectedDay.value) return;

  const blocks = selectedDay.value.blocks.filter(
    (block) => block.type !== "break",
  );
  if (!blocks.length) return;

  const first = blocks[0];
  const last = blocks[blocks.length - 1];
  if (!first || !last) return;

  const dates = `${toIcsDateTime(selectedDay.value.date, first.start)}/${toIcsDateTime(
    selectedDay.value.date,
    last.end,
  )}`;
  const details = blocks
    .map(
      (block) =>
        `${block.start}-${block.end} ${block.subject || "Study Session"} (${block.type})`,
    )
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `Study Plan - ${formatFullDay(selectedDay.value.date)}`,
    dates,
    details,
  });

  window.open(
    `https://calendar.google.com/calendar/render?${params.toString()}`,
    "_blank",
    "noopener,noreferrer",
  );
};
</script>
