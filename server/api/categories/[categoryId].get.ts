import { createError, getRouterParam } from "h3";
import { useApi } from "~~/server/utils/api";

export default defineEventHandler(async (event) => {
  const categoryId = getRouterParam(event, "categoryId");

  if (!categoryId) {
    throw createError({ statusCode: 400, statusMessage: "Category ID is required" });
  }

  return await useApi(event, `/catalog/categories/${categoryId}`, {
    method: "GET",
    useJwt: false,
  });
});
