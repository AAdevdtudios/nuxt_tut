export default defineNuxtPlugin(() => {
  /**
   * GET requests (data fetching)
   */
  const get = <T, R = T>(
    url: string,
    options?: {
      query?: Record<string, any>;
      transform?: (data: T) => R;
      onError?: (error: any) => any;
      immediate?: boolean;
    }
  ) => {
    const { transform, onError, ...rest } = options || {};

    const res = useFetch<T>(url, {
      ...rest,
      onResponseError({ response }) {
        if (onError) {
          throw onError(response._data);
        }
      },
    });

    const data = computed<R | null>(() => {
      if (!res.data.value) return null;
      return transform
        ? transform(res.data.value as T)
        : (res.data.value as any);
    });

    return {
      ...res,
      data,
    };
  };

  /**
   * Reactive mutations (POST, PUT, PATCH, DELETE)
   */
  const useMutation = <T, R = T>(
    url: string,
    options: {
      method: "POST" | "PUT" | "PATCH" | "DELETE";
      transform?: (data: T) => R;
      onError?: (error: any) => any;
    }
  ) => {
    const pending = ref(false);
    const error = ref<any>(null);
    const data = ref<R | null>(null);

    const execute = async (body?: any): Promise<R> => {
      pending.value = true;
      error.value = null;

      try {
        const res = await $fetch<T>(url, {
          method: options.method,
          body,
        });

        const result = options.transform
          ? options.transform(res as T)
          : (res as any);
        data.value = result;
        return result;
      } catch (err: any) {
        error.value = options.onError ? options.onError(err) : err;
        throw error.value;
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

  /**
   * Simple mutation (no reactivity)
   */
  const mutate = async <T, R = T>(
    url: string,
    options: {
      method: "POST" | "PUT" | "PATCH" | "DELETE";
      body?: any;
      transform?: (data: T) => R;
      onError?: (error: any) => any;
    }
  ): Promise<R> => {
    try {
      const data = await $fetch<T>(url, {
        method: options.method,
        body: options.body,
      });

      return options.transform ? options.transform(data as T) : (data as any);
    } catch (error: any) {
      if (options.onError) {
        throw options.onError(error);
      }
      throw error;
    }
  };

  return {
    provide: {
      api: {
        get,
        mutate,
        useMutation, // 👈 important
      },
    },
  };
});
