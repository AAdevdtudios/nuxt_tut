import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { ENV } from "~/constants/env";
import type { AuthSessionResponse, User } from "~/types";

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 30 * 1000;

function toUser(session: AuthSessionResponse): User {
  return {
    id: session.userId,
    email: session.email,
    name: session.displayName,
    displayName: session.displayName,
    role: session.role,
  };
}

function normalizeUserProfile(raw: any, current: User | null): User {
  const payload = raw?.data ?? raw?.user ?? raw ?? {};
  const subscription =
    payload?.subscription ?? payload?.currentSubscription ?? current?.subscription ?? null;

  return {
    id: String(payload?.id ?? current?.id ?? ""),
    email: String(payload?.email ?? current?.email ?? ""),
    name: payload?.name ?? current?.name,
    displayName: String(
      payload?.displayName ?? payload?.username ?? current?.displayName ?? "",
    ),
    role: String(payload?.role ?? current?.role ?? "user"),
    createdAtUtc: payload?.createdAtUtc ?? current?.createdAtUtc,
    isLocked: payload?.isLocked ?? current?.isLocked,
    subscription: subscription ?? null,
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
      const baseUser = toUser(session);
      const shouldPreserveProfileExtras =
        user.value && user.value.id === baseUser.id;

      accessToken.value = session.accessToken;
      accessTokenExpiresAtUtc.value = session.accessTokenExpiresAtUtc;
      refreshToken.value = session.refreshToken;
      refreshTokenExpiresAtUtc.value = session.refreshTokenExpiresAtUtc;
      user.value = shouldPreserveProfileExtras
        ? {
            ...user.value,
            ...baseUser,
          }
        : baseUser;
    }

    function setUser(profile: User) {
      user.value = {
        ...user.value,
        ...profile,
      } as User;
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
      const profile = await $api.fetch<any>(ENV.API_ENDPOINTS.ME, {
        method: "GET",
      });
      const normalized = normalizeUserProfile(profile, user.value);
      setUser(normalized);
      return normalized;
    }

    async function updateProfileName(name: string) {
      const { $api } = useNuxtApp();
      const response = await $api.mutate<{
        message: string;
        user: User & { name?: string };
      }>(ENV.API_ENDPOINTS.UPDATE_PROFILE_NAME, {
        method: "PATCH",
        body: {
          name,
        },
      });

      if (response?.user) {
        setUser({
          ...user.value,
          ...response.user,
          displayName: response.user.displayName || response.user.name || name,
        } as User);
      }

      return response;
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
      updateProfileName,
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
