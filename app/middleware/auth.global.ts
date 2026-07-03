import { useAuthStore } from "~/stores/auth";
import { defineNuxtRouteMiddleware, navigateTo } from "#app";

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore();
  const loginPath = "/";
  const accessTokenCookie = useCookie<string | null>("access_token");
  const refreshTokenCookie = useCookie<string | null>("refresh_token");
  const hasStoreSession = Boolean(auth.hasSession);
  const hasCookieSession = Boolean(
    accessTokenCookie.value || refreshTokenCookie.value,
  );
  const hasAnySession = hasStoreSession || hasCookieSession;

  if (to.path === loginPath || to.path.startsWith("/auth")) {
    // Don't auto-redirect away from auth screens here.
    // The login/register pages themselves perform a validated redirect (refresh + /me),
    // which prevents redirect loops with stale/expired sessions.
    return;
  }

  if (!hasAnySession) {
    return navigateTo({
      path: loginPath,
      query: {
        redirect: to.fullPath,
      },
    });
  }
});
