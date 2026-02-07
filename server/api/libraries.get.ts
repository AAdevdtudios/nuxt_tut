import { getQuery, createError } from "h3";
import { useApi } from "../utils/api";
import { parseLibrariesQuery } from "../schemas/library.schema";
import type { LibrariesResponse } from "~/types/library.types";

export default defineEventHandler(async (event) => {
  try {
    // Validate and parse query parameters
    const query = getQuery(event);
    const parsed = parseLibrariesQuery(query);

    const page = parsed.page;
    const pageSize = parsed.pageSize;
    const search = parsed.search;
    const libraryType = parsed.libraryType;

    // Build Strapi params
    const params: Record<string, any> = {
      "pagination[page]": page,
      "pagination[pageSize]": pageSize,
    };

    if (search && search.trim() !== "") {
      params["filters[$or][0][title][$containsi]"] = search;
      params["filters[$or][1][content][$containsi]"] = search;
    }

    if (libraryType && libraryType !== "all") {
      params["filters[libraryType][$eq]"] = libraryType;
    }

    // Build query string
    const queryString = new URLSearchParams(params).toString();
    const path = `/libraries?${queryString}`;

    const response = await useApi<LibrariesResponse>(event, path, {
      method: "GET",
      useJwt: true,
    });

    return response;
  } catch (error: any) {
    console.error("[libraries.get] Error:", error);

    // Handle validation errors
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
