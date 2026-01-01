<template>
  <div class="editor-area max-h-100">
    <DragonEditor v-model="contentData" />
  </div>
</template>

<script setup lang="ts">
const contentData = ref<DEContentData>([]); // Do not modify the value after binding under any circumstances.
</script>
