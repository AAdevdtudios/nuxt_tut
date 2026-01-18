<template>
  <DashboardBodyLayout
    title="Smart Timetable Generator"
    description="Create and manage your personalized study schedule with AI assistance"
  >
    <template #leading-icon>
      <UIcon name="i-lucide-calendar" class="h-8 w-8 text-primary" />
    </template>
    <template #actions>
      <UButton
        label="Generate New Timetable"
        icon="i-lucide-plus"
        color="primary"
      />
      <UButton label="Add Entry" icon="i-lucide-plus" variant="outline" />
    </template>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
definePageMeta({ layout: "dashboard" });
</script>
