import { createError, getQuery } from "h3";
import { useApi } from "../utils/api";
import { normalizeCategoriesResponse } from "../utils/explore";
import type { CategoriesResponse } from "~/types/explore.types";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const params = new URLSearchParams({
      Page: String(query.page || query.Page || 1),
      PageSize: String(query.pageSize || query.PageSize || 50),
    });

    if (typeof query.search === "string" && query.search.trim()) {
      params.set("Search", query.search);
    }

    const data = await useApi<unknown>(
      event,
      `/catalog/categories?${params.toString()}`,
      {
        method: "GET",
        useJwt: false,
      },
    );

    return normalizeCategoriesResponse(data) as CategoriesResponse;
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch categories",
    });
  }
});
