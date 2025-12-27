import { defineNuxtPlugin } from "#app";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

export default defineNuxtPlugin(({ $pinia }) => {
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
});
