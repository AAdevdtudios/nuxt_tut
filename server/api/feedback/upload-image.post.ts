import { createError, readMultipartFormData } from "h3";
import { useApi } from "../../utils/api";

type FeedbackImageResponse = {
  url?: string;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  if (!form || form.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Attach one image file",
    });
  }

  const fileField = form.find((field) => field.filename && field.data);
  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, statusMessage: "Attach one image file" });
  }

  const fileType = fileField.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(fileType)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Only PNG, JPG, WEBP, or GIF screenshots are allowed",
    });
  }

  if (fileField.data.length > MAX_IMAGE_BYTES) {
    throw createError({
      statusCode: 400,
      statusMessage: "Screenshot must be 5MB or smaller",
    });
  }

  const payload = new FormData();
  const file = new Blob([new Uint8Array(fileField.data)], { type: fileType });
  payload.append("File", file, fileField.filename);

  const response = await useApi<FeedbackImageResponse>(event, "/uploads/feedback-image", {
    method: "POST",
    body: payload,
    useJwt: true,
    skipContentType: true,
  });

  if (!response?.url) {
    throw createError({
      statusCode: 500,
      statusMessage: "Upload completed but no file URL was returned",
    });
  }

  return { url: response.url };
});
