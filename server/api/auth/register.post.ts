// Register endpoint implementation
import { defineEventHandler, readBody } from "h3";
import { AuthResponse } from "~~/server/types";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const response = await useApi<AuthResponse>(event, "/auth/local/register", {
      method: "POST",
      body: {
        email: body["email"],
        username: body["username"],
        password: body["password"],
      },
      useJwt: false,
    });
    setCookie(event, "access_token", response.jwt, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: "Login failed",
    });
  }
});
