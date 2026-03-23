// GET /api/features
// Retrieves available features and pricing plans

import { PRICING_PLANS, FEATURES } from "~/constants/features";

export default defineEventHandler(async (event) => {
  try {
    return {
      plans: PRICING_PLANS,
      features: Object.values(FEATURES),
      currencies: [
        { code: "USD", symbol: "$" },
        { code: "EUR", symbol: "€" },
        { code: "GBP", symbol: "£" },
        { code: "JPY", symbol: "¥" },
        { code: "AUD", symbol: "A$" },
        { code: "CAD", symbol: "C$" },
        { code: "CHF", symbol: "CHF" },
        { code: "CNY", symbol: "¥" },
        { code: "INR", symbol: "₹" },
        { code: "MXN", symbol: "$" },
        { code: "SGD", symbol: "S$" },
        { code: "HKD", symbol: "HK$" },
        { code: "NOK", symbol: "kr" },
        { code: "SEK", symbol: "kr" },
        { code: "DKK", symbol: "kr" },
        { code: "NZD", symbol: "NZ$" },
        { code: "ZAR", symbol: "R" },
        { code: "BRL", symbol: "R$" },
        { code: "RUB", symbol: "₽" },
        { code: "KRW", symbol: "₩" },
        { code: "NGN", symbol: "₦" },
        { code: "AED", symbol: "د.إ" },
        { code: "SAR", symbol: "ر.س" },
        { code: "PKR", symbol: "₨" },
        { code: "THB", symbol: "฿" },
        { code: "IDR", symbol: "Rp" },
        { code: "PHP", symbol: "₱" },
      ],
    };
  } catch (error) {
    console.error("Features fetch error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch features",
    });
  }
});
