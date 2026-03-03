import { useRuntimeConfig } from "#imports";
import { createError, getCookie, getHeader } from "h3";

function normalizeUpstreamMessage(error: any) {
  const data = error?.data;

  if (typeof data?.message === "string" && data.message !== "One or more errors occurred!") {
    return data.message;
  }

  const serializerErrors = data?.errors?.serializerErrors;
  if (Array.isArray(serializerErrors) && serializerErrors.length > 0) {
    return serializerErrors.join(", ");
  }

  const errorEntries = data?.errors && typeof data.errors === "object"
    ? Object.entries(data.errors)
        .flatMap(([key, value]) => {
          if (Array.isArray(value)) {
            return value.map((message) => `${key}: ${message}`);
          }

          if (typeof value === "string") {
            return `${key}: ${value}`;
          }

          return [];
        })
        .filter(Boolean)
    : [];

  if (errorEntries.length > 0) {
    return errorEntries.join(", ");
  }

  return (
    data?.message ||
    error?.statusMessage ||
    error?.message ||
    "Upstream API error"
  );
}

export const useApi = async <T>(
  event: any,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
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
  const hasBody = body !== undefined && body !== null;

  // Only send a JSON content type when a JSON payload is actually present.
  // This backend rejects body-less GET requests that still advertise JSON.
  if (
    hasBody &&
    !skipContentType &&
    !(body instanceof FormData)
  ) {
    headers["Content-Type"] = "application/json";
  }

  if (useJwt) {
    const forwardedAuthorization = getHeader(event, "authorization");
    const token = getCookie(event, "access_token");

    if (forwardedAuthorization) {
      headers.Authorization = forwardedAuthorization;
    } else if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const config = useRuntimeConfig();
  const baseUrl = config.API_BASE_URL;

  try {
    return (await $fetch<T>(`${baseUrl}${path}`, {
      method,
      headers,
      body: hasBody ? body : undefined,
    })) as T;
  } catch (error: any) {
    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: normalizeUpstreamMessage(error),
      data: error?.data,
    });
  }
};
