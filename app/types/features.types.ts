export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "starter" | "pro" | "enterprise";
  enabled: boolean;
  limits?: {
    [key: string]: number | string;
  };
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: "monthly" | "annually";
  features: Feature[];
  popular?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "canceled" | "past_due" | "pending";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  canceledAt?: Date;
  trialEndsAt?: Date;
}
