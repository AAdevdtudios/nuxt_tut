import { useAuthStore } from "~/stores/auth";
import { defineNuxtRouteMiddleware, navigateTo } from "#app";

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  // Allow access to auth pages
  if (to.path.startsWith("/auth")) return;
  // If not authenticated, redirect to login
  if (!auth.isAuthenticated) {
    return navigateTo("/auth/login");
  }
});
