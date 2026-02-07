import { readMultipartFormData, createError } from "h3";
import { useApi } from "../utils/api";
import type { UploadResponse } from "~/types/library.types";

/**
 * File Upload Endpoint
 * Proxies file uploads to Strapi's /api/upload endpoint
 *
 * Accepts multipart form data with file field
 * Returns Strapi upload response with file metadata and ID
 */
export default defineEventHandler(async (event) => {
  try {
    const form = await readMultipartFormData(event);

    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: "No file provided",
      });
    }

    // Find the file field
    const fileField = form.find((field) => field.name === "files");

    if (!fileField || !fileField.data) {
      throw createError({
        statusCode: 400,
        statusMessage: "File field is required",
      });
    }

    // Create FormData for Strapi upload
    const formData = new FormData();

    // Convert buffer to Uint8Array for proper blob creation
    const uint8Array = new Uint8Array(fileField.data);
    const blob = new Blob([uint8Array], {
      type: fileField.type || "application/octet-stream",
    });

    formData.append("files", blob, fileField.filename);

    // Use useApi with FormData - it automatically handles Content-Type
    const response = await useApi<UploadResponse>(event, "/upload", {
      method: "POST",
      body: formData,
      useJwt: true,
    });

    return response;
  } catch (error: any) {
    console.error("[upload.post] Error:", error);
    throw createError({
      statusCode: error?.statusCode || 500,
      statusMessage:
        error?.statusMessage || error?.message || "Failed to upload file",
    });
  }
});
