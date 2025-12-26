import { defineEventHandler } from "h3";
import { AuthResponse } from "~~/server/types";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  // Will throw 401 if JWT is missing or invalid
  const user = await useApi<AuthResponse>(event, "/users/me", {
    method: "GET",
    useJwt: true,
  });

  return user;
});
