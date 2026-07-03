import { createError, defineEventHandler, readMultipartFormData } from "h3";
import { useApi } from "../../utils/api";

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event);

  if (!parts?.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "Multipart payload is required",
    });
  }

  const form = new FormData();

  for (const part of parts) {
    if (!part.name) continue;

    if (part.filename) {
      const bytes = new Uint8Array(part.data);
      const blob = new Blob([bytes], {
        type: part.type || "application/octet-stream",
      });
      form.append(part.name, blob, part.filename);
      continue;
    }

    form.append(part.name, part.data.toString("utf8"));
  }

  return await useApi(event, "/notes/intake", {
    method: "POST",
    body: form,
    useJwt: true,
    skipContentType: true,
  });
});
