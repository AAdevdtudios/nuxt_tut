import { createError, getQuery } from "h3";
import { useApi } from "../utils/api";
import { parseProjectsQuery } from "../schemas/project.schema";
import type { ProjectsResponse } from "~/types/project.types";
import { normalizeProjectsResponse } from "../utils/project";
import { formatValidationError } from "../utils/validation";

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event);
    const params = parseProjectsQuery(query);
    const backendParams = new URLSearchParams({
      Page: String(params.page),
      PageSize: String(params.pageSize),
    });

    if (params.search && params.search.trim() !== "") {
      backendParams.set("Search", params.search);
    }

    const response = await useApi<unknown>(
      event,
      `/projects?${backendParams.toString()}`,
      {
      method: "GET",
      useJwt: true,
      },
    );

    return normalizeProjectsResponse(response) as ProjectsResponse;
  } catch (error: any) {
    if (error instanceof Error && error.name === "ZodError") {
      const fieldErrors = formatValidationError(error);
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${fieldErrors}`,
      });
    }

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to fetch projects",
    });
  }
});
