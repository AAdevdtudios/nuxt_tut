import { defineEventHandler, readBody, setCookie } from "h3";
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

  const response = await useApi<AuthSessionResponse>(event, "/auth/register", {
    method: "POST",
    body: {
      email: body?.email,
      password: body?.password,
      name: body?.name,
      displayName: body?.displayName,
    },
    useJwt: false,
  });

  setAuthCookies(event, response);
  return response;
});
