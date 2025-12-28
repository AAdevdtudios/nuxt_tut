<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold text-foreground">Welcome back, Alex</h2>
        <p class="mt-1 text-muted-foreground">
          Here's your learning overview for today
        </p>
      </div>
      <AddProjectBtn />
    </div>
  </div>
</template>

<script lang="ts" setup>
// No additional script logic needed for this simple dashboard page
definePageMeta({
  layout: "dashboard",
});
</script>
