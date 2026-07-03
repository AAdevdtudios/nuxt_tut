<script setup lang="ts">
import type { SubscriptionInfo } from "~/types";

definePageMeta({ layout: "newdash" });

const route = useRoute();
const router = useRouter();
const toast = useToast();
const auth = useAuthStore();
const { $api } = useNuxtApp();

const isRefreshing = ref(false);
const subscription = ref<SubscriptionInfo | null>(null);
const loadError = ref("");

const stripeState = computed(() => {
  const value = String(route.query.stripe || "").toLowerCase();
  if (value === "success" || route.query.success === "true") return "success";
  if (value === "cancel" || route.query.cancel === "true") return "cancel";
  return "overview";
});

const pageState = computed(() => {
  if (stripeState.value === "success") {
    return {
      icon: "i-lucide-circle-check",
      color: "success" as const,
      eyebrow: "Payment completed",
      title: "Your billing update is being confirmed",
      description:
        "Stripe returned successfully. GapAI is refreshing your subscription so the new limits are available in your account.",
    };
  }

  if (stripeState.value === "cancel") {
    return {
      icon: "i-lucide-circle-x",
      color: "warning" as const,
      eyebrow: "Checkout cancelled",
      title: "No billing changes were made",
      description:
        "You cancelled Stripe checkout. Your current plan remains active and you can choose another plan whenever you are ready.",
    };
  }

  return {
    icon: "i-lucide-credit-card",
    color: "primary" as const,
    eyebrow: "Billing",
    title: "Manage your GapAI billing",
    description:
      "Review your current plan, usage limits, and subscription status.",
  };
});

const planName = computed(
  () => subscription.value?.planName || auth.currentUser?.subscription?.planName || "No active plan",
);

const subscriptionStatus = computed(
  () => subscription.value?.status || auth.currentUser?.subscription?.status || "Unavailable",
);

const priceLabel = computed(() => {
  const cents =
    subscription.value?.effectivePriceUsdCents ??
    auth.currentUser?.subscription?.effectivePriceUsdCents;

  if (typeof cents !== "number") return "Pricing unavailable";
  if (cents === 0) return "Free plan";
  return `£${(cents / 100).toFixed(2)} / month`;
});

const usage = computed(
  () => subscription.value?.usage || auth.currentUser?.subscription?.usage || null,
);

const usageItems = computed(() => [
  {
    label: "Questions",
    used: usage.value?.questionsUsed ?? 0,
    limit: usage.value?.questionLimit ?? 0,
  },
  {
    label: "Documents",
    used: usage.value?.documentsUsed ?? 0,
    limit: usage.value?.documentLimit ?? 0,
  },
  {
    label: "Processed pages",
    used: usage.value?.processedPagesUsed ?? 0,
    limit: usage.value?.processedPagesLimit ?? 0,
  },
]);

function usagePercent(item: { used: number; limit: number }) {
  if (!item.limit) return 0;
  return Math.min(100, Math.round((Number(item.used || 0) / Number(item.limit)) * 100));
}

async function refreshBilling() {
  try {
    isRefreshing.value = true;
    loadError.value = "";

    if (auth.hasSession) {
      try {
        await auth.fetchCurrentUser();
      } catch {}
    }

    subscription.value = await $api.fetch<SubscriptionInfo>("/api/subscription/current");

    if (stripeState.value === "success") {
      toast.add({
        title: "Billing refreshed",
        description: "Your latest subscription details are now loaded.",
        color: "success",
      });
    }
  } catch (error: any) {
    loadError.value =
      error?.data?.message ||
      error?.statusMessage ||
      error?.message ||
      "Could not refresh billing information.";
  } finally {
    isRefreshing.value = false;
  }
}

async function openBillingPortal() {
  try {
    const response = await $api.mutate<{ url?: string }>("/api/billing/portal", {
      method: "POST",
    });

    if (!response?.url) throw new Error("Billing portal is not available right now.");
    await navigateTo(response.url, { external: true });
  } catch (error: any) {
    toast.add({
      title: "Billing portal unavailable",
      description: error?.message || "Could not open billing management.",
      color: "error",
    });
  }
}

onMounted(() => {
  void refreshBilling();
});
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <section class="ga-surface-warm overflow-hidden rounded-[2rem] border p-6 sm:p-10">
      <div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div class="max-w-2xl">
          <div
            class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--ga-primary-soft)] text-[var(--ga-primary)]"
          >
            <UIcon :name="pageState.icon" class="h-7 w-7" />
          </div>
          <p class="ga-link mt-5 text-xs font-bold uppercase tracking-[0.22em]">
            {{ pageState.eyebrow }}
          </p>
          <h1 class="ga-heading mt-3 font-serif text-4xl font-semibold leading-tight sm:text-6xl">
            {{ pageState.title }}
          </h1>
          <p class="ga-muted mt-4 text-sm leading-6 sm:text-base">
            {{ pageState.description }}
          </p>
        </div>

        <UBadge :color="pageState.color" variant="soft" class="w-fit rounded-full capitalize">
          {{ stripeState === "overview" ? subscriptionStatus : stripeState }}
        </UBadge>
      </div>
    </section>

    <UAlert
      v-if="loadError"
      icon="i-lucide-alert-circle"
      color="error"
      variant="soft"
      title="Billing details unavailable"
      :description="loadError"
    />

    <section class="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <UCard class="ga-surface rounded-[1.5rem] border">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="ga-subtle text-xs font-bold uppercase tracking-[0.18em]">Current plan</p>
            <h2 class="ga-heading mt-2 font-serif text-4xl font-semibold">{{ planName }}</h2>
            <p class="ga-muted mt-2 text-sm">{{ priceLabel }}</p>
          </div>
          <UBadge color="neutral" variant="soft" class="rounded-full capitalize">
            {{ subscriptionStatus }}
          </UBadge>
        </div>

        <div class="mt-8 grid gap-3">
          <UButton
            label="Refresh billing"
            icon="i-lucide-refresh-cw"
            color="primary"
            class="justify-center rounded-xl"
            :loading="isRefreshing"
            @click="refreshBilling"
          />
          <UButton
            label="Manage billing"
            icon="i-lucide-external-link"
            color="neutral"
            variant="soft"
            class="justify-center rounded-xl"
            @click="openBillingPortal"
          />
        </div>
      </UCard>

      <UCard class="ga-surface rounded-[1.5rem] border">
        <template #header>
          <div>
            <h2 class="ga-heading font-serif text-2xl font-semibold">Plan usage</h2>
            <p class="ga-muted mt-1 text-sm">Your current allowance from the subscription API.</p>
          </div>
        </template>

        <div class="space-y-5">
          <div v-for="item in usageItems" :key="item.label">
            <div class="mb-2 flex items-center justify-between gap-3 text-sm">
              <span class="ga-heading font-semibold">{{ item.label }}</span>
              <span class="ga-muted">{{ item.used }} / {{ item.limit || "Unavailable" }}</span>
            </div>
            <UProgress :model-value="usagePercent(item)" color="primary" />
          </div>
        </div>
      </UCard>
    </section>

    <section class="ga-surface flex flex-col gap-3 rounded-[1.5rem] border p-4 sm:flex-row sm:items-center sm:justify-between">
      <p class="ga-muted text-sm">
        {{ stripeState === "cancel" ? "You can pick another plan from settings." : "Need to change plan or confirm billing? Continue from settings." }}
      </p>
      <div class="flex flex-col gap-2 sm:flex-row">
        <UButton
          label="Go to settings"
          icon="i-lucide-settings"
          color="neutral"
          variant="soft"
          class="justify-center rounded-xl"
          @click="router.push('/dashboard/settings')"
        />
        <UButton
          label="Back to dashboard"
          icon="i-lucide-layout-dashboard"
          color="primary"
          class="justify-center rounded-xl"
          @click="router.push('/dashboard')"
        />
      </div>
    </section>
  </div>
</template>
