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

function logFormData(label: string, formData: FormData) {
  const entries = Array.from(formData.entries()).map(([key, value]) => {
    if (value instanceof File) {
      return {
        key,
        fileName: value.name,
        fileType: value.type,
        fileSize: value.size,
      };
    }

    return { key, value };
  });

  console.log(label, entries);
}

function createMultipartPayload(
  form: Awaited<ReturnType<typeof readMultipartFormData>>,
) {
  const formData = new FormData();
  let hasType = false;
  let hasFile = false;
  let hasUrl = false;
  let hasContent = false;

  for (const field of form || []) {
    if (!field.name || !field.data) continue;

    if (field.filename) {
      const file = new Blob([new Uint8Array(field.data)], {
        type: field.type || "application/octet-stream",
      });
      formData.append("File", file, field.filename);
      hasFile = true;
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
      if (field.name === "content") {
        formData.append("Content", value);
        if (value.trim()) hasContent = true;
      }
    }
  }

  if (!hasType) {
    if (hasFile) {
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
      logFormData("[libraries.put] multipart payload", payload);

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
    logFormData("[libraries.put] payload", payload);

    const response = await useApi<unknown>(event, `/library/items/${libraryId}`, {
      method: "PATCH",
      body: payload,
      useJwt: true,
      skipContentType: true,
    });

    return normalizeLibrarySingleResponse(response) as LibrarySingleResponse;
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

    console.error("[libraries.put] upstream error", {
      status: error?.status,
      message: error?.message,
      data: error?.data,
    });

    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || "Failed to update library",
    });
  }
});
