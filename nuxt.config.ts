import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  experimental: {
    // Prevent /_nuxt/builds/meta/dev.json prefetch lookups in dev mode.
    appManifest: false,
    defaults: {
      nuxtLink: {
        prefetch: false,
      },
    },
  },
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
    "@nuxtjs/i18n",
    "@nuxtjs/device",
    "nuxt-tiptap-editor",
    "@vueuse/nuxt",
  ],
  tiptap: {
    prefix: "Tiptap", //prefix for Tiptap imports, composables not included
  },
  runtimeConfig: {
    API_TOKEN_KEY: process.env.API_TOKEN_KEY,
    API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5296",
  },
  // nitro: {
  //   prerender: {
  //     crawlLinks: false,
  //   },
  // },
  lottie: {
    componentName: "Lottie", // Optional: Customize the component name
    lottieFolder: "/assets/lottie", // Optional: Customize the Lottie folder path
    autoFolderCreation: true, // Optional: Auto create lottie folder (default: true)
    enableLogs: true, // Optional: Enable console logs from module (default: true)
  },
  css: ["~/assets/css/main.css"],
  vite: {
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "app"),
      },
    },
    plugins: [tailwindcss()],
  },
});
