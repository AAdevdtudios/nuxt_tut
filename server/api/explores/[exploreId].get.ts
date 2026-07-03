import { createError, getRouterParam } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const exploreId = getRouterParam(event, "exploreId");

  if (!exploreId) {
    throw createError({ statusCode: 400, statusMessage: "Explore ID is required" });
  }

  return await useApi(event, `/catalog/explores/${exploreId}`, {
    method: "GET",
    useJwt: false,
  });
});
