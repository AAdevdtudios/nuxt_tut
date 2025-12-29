<template>
  <DashboardBodyLayout
    title="Library"
    description="Manage your study materials and resources"
  >
    <template #actions>
      <AddProjectBtn />
    </template>
  </DashboardBodyLayout>
</template>

<script lang="ts" setup>
// No additional script logic needed for this simple library page
definePageMeta({
  layout: "dashboard",
});
</script>
