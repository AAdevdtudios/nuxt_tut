<template>
  <div class="flex flex-col gap-6 px-2">
    <div class="flex flex-col border border-muted/50 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-2">Project Overview</h2>
      <span class="text-sm text-muted flex justify-between w-full">
        Overall Completion
        <span>{{ progress }}%</span>
      </span>
      <UProgress v-model="progress" :max="100" class="mt-2 mb-6" />
      <div class="grid grid-cols-2 gap-10 md:grid-cols-4">
        <div
          class="flex flex-col items-center border border-muted/50 rounded-lg p-4"
        >
          <span class="text-lg lg:text-2xl font-bold text-foreground">12</span>
          <span class="text-sm text-muted">Materials</span>
        </div>
        <div
          class="flex flex-col items-center border border-muted/50 rounded-lg p-4"
        >
          <span class="text-lg lg:text-2xl font-bold text-foreground">5</span>
          <span class="text-sm text-muted">Notes</span>
        </div>
        <div
          class="flex flex-col items-center border border-muted/50 rounded-lg p-4"
        >
          <span class="text-lg lg:text-2xl font-bold text-foreground">3</span>
          <span class="text-sm text-muted">Weekly Goal</span>
        </div>
        <div
          class="flex flex-col items-center border border-muted/50 rounded-lg p-4"
        >
          <span class="text-lg lg:text-2xl font-bold text-foreground"
            >Aug 30, 2024</span
          >
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
          Generate questions from your materials
        </p>
      </div>
      <div
        class="px-10 py-5 flex flex-col col-span-2 md:col-span-1 items-center border border-muted/50 rounded-lg hover:border-primary cursor-pointer"
      >
        <UAvatar icon="i-lucide-notebook" size="3xl" />
        <h3 class="font-medium text-md md:text-lg">Add Notes</h3>
        <p class="text-xs md:text-sm text-muted text-center mt-2">
          Write down your thoughts
        </p>
      </div>
    </div>
    <UAlert
      color="neutral"
      variant="subtle"
      title="Your Goal"
      description="Score at least 85% in all subjects."
      :avatar="{
        icon: 'i-lucide-target',
      }"
    />
    <div class="flex flex-col border border-muted/50 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <UIcon name="i-lucide-file-text" class="h-6 w-6 text-primary" />
            <div>
              <p class="text-foreground">Added new material: "Project Plan"</p>
              <span class="text-sm text-muted">2 hours ago</span>
            </div>
          </div>
          <UButton icon="i-lucide-arrow-right" variant="ghost" size="sm" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const progress = ref(65);
</script>
