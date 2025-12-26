<script lang="ts" setup>
const counter = useState<number>("counter");

const { data } = await useFetch("/api/hello");
</script>
<template>
  <div>About page</div>
  <p class="mt-4">Counter: {{ counter }}</p>

  <ul class="mt-4 list-disc list-inside">
    <li v-for="item in data!.database" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
