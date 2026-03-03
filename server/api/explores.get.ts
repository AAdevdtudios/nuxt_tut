import { createError, getQuery } from "h3";
import { useApi } from "../utils/api";
import { normalizeExploresResponse } from "../utils/explore";
import type { ExploresResponse } from "~/types/explore.types";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const params = new URLSearchParams({
      Page: String(query.page || query.Page || 1),
      PageSize: String(query.pageSize || query.PageSize || 10),
    });

    if (typeof query.search === "string" && query.search.trim()) {
      params.set("Search", query.search);
    }

    const categoryId = query.categoryId || query.CategoryId;
    if (typeof categoryId === "string" && categoryId !== "all") {
      params.set("CategoryId", categoryId);
    }

    const data = await useApi<unknown>(
      event,
      `/catalog/explores?${params.toString()}`,
      {
        method: "GET",
        useJwt: false,
      },
    );

    return normalizeExploresResponse(data) as ExploresResponse;
  } catch (error: any) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch explores",
    });
  }
});
