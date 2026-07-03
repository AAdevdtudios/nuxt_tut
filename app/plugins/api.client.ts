type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRequestOptions<T, R> = {
  method?: ApiMethod;
  body?: any;
  query?: Record<string, any>;
  headers?: HeadersInit;
  transform?: (data: T) => R;
  onError?: (error: any) => any;
};

type ApiMutationOptions<T, R> = {
  method: Exclude<ApiMethod, "GET">;
  transform?: (data: T) => R;
  onError?: (error: any) => any;
};

const CLIENT_API_TIMEOUT_MS = 15_000;
const CLIENT_AI_API_TIMEOUT_MS = 60_000;
const NETWORK_ERROR_MESSAGE =
  "Service is temporarily unavailable. Please try again shortly.";

const isAiApiUrl = (url: string) =>
  /^\/api\/notes\/[^/]+\/chat(?:\/|$)/.test(url) ||
  /^\/api\/sources\/[^/]+\/chat(?:\/|$)/.test(url) ||
  /^\/api\/notes\/[^/]+\/actions(?:\/|$)/.test(url) ||
  /^\/api\/notes\/[^/]+\/study-guide(?:\/|$)/.test(url) ||
  /^\/api\/sources\/[^/]+\/study-guide(?:\/|$)/.test(url) ||
  /^\/api\/notes\/ai(?:\/|$)/.test(url) ||
  /^\/api\/projects\/[^/]+\/adaptive\/chat(?:\/|$)/.test(url) ||
  /^\/api\/study-sessions(?:\/|$)/.test(url);

export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp();

  const stripEndpointNoise = (message: string) => {
    const cleaned = message
      .replace(/^\[[A-Z]+\]\s+"[^"]+":\s*\d+\s*/i, "")
      .replace(/\[[A-Z]+\]\s+"https?:\/\/[^"]+":\s*<no response>\s*/gi, "")
      .replace(/\[[A-Z]+\]\s+"\/api\/[^"]+":\s*<no response>\s*/gi, "")
      .replace(/https?:\/\/[^\s"'<>]+/gi, "")
      .replace(/^One or more errors occurred![:\s]*/i, "")
      .trim();

    const lowered = cleaned.toLowerCase();
    if (
      lowered === "fetch failed" ||
      lowered.includes("<no response>") ||
      lowered.includes("networkerror") ||
      lowered.includes("network error") ||
      lowered.includes("econnrefused") ||
      lowered.includes("socket hang up") ||
      lowered.includes("connect timeout") ||
      lowered.includes("request timed out") ||
      lowered.includes("timeout")
    ) {
      return NETWORK_ERROR_MESSAGE;
    }

    return cleaned;
  };

  const flattenErrorDetails = (errors: any): string[] => {
    if (!errors || typeof errors !== "object") return [];

    return Object.entries(errors).flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((entry) =>
          stripEndpointNoise(`${key}: ${String(entry || "")}`),
        );
      }
      if (typeof value === "string") {
        return [stripEndpointNoise(`${key}: ${value}`)];
      }
      return [];
    });
  };

  const normalizeErrorMessage = (error: any, url?: string) => {
    const fallback = "Request failed. Please try again.";
    const data = error?.data || error?.response?._data;
    const code = String(data?.code || "").toLowerCase();
    const errorLabel = String(data?.error || "").toLowerCase();
    const statusCode = Number(
      error?.response?.status ||
        error?.statusCode ||
        error?.status ||
        data?.statusCode ||
        0,
    );
    const messages = new Set<string>();

    const rawNetworkMessage = [
      error?.message,
      error?.statusMessage,
      error?.cause?.message,
      data?.message,
      data?.statusMessage,
      data?.error,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (
      statusCode === 0 &&
      (rawNetworkMessage.includes("fetch failed") ||
        rawNetworkMessage.includes("<no response>") ||
        rawNetworkMessage.includes("networkerror") ||
        rawNetworkMessage.includes("network error") ||
        rawNetworkMessage.includes("econnrefused") ||
        rawNetworkMessage.includes("socket hang up") ||
        rawNetworkMessage.includes("connect timeout") ||
        rawNetworkMessage.includes("request timed out") ||
        rawNetworkMessage.includes("timeout"))
    ) {
      return NETWORK_ERROR_MESSAGE;
    }

    if (
      statusCode === 401 ||
      code === "unauthorized" ||
      errorLabel === "unauthorized"
    ) {
      if (url === "/api/auth/login") {
        return "Incorrect credentials. Please check your email and password.";
      }
      return "Unauthorized. Please log in again.";
    }

    if (
      statusCode === 403 ||
      code === "forbidden" ||
      errorLabel === "forbidden"
    ) {
      const explicit =
        typeof data?.error === "string"
          ? data.error
          : typeof data?.message === "string"
            ? data.message
            : "";
      return (
        stripEndpointNoise(explicit) ||
        "You do not have permission for this action."
      );
    }

    if (statusCode === 404 || code === "notfound") {
      const explicit =
        typeof data?.error === "string"
          ? data.error
          : typeof data?.message === "string"
            ? data.message
            : "";
      return (
        stripEndpointNoise(explicit) || "The requested resource was not found."
      );
    }

    if (typeof data?.message === "string") {
      messages.add(stripEndpointNoise(data.message));
    }

    flattenErrorDetails(data?.errors).forEach((value) => messages.add(value));

    if (typeof error?.statusMessage === "string") {
      messages.add(stripEndpointNoise(error.statusMessage));
    }

    if (typeof error?.message === "string") {
      messages.add(stripEndpointNoise(error.message));
    }

    const merged =
      Array.from(messages).filter(Boolean).join(" ").trim() || fallback;
    const lowered = merged.toLowerCase();

    if (
      lowered.includes("limit") ||
      lowered.includes("quota") ||
      lowered.includes("exceed")
    ) {
      if (
        lowered.includes("document") ||
        lowered.includes("file") ||
        lowered.includes("upload")
      ) {
        return "Document limit exceeded for your current plan.";
      }

      if (
        lowered.includes("question") ||
        lowered.includes("practice") ||
        lowered.includes("essay")
      ) {
        return "Question limit exceeded for your current plan.";
      }

      return "Your current plan limit has been exceeded.";
    }

    return stripEndpointNoise(merged) || fallback;
  };

  const withNormalizedMessage = (error: any, url?: string) => {
    const message = normalizeErrorMessage(error, url);
    const normalized = new Error(message) as any;
    normalized.cause = error;
    normalized.data = error?.data || error?.response?._data;
    normalized.status = error?.status || error?.response?.status;
    normalized.statusCode = error?.statusCode || error?.response?.status;
    normalized.statusMessage = message;
    return normalized;
  };

  const shouldBypassAuthRefresh = (url: string) =>
    url === "/api/auth/login" ||
    url === "/api/auth/register" ||
    url === "/api/auth/password/forgot" ||
    url === "/api/auth/password/reset" ||
    url === "/api/auth/account/recover" ||
    url === "/api/auth/refresh" ||
    url === "/api/auth/logout";

  const withAuthHeaders = (headers?: HeadersInit) => {
    const auth = useAuthStore();
    const normalizedHeaders = new Headers(headers);

    if (auth.accessToken) {
      normalizedHeaders.set("Authorization", `Bearer ${auth.accessToken}`);
    }

    return normalizedHeaders;
  };

  const shouldRefresh = (url: string, error: any, skipRefresh?: boolean) => {
    if (skipRefresh) return false;
    if (error?.response?.status !== 401) return false;
    if (shouldBypassAuthRefresh(url)) return false;

    const auth = useAuthStore();
    return Boolean(auth.refreshToken);
  };

  const getErrorStatusCode = (error: any) => {
    const status = Number(
      error?.response?.status ??
        error?.response?.statusCode ??
        error?.statusCode ??
        error?.status ??
        error?.data?.statusCode ??
        error?.data?.status ??
        error?.response?._data?.statusCode ??
        0,
    );

    return Number.isFinite(status) ? status : 0;
  };

  const isUnauthorizedError = (error: any) => {
    const status = getErrorStatusCode(error);
    if (status === 401) return true;

    const statusMessage = String(
      error?.statusMessage ??
        error?.data?.statusMessage ??
        error?.response?.statusText ??
        "",
    ).toLowerCase();

    const message = String(error?.message ?? "").toLowerCase();

    return (
      statusMessage.includes("unauthorized") ||
      message === "unauthorized" ||
      message.includes("unauthorized")
    );
  };

  const redirectToLogin = async () => {
    if (didRedirectToLogin) return;
    didRedirectToLogin = true;

    const redirect = (() => {
      try {
        const route = useRoute();
        return typeof route.fullPath === "string" &&
          route.fullPath.startsWith("/")
          ? route.fullPath
          : "/dashboard";
      } catch {
        return "/dashboard";
      }
    })();

    // Clear httpOnly cookies via a server endpoint before redirecting.
    try {
      await $fetch("/api/auth/logout", { method: "POST" });
    } catch {}

    const auth = useAuthStore();
    auth.clearSession();
    try {
      const access = useCookie<string | null>("access_token");
      const refresh = useCookie<string | null>("refresh_token");
      const persisted = useCookie<string | null>("auth");
      access.value = null;
      refresh.value = null;
      persisted.value = null;
    } catch {}

    // Hard redirect prevents any further API calls/toasts in the current session.
    if (process.client) {
      window.location.assign(`/?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    await nuxtApp.runWithContext(() =>
      navigateTo({
        path: "/",
        query: { redirect },
      }),
    );
  };

  let didRedirectToLogin = false;

  const request = async <T, R = T>(
    url: string,
    options: ApiRequestOptions<T, R> = {},
    skipRefresh = false,
  ): Promise<R> => {
    try {
      const auth = useAuthStore();
      const hasBody = options.body !== undefined && options.body !== null;

      if (!shouldBypassAuthRefresh(url)) {
        try {
          await auth.ensureValidAccessToken();
        } catch {
          await redirectToLogin();
          return undefined as unknown as R;
        }
      }

      const fetchOptions: {
        method: ApiMethod;
        query?: Record<string, any>;
        headers: HeadersInit;
        body?: any;
        timeout: number;
      } = {
        method: options.method || "GET",
        query: options.query,
        headers: withAuthHeaders(options.headers),
        timeout: isAiApiUrl(url)
          ? CLIENT_AI_API_TIMEOUT_MS
          : CLIENT_API_TIMEOUT_MS,
      };

      if (hasBody) {
        fetchOptions.body = options.body;
      }

      const result = (await $fetch(url, fetchOptions)) as T;

      return options.transform
        ? options.transform(result)
        : (result as unknown as R);
    } catch (error: any) {
      if (shouldRefresh(url, error, skipRefresh)) {
        const auth = useAuthStore();
        try {
          await auth.refreshAccessToken(skipRefresh);
        } catch (refreshError: any) {
          if (
            !shouldBypassAuthRefresh(url) &&
            isUnauthorizedError(refreshError)
          ) {
            await redirectToLogin();
            return undefined as unknown as R;
          }
          throw refreshError;
        }

        return request<T, R>(url, options, true);
      }

      if (!shouldBypassAuthRefresh(url) && isUnauthorizedError(error)) {
        await redirectToLogin();
        return undefined as unknown as R;
      }

      const normalizedError = withNormalizedMessage(error, url);

      if (options.onError) {
        throw options.onError(normalizedError);
      }

      throw normalizedError;
    }
  };

  const get = <T, R = T>(
    url: string,
    options?: {
      query?: Record<string, any>;
      transform?: (data: T) => R;
      onError?: (error: any) => any;
      immediate?: boolean;
    },
  ) => {
    const { transform, onError, ...rest } = options || {};

    return useAsyncData(
      `${url}:${JSON.stringify(rest.query || {})}`,
      () =>
        request<T, R>(url, {
          method: "GET",
          query: rest.query,
          transform,
          onError,
        }),
      {
        immediate: rest.immediate,
      },
    );
  };

  const useMutation = <T, R = T>(
    url: string,
    options: ApiMutationOptions<T, R>,
  ) => {
    const pending = ref(false);
    const error = ref<any>(null);
    const data = ref<R | null>(null);

    const execute = async (body?: any): Promise<R> => {
      pending.value = true;
      error.value = null;

      try {
        const result = await request<T, R>(url, {
          method: options.method,
          body,
          transform: options.transform,
          onError: options.onError,
        });

        data.value = result;
        return result;
      } catch (err: any) {
        error.value = err;
        throw err;
      } finally {
        pending.value = false;
      }
    };

    return {
      execute,
      pending: readonly(pending),
      error: readonly(error),
      data: readonly(data),
    };
  };

  const mutate = async <T, R = T>(
    url: string,
    options: {
      method: Exclude<ApiMethod, "GET">;
      body?: any;
      transform?: (data: T) => R;
      onError?: (error: any) => any;
    },
  ): Promise<R> =>
    request<T, R>(url, {
      method: options.method,
      body: options.body,
      transform: options.transform,
      onError: options.onError,
    });

  return {
    provide: {
      api: {
        fetch: request,
        get,
        mutate,
        useMutation,
      },
    },
  };
});
