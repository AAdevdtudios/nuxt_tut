<template>
  <div class="flex flex-col gap-2 items-center">
    <h3 class="text-lg md:text-2xl text-center font-black text-primary/70">
      Ready to Generate Your AI Timetable?
    </h3>
    <span class="text-xs md:text-sm text-muted text-center">
      Based on your preferences, AI will create an optimized study schedule that
      maximizes your learning potential.
    </span>
    <div class="grid grid-cols-1 md:grid-cols-3 my-2 w-full gap-5">
      <div
        class="text-center items-center flex flex-col border py-3 rounded-2xl border-muted"
        v-for="value in total"
        :key="value.text"
      >
        <h3 class="text-2xl text-primary font-black">{{ value.value }}</h3>
        <span class="text-muted font-bold">{{ value.text }}</span>
      </div>
    </div>
    <UButton class="w-full flex justify-center" size="lg">
      <UIcon name="i-lucide-zap" />
      <span> Generate Ai Timetable </span>
    </UButton>
  </div>
</template>
<script lang="ts" setup>
var total = [
  {
    text: "Subjects",
    value: 3,
  },
  {
    text: "Hours/Day",
    value: 5,
  },
  {
    text: "Deadlines",
    value: 2,
  },
];
</script>
