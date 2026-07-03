import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  readMultipartFormData,
} from "h3";
import { validateLibraryUpdate } from "../../schemas/library.schema";
import { useApi } from "../../utils/api";
import {
  normalizeLibrarySingleResponse,
  toBackendLibraryType,
} from "../../utils/library";
import type { LibrarySingleResponse } from "~/types/library.types";
import { formatValidationError } from "../../utils/validation";

function createMultipartPayload(
  form: Awaited<ReturnType<typeof readMultipartFormData>>,
) {
  const formData = new FormData();
  let hasType = false;
  let hasDocsUrl = false;
  let hasUrl = false;
  let hasContent = false;

  for (const field of form || []) {
    if (!field.name || !field.data) continue;

    if (field.filename) {
      continue;
    } else {
      const value = Buffer.from(field.data).toString("utf8");

      if (field.name === "title") formData.append("Title", value);
      if (field.name === "libraryType") {
        const type = toBackendLibraryType(value as any);
        if (type !== undefined) {
          formData.append("Type", type);
          hasType = true;
        }
      }
      // Backward compatibility for older clients; new clients send
      // `libraryType` only and the proxy maps it to backend `Type`.
      if (field.name === "type") {
        const type = toBackendLibraryType(value as any);
        if (type !== undefined) {
          formData.append("Type", type);
          hasType = true;
        }
      }
      if (field.name === "url") {
        formData.append("Url", value);
        if (value.trim()) hasUrl = true;
      }
      if (field.name === "docsUrl") {
        formData.append("DocsUrl", value);
        if (value.trim()) hasDocsUrl = true;
      }
      if (field.name === "content") {
        formData.append("Content", value);
        if (value.trim()) hasContent = true;
      }
    }
  }

  if (!hasType) {
    if (hasDocsUrl) {
      formData.append("Type", "Docs");
    } else if (hasUrl) {
      formData.append("Type", "Url");
    } else if (hasContent) {
      formData.append("Type", "Note");
    }
  }

  return formData;
}

function createLibraryPayload(validated: ReturnType<typeof validateLibraryUpdate>) {
  const formData = new FormData();

  if (validated.title !== undefined) {
    formData.append("Title", validated.title);
  }

  const type = toBackendLibraryType(validated.libraryType);
  if (type !== undefined) {
    formData.append("Type", type);
  }

  if (validated.url !== undefined && validated.url !== null) {
    formData.append("Url", validated.url);
  }

  if (validated.docsUrl !== undefined && validated.docsUrl !== null) {
    formData.append("DocsUrl", validated.docsUrl);
  }

  if (validated.content !== undefined && validated.content !== null) {
    formData.append("Content", validated.content);
  }

  return formData;
}

export default defineEventHandler(async (event) => {
  try {
    const libraryId = getRouterParam(event, "documentId");

    if (!libraryId || typeof libraryId !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Valid libraryId is required",
      });
    }

    const contentType = event.node.req.headers["content-type"] || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await readMultipartFormData(event);

      if (!form || form.length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: "Multipart payload is required",
        });
      }

      const payload = createMultipartPayload(form);

      const response = await useApi<unknown>(
        event,
        `/library/items/${libraryId}`,
        {
          method: "PATCH",
          body: payload,
          useJwt: true,
          skipContentType: true,
        },
      );

      return normalizeLibrarySingleResponse(response) as LibrarySingleResponse;
    }

    const body = await readBody(event);
    const validated = validateLibraryUpdate(body);
    const payload = createLibraryPayload(validated);

    const response = await useApi<unknown>(event, `/library/items/${libraryId}`, {
      method: "PATCH",
      body: payload,
      useJwt: true,
      skipContentType: true,
    });

    return normalizeLibrarySingleResponse(response) as LibrarySingleResponse;
  } catch (error: any) {
    if (error.name === "ZodError") {
      const fieldErrors = formatValidationError(error);
      throw createError({
        statusCode: 400,
        statusMessage: `Validation failed: ${fieldErrors}`,
      });
    }

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to update library",
    });
  }
});
