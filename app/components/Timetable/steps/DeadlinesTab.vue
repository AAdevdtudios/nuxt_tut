<script setup lang="ts">
const isComplete = defineModel<boolean>("isComplete", { required: true });
const data = defineModel<any>("data", { required: true });

onMounted(() => {
  data.value = { deadlinePolicy: "flexible" };
  isComplete.value = true; // optional auto-complete
});
</script>

<template>
  <p>Deadlines are optional. Defaults will be used.</p>
</template>
