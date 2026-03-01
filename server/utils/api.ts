import { useRuntimeConfig } from "#imports";
import { createError, getCookie } from "h3";

export const useApi = async <T>(
  event: any,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    useJwt?: boolean;
    skipContentType?: boolean;
  } = {},
): Promise<T> => {
  const {
    method = "GET",
    body,
    useJwt = true,
    skipContentType = false,
  } = options;

  const headers: Record<string, string> = {};

  // Only set Content-Type if not FormData and not explicitly skipped
  if (!skipContentType && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (useJwt) {
    const token = getCookie(event, "access_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const config = useRuntimeConfig();
  const baseUrl = config.API_BASE_URL;
  console.log(baseUrl);

  try {
    return (await $fetch<T>(`${baseUrl}${path}`, {
      method,
      headers,
      body,
    })) as T;
  } catch (error: any) {
    /**
     * Normalize ALL upstream errors
     */
    console.log(error);

    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage:
        error?.data?.error?.message ||
        error?.data?.message ||
        "Upstream API error",
      data: error?.data,
    });
  }
};
