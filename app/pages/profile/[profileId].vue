<script lang="ts" setup>
import { useRoute } from "vue-router";

useHead({
  title: "Hello world",
});
const profileId = useRoute().params.profileId;
</script>

<template>
  <div>{{ profileId }}</div>
</template>
