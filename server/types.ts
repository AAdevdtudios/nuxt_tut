export interface AuthSessionResponse {
  userId: string;
  email: string;
  name?: string;
  displayName: string;
  role: string;
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

export interface SubscriptionUsage {
  questionsUsed: number;
  questionLimit: number;
  essayGradingsUsed: number;
  essayGradingsLimit: number;
  reportsUsed: number;
  reportLimit: number;
  chatsUsed: number;
  chatLimit: number;
  documentsUsed: number;
  documentLimit: number;
  processedPagesUsed: number;
  processedPagesLimit: number;
}

export interface SubscriptionInfo {
  planCode: string;
  planName: string;
  priceUsdCents: number;
  discountPercent: number;
  effectivePriceUsdCents: number;
  status: string;
  hasCompetitiveFeatures: boolean;
  hasDeepAnalytics: boolean;
  allowedChatTiers: string[];
  isUnlimitedForTesting: boolean;
  periodStartUtc: string;
  periodEndUtc: string;
  usage: SubscriptionUsage;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  displayName: string;
  role: string;
  createdAtUtc: string;
  isLocked: boolean;
  subscription: SubscriptionInfo | null;
}
