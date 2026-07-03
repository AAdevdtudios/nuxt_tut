import type { Feature, PricingPlan } from "~/types/features.types";

export const FEATURES: { [key: string]: Feature } = {
  projects: {
    id: "projects",
    name: "Projects",
    description: "Number of active projects",
    icon: "lucide:folder",
    category: "starter",
    enabled: true,
    limits: {
      starter: 5,
      pro: "Unlimited",
      enterprise: "Unlimited",
    },
  },
  storage: {
    id: "storage",
    name: "Storage",
    description: "Total storage space",
    icon: "lucide:hard-drive",
    category: "starter",
    enabled: true,
    limits: {
      starter: "1GB",
      pro: "100GB",
      enterprise: "Unlimited",
    },
  },
  support: {
    id: "support",
    name: "Support",
    description: "Customer support priority",
    icon: "lucide:headphones",
    category: "starter",
    enabled: true,
    limits: {
      starter: "Community",
      pro: "Priority",
      enterprise: "Dedicated",
    },
  },
  analytics: {
    id: "analytics",
    name: "Advanced Analytics",
    description: "Access to detailed analytics and reports",
    icon: "lucide:bar-chart-3",
    category: "pro",
    enabled: true,
  },
  collaboration: {
    id: "collaboration",
    name: "Team Collaboration",
    description: "Invite team members and collaborate in real-time",
    icon: "lucide:users",
    category: "pro",
    enabled: true,
  },
  customBranding: {
    id: "customBranding",
    name: "Custom Branding",
    description: "White-label and custom domain support",
    icon: "lucide:palette",
    category: "enterprise",
    enabled: true,
  },
  sso: {
    id: "sso",
    name: "SSO Authentication",
    description: "Single Sign-On via SAML/OAuth",
    icon: "lucide:lock",
    category: "enterprise",
    enabled: true,
  },
  api: {
    id: "api",
    name: "REST API Access",
    description: "Full API access for integrations",
    icon: "lucide:code",
    category: "pro",
    enabled: true,
  },
  webhook: {
    id: "webhook",
    name: "Webhooks",
    description: "Real-time webhooks for automations",
    icon: "lucide:zap",
    category: "pro",
    enabled: true,
  },
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for beginners and individual learners",
    price: 9.99,
    currency: "GBP",
    billingCycle: "monthly",
    features: [FEATURES.projects!, FEATURES.storage!, FEATURES.support!],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams and professionals",
    price: 29.99,
    currency: "GBP",
    billingCycle: "monthly",
    features: [
      FEATURES.projects!,
      FEATURES.storage!,
      FEATURES.support!,
      FEATURES.analytics!,
      FEATURES.collaboration!,
      FEATURES.api!,
      FEATURES.webhook!,
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations with advanced needs",
    price: 0, // Custom pricing
    currency: "GBP",
    billingCycle: "monthly",
    features: Object.values(FEATURES),
    popular: false,
  },
];

export const SUBSCRIPTION_STATUSES = {
  active: "Active",
  canceled: "Canceled",
  past_due: "Past Due",
  pending: "Pending",
} as const;

export const TRIAL_DURATION_DAYS = 14;
export const FREE_PLAN_STORAGE_GB = 1;
export const DEFAULT_BILLING_CYCLE: "monthly" | "annually" = "monthly";
