<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import LogoutBtn from "~/components/Utils/LogoutBtn.vue";

const auth = useAuthStore();

const displayName = computed(() => {
  const value = auth.currentUser?.displayName?.trim();
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
</script>

<template>
  <UDashboardNavbar>
    <template #leading>
      <UDashboardSidebarCollapse />
    </template>

    <template #trailing>
      <h1 class="text-xl font-semibold text-card-foreground">Dashboard</h1>
    </template>

    <template #right>
      <UColorModeButton />
      <LogoutBtn withIcon size="md" />
      <ULink
        to="/dashboard/settings"
        class="flex items-center gap-3 rounded-full px-1 py-1 text-sm text-card-foreground transition-colors hover:bg-muted"
      >
        <UAvatar :text="avatarText" size="md" :alt="displayName" />
        <span class="hidden font-medium md:inline">{{ displayName }}</span>
      </ULink>
    </template>
  </UDashboardNavbar>
</template>
