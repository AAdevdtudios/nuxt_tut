import { defineEventHandler } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  return await useApi(event, "/subscription/me", {
    method: "GET",
    useJwt: true,
  });
});
