<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { computed, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const isDedicatedWorkspace = computed(
  () =>
    route.path === "/dashboard/study" ||
    route.path.startsWith("/dashboard/notes/"),
);

const displayName = computed(() => {
  const value =
    auth.currentUser?.name?.trim() || auth.currentUser?.displayName?.trim();
  return value || "User";
});

const avatarText = computed(() => {
  const initials = displayName.value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return initials || "U";
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
      label: "Feedback",
      icon: "i-lucide-message-square-heart",
      to: "/dashboard/feedback",
    },
    {
      label: "Quick Practice",
      icon: "i-lucide-file-question",
      to: "/dashboard/quick-practice",
    },
    {
      label: "Coming Soon",
      icon: "i-lucide-sparkles",
      to: "/dashboard/coming-soon",
    },
  ],
  [
    {
      label: "Logout",
      icon: "i-lucide-log-out",
      color: "error",
      onSelect: async () => {
        await auth.logout();
        await router.push("/auth/login");
      },
    },
  ],
]);

onMounted(async () => {
  if (auth.hasSession && !auth.currentUser) {
    try {
      await auth.fetchCurrentUser();
    } catch {
      // Auth middleware handles expired sessions.
    }
  }
});
</script>

<template>
  <div class="ga-app flex min-h-screen flex-col overflow-x-hidden">
    <header
      class="ga-surface sticky top-0 z-40 flex h-(--ui-header-height) shrink-0 items-center justify-between gap-3 border-b px-4 backdrop-blur sm:px-6"
    >
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

      <div class="flex shrink-0 items-center gap-2">
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
        <UColorModeSwitch color="neutral" variant="ghost" size="xl" />
        <UDropdownMenu :items="userMenuItems" :content="{ align: 'end' }">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full p-1"
            :aria-label="`Open ${displayName} menu`"
          >
            <UAvatar :text="avatarText" :alt="displayName" size="md" />
          </UButton>
        </UDropdownMenu>
      </div>
    </header>

    <main
      class="min-w-0 flex-1"
      :class="isDedicatedWorkspace ? 'min-h-0' : 'p-4 sm:p-6 lg:p-10'"
    >
      <slot />
    </main>
  </div>
</template>
