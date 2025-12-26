import { useRuntimeConfig } from "#imports";
import { createError, getCookie } from "h3";

export const useApi = async <T>(
  event: any,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    useJwt?: boolean;
  } = {}
): Promise<T> => {
  const { method = "GET", body, useJwt = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (useJwt) {
    const token = getCookie(event, "access_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const config = useRuntimeConfig();
  const baseUrl = config.API_BASE_URL;

  try {
    return await $fetch<T>(`${baseUrl}${path}`, {
      method,
      headers,
      body,
    });
  } catch (error: any) {
    /**
     * Normalize ALL upstream errors
     */
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
