import { defineEventHandler } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  await useApi(event, "/subscription/me", {
    method: "GET",
    useJwt: true,
  });

  return {
    data: [],
    total: 0,
    currency: "GBP",
  };
});
