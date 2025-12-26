// Login to the user and return a JWT token and user info using Strapi's local authentication api]
// david@gmail.com
import { defineEventHandler, readBody } from "h3";
import { AuthResponse } from "~~/server/types";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  try {
    const response = await useApi<AuthResponse>(event, "/auth/local", {
      method: "POST",
      body: {
        identifier: body["email"],
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
