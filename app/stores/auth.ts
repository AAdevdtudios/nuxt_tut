import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { ENV } from "~/constants/env";
import type { AuthSessionResponse, User } from "~/types";
import { useProjectStore } from "~/stores/projects";
import { useLibraryStore } from "~/stores/libraries";

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 30 * 1000;
const REFRESH_TOKEN_EXPIRY_BUFFER_MS = 5 * 1000;

function toUser(session: AuthSessionResponse): User {
  return {
    id: session.userId,
    email: session.email,
    name: session.name,
    displayName: session.displayName,
    role: session.role,
  };
}

function normalizeUserProfile(raw: any, current: User | null): User {
  const payload = raw?.data ?? raw?.user ?? raw ?? {};
  const subscription =
    payload?.subscription ??
    payload?.currentSubscription ??
    current?.subscription ??
    null;

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

    function clearWorkspaceStores() {
      const projectStore = useProjectStore();
      const libraryStore = useLibraryStore();
      projectStore.clearProjects();
      libraryStore.clearLibraries();
    }

    function setSession(session: AuthSessionResponse) {
      const baseUser = toUser(session);
      const shouldPreserveProfileExtras =
        user.value && user.value.id === baseUser.id;
      const hasUserSwitched = user.value?.id && user.value.id !== baseUser.id;

      if (hasUserSwitched) {
        clearWorkspaceStores();
      }

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
      clearWorkspaceStores();
    }

    function isAccessTokenExpired(bufferMs = ACCESS_TOKEN_REFRESH_BUFFER_MS) {
      if (!accessToken.value || !accessTokenExpiresAtUtc.value) {
        return true;
      }

      return (
        new Date(accessTokenExpiresAtUtc.value).getTime() - bufferMs <=
        Date.now()
      );
    }

    function isRefreshTokenExpired(bufferMs = REFRESH_TOKEN_EXPIRY_BUFFER_MS) {
      if (!refreshToken.value || !refreshTokenExpiresAtUtc.value) {
        return true;
      }

      return (
        new Date(refreshTokenExpiresAtUtc.value).getTime() - bufferMs <=
        Date.now()
      );
    }

    async function ensureValidAccessToken() {
      if (!refreshToken.value) {
        if (!accessToken.value) {
          clearSession();
          throw new Error("Session expired");
        }

        if (isAccessTokenExpired(0)) {
          clearSession();
          throw new Error("Session expired");
        }

        return accessToken.value;
      }

      // If refresh token is expired, refresh will never work. Clear local session early.
      if (isRefreshTokenExpired()) {
        clearSession();
        throw new Error("Session expired");
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
        },
      );

      setSession(session);
      return session;
    }

    async function register(payload: {
      name: string;
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
      if (!profile) {
        clearSession();
        throw new Error("Unauthorized");
      }
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

    async function updateProfileUsername(displayName: string) {
      const { $api } = useNuxtApp();
      const response = await $api.mutate<{
        message: string;
        user: User;
      }>(ENV.API_ENDPOINTS.UPDATE_PROFILE_USERNAME, {
        method: "PATCH",
        body: { displayName },
      });

      if (response?.user) setUser(response.user);
      return response;
    }

    async function deleteAccount() {
      const { $api } = useNuxtApp();
      const response = await $api.mutate<{ message: string }>(
        ENV.API_ENDPOINTS.DELETE_ACCOUNT,
        { method: "DELETE" },
      );
      clearSession();
      return response;
    }

    async function recoverAccount(payload: { email: string; password: string }) {
      const { $api } = useNuxtApp();
      const session = await $api.mutate<AuthSessionResponse>(
        ENV.API_ENDPOINTS.RECOVER_ACCOUNT,
        {
          method: "POST",
          body: payload,
        },
      );
      setSession(session);
      return session;
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
          if (!session?.accessToken || !session?.refreshToken) {
            clearSession();
            throw new Error("Session expired");
          }
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

    async function forgotPassword(email: string) {
      const { $api } = useNuxtApp();
      return await $api.mutate<{
        message?: string;
        resetToken?: string | null;
      }>(ENV.API_ENDPOINTS.FORGOT_PASSWORD, {
        method: "POST",
        body: {
          email,
        },
      });
    }

    async function resetPassword(payload: {
      token: string;
      newPassword: string;
    }) {
      const { $api } = useNuxtApp();
      return await $api.mutate<{
        message?: string;
      }>(ENV.API_ENDPOINTS.RESET_PASSWORD, {
        method: "POST",
        body: payload,
      });
    }

    const isAuthenticated = computed(() => Boolean(accessToken.value));
    const hasSession = computed(() => {
      // "Session" here means we have at least one usable token.
      if (refreshToken.value && !isRefreshTokenExpired(0)) return true;
      if (accessToken.value && !isAccessTokenExpired(0)) return true;
      return false;
    });
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
      updateProfileUsername,
      deleteAccount,
      recoverAccount,
      refreshAccessToken,
      ensureValidAccessToken,
      logout,
      forgotPassword,
      resetPassword,
      isAuthenticated,
      hasSession,
      currentUser,
      isAccessTokenExpired,
      isRefreshTokenExpired,
    };
  },
  {
    persist: true,
  },
);
