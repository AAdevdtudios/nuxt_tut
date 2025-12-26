<script lang="ts" setup>
const counter = useState<number>("counter", () => 0);
</script>

<template>
  <div>
    <h1 class="text-5xl font-bold">Welcome to the Home Page</h1>
    <p class="mt-4">Counter: {{ counter }}</p>
    <button
      class="mt-4 px-4 py-2 bg-green-500 text-white rounded"
      @click="counter++"
    >
      Increment Counter
    </button>
    <NuxtLink
      to="/about"
      class="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded"
      >Go to About Page</NuxtLink
    >
  </div>
</template>
