import { ref, computed } from "vue";
import type { PricingPlan } from "~/types/features.types";

export const useSubscriptionPlans = () => {
  const plans = ref<PricingPlan[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const selectedPlanId = ref<string | null>(null);

  const selectedPlan = computed(() =>
    plans.value.find((p) => p.id === selectedPlanId.value),
  );

  const fetchPlans = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const data = await $fetch<PricingPlan[]>("/api/subscription/plans");
      plans.value = Array.isArray(data) ? data : [];
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch plans";
      console.error("Error fetching subscription plans:", err);
    } finally {
      isLoading.value = false;
    }
  };

  const selectPlan = (planId: string) => {
    selectedPlanId.value = planId;
  };

  const proceedToPayment = async (planId: string) => {
    try {
      const plan = plans.value.find((p) => p.id === planId);
      if (!plan) {
        throw new Error("Plan not found");
      }

      // Create checkout session
      const data = await $fetch<{
        url?: string;
        checkoutUrl?: string;
        sessionId?: string;
      }>("/api/subscription/create-checkout-session", {
        method: "POST",
        body: {
          planCode: plan.id,
        },
      });

      // Redirect to Stripe checkout
      const checkoutUrl = data?.url || data?.checkoutUrl;
      if (checkoutUrl) {
        await navigateTo(checkoutUrl, { external: true });
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Payment initialization failed";
      console.error("Payment error:", err);
    }
  };

  return {
    plans: computed(() => plans.value),
    selectedPlan,
    selectedPlanId: computed(() => selectedPlanId.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    fetchPlans,
    selectPlan,
    proceedToPayment,
  };
};
