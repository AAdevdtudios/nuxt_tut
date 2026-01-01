<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
const route = useRoute();

const items = ref<NavigationMenuItem[][]>([
  [
    {
      label: "Dashboard",
      icon: "i-lucide-layout-dashboard",
      to: "/dashboard",
    },
    {
      label: "Library",
      icon: "i-lucide-library-big",
      to: "/dashboard/library",
    },
    {
      label: "AI Chat",
      icon: "i-lucide-bot-message-square",
      to: "/dashboard/ai_chat",
    },
    {
      label: "Projects",
      icon: "i-lucide-folder-kanban",
      defaultOpen: true,
      to: "/dashboard/projects",
      children: [],
    },
    {
      label: "Timetable",
      icon: "i-lucide-calendar",
    },
    {
      label: "Question Generator",
      icon: "i-lucide-circle-help",
      to: "/dashboard/question_generator",
    },
    {
      label: "Explore",
      icon: "i-lucide-telescope",
      to: "/dashboard/explore",
    },
    {
      label: "Settings",
      icon: "i-lucide-settings",
      to: "/dashboard/settings",
    },
  ],
  [
    {
      label: "Feedback",
      icon: "i-lucide-message-circle",
      to: "https://github.com/nuxt-ui-templates/dashboard",
      target: "_blank",
    },
    {
      label: "Help & Support",
      icon: "i-lucide-info",
      to: "https://github.com/nuxt/ui",
      target: "_blank",
    },
  ],
]);

onMounted(async () => {
  const projects = await new Promise<NavigationMenuItem[]>((resolve) =>
    setTimeout(
      () =>
        resolve([
          { label: "Chemistry", icon: "i-lucide-microscope" },
          { label: "Mathematics", icon: "i-lucide-calculator" },
          { label: "Physics", icon: "i-lucide-atom" },
          { label: "Biology", icon: "i-lucide-leaf" },
        ]),
      500
    )
  );

  const projectsItem = items.value[0]?.[3];

  if (projectsItem) {
    projectsItem.children = projects;
  }
});
</script>

<template>
  <UDashboardSidebar
    collapsible
    :default-size="22"
    :ui="{
      footer: 'border-t border-default',
      header: 'border-b border-default',
      body: 'px-2 py-4 space-y-4',
    }"
  >
    <template #header="{ collapsed }">
      <div
        v-if="collapsed"
        class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
      >
        <span class="text-sm font-bold text-primary-foreground">AI</span>
      </div>
      <div v-else class="flex items-center gap-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary"
        >
          <span class="text-sm font-bold text-primary-foreground">AI</span>
        </div>
        <span class="text-lg font-semibold text-sidebar-foreground"
          >LearnHub</span
        >
      </div>
    </template>

    <template #default="{ collapsed }">
      <UNavigationMenu
        :collapsed="collapsed"
        :items="items[0]"
        orientation="vertical"
      />

      <UNavigationMenu
        :collapsed="collapsed"
        :items="items[1]"
        orientation="vertical"
        class="mt-auto"
      />
    </template>

    <template #footer="{ collapsed }">
      <UButton
        :avatar="{
          src: 'https://github.com/benjamincanac.png',
        }"
        :label="collapsed ? undefined : 'Benjamin'"
        color="neutral"
        variant="ghost"
        class="w-full"
        :block="collapsed"
      />
    </template>
  </UDashboardSidebar>
</template>
