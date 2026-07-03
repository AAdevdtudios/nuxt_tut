<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { computed } from "vue";
import { ProjectService } from "~/services/projectService";
import type { ProjectIcon } from "~/types/project.types";
import { useAuthStore } from "~/stores/auth";
import LogoutBtn from "../Utils/LogoutBtn.vue";
const route = useRoute();
const projectStore = useProjectStore();
const auth = useAuthStore();
const { initialize } = useStoreInitializer();
const projectService = new ProjectService();

const displayName = computed(() => {
  const value =
    auth.currentUser?.name?.trim() || auth.currentUser?.displayName?.trim();
  return value || "Profile";
});

const avatarText = computed(() => {
  const name = displayName.value;
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
});

const projectMenuChildren = computed<NavigationMenuItem[]>(() =>
  projectStore.allProjects.map((project) => ({
    label: project.title,
    icon: projectService.getIconName(project.icons as ProjectIcon),
    to: `/dashboard/projects/${project.documentId}`,
  })),
);

const primaryItems = computed<NavigationMenuItem[]>(() => [
  {
    label: "Home",
    icon: "i-lucide-house",
    to: "/dashboard",
  },
  {
    label: "Notes",
    icon: "i-lucide-notebook-pen",
    to: "/dashboard/notes",
  },
  {
    label: "Projects",
    icon: "i-lucide-folder-kanban",
    defaultOpen: true,
    to: "/dashboard/projects",
    children: projectMenuChildren.value,
  },
  {
    label: "Library",
    icon: "i-lucide-library-big",
    to: "/dashboard/library",
  },
]);

const secondaryItems: NavigationMenuItem[] = [
  {
    label: "Settings",
    icon: "i-lucide-settings",
    to: "/dashboard/settings",
  },
  {
    label: "Help & Support",
    icon: "i-lucide-info",
    to: "/dashboard/help",
  },
];

onMounted(async () => {
  await initialize();
});
</script>

<template>
  <UDashboardSidebar
    collapsible
    :menu="{
      title: 'Dev',
    }"
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
          >GapAI</span
        >
      </div>
    </template>

    <template #default="{ collapsed }">
      <UNavigationMenu
        :collapsed="collapsed"
        :items="primaryItems"
        orientation="vertical"
      />
      <UNavigationMenu
        :collapsed="collapsed"
        :items="secondaryItems"
        orientation="vertical"
        class="mt-auto"
      />
      <LogoutBtn
        :text="collapsed ? undefined : 'Logout'"
        size="md"
        withIcon
        variant="ghost"
      />
    </template>

    <template #footer="{ collapsed }">
      <UButton
        :avatar="{
          text: avatarText,
        }"
        :label="collapsed ? undefined : displayName"
        color="neutral"
        variant="ghost"
        class="w-full"
        :block="collapsed"
        to="/dashboard/settings"
      />
    </template>
  </UDashboardSidebar>
</template>
