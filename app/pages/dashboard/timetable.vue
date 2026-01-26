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
      <UButton label="Add Entry" icon="i-lucide-plus" variant="outline" />
    </template>
    <UEmpty
      icon="i-lucide-file"
      title="No Timetable Entries"
      :ui="{
        description: 'font-medium text-center text-xs text-muted',
      }"
      description="Start by using AI to generate your personalized timetable or add entries manually."
      :actions="[
        {
          icon: 'i-lucide-sparkles',
          label: 'Create new',
          onClick: () => {
            //
          },
        },
        {
          icon: 'i-lucide-refresh-cw',
          label: 'Refresh',
          color: 'neutral',
          variant: 'subtle',
        },
      ]"
    />
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard" });
</script>
