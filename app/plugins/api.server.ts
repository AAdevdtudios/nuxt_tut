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
  const nuxtApp = useNuxtApp();
  const forwardedHeaders = useRequestHeaders(["cookie", "authorization"]);

  const isUnauthorizedError = (error: any) =>
    error?.response?.status === 401 ||
    error?.statusCode === 401 ||
    error?.status === 401 ||
    error?.statusMessage === "Unauthorized" ||
    error?.data?.statusMessage === "Unauthorized" ||
    error?.message === "Unauthorized";

  const redirectToLogin = async () =>
    await nuxtApp.runWithContext(() =>
      navigateTo("/auth/login", {
        redirectCode: 302,
      }),
    );

  const request = async <T, R = T>(
    url: string,
    options: ApiRequestOptions<T, R> = {},
  ): Promise<R> => {
    try {
      const result = (await $fetch(url, {
        method: options.method || "GET",
        body: options.body,
        query: options.query,
        headers: {
          ...forwardedHeaders,
          ...(options.headers || {}),
        },
      })) as T;

      return options.transform ? options.transform(result) : (result as unknown as R);
    } catch (error: any) {
      if (
        !url.startsWith("/api/auth/") &&
        isUnauthorizedError(error)
      ) {
        await redirectToLogin();
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
