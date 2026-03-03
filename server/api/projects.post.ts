import { readBody, createError } from "h3";
import { useApi } from "../utils/api";
import { validateProjectCreate } from "../schemas/project.schema";
import type { ProjectSingleResponse } from "~/types/project.types";
import {
  normalizeProjectSingleResponse,
  toProjectIconEnum,
} from "../utils/project";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const validated = validateProjectCreate(body);
    const payload = {
      Title: validated.title,
      Description: validated.description || null,
      Icon: toProjectIconEnum(validated.icons),
      Color: validated.color,
      Start: new Date(validated.start).toISOString(),
      End: new Date(validated.end).toISOString(),
      LibraryIds: validated.libraries?.map(String),
    };

    const response = await useApi<unknown>(event, "/projects", {
      method: "POST",
      body: payload,
      useJwt: true,
    });

    return normalizeProjectSingleResponse(response) as ProjectSingleResponse;
  } catch (error: any) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      const fieldErrors = (zodError.errors || [])
        .map(
          (err: any) => `${err.path?.join(".") || "unknown"} - ${err.message}`,
        )
        .join(", ");
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${fieldErrors}`,
      });
    }

    if (Array.isArray(error)) {
      const fieldErrors = error
        .map(
          (err: any) => `${err.path?.join(".") || "unknown"} - ${err.message}`,
        )
        .join(", ");
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${fieldErrors}`,
      });
    }

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to create project",
    });
  }
});
