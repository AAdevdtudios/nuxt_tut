import { getQuery, createError } from "h3";
import { useApi } from "../utils/api";
import { parseLibrariesQuery } from "../schemas/library.schema";
import type { LibrariesResponse } from "~/types/library.types";
import {
  normalizeLibrariesResponse,
  toBackendLibraryType,
} from "../utils/library";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const parsed = parseLibrariesQuery(query);

    const params: Record<string, string> = {
      page: String(parsed.page),
      pageSize: String(parsed.pageSize),
    };

    if (parsed.search && parsed.search.trim() !== "") {
      params.search = parsed.search;
    }

    if (parsed.libraryType && parsed.libraryType !== "all") {
      const backendType = toBackendLibraryType(parsed.libraryType);
      if (backendType) {
        params.type = backendType;
      }
    }

    const queryString = new URLSearchParams(params).toString();
    const path = `/library/items?${queryString}`;

    const response = await useApi<unknown>(event, path, {
      method: "GET",
      useJwt: true,
    });

    return normalizeLibrariesResponse(response) as LibrariesResponse;
  } catch (error: any) {
    if (error.name === "ZodError") {
      const fieldErrors = error.errors
        .map((err: any) => `${err.path.join(".")} - ${err.message}`)
        .join(", ");
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${fieldErrors}`,
      });
    }

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch libraries",
    });
  }
});
