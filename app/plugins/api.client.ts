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

export default defineNuxtPlugin(() => {
  const shouldBypassAuthRefresh = (url: string) =>
    url === "/api/auth/login" ||
    url === "/api/auth/register" ||
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

  const request = async <T, R = T>(
    url: string,
    options: ApiRequestOptions<T, R> = {},
    skipRefresh = false,
  ): Promise<R> => {
    try {
      const auth = useAuthStore();

      if (!shouldBypassAuthRefresh(url)) {
        await auth.ensureValidAccessToken();
      }

      const result = (await $fetch(url, {
        method: options.method || "GET",
        body: options.body,
        query: options.query,
        headers: withAuthHeaders(options.headers),
      })) as T;

      return options.transform ? options.transform(result) : (result as unknown as R);
    } catch (error: any) {
      if (shouldRefresh(url, error, skipRefresh)) {
        const auth = useAuthStore();
        await auth.refreshAccessToken(skipRefresh);

        return request<T, R>(url, options, true);
      }

      if (options.onError) {
        throw options.onError(error);
      }

      throw error;
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

  const useMutation = <T, R = T>(url: string, options: ApiMutationOptions<T, R>) => {
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
