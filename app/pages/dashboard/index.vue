<template>
  <UDashboardLayout>
    <template #header>
      <h1 class="text-3xl font-bold">Dashboard</h1>
    </template>
    <template #default>
      <div class="p-4">
        <p>Welcome to your dashboard!</p>
      </div>
    </template>
  </UDashboardLayout>
</template>

<script lang="ts" setup>
// No additional script logic needed for this simple dashboard page
definePageMeta({
  layout: "dashboard",
});
</script>
