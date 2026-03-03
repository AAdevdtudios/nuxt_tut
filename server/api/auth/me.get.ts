import { defineEventHandler } from "h3";
import type { UserProfile } from "~~/server/types";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const user = await useApi<UserProfile>(event, "/auth/me", {
    method: "GET",
    useJwt: true,
  });

  return user;
});
