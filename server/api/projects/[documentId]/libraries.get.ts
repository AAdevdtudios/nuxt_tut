import { createError, getQuery } from "h3";
import { useApi } from "../../../utils/api";
import { normalizeLibrariesResponse } from "../../../utils/library";
import type { LibrariesResponse } from "~/types/library.types";

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, "documentId");

  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project ID is required",
    });
  }

  try {
    const query = getQuery(event);
    const params = new URLSearchParams();

    if (typeof query.search === "string" && query.search.trim()) {
      params.set("search", query.search.trim());
    }

    if (typeof query.filter === "string" && query.filter.trim()) {
      params.set("filter", query.filter.trim());
    }

    if (typeof query.page === "string" && query.page.trim()) {
      params.set("page", String(Number(query.page) || 1));
    }

    if (typeof query.pageSize === "string" && query.pageSize.trim()) {
      params.set("pageSize", String(Number(query.pageSize) || 20));
    }

    const path = params.toString()
      ? `/projects/${documentId}/libraries?${params.toString()}`
      : `/projects/${documentId}/libraries`;

    const response = await useApi<unknown>(event, path, {
      method: "GET",
      useJwt: true,
    });

    return normalizeLibrariesResponse(response) as LibrariesResponse;
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage ||
        error?.message ||
        "Failed to fetch project libraries",
      data: error?.data,
    });
  }
});
