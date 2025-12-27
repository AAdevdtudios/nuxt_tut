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
      <h1 className="text-xl font-semibold text-card-foreground">Dashboard</h1>
    </template>

    <template #right>
      <UButton
        icon="i-lucide-search"
        size="md"
        color="primary"
        variant="outline"
      />
      <UColorModeButton />
    </template>
  </UDashboardNavbar>
</template>
