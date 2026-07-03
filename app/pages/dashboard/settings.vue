<template>
  <DashboardBodyLayout
    title="Settings"
    description="Manage your account profile"
  >
    <div class="grid grid-cols-1 gap-6 mt-6 lg:grid-cols-2">
      <UCard
        class="ga-surface border shadow-sm"
        :ui="{
          header: 'border-b border-[var(--ga-border)]',
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="ga-icon-box flex h-10 w-10 items-center justify-center rounded-xl"
            >
              <UIcon name="i-lucide-user" class="h-5 w-5" />
            </div>
            <h3 class="ga-heading text-lg font-semibold">
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
              <UInput
                v-model="settings.username"
                class="w-full"
              />
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
            <UButton
              variant="ghost"
              color="error"
              label="Delete Account"
              @click="isDeleteAccountModalOpen = true"
            />
          </div>
        </template>
      </UCard>

      <UCard
        class="ga-surface border shadow-sm"
        :ui="{
          header: 'border-b border-[var(--ga-border)]',
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="ga-icon-box flex h-10 w-10 items-center justify-center rounded-xl"
            >
              <UIcon name="i-lucide-credit-card" class="h-5 w-5" />
            </div>
            <h3 class="ga-heading text-lg font-semibold">
              Payment & Plan
            </h3>
          </div>
        </template>
        <div class="space-y-4">
          <div class="ga-surface-soft rounded-xl border p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="ga-muted text-sm">Current plan</p>
                <h4 class="ga-heading text-lg font-semibold">
                  {{ subscriptionPlanName }}
                </h4>
              </div>
              <UBadge color="primary" variant="soft">
                {{ subscriptionStatus }}
              </UBadge>
            </div>
            <p class="ga-muted mt-2 text-sm">
              {{ subscriptionPriceLabel }}
            </p>
          </div>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="ga-surface-soft rounded-xl border p-4">
              <p class="ga-muted text-sm">Questions usage</p>
              <p class="mt-1 text-base font-semibold">
                {{ questionUsageLabel }}
              </p>
            </div>
            <div class="ga-surface-soft rounded-xl border p-4">
              <p class="ga-muted text-sm">Document usage</p>
              <p class="mt-1 text-base font-semibold">
                {{ documentUsageLabel }}
              </p>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex flex-wrap justify-end gap-2">
            <UButton variant="ghost" disabled> View Payment History </UButton>
            <UButton
              variant="solid"
              :loading="isOpeningBillingPortal"
              :disabled="isOpeningBillingPortal || !auth.hasSession"
              @click="openBillingPortal"
            >
              Manage Payment Methods
            </UButton>
          </div>
        </template>
      </UCard>

      <UCard
        class="ga-surface col-span-1 border shadow-sm lg:col-span-2"
        :ui="{
          header: 'border-b border-[var(--ga-border)]',
        }"
      >
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="ga-icon-box flex h-10 w-10 items-center justify-center rounded-xl"
            >
              <UIcon name="i-lucide-sliders-horizontal" class="h-5 w-5" />
            </div>
            <h3 class="ga-heading text-lg font-semibold">
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

          <div class="ga-surface-soft rounded-xl border p-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium">Reduce Motion</p>
                <p class="ga-muted text-xs">
                  Minimize non-essential animations in the dashboard.
                </p>
              </div>
              <USwitch v-model="systemDraft.reducedMotion" />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-between gap-2">
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
      <PricingPlansCard
        class="ga-surface col-span-1 border shadow-sm lg:col-span-2"
        :plans="plans"
        :current-plan-code="subscription?.planCode"
        :loading="plansLoading"
      />
    </div>

    <UModal v-model:open="isDeleteAccountModalOpen">
      <template #content>
        <div class="space-y-4 p-6">
          <div>
            <h3 class="ga-heading text-lg font-semibold">Delete account?</h3>
            <p class="ga-muted mt-1 text-sm">
              This signs you out immediately. The account can only be restored
              through account recovery.
            </p>
          </div>
          <UFormField label="Type DELETE to confirm">
            <UInput v-model="deleteAccountConfirmation" class="w-full" />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="isDeleteAccountModalOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              color="error"
              :loading="isDeletingAccount"
              :disabled="deleteAccountConfirmation !== 'DELETE'"
              @click="handleDeleteAccount"
            >
              Delete Account
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </DashboardBodyLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { useAuthStore } from "~/stores/auth";
import { useSystemPreferencesStore } from "~/stores/systemPreferences";
import { useSubscriptionPlans } from "~/composables/useSubscriptionPlans";

definePageMeta({
  layout: "newdash",
});

const auth = useAuthStore();
const systemPreferences = useSystemPreferencesStore();
const colorMode = useColorMode();
const toast = useToast();
const { $api } = useNuxtApp();

// Fetch subscription plans
const { plans, fetchPlans, isLoading: plansLoading } = useSubscriptionPlans();

onMounted(async () => {
  await fetchPlans();
  if (auth.hasSession) {
    try {
      await auth.fetchCurrentUser();
    } catch {}
  }
});
const saved = ref(false);
const systemSaved = ref(false);
const saving = ref(false);
const isOpeningBillingPortal = ref(false);
const isDeleteAccountModalOpen = ref(false);
const isDeletingAccount = ref(false);
const deleteAccountConfirmation = ref("");
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
  const nextUsername = settings.value.username.trim();
  const currentName =
    auth.currentUser?.name?.trim() ||
    auth.currentUser?.displayName?.trim() ||
    "";
  const currentUsername = auth.currentUser?.displayName?.trim() || "";
  const hasValidNameChange = nextName.length >= 3 && nextName !== currentName;
  const hasValidUsernameChange =
    /^[A-Za-z0-9._-]{2,}$/.test(nextUsername) &&
    nextUsername !== currentUsername;
  return hasValidNameChange || hasValidUsernameChange;
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

  return `Billed at £${(cents / 100).toFixed(2)}`;
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
    theme: (colorMode.preference || systemPreferences.theme || "system") as
      | "system"
      | "light"
      | "dark",
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
  () => colorMode.preference,
  (value) => {
    const nextTheme = (value || "system") as "system" | "light" | "dark";
    if (systemDraft.value.theme !== nextTheme) {
      systemDraft.value.theme = nextTheme;
    }
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
    const nextName = settings.value.name.trim();
    const nextUsername = settings.value.username.trim();
    const currentName =
      auth.currentUser?.name?.trim() ||
      auth.currentUser?.displayName?.trim() ||
      "";
    const currentUsername = auth.currentUser?.displayName?.trim() || "";

    if (nextName !== currentName) {
      await auth.updateProfileName(nextName);
    }
    if (nextUsername !== currentUsername) {
      await auth.updateProfileUsername(nextUsername);
    }
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

async function handleDeleteAccount() {
  if (deleteAccountConfirmation.value !== "DELETE") return;

  try {
    isDeletingAccount.value = true;
    await auth.deleteAccount();
    await navigateTo("/auth/login");
  } catch (error: any) {
    toast.add({
      title: "Delete failed",
      description: error?.message || "Could not delete your account.",
      color: "error",
    });
  } finally {
    isDeletingAccount.value = false;
    isDeleteAccountModalOpen.value = false;
    deleteAccountConfirmation.value = "";
  }
}

async function openBillingPortal() {
  try {
    isOpeningBillingPortal.value = true;
    const response = await $api.mutate<{ url?: string }>("/api/billing/portal", {
      method: "POST",
    });

    if (!response?.url) {
      throw new Error("Billing portal is not available right now.");
    }

    await navigateTo(response.url, { external: true });
  } catch (error: any) {
    toast.add({
      title: "Billing portal unavailable",
      description: error?.message || "Could not open billing management.",
      color: "error",
    });
  } finally {
    isOpeningBillingPortal.value = false;
  }
}
</script>
