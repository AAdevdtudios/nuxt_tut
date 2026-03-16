<template>
  <DashboardBodyLayout
    title="Settings"
    description="Manage your account profile"
  >
    <div class="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
      <UCard
        :ui="{
          header: 'border-b border-default',
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <UIcon name="i-lucide-user" class="h-5 w-5" />
            </div>
            <h3 class="text-lg font-semibold text-card-foreground">
              Profile Information
            </h3>
          </div>
        </template>
        <div class="space-y-4">
          <UFormField label="Full name">
            <UInput v-model="settings.name" class="w-full" />
          </UFormField>
          <div class="grid grid-cols-2 gap-2">
            <UFormField label="Email Address">
              <UInput :model-value="settings.email" disabled class="w-full" />
            </UFormField>
            <UFormField label="Username">
              <UInput :model-value="settings.username" disabled class="w-full" />
            </UFormField>
          </div>
        </div>
        <template #footer>
          <div class="w-full flex flex-row-reverse gap-2">
            <UButton
              variant="solid"
              @click="handleSave"
              :loading="saving"
              :disabled="saving || !canSave"
            >
              {{ saved ? "Saved!" : "Save Changes" }}
            </UButton>
            <UButton variant="ghost" color="error" label="Delete Account" disabled />
          </div>
        </template>
      </UCard>

      <UCard
        :ui="{
          header: 'border-b border-default',
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <UIcon name="i-lucide-credit-card" class="h-5 w-5" />
            </div>
            <h3 class="text-lg font-semibold text-card-foreground">
              Payment & Plan
            </h3>
          </div>
        </template>
        <div class="space-y-4">
          <div class="rounded-xl border border-default bg-muted/30 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm text-muted-foreground">Current plan</p>
                <h4 class="text-lg font-semibold text-card-foreground">
                  {{ subscriptionPlanName }}
                </h4>
              </div>
              <UBadge color="primary" variant="soft">
                {{ subscriptionStatus }}
              </UBadge>
            </div>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ subscriptionPriceLabel }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="rounded-lg border border-default p-4">
              <p class="text-sm text-muted-foreground">Questions usage</p>
              <p class="mt-1 text-base font-semibold">
                {{ questionUsageLabel }}
              </p>
            </div>
            <div class="rounded-lg border border-default p-4">
              <p class="text-sm text-muted-foreground">Document usage</p>
              <p class="mt-1 text-base font-semibold">
                {{ documentUsageLabel }}
              </p>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex flex-wrap justify-end gap-2">
            <UButton variant="ghost" disabled>
              View Payment History
            </UButton>
            <UButton variant="solid" disabled>
              Manage Payment Methods
            </UButton>
          </div>
        </template>
      </UCard>

      <UCard
        :ui="{
          header: 'border-b border-default',
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <UIcon name="i-lucide-sliders-horizontal" class="h-5 w-5" />
            </div>
            <h3 class="text-lg font-semibold text-card-foreground">
              System Settings
            </h3>
          </div>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <UFormField label="Language">
              <USelect
                v-model="systemDraft.language"
                :items="languageOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Theme">
              <USelect
                v-model="systemDraft.theme"
                :items="themeOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <UFormField label="Accent Color">
              <USelect
                v-model="systemDraft.accentColor"
                :items="accentOptions"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Layout Density">
              <USelect
                v-model="systemDraft.density"
                :items="densityOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="rounded-lg border border-default p-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium">Reduce Motion</p>
                <p class="text-xs text-muted-foreground">
                  Minimize non-essential animations in the dashboard.
                </p>
              </div>
              <USwitch
                v-model="systemDraft.reducedMotion"
              />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between gap-2">
            <p class="text-xs text-muted-foreground">
              Saved locally on this device (no server sync).
            </p>
            <UButton
              color="primary"
              :disabled="!canSaveSystemPreferences"
              @click="handleSaveSystemPreferences"
            >
              {{ systemSaved ? "Saved!" : "Save Preferences" }}
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useSystemPreferencesStore } from "~/stores/systemPreferences";

definePageMeta({
  layout: "dashboard",
});

const auth = useAuthStore();
const systemPreferences = useSystemPreferencesStore();
const colorMode = useColorMode();
const toast = useToast();
const saved = ref(false);
const systemSaved = ref(false);
const saving = ref(false);
const settings = ref({
  name: "",
  email: "",
  username: "",
});
const systemDraft = ref({
  language: "en",
  accentColor: "primary",
  theme: "system" as "system" | "light" | "dark",
  density: "comfortable" as "comfortable" | "compact",
  reducedMotion: false,
});

const syncFromUser = () => {
  settings.value = {
    name: auth.currentUser?.name || auth.currentUser?.displayName || "",
    email: auth.currentUser?.email || "",
    username: auth.currentUser?.displayName || "",
  };
};

watch(
  () => auth.currentUser,
  () => {
    syncFromUser();
  },
  { immediate: true },
);

if (
  auth.hasSession &&
  (!auth.currentUser ||
    !auth.currentUser.createdAtUtc ||
    auth.currentUser.subscription === undefined)
) {
  try {
    await auth.fetchCurrentUser();
  } catch {}
}

const canSave = computed(() => {
  const nextName = settings.value.name.trim();
  const currentName =
    auth.currentUser?.name?.trim() || auth.currentUser?.displayName?.trim() || "";
  return nextName.length >= 3 && nextName !== currentName;
});

const subscription = computed(() => auth.currentUser?.subscription || null);

const subscriptionPlanName = computed(
  () => subscription.value?.planName || "No active plan",
);

const subscriptionStatus = computed(
  () => subscription.value?.status || "Unavailable",
);

const subscriptionPriceLabel = computed(() => {
  if (!subscription.value) {
    return "Billing information is not available for this account.";
  }

  const cents = subscription.value.effectivePriceUsdCents;
  if (typeof cents !== "number") {
    return "Current plan pricing is unavailable.";
  }

  if (cents === 0) {
    return "Free plan";
  }

  return `Billed at $${(cents / 100).toFixed(2)}`;
});

const questionUsageLabel = computed(() => {
  const usage = subscription.value?.usage;

  if (!usage) {
    return "Unavailable";
  }

  return `${usage.questionsUsed} / ${usage.questionLimit}`;
});

const documentUsageLabel = computed(() => {
  const usage = subscription.value?.usage;

  if (!usage) {
    return "Unavailable";
  }

  return `${usage.documentsUsed} / ${usage.documentLimit}`;
});

const languageOptions = computed(() => [
  { label: "English", value: "en" },
  { label: "French", value: "fr" },
  { label: "Spanish", value: "es" },
]);

const themeOptions = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const accentOptions = [
  { label: "Primary", value: "primary" },
  { label: "Blue", value: "blue" },
  { label: "Green", value: "green" },
  { label: "Amber", value: "amber" },
  { label: "Rose", value: "rose" },
];

const densityOptions = [
  { label: "Comfortable", value: "comfortable" },
  { label: "Compact", value: "compact" },
];

const syncSystemDraft = () => {
  systemDraft.value = {
    language: systemPreferences.language || "en",
    accentColor: systemPreferences.accentColor || "primary",
    theme: (systemPreferences.theme || "system") as "system" | "light" | "dark",
    density: (systemPreferences.density || "comfortable") as
      | "comfortable"
      | "compact",
    reducedMotion: Boolean(systemPreferences.reducedMotion),
  };
};

syncSystemDraft();

const canSaveSystemPreferences = computed(
  () =>
    systemDraft.value.language !== systemPreferences.language ||
    systemDraft.value.accentColor !== systemPreferences.accentColor ||
    systemDraft.value.theme !== systemPreferences.theme ||
    systemDraft.value.density !== systemPreferences.density ||
    systemDraft.value.reducedMotion !== systemPreferences.reducedMotion,
);

watch(
  () => systemPreferences.theme,
  (value) => {
    colorMode.preference = value as "system" | "light" | "dark";
  },
  { immediate: true },
);

function handleSaveSystemPreferences() {
  if (!canSaveSystemPreferences.value) return;

  systemPreferences.setLanguage(systemDraft.value.language);
  systemPreferences.setAccentColor(systemDraft.value.accentColor);
  systemPreferences.setTheme(systemDraft.value.theme);
  systemPreferences.setDensity(systemDraft.value.density);
  systemPreferences.setReducedMotion(systemDraft.value.reducedMotion);
  colorMode.preference = systemDraft.value.theme;

  systemSaved.value = true;
  toast.add({
    title: "System preferences updated",
    description: "Changes were applied immediately.",
    color: "success",
  });
  setTimeout(() => (systemSaved.value = false), 1500);
}

async function handleSave() {
  if (!canSave.value) {
    return;
  }

  try {
    saving.value = true;
    await auth.updateProfileName(settings.value.name.trim());
    syncFromUser();
    saved.value = true;
    toast.add({
      title: "Profile updated",
      description: "Your full name was saved successfully.",
      color: "success",
    });
    setTimeout(() => (saved.value = false), 2000);
  } catch (error: any) {
    toast.add({
      title: "Update failed",
      description: error?.message || "Could not save your display name.",
      color: "error",
    });
  } finally {
    saving.value = false;
  }
}
</script>
