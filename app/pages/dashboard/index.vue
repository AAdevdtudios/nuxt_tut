<template>
  <DashboardBodyLayout
    title="Welcome back, Alex"
    description="Here's your learning overview for today"
  >
    <template #actions>
      <AddProjectBtn />
    </template>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <DashboardCard
        title="Library Items"
        :value="125"
        icon="i-lucide-book-open"
      />
      <DashboardCard
        title="Active Projects"
        :value="8"
        icon="i-lucide-briefcase"
      />
      <DashboardCard title="AI Interactions" :value="8" icon="i-lucide-bot" />
      <DashboardCard
        title="Study Streak"
        :value="'12 Days'"
        icon="i-lucide-chart-no-axes-combined"
      />
    </div>
    <div class="grid grid-cols-3 gap-10 md:grid-cols-1 lg:grid-cols-3">
      <UCard class="col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="text-lg font-medium text-muted-foreground">
              Recent Library Items
            </p>
            <ULink
              to="/dashboard/library"
              class="text-sm font-medium text-primary"
              >View All</ULink
            >
          </div>
        </template>
        <div class="space-y-2">
          <ul class="divide-y divide-default">
            <li
              v-for="item in [1, 2, 3, 4, 5]"
              :key="item"
              class="flex items-center justify-between py-2"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
                >
                  <UIcon
                    name="i-lucide-book-open"
                    size="20"
                    class="text-primary"
                  />
                </div>
                <div>
                  <p class="font-medium text-foreground">Biology 101</p>
                  <p class="text-sm text-muted-foreground">
                    Last accessed: June 20, 2024
                  </p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </UCard>
      <UCard class="col-span-1">
        <template #header>
          <p class="text-lg font-medium text-muted-foreground">
            Upcoming Schedule
          </p>
        </template>
        <div class="space-y-2">
          <ul class="divide-y divide-default">
            <li
              v-for="session in [1, 2, 3]"
              :key="session"
              class="flex items-center justify-between py-2"
            >
              <div>
                <p class="font-medium text-foreground">Chemistry Review</p>
                <p class="text-sm text-muted-foreground">
                  Scheduled: June 22, 2024 at 3:00 PM
                </p>
              </div>
              <UButton size="sm" variant="outline">Join</UButton>
            </li>
          </ul>
        </div>
      </UCard>
    </div>
    <UCard>
      <template #header>
        <p class="text-lg font-medium text-muted-foreground">Active Projects</p>
      </template>
      <div class="space-y-4">
        <ul class="divide-y divide-default">
          <li v-for="project in [1, 2, 3, 4]" :key="project">
            <UCard :ui="{ body: 'p-4 w-full' }">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-foreground">Project Alpha</p>
                  <p class="text-sm text-muted-foreground">
                    Due Date: June 30, 2024
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <UButton size="sm" variant="outline">View</UButton>
                  <UButton size="sm" variant="ghost">Continue</UButton>
                </div>
              </div>
            </UCard>
          </li>
        </ul>
      </div>
    </UCard>
  </DashboardBodyLayout>
</template>

<script lang="ts" setup>
// No additional script logic needed for this simple dashboard page
definePageMeta({
  layout: "dashboard",
});
</script>
