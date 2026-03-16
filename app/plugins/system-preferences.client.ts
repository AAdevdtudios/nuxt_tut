import { watch } from "vue";
import { useSystemPreferencesStore } from "~/stores/systemPreferences";

const ACCENT_PALETTES: Record<string, Record<string, string>> = {
  primary: {
    50: "#eef2ff",
    100: "#e0e7ff",
    200: "#c7d2fe",
    300: "#a5b4fc",
    400: "#818cf8",
    500: "#6366f1",
    600: "#4f46e5",
    700: "#4338ca",
    800: "#3730a3",
    900: "#312e81",
    950: "#1e1b4b",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
    950: "#172554",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
  },
  rose: {
    50: "#fff1f2",
    100: "#ffe4e6",
    200: "#fecdd3",
    300: "#fda4af",
    400: "#fb7185",
    500: "#f43f5e",
    600: "#e11d48",
    700: "#be123c",
    800: "#9f1239",
    900: "#881337",
    950: "#4c0519",
  },
};

function applyAccent(accentColor: string) {
  const palette = ACCENT_PALETTES[accentColor] || ACCENT_PALETTES.primary;
  const root = document.documentElement;

  Object.entries(palette).forEach(([shade, value]) => {
    root.style.setProperty(`--ui-color-primary-${shade}`, value);
  });
  root.style.setProperty("--ui-primary", palette["500"]);
}

export default defineNuxtPlugin(() => {
  const preferences = useSystemPreferencesStore();
  const nuxtApp = useNuxtApp();

  watch(
    () => preferences.language,
    async (language) => {
      document.documentElement.lang = language || "en";

      const i18n = (nuxtApp as any)?.$i18n;
      if (!i18n) return;

      const nextLocale = language || "en";
      try {
        if (typeof i18n.setLocale === "function") {
          await i18n.setLocale(nextLocale);
          return;
        }

        if (i18n.locale && "value" in i18n.locale) {
          i18n.locale.value = nextLocale;
        } else if (i18n.global?.locale && "value" in i18n.global.locale) {
          i18n.global.locale.value = nextLocale;
        }
      } catch {
        // Ignore unsupported locale errors and keep document lang in sync.
      }
    },
    { immediate: true },
  );

  watch(
    () => preferences.accentColor,
    (accentColor) => {
      applyAccent(accentColor || "primary");
      document.documentElement.dataset.accent = accentColor || "primary";
    },
    { immediate: true },
  );

  watch(
    () => preferences.density,
    (density) => {
      document.documentElement.dataset.density = density || "comfortable";
    },
    { immediate: true },
  );

  watch(
    () => preferences.reducedMotion,
    (reducedMotion) => {
      document.documentElement.dataset.reducedMotion = reducedMotion
        ? "true"
        : "false";
    },
    { immediate: true },
  );
});
