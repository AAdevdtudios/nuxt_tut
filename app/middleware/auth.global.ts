import { useAuthStore } from "~/stores/auth";
import { defineNuxtRouteMiddleware, navigateTo } from "#app";

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  const accessTokenCookie = useCookie<string | null>("access_token");
  const refreshTokenCookie = useCookie<string | null>("refresh_token");

  // Allow access to auth pages
  if (to.path.startsWith("/auth")) return;

  if (
    !auth.hasSession &&
    !accessTokenCookie.value &&
    !refreshTokenCookie.value
  ) {
    return navigateTo("/auth/login");
  }
});
