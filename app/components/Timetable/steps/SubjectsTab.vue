<script setup lang="ts">
const isComplete = defineModel<boolean>("isComplete", { required: true });
const data = defineModel<any>("data", { required: true });

const subject = ref("");

watch(subject, (value) => {
  isComplete.value = value.length > 0;
  data.value = { subject: value };
});
</script>

<template>
  <UInput v-model="subject" placeholder="Enter subject" />
</template>
