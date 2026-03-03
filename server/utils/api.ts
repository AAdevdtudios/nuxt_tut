import { useRuntimeConfig } from "#imports";
import { createError, getCookie, getHeader, setCookie } from "h3";

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
  const executeRequest = async (headers: Record<string, string>) => {
    const config = useRuntimeConfig();
    const baseUrl = config.API_BASE_URL;

    return (await $fetch<T>(`${baseUrl}${path}`, {
      method,
      headers,
      body: hasBody ? body : undefined,
    })) as T;
  };

  const refreshServerSession = async () => {
    const refreshToken = getCookie(event, "refresh_token");

    if (!refreshToken) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
      });
    }

    const config = useRuntimeConfig();
    const session = await $fetch<any>(`${config.API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: {
        refreshToken,
      },
    });

    const secure = process.env.NODE_ENV === "production";

    setCookie(event, "access_token", session.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      expires: new Date(session.accessTokenExpiresAtUtc),
      path: "/",
    });

    setCookie(event, "refresh_token", session.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      expires: new Date(session.refreshTokenExpiresAtUtc),
      path: "/",
    });

    return session;
  };

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

  try {
    return await executeRequest(headers);
  } catch (error: any) {
    const shouldRefresh =
      useJwt &&
      error?.response?.status === 401 &&
      path !== "/auth/refresh" &&
      Boolean(getCookie(event, "refresh_token"));

    if (shouldRefresh) {
      try {
        const session = await refreshServerSession();
        headers.Authorization = `Bearer ${session.accessToken}`;
        return await executeRequest(headers);
      } catch (refreshError: any) {
        throw createError({
          statusCode: refreshError?.response?.status || refreshError?.statusCode || 401,
          statusMessage: normalizeUpstreamMessage(refreshError),
          data: refreshError?.data,
        });
      }
    }

    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: normalizeUpstreamMessage(error),
      data: error?.data,
    });
  }
};
