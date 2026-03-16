import {
  createError,
  deleteCookie,
  defineEventHandler,
  getCookie,
  readBody,
  setCookie,
} from "h3";
import type { AuthSessionResponse } from "~~/server/types";
import { useApi } from "~~/server/utils/api";

function setAuthCookies(event: any, session: AuthSessionResponse) {
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
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const refreshToken = body?.refreshToken || getCookie(event, "refresh_token");

  try {
    const response = await useApi<AuthSessionResponse>(event, "/auth/refresh", {
      method: "POST",
      body: { refreshToken },
      useJwt: false,
    });

    setAuthCookies(event, response);
    return response;
  } catch (error: any) {
    const statusCode =
      error?.statusCode || error?.status || error?.response?.status;

    if (statusCode === 401) {
      deleteCookie(event, "access_token", { path: "/" });
      deleteCookie(event, "refresh_token", { path: "/" });
    }

    throw createError({
      statusCode: statusCode || 500,
      statusMessage:
        error?.statusMessage || error?.message || "Failed to refresh session",
      data: error?.data,
    });
  }
});
