<template>
  <UCard :class="class">
    <template #header>
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-medium">Subscription Plans</h2>
          </div>
          <p class="text-sm text-muted-foreground">
            Choose the best plan that suits your needs.
          </p>
        </div>

        <div class="w-52">
          <p class="mb-1 text-xs text-muted-foreground">Currency</p>
          <USelect
            v-model="currencyCode"
            :items="currencyItems"
            class="w-full"
          />
        </div>
      </div>
    </template>

    <div class="p-0">
      <div v-if="loading" class="p-6 text-sm text-muted-foreground">
        Loading plans…
      </div>

      <div v-else-if="loadError" class="p-6">
        <UAlert
          icon="i-lucide-alert-circle"
          color="error"
          variant="soft"
          :title="loadError"
        />
      </div>

      <div v-else class="grid gap-4 border-0 p-6 sm:grid-cols-2 lg:grid-cols-3">
        <UPricingPlan
          v-for="plan in plans"
          :key="plan.id"
          :highlight="Boolean(plan.popular)"
          :badge="plan.popular ? 'Most popular' : undefined"
          :title="plan.name"
          :description="plan.description"
          :price="formatPlanPrice(plan.price)"
          billingPeriod="/mo"
          :features="plan.features?.slice(0, 5).map((f) => f.name) || []"
          :button="{
            label: buttonLabel(plan),
            color: selectedPlanId === plan.id ? 'primary' : 'neutral',
            variant: selectedPlanId === plan.id ? 'solid' : 'soft',
            disabled: isProcessing,
            onClick: () => onPlanClick(plan.id),
          }"
        />
      </div>

      <div v-if="paymentError" class="border-t border-default p-6">
        <UAlert
          icon="i-lucide-alert-circle"
          color="error"
          variant="soft"
          :title="paymentError"
        />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { PricingPlan } from "~/types/features.types";
import { useCurrency } from "~/composables/useCurrency";

const props = defineProps<{
  plans: PricingPlan[];
  loading?: boolean;
  loadError?: string | null;
  class?: string;
}>();

const selectedPlanId = ref<string | null>(null);
const isProcessing = ref(false);
const paymentError = ref<string | null>(null);

const {
  supportedCurrencies,
  selectedCurrency,
  fetchRates,
  convertPrice,
  formatPrice,
  setCurrency,
} = useCurrency();

const currencyItems = computed(() =>
  supportedCurrencies.map((currency) => ({
    label: `${currency.symbol} ${currency.code} — ${currency.name}`,
    value: currency.code,
  })),
);

const currencyCode = computed({
  get: () => selectedCurrency.value,
  set: (code: string) => setCurrency(code),
});

onMounted(() => {
  void fetchRates();
});

const formatPlanPrice = (baseUsd: number) => {
  if (baseUsd === 0) return "Free";
  const converted = convertPrice(baseUsd);
  return formatPrice(converted);
};

const buttonLabel = (plan: PricingPlan) => {
  const selected = selectedPlanId.value === plan.id;
  if (selected) return plan.price === 0 ? "Selected" : "Continue";
  return plan.price === 0 ? "Select" : "Choose";
};

const startCheckout = async (plan: PricingPlan) => {
  const { data, error: fetchError } = await useFetch(
    "/api/subscription/create-checkout-session",
    {
      method: "POST",
      body: {
        planName: plan.name,
        priceInCents: Math.round(plan.price * 100),
        currency: plan.currency || "USD",
      },
    },
  );

  if (fetchError.value) {
    throw new Error("Failed to create checkout session");
  }

  if (data.value?.checkoutUrl) {
    await navigateTo(data.value.checkoutUrl, { external: true });
  } else if (data.value?.sessionId) {
    await navigateTo("/billing?success=true");
  }
};

const onPlanClick = async (planId: string) => {
  selectedPlanId.value = planId;
  paymentError.value = null;

  const plan = props.plans.find((p) => p.id === planId);
  if (!plan) return;
  if (plan.price === 0) return;

  try {
    isProcessing.value = true;
    await startCheckout(plan);
  } catch (err) {
    paymentError.value = err instanceof Error ? err.message : "Payment failed";
    console.error("Payment error:", err);
  } finally {
    isProcessing.value = false;
  }
};
</script>
