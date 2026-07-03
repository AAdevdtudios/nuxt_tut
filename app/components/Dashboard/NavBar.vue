<script setup lang="ts">
import { computed } from "vue";
import { useAuthStore } from "~/stores/auth";
import type { DropdownMenuItem } from "@nuxt/ui";

const auth = useAuthStore();

const displayName = computed(() => {
  const value =
    auth.currentUser?.name?.trim() || auth.currentUser?.displayName?.trim();
  return value || "User";
});

const avatarText = computed(() => {
  const name = displayName.value;
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
});

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: "Settings",
      icon: "i-lucide-settings",
      to: "/dashboard/settings",
    },
    {
      label: "Help",
      icon: "i-lucide-circle-help",
      to: "/dashboard/help",
    },
    {
      label: "Coming Soon",
      icon: "i-lucide-sparkles",
      to: "/dashboard/coming-soon",
    },
  ],
]);
</script>

<template>
  <UDashboardNavbar>
    <template #leading>
      <NuxtLink to="/dashboard" class="flex min-w-0 items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--ga-border)] bg-white shadow-sm"
        >
          <img src="/GapAiLogo.png" alt="GapAI" class="h-9 w-9 object-contain" />
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h1 class="ga-heading truncate font-serif text-xl font-semibold leading-none">
              GapAI
            </h1>
            <UBadge
              color="primary"
              variant="soft"
              size="sm"
              class="rounded-full text-[9px] font-bold uppercase tracking-[0.18em]"
            >
              Beta
            </UBadge>
          </div>
          <p
            class="ga-subtle mt-1 truncate text-[9px] font-bold uppercase tracking-[0.22em]"
          >
            Active learning workspace
          </p>
        </div>
      </NuxtLink>
    </template>

    <template #right>
      <UButton
        to="/dashboard/feedback"
        icon="i-lucide-message-square-heart"
        color="neutral"
        variant="ghost"
        class="rounded-xl"
        aria-label="Send feedback"
      >
        <span class="hidden sm:inline">Feedback</span>
      </UButton>
      <UColorModeButton />
      <UDropdownMenu :items="userMenuItems" :content="{ align: 'end' }">
        <UButton
          color="neutral"
          variant="ghost"
          class="rounded-full p-1"
          :aria-label="`Open ${displayName} menu`"
        >
          <UAvatar :text="avatarText || 'U'" size="md" :alt="displayName" />
        </UButton>
      </UDropdownMenu>
    </template>
  </UDashboardNavbar>
</template>
