import { createError, readMultipartFormData } from "h3";
import { useRuntimeConfig } from "#imports";
import { useApi } from "../utils/api";

type UploadApiResponse = {
  key?: string;
  url?: string;
  path?: string;
  fileUrl?: string;
  location?: string;
  fileName?: string;
  contentType?: string;
  size?: number;
  purpose?: string;
};

export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event);

    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "Multipart payload is required",
      });
    }

    const payload = new FormData();
    const config = useRuntimeConfig();
    const requestedPurpose = form
      .find((field) => field.name === "purpose" || field.name === "Purpose")
      ?.data;
    const purpose = requestedPurpose
      ? Buffer.from(requestedPurpose).toString("utf8")
      : "note-image";

    for (const field of form) {
      if (!field.name || !field.data) continue;

      if (field.filename) {
        const fileType = field.type || "application/octet-stream";
        const fileName = field.filename.toLowerCase();

        if (
          purpose === "library-document" &&
          fileType !== "application/pdf" &&
          !fileName.endsWith(".pdf")
        ) {
          throw createError({
            statusCode: 400,
            statusMessage: "Only PDF files are allowed for library documents",
          });
        }

        const file = new Blob([new Uint8Array(field.data)], {
          type: fileType,
        });
        payload.append("File", file, field.filename);
        continue;
      }

      const value = Buffer.from(field.data).toString("utf8");
      if (field.name === "purpose" || field.name === "Purpose") {
        payload.append("purpose", value);
      }
    }

    if (!payload.get("File")) {
      throw createError({
        statusCode: 400,
        statusMessage: "File is required",
      });
    }

    if (!payload.get("purpose")) {
      payload.append("purpose", "note-image");
    }

    const response = await useApi<UploadApiResponse>(event, "/uploads", {
      method: "POST",
      body: payload,
      useJwt: true,
      skipContentType: true,
    });

    const rawUrl =
      response?.url ||
      response?.path ||
      response?.fileUrl ||
      response?.location;

    if (!rawUrl) {
      throw createError({
        statusCode: 500,
        statusMessage: "Upload completed but no file URL was returned",
      });
    }

    const absoluteUrl = rawUrl.startsWith("http")
      ? rawUrl
      : `${config.API_BASE_URL}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;

    return {
      key: response?.key || null,
      url: absoluteUrl,
      path: rawUrl,
      fileName: response?.fileName || null,
      contentType: response?.contentType || null,
      size: response?.size || null,
      purpose: response?.purpose || payload.get("purpose"),
    };
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage || error?.message || "Failed to upload image",
      data: error?.data,
    });
  }
});
