<script lang="ts" setup>
import { useAuthStore } from "~/stores/auth";
const counter = useState<number>("counter", () => 0);
const auth = useAuthStore();
</script>

<template>
  <div>
    <h1 class="text-5xl font-bold">Welcome to the Home Page</h1>
    <div v-if="auth.currentUser">
      <h2 class="text-2xl mt-6 mb-2">User Info</h2>
      <ul class="mb-4">
        <li><strong>ID:</strong> {{ auth.currentUser.id }}</li>
        <li><strong>Name:</strong> {{ auth.currentUser.displayName }}</li>
        <li><strong>Email:</strong> {{ auth.currentUser.email }}</li>
        <li><strong>Role:</strong> {{ auth.currentUser.role }}</li>
        <li>
          <strong>Locked:</strong>
          {{ auth.currentUser.isLocked ? "Yes" : "No" }}
        </li>
        <li v-if="auth.currentUser.subscription">
          <strong>Plan:</strong> {{ auth.currentUser.subscription.planName }}
        </li>
      </ul>
    </div>
    <button
      v-if="auth.currentUser"
      @click="auth.logout()"
      class="mt-2 px-4 py-2 bg-red-500 text-white rounded"
    >
      Logout
    </button>
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
