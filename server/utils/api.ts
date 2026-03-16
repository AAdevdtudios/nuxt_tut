import { useRuntimeConfig } from "#imports";
import { createError, getCookie, getHeader, setCookie } from "h3";

function normalizeUpstreamMessage(error: any) {
  const data = error?.data;
  const code = String(data?.code || "").toLowerCase();
  const errorLabel = String(data?.error || "").toLowerCase();
  const statusCode = Number(
    error?.response?.status || error?.statusCode || data?.statusCode || 0,
  );

  const stripNoise = (value: string) =>
    value
      .replace(/^\[[A-Z]+\]\s+"[^"]+":\s*\d+\s*/i, "")
      .replace(/^One or more errors occurred![:\s]*/i, "")
      .trim();

  // Handle validation errors (code === "validation")
  const isValidationError = code === "validation";

  const detailsFromMap =
    data?.errors && typeof data.errors === "object"
      ? Object.entries(data.errors)
          .flatMap(([key, value]) => {
            if (Array.isArray(value)) {
              return value.map((message) => {
                const cleanMessage = stripNoise(String(message));
                // Format: "fieldName: error message"
                return `${key}: ${cleanMessage}`;
              });
            }

            if (typeof value === "string") {
              const cleanMessage = stripNoise(String(value));
              return `${key}: ${cleanMessage}`;
            }

            return [];
          })
          .filter(Boolean)
      : [];

  const mergedDetails = detailsFromMap.join(", ");

  // Handle 401 - Unauthorized (typically authentication failures)
  if (
    statusCode === 401 ||
    code === "unauthorized" ||
    errorLabel === "unauthorized"
  ) {
    return "Incorrect credentials. Please check your email and password.";
  }

  // Handle 403 - Forbidden
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
      stripNoise(explicit) ||
      "You don't have permission to perform this action."
    );
  }

  // Handle 404 - Not Found
  if (statusCode === 404 || code === "notfound") {
    const explicit =
      typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
          ? data.message
          : "";
    return stripNoise(explicit) || "Resource not found.";
  }

  // Handle validation errors with field details
  if (isValidationError && mergedDetails) {
    return "Validation failed. Please check the highlighted fields.";
  }

  // Handle explicit message
  if (
    typeof data?.message === "string" &&
    data.message !== "One or more errors occurred!"
  ) {
    return stripNoise(data.message);
  }

  // Handle serializer errors
  const serializerErrors = data?.errors?.serializerErrors;
  if (Array.isArray(serializerErrors) && serializerErrors.length > 0) {
    const formatted = serializerErrors
      .map((line: string) => stripNoise(line))
      .filter(Boolean)
      .join(", ");
    if (formatted) return formatted;
  }

  // Fall back to merged details or generic message
  if (mergedDetails) {
    return mergedDetails;
  }

  // Generic error fallback based on status code
  if (statusCode >= 500) {
    return "Server error. Please try again later.";
  }

  if (statusCode >= 400) {
    return "An error occurred. Please check your input and try again.";
  }

  return stripNoise(
    data?.error ||
      data?.message ||
      error?.statusMessage ||
      error?.message ||
      "An unexpected error occurred.",
  );
}

function extractFieldErrors(data: any): Record<string, string[]> {
  if (!data?.errors || typeof data.errors !== "object") {
    return {};
  }

  const fieldErrors: Record<string, string[]> = {};

  Object.entries(data.errors).forEach(([field, value]) => {
    if (Array.isArray(value)) {
      fieldErrors[field] = value.map((msg) =>
        String(msg)
          .replace(/^\[[A-Z]+\]\s+"[^"]+":\s*\d+\s*/i, "")
          .trim(),
      );
    } else if (typeof value === "string") {
      fieldErrors[field] = [
        String(value)
          .replace(/^\[[A-Z]+\]\s+"[^"]+":\s*\d+\s*/i, "")
          .trim(),
      ];
    }
  });

  return fieldErrors;
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
  if (hasBody && !skipContentType && !(body instanceof FormData)) {
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
          statusCode:
            refreshError?.response?.status || refreshError?.statusCode || 401,
          statusMessage: normalizeUpstreamMessage(refreshError),
          data: {
            ...refreshError?.data,
            fieldErrors: extractFieldErrors(refreshError?.data),
          },
        });
      }
    }

    throw createError({
      statusCode: error?.response?.status || 500,
      statusMessage: normalizeUpstreamMessage(error),
      data: {
        ...error?.data,
        fieldErrors: extractFieldErrors(error?.data),
      },
    });
  }
};
