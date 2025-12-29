import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "nuxt-lucide-icons",
    "@vee-validate/nuxt",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate",
    "@nuxtjs/color-mode",
    "dragon-editor",
    "nuxt-lottie",
  ],
  runtimeConfig: {
    API_TOKEN_KEY: process.env.API_TOKEN_KEY,
    API_BASE_URL: process.env.API_BASE_URL,
  },
  lottie: {
    componentName: "Lottie", // Optional: Customize the component name
    lottieFolder: "/assets/lottie", // Optional: Customize the Lottie folder path
    autoFolderCreation: true, // Optional: Auto create lottie folder (default: true)
    enableLogs: true, // Optional: Enable console logs from module (default: true)
  },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
});
