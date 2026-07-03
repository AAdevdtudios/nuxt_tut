import { useRuntimeConfig } from "#imports";
import { createError, deleteCookie, getCookie, getHeader, setCookie } from "h3";

const UPSTREAM_TIMEOUT_MS = 10_000;
const AI_UPSTREAM_TIMEOUT_MS = 60_000;
const UPSTREAM_UNAVAILABLE_MESSAGE =
  "Service is temporarily unavailable. Please try again shortly.";

const LOG_COLORS = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
};

function isAiUpstreamPath(path: string) {
  return (
    /^\/notes\/[^/]+\/chat(?:\/|$)/.test(path) ||
    /^\/sources\/[^/]+\/chat(?:\/|$)/.test(path) ||
    /^\/notes\/[^/]+\/actions(?:\/|$)/.test(path) ||
    /^\/notes\/[^/]+\/study-guide(?:\/|$)/.test(path) ||
    /^\/sources\/[^/]+\/study-guide(?:\/|$)/.test(path) ||
    /^\/notes\/ai(?:\/|$)/.test(path) ||
    /^\/projects\/[^/]+\/adaptive\/chat(?:\/|$)/.test(path) ||
    /^\/study-sessions(?:\/|$)/.test(path) ||
    /^\/quick-practice(?:\/|$)/.test(path)
  );
}

function nowMs() {
  return Date.now();
}

function elapsedMs(startedAt: number) {
  return `${Date.now() - startedAt}ms`;
}

function upstreamStatusCode(error: any) {
  return Number(error?.response?.status || error?.statusCode || error?.status || 500);
}

function safeLogPath(path: string) {
  return path.replace(/([?&](?:token|accessToken|refreshToken|password|secret|key)=)[^&]+/gi, "$1[redacted]");
}

function isJobLikeResponse(path: string, response: any) {
  const status = String(response?.status || "").toLowerCase();

  return (
    Boolean(response?.jobId) ||
    Boolean(response?.activeQuestionJobId) ||
    /\/(?:status|result|jobs|tests)(?:\/|$)/.test(path) ||
    ["pending", "running", "queued", "analyzing", "diagnostic_ready"].includes(status)
  );
}

function summarizeJobResponse(response: any) {
  const parts = [
    response?.jobId ? `job=${response.jobId}` : "",
    response?.status ? `status=${response.status}` : "",
    response?.progress !== undefined && response?.progress !== null
      ? `progress=${response.progress}%`
      : "",
    response?.generatedCount !== undefined && response?.totalCount !== undefined
      ? `generated=${response.generatedCount}/${response.totalCount}`
      : "",
  ].filter(Boolean);

  return parts.length ? ` ${LOG_COLORS.gray}(${parts.join(" ")})${LOG_COLORS.reset}` : "";
}

function logBackendSuccess(method: string, path: string, startedAt: number, response: any) {
  const isJob = isJobLikeResponse(path, response);
  const color = isJob ? LOG_COLORS.yellow : LOG_COLORS.green;
  const label = isJob ? "JOB" : "OK";

  console.info(
    `${color}[backend:${label}]${LOG_COLORS.reset} ${method} ${safeLogPath(path)} ${LOG_COLORS.gray}${elapsedMs(startedAt)}${LOG_COLORS.reset}${summarizeJobResponse(response)}`,
  );
}

function logBackendError(method: string, path: string, startedAt: number, error: any) {
  const status = upstreamStatusCode(error);
  const message = normalizeUpstreamMessage(error, path);

  console.error(
    `${LOG_COLORS.red}[backend:ERR]${LOG_COLORS.reset} ${method} ${safeLogPath(path)} ${LOG_COLORS.gray}${elapsedMs(startedAt)}${LOG_COLORS.reset} status=${status} message="${message}"`,
  );
}

function normalizeUpstreamMessage(error: any, path?: string) {
  const data = error?.data;
  const code = String(data?.code || "").toLowerCase();
  const errorLabel = String(data?.error || "").toLowerCase();
  const statusCode = Number(
    error?.response?.status || error?.statusCode || data?.statusCode || 0,
  );

  const stripNoise = (value: string) => {
    const cleaned = value
      .replace(/^\[[A-Z]+\]\s+"[^"]+":\s*\d+\s*/i, "")
      .replace(/\[[A-Z]+\]\s+"https?:\/\/[^"]+":\s*<no response>\s*/gi, "")
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
      return UPSTREAM_UNAVAILABLE_MESSAGE;
    }

    return cleaned;
  };

  const isNetworkFailure = (() => {
    const status = Number(error?.response?.status || error?.statusCode || 0);
    if (status > 0) return false;

    const raw = [
      error?.message,
      error?.statusMessage,
      error?.cause?.message,
      data?.message,
      data?.error,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return (
      raw.includes("fetch failed") ||
      raw.includes("<no response>") ||
      raw.includes("econnrefused") ||
      raw.includes("networkerror") ||
      raw.includes("network error") ||
      raw.includes("socket hang up") ||
      raw.includes("connect timeout") ||
      raw.includes("request timed out") ||
      raw.includes("timeout")
    );
  })();

  if (isNetworkFailure) {
    return UPSTREAM_UNAVAILABLE_MESSAGE;
  }

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

  // Handle 401 - Unauthorized
  if (
    statusCode === 401 ||
    code === "unauthorized" ||
    errorLabel === "unauthorized"
  ) {
    // Only show "Incorrect credentials" for login failures.
    if (path === "/auth/login") {
      return "Incorrect credentials. Please check your email and password.";
    }

    return "Unauthorized. Please log in again.";
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
    return mergedDetails;
  }

  // Handle explicit message or error field (backend WriteErrorAsync sends data.error)
  if (
    typeof data?.message === "string" &&
    data.message !== "One or more errors occurred!"
  ) {
    return stripNoise(data.message);
  }

  if (
    typeof data?.error === "string" &&
    data.error !== "Validation failed."
  ) {
    return stripNoise(data.error);
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

  const fallbackMessage = stripNoise(
    data?.error ||
      data?.message ||
      error?.statusMessage ||
      error?.message ||
      "An unexpected error occurred.",
  );

  return fallbackMessage || "An unexpected error occurred.";
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
    const timeout = isAiUpstreamPath(path)
      ? AI_UPSTREAM_TIMEOUT_MS
      : UPSTREAM_TIMEOUT_MS;

    return (await $fetch<T>(`${baseUrl}${path}`, {
      method,
      headers,
      body: hasBody ? body : undefined,
      timeout,
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
      timeout: UPSTREAM_TIMEOUT_MS,
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

  const startedAt = nowMs();

  try {
    const response = await executeRequest(headers);
    logBackendSuccess(method, path, startedAt, response);
    return response;
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
        const response = await executeRequest(headers);
        logBackendSuccess(method, path, startedAt, response);
        return response;
      } catch (refreshError: any) {
        // Refresh failed (expired/invalid token). Clear cookies so the client can re-authenticate cleanly.
        deleteCookie(event, "access_token", { path: "/" });
        deleteCookie(event, "refresh_token", { path: "/" });
        deleteCookie(event, "auth", { path: "/" });
        logBackendError(method, "/auth/refresh", startedAt, refreshError);

        throw createError({
          statusCode:
            refreshError?.response?.status || refreshError?.statusCode || 401,
          statusMessage: normalizeUpstreamMessage(
            refreshError,
            "/auth/refresh",
          ),
          data: {
            ...refreshError?.data,
            fieldErrors: extractFieldErrors(refreshError?.data),
          },
        });
      }
    }

    logBackendError(method, path, startedAt, error);

    throw createError({
      statusCode:
        error?.response?.status || error?.statusCode || error?.status || 500,
      statusMessage: normalizeUpstreamMessage(error, path),
      data: {
        ...error?.data,
        fieldErrors: extractFieldErrors(error?.data),
      },
    });
  }
};
