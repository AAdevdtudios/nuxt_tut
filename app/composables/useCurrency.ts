import { ref, computed } from "vue";

interface ExchangeRates {
  [key: string]: number;
}

interface CurrencyState {
  rates: ExchangeRates;
  selectedCurrency: string;
  lastUpdated: number;
  hasUserSelectedCurrency?: boolean;
  baseCurrencyVersion?: number;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const API_KEY = "fca_live_abcdefgh12345"; // Replace with actual exchangerate-api key

const supportedCurrencies = [
  // Americas
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/" },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$" },

  // Europe
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "PLN", name: "Polish Złoty", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },

  // Middle East
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "SAR", name: "Saudi Riyal", symbol: "ر.س" },
  { code: "QAR", name: "Qatari Riyal", symbol: "ر.ق" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك" },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع." },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا" },

  // Africa (incl. Nigeria)
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK" },
  { code: "BWP", name: "Botswana Pula", symbol: "P" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م." },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "DZD", name: "Algerian Dinar", symbol: "دج" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت" },
  { code: "XOF", name: "CFA Franc (BCEAO)", symbol: "CFA" },
  { code: "XAF", name: "CFA Franc (BEAC)", symbol: "CFA" },

  // Asia-Pacific
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "रु" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸" },
];

const state = ref<CurrencyState>({
  rates: {},
  selectedCurrency: "GBP",
  lastUpdated: 0,
  hasUserSelectedCurrency: false,
  baseCurrencyVersion: 2,
});

// Load from localStorage on initialization
if (process.client) {
  const saved = localStorage.getItem("currency-state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.value = parsed;
      if (!parsed.baseCurrencyVersion && !parsed.hasUserSelectedCurrency) {
        state.value.selectedCurrency = "GBP";
        state.value.baseCurrencyVersion = 2;
      }
    } catch (e) {
      // Fallback to default
    }
  }
}

const saveTolocalStorage = () => {
  if (process.client) {
    localStorage.setItem("currency-state", JSON.stringify(state.value));
  }
};

export const useCurrency = () => {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const currentCurrency = computed(
    () =>
      supportedCurrencies.find(
        (c) => c.code === state.value.selectedCurrency,
      ) || supportedCurrencies[0],
  );

  const fetchRates = async () => {
    // Check cache first
    const now = Date.now();
    if (
      state.value.rates &&
      Object.keys(state.value.rates).length > 0 &&
      now - state.value.lastUpdated < CACHE_DURATION
    ) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Using exchangerate-api.com free tier
      const response = await fetch(`https://open.er-api.com/v6/latest/USD`, {
        method: "GET",
      });

      if (!response.ok) throw new Error("Failed to fetch rates");

      const data = await response.json();

      if (data.rates) {
        state.value.rates = data.rates;
        state.value.lastUpdated = now;
        saveTolocalStorage();
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Unknown error";
      console.error("Currency fetch error:", e);
      // Fallback rates if API fails
      if (!state.value.rates || Object.keys(state.value.rates).length === 0) {
        state.value.rates = {
          USD: 1,
          EUR: 0.92,
          GBP: 0.79,
          JPY: 149.5,
          AUD: 1.52,
          CAD: 1.36,
          CHF: 0.88,
          CNY: 7.24,
          INR: 83.12,
          NGN: 1550,
        };
      }
    } finally {
      isLoading.value = false;
    }
  };

  const convertPrice = (basePrice: number, toCurrency?: string): number => {
    const currency = toCurrency || state.value.selectedCurrency;
    const targetRate = state.value.rates[currency] || (currency === "GBP" ? 0.79 : 1);
    const gbpRate = state.value.rates.GBP || 0.79;

    if (currency === "GBP") {
      return basePrice;
    }

    // Exchange API rates are USD-based. Backend prices are GBP-based, so convert
    // GBP -> USD -> target currency.
    return (basePrice / gbpRate) * targetRate;
  };

  const formatPrice = (price: number, currency?: string): string => {
    const curr = currency || state.value.selectedCurrency;
    const currencyObj = supportedCurrencies.find((c) => c.code === curr);

    if (!currencyObj) return `$${price.toFixed(2)}`;

    // Different formatting based on currency
    if (curr === "JPY" || curr === "KRW") {
      return `${currencyObj.symbol}${Math.round(price)}`;
    }

    return `${currencyObj.symbol}${price.toFixed(2)}`;
  };

  const setCurrency = (code: string) => {
    if (supportedCurrencies.find((c) => c.code === code)) {
      state.value.selectedCurrency = code;
      state.value.hasUserSelectedCurrency = true;
      state.value.baseCurrencyVersion = 2;
      saveTolocalStorage();
    }
  };

  return {
    supportedCurrencies,
    currentCurrency,
    selectedCurrency: computed(() => state.value.selectedCurrency),
    rates: computed(() => state.value.rates),
    isLoading,
    error,
    fetchRates,
    convertPrice,
    formatPrice,
    setCurrency,
  };
};
