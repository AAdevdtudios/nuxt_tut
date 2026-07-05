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
    "@nuxtjs/i18n",
    "@nuxtjs/device",
    "nuxt-tiptap-editor",
    "@vueuse/nuxt",
  ],
  tiptap: {
    prefix: "Tiptap", //prefix for Tiptap imports, composables not included
  },
  i18n: {
    defaultLocale: "en",
    strategy: "no_prefix",
    locales: [
      { code: "en", name: "English" },
      { code: "fr", name: "French" },
      { code: "es", name: "Spanish" },
    ],
  },
  runtimeConfig: {
    API_BASE_URL: process.env.API_BASE_URL || "http://localhost:5296",
    public: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
    },
  },
  // nitro: {
  //   prerender: {
  //     crawlLinks: false,
  //   },
  // },
  css: ["~/assets/css/main.css"],
  vite: {
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "app"),
      },
    },
    optimizeDeps: {
      include: [
        "@tiptap/extension-table",
        "@tiptap/extension-color",
        "@tiptap/extension-text-style",
        "zod",
      ],
    },
    plugins: [tailwindcss()],
  },
});
