<script setup lang="ts">
useHead({
  title: "Authentication",
  meta: [
    {
      name: "description",
      content: "Login or register to access your account",
    },
  ],
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4"
  >
    <div class="w-full max-w-4xl">
      <slot />
    </div>
  </div>
</template>
