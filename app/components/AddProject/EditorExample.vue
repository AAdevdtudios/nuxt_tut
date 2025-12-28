<template>
  <div class="editor-area">
    <DragonEditor v-model="contentData" style="height: 100vh" />
  </div>
</template>

<script setup lang="ts">
const contentData = ref<DEContentData>([]); // Do not modify the value after binding under any circumstances.
</script>
