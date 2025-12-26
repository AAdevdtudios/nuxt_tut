<script lang="ts" setup>
useHead({
  title: "Hello world",
  meta: [
    {
      name: "description",
      content: "This is an example page",
    },
  ],
});
const profileId = useRoute().params.profileId;
</script>

<template>
  <h1 class="text-5xl font-bold">{{ profileId }}</h1>
</template>
