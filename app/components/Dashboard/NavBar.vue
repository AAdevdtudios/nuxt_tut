<script setup lang="ts">
const items = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Starred", value: "starred" },
];
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
      <UButton
        icon="i-lucide-search"
        size="md"
        color="primary"
        variant="outline"
      />
      <UtilsNotifications />
      <UColorModeButton />
      <UAvatar
        :src="`https://i.pravatar.cc/150?u=${Math.random()}`"
        size="md"
        alt="User Avatar"
      />
    </template>
  </UDashboardNavbar>
</template>
