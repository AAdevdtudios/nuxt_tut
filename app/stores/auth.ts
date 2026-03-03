import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { ENV } from "~/constants/env";
import type { AuthSessionResponse, User } from "~/types";

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 30 * 1000;

function toUser(session: AuthSessionResponse): User {
  return {
    id: session.userId,
    email: session.email,
    displayName: session.displayName,
    role: session.role,
  };
}

export const useAuthStore = defineStore(
  "auth",
  () => {
    const accessToken = ref<string | null>(null);
    const accessTokenExpiresAtUtc = ref<string | null>(null);
    const refreshToken = ref<string | null>(null);
    const refreshTokenExpiresAtUtc = ref<string | null>(null);
    const user = ref<User | null>(null);
    const refreshRequest = ref<Promise<AuthSessionResponse> | null>(null);

    function setSession(session: AuthSessionResponse) {
      accessToken.value = session.accessToken;
      accessTokenExpiresAtUtc.value = session.accessTokenExpiresAtUtc;
      refreshToken.value = session.refreshToken;
      refreshTokenExpiresAtUtc.value = session.refreshTokenExpiresAtUtc;
      user.value = toUser(session);
    }

    function setUser(profile: User) {
      user.value = profile;
    }

    function clearSession() {
      accessToken.value = null;
      accessTokenExpiresAtUtc.value = null;
      refreshToken.value = null;
      refreshTokenExpiresAtUtc.value = null;
      user.value = null;
    }

    function isAccessTokenExpired(bufferMs = ACCESS_TOKEN_REFRESH_BUFFER_MS) {
      if (!accessToken.value || !accessTokenExpiresAtUtc.value) {
        return true;
      }

      return (
        new Date(accessTokenExpiresAtUtc.value).getTime() - bufferMs <= Date.now()
      );
    }

    async function ensureValidAccessToken() {
      if (!refreshToken.value) {
        return accessToken.value;
      }

      if (isAccessTokenExpired()) {
        const session = await refreshAccessToken();
        return session.accessToken;
      }

      return accessToken.value;
    }

    async function login(payload: { email: string; password: string }) {
      const { $api } = useNuxtApp();
      const session = await $api.mutate<AuthSessionResponse>(
        ENV.API_ENDPOINTS.LOGIN,
        {
          method: "POST",
          body: payload,
          onError: (error) => ({
            message: error?.data?.message || "Invalid credentials",
          }),
        },
      );

      setSession(session);
      return session;
    }

    async function register(payload: {
      displayName: string;
      email: string;
      password: string;
    }) {
      const { $api } = useNuxtApp();
      const session = await $api.mutate<AuthSessionResponse>(
        ENV.API_ENDPOINTS.REGISTER,
        {
          method: "POST",
          body: payload,
          onError: (error) => ({
            message: error?.data?.message || "Registration failed",
          }),
        },
      );

      setSession(session);
      return session;
    }

    async function fetchCurrentUser() {
      const { $api } = useNuxtApp();
      const profile = await $api.fetch<User>(ENV.API_ENDPOINTS.ME, {
        method: "GET",
      });

      setUser(profile);
      return profile;
    }

    async function refreshAccessToken(force = false) {
      if (!refreshToken.value) {
        throw new Error("Missing refresh token");
      }

      if (refreshRequest.value && !force) {
        return refreshRequest.value;
      }

      const { $api } = useNuxtApp();
      refreshRequest.value = $api
        .mutate<AuthSessionResponse>(ENV.API_ENDPOINTS.REFRESH, {
          method: "POST",
          body: {
            refreshToken: refreshToken.value,
          },
          onError: (error) => ({
            message: error?.data?.message || "Session expired",
          }),
        })
        .then((session) => {
          setSession(session);
          return session;
        })
        .catch((error) => {
          clearSession();
          throw error;
        })
        .finally(() => {
          refreshRequest.value = null;
        });

      return refreshRequest.value;
    }

    async function logout() {
      const { $api } = useNuxtApp();

      try {
        await $api.mutate(ENV.API_ENDPOINTS.LOGOUT, {
          method: "POST",
        });
      } finally {
        clearSession();
      }
    }

    const isAuthenticated = computed(() => Boolean(accessToken.value));
    const hasSession = computed(
      () => Boolean(accessToken.value || refreshToken.value),
    );
    const currentUser = computed(() => user.value);

    return {
      accessToken,
      accessTokenExpiresAtUtc,
      refreshToken,
      refreshTokenExpiresAtUtc,
      user,
      setSession,
      setUser,
      clearSession,
      login,
      register,
      fetchCurrentUser,
      refreshAccessToken,
      ensureValidAccessToken,
      logout,
      isAuthenticated,
      hasSession,
      currentUser,
      isAccessTokenExpired,
    };
  },
  {
    persist: true,
  },
);
