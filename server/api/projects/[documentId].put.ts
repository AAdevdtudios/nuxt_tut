import { readBody, createError } from "h3";
import { useApi } from "../../utils/api";
import { validateProjectUpdate } from "../../schemas/project.schema";
import type { ProjectSingleResponse } from "~/types/project.types";
import {
  normalizeProjectSingleResponse,
  toProjectIconEnum,
} from "../../utils/project";

export default defineEventHandler(async (event) => {
  try {
    const documentId = getRouterParam(event, "documentId");

    if (!documentId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Document ID is required",
      });
    }

    const body = await readBody(event);
    const validated = validateProjectUpdate(body);
    const payload = {
      ...(validated.title !== undefined && { Title: validated.title }),
      ...(validated.description !== undefined && {
        Description: validated.description,
      }),
      ...(validated.icons !== undefined && {
        Icon: toProjectIconEnum(validated.icons),
      }),
      ...(validated.color !== undefined && { Color: validated.color }),
      ...(validated.start !== undefined && {
        Start: new Date(validated.start).toISOString(),
      }),
      ...(validated.end !== undefined && {
        End: new Date(validated.end).toISOString(),
      }),
      ...(validated.libraries !== undefined && {
        LibraryIds: validated.libraries.map(String),
      }),
      ReplaceLibraries: validated.libraries !== undefined,
    };

    const response = await useApi<unknown>(
      event,
      `/projects/${documentId}`,
      {
        method: "PATCH",
        body: payload,
        useJwt: true,
      },
    );

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
      statusMessage: error.message || "Failed to update project",
    });
  }
});
