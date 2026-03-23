// GET /api/subscription/plans
// Proxies backend `/subscription/plans` and maps it to the UI PricingPlan shape.

import type { Feature, PricingPlan } from "~/types/features.types";
import { useApi } from "../../utils/api";

type BackendSubscriptionPlan = {
  code: string;
  name: string;
  priceUsdCents: number;
  monthlyQuestionLimit: number;
  monthlyEssayLimit: number;
  documentLimit: number;
  monthlyProcessedPageLimit: number;
  hasCompetitiveFeatures: boolean;
  hasDeepAnalytics: boolean;
};

function planDescription(planCode: string) {
  switch (planCode.toLowerCase()) {
    case "free":
      return "Get started with the essentials.";
    case "basic":
      return "Best for consistent learners with higher limits.";
    case "pro":
      return "For power users who want the most.";
    default:
      return "Choose the plan that fits your needs.";
  }
}

function planPopularity(planCode: string) {
  return planCode.toLowerCase() === "basic";
}

function buildPlanFeatures(plan: BackendSubscriptionPlan): Feature[] {
  const base: Feature[] = [
    {
      id: "questions",
      name: `${plan.monthlyQuestionLimit} questions / month`,
      description: "Monthly question limit",
      icon: "lucide:help-circle",
      category: "starter",
      enabled: true,
    },
    {
      id: "essay-grading",
      name: `${plan.monthlyEssayLimit} essay gradings / month`,
      description: "Monthly essay grading limit",
      icon: "lucide:file-check-2",
      category: "starter",
      enabled: true,
    },
    {
      id: "documents",
      name: `${plan.documentLimit} documents`,
      description: "Document limit",
      icon: "lucide:file-text",
      category: "starter",
      enabled: true,
    },
    {
      id: "processed-pages",
      name: `${plan.monthlyProcessedPageLimit} processed pages / month`,
      description: "Monthly processed page limit",
      icon: "lucide:scan-text",
      category: "starter",
      enabled: true,
    },
  ];

  if (plan.hasCompetitiveFeatures) {
    base.push({
      id: "competitive-features",
      name: "Competitive features",
      description: "Includes competitive plan features",
      icon: "lucide:trophy",
      category: "pro",
      enabled: true,
    });
  }

  if (plan.hasDeepAnalytics) {
    base.push({
      id: "deep-analytics",
      name: "Deep analytics",
      description: "Includes deep analytics",
      icon: "lucide:bar-chart-3",
      category: "pro",
      enabled: true,
    });
  }

  return base;
}

export default defineEventHandler(async (event) => {
  const upstreamPlans = await useApi<BackendSubscriptionPlan[]>(
    event,
    "/subscription/plans",
    { method: "GET", useJwt: false },
  );

  const plans: PricingPlan[] = upstreamPlans.map((plan) => ({
    id: plan.code,
    name: plan.name,
    description: planDescription(plan.code),
    price: Number((plan.priceUsdCents / 100).toFixed(2)),
    currency: "USD",
    billingCycle: "monthly",
    features: buildPlanFeatures(plan),
    popular: planPopularity(plan.code),
  }));

  return plans;
});
