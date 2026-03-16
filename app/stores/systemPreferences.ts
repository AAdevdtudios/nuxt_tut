import { defineStore } from "pinia";
import { ref } from "vue";

export const useSystemPreferencesStore = defineStore(
  "systemPreferences",
  () => {
    const language = ref("en");
    const accentColor = ref("primary");
    const theme = ref("system");
    const density = ref("comfortable");
    const reducedMotion = ref(false);

    const setLanguage = (value: string) => {
      language.value = value;
    };

    const setAccentColor = (value: string) => {
      accentColor.value = value;
    };

    const setTheme = (value: "system" | "light" | "dark") => {
      theme.value = value;
    };

    const setDensity = (value: "comfortable" | "compact") => {
      density.value = value;
    };

    const setReducedMotion = (value: boolean) => {
      reducedMotion.value = value;
    };

    return {
      language,
      accentColor,
      theme,
      density,
      reducedMotion,
      setLanguage,
      setAccentColor,
      setTheme,
      setDensity,
      setReducedMotion,
    };
  },
  {
    persist: true,
  },
);
