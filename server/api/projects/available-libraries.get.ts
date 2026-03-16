import { createError, getQuery } from "h3";
import { useApi } from "../../utils/api";
import { normalizeLibrariesResponse } from "../../utils/library";
import type { LibrariesResponse } from "~/types/library.types";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);

    const params = new URLSearchParams();

    if (typeof query.projectId === "string" && query.projectId.trim()) {
      params.set("projectId", query.projectId);
    }

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

    const response = await useApi<unknown>(
      event,
      `/projects/available-libraries?${params.toString()}`,
      {
        method: "GET",
        useJwt: true,
      },
    );

    return normalizeLibrariesResponse(response) as LibrariesResponse;
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage ||
        error?.message ||
        "Failed to fetch available project libraries",
      data: error?.data,
    });
  }
});
