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
    // Only redirect away from auth screens when we have an actual client session.
    // A stale refresh cookie alone can cause redirect loops.
    if (hasStoreSession && (to.path === loginPath || to.path.startsWith("/auth"))) {
      const redirect =
        typeof to.query.redirect === "string" && to.query.redirect.startsWith("/")
          ? to.query.redirect
          : "/dashboard";

      return navigateTo(redirect);
    }

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
