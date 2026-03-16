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

  const stripEndpointNoise = (message: string) =>
    message
      .replace(/^\[[A-Z]+\]\s+"[^"]+":\s*\d+\s*/i, "")
      .replace(/^One or more errors occurred![:\s]*/i, "")
      .trim();

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

  const normalizeErrorMessage = (error: any) => {
    const fallback = "Request failed. Please try again.";
    const data = error?.data || error?.response?._data;
    const code = String(data?.code || "").toLowerCase();
    const errorLabel = String(data?.error || "").toLowerCase();
    const statusCode = Number(
      error?.response?.status || error?.statusCode || error?.status || data?.statusCode || 0,
    );
    const messages: string[] = [];

    if (statusCode === 401 || code === "unauthorized" || errorLabel === "unauthorized") {
      return "Unauthorized. Please log in again.";
    }

    if (statusCode === 403 || code === "forbidden" || errorLabel === "forbidden") {
      const explicit =
        typeof data?.error === "string"
          ? data.error
          : typeof data?.message === "string"
            ? data.message
            : "";
      return stripEndpointNoise(explicit) || "You do not have permission for this action.";
    }

    if (statusCode === 404 || code === "notfound") {
      const explicit =
        typeof data?.error === "string"
          ? data.error
          : typeof data?.message === "string"
            ? data.message
            : "";
      return stripEndpointNoise(explicit) || "The requested resource was not found.";
    }

    if (typeof data?.message === "string") {
      messages.push(stripEndpointNoise(data.message));
    }

    messages.push(...flattenErrorDetails(data?.errors));

    if (typeof error?.statusMessage === "string") {
      messages.push(stripEndpointNoise(error.statusMessage));
    }

    if (typeof error?.message === "string") {
      messages.push(stripEndpointNoise(error.message));
    }

    const merged = messages.filter(Boolean).join(" ").trim() || fallback;
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

    return merged;
  };

  const withNormalizedMessage = (error: any) => {
    const message = normalizeErrorMessage(error);
    const normalized = new Error(message) as any;
    normalized.cause = error;
    normalized.data = error?.data || error?.response?._data;
    normalized.status = error?.status || error?.response?.status;
    normalized.statusCode = error?.statusCode || error?.response?.status;
    normalized.statusMessage = message;
    return normalized;
  };

  const isUnauthorizedError = (error: any) =>
    error?.response?.status === 401 ||
    error?.statusCode === 401 ||
    error?.status === 401 ||
    error?.statusMessage === "Unauthorized" ||
    error?.data?.statusMessage === "Unauthorized" ||
    error?.message === "Unauthorized";

  const redirectToLogin = async () =>
    await nuxtApp.runWithContext(() =>
      navigateTo("/", {
        redirectCode: 302,
      }),
    );

  const request = async <T, R = T>(
    url: string,
    options: ApiRequestOptions<T, R> = {},
  ): Promise<R> => {
    try {
      const hasBody = options.body !== undefined && options.body !== null;
      const fetchOptions: {
        method: ApiMethod;
        query?: Record<string, any>;
        headers: HeadersInit;
        body?: any;
      } = {
        method: options.method || "GET",
        query: options.query,
        headers: {
          ...forwardedHeaders,
          ...(options.headers || {}),
        },
      };

      if (hasBody) {
        fetchOptions.body = options.body;
      }

      const result = (await $fetch(url, fetchOptions)) as T;

      return options.transform ? options.transform(result) : (result as unknown as R);
    } catch (error: any) {
      if (
        !url.startsWith("/api/auth/") &&
        isUnauthorizedError(error)
      ) {
        await redirectToLogin();
      }

      const normalizedError = withNormalizedMessage(error);

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
