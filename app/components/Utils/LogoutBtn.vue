<script setup lang="ts">
import { useAuthStore } from "~/stores/auth";
import { useRouter } from "vue-router";

defineProps<{
  text?: string;
  size?: "sm" | "md" | "lg";
  withIcon?: boolean;
  variant?: "outline" | "ghost";
}>();

const auth = useAuthStore();
const router = useRouter();

const logout = async () => {
  await auth.logout();
  await router.push("/");
};
</script>

<template>
  <UButton
    :variant="variant"
    color="error"
    :icon="withIcon ? 'i-lucide-log-out' : undefined"
    :size="size"
    :label="text"
    class="hidden md:inline-flex"
    @click="logout"
  />
</template>
