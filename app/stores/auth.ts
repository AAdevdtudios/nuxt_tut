import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ENV } from "~/constants/env";
import type { User, AuthResponse } from "~/types";

export const useAuthStore = defineStore(
  "auth",
  () => {
    const token = ref<string | null>(null);
    const user = ref<User | null>(null);

    function setAuth(auth: AuthResponse) {
      token.value = auth.jwt;
      user.value = auth.user;
    }

    function logout() {
      token.value = null;
      user.value = null;
    }

    // Login action
    async function login(payload: { email: string; password: string }) {
      const { $api } = useNuxtApp();
      const mutation = $api.useMutation<AuthResponse, AuthResponse>(
        ENV.API_ENDPOINTS.LOGIN,
        {
          method: "POST",
          onError: (err) => ({
            message: err.data?.message || "Invalid credentials",
          }),
        }
      );
      const response = await mutation.execute(payload);
      setAuth({ jwt: response.jwt || "", user: response.user });
      return response.user;
    }

    // Register action
    async function register(payload: {
      username: string;
      email: string;
      password: string;
    }) {
      const { $api } = useNuxtApp();
      const mutation = $api.useMutation<AuthResponse, AuthResponse>(
        ENV.API_ENDPOINTS.REGISTER,
        {
          method: "POST",
          onError: (err) => ({
            message: err.data?.message || "Invalid credentials",
          }),
        }
      );
      const response = await mutation.execute(payload);
      setAuth({ jwt: response.jwt || "", user: response.user });
      return response.user;
    }

    const isAuthenticated = computed(() => !!token.value);
    const currentUser = computed(() => user.value);

    return {
      token,
      user,
      setAuth,
      logout,
      login,
      register,
      isAuthenticated,
      currentUser,
    };
  },
  {
    persist: true,
  }
);
