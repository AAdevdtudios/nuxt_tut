export default defineNuxtPlugin(() => {
  const auth = useAuthStore();
  const route = useRoute();

  const isAuthRoute = (path: string) =>
    path === "/" || path.startsWith("/auth");

  const clearCookiesClient = () => {
    try {
      const access = useCookie<string | null>("access_token");
      const refresh = useCookie<string | null>("refresh_token");
      const persisted = useCookie<string | null>("auth");
      access.value = null;
      refresh.value = null;
      persisted.value = null;
    } catch {}
  };

  const logoutAndRedirect = async () => {
    const redirect =
      typeof route.fullPath === "string" && route.fullPath.startsWith("/")
        ? route.fullPath
        : "/dashboard";

    // Clear httpOnly cookies on the server too.
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    auth.clearSession();
    clearCookiesClient();

    if (isAuthRoute(route.path)) return;

    // Hard redirect to stop any in-flight requests/toasts.
    window.location.assign(`/?redirect=${encodeURIComponent(redirect)}`);
  };

  let running = false;
  const check = async () => {
    if (running) return;
    running = true;
    try {
      // If refresh token is expired, refresh will never work; force logout.
      if (auth.refreshToken && auth.isRefreshTokenExpired(0)) {
        await logoutAndRedirect();
        return;
      }

      // If we have a refresh token and access token is near-expiry, refresh in the background.
      if (auth.refreshToken && auth.isAccessTokenExpired()) {
        try {
          await auth.refreshAccessToken();
        } catch {
          await logoutAndRedirect();
        }
      }
    } finally {
      running = false;
    }
  };

  // Run once after hydration and keep it up-to-date.
  requestAnimationFrame(() => {
    void check();
  });

  const interval = window.setInterval(() => void check(), 30_000);

  const onVisibility = () => {
    if (document.visibilityState === "visible") void check();
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("focus", check);

  // Cleanup on HMR / app teardown
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", check);
    });
  }
});
