import { defineEventHandler, readMultipartFormData } from "h3";
import { useApi } from "../../utils/api";

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event);
  const body = new FormData();

  for (const item of form || []) {
    if (!item.name) continue;

    if (item.filename) {
      const fileBytes = item.data.buffer.slice(
        item.data.byteOffset,
        item.data.byteOffset + item.data.byteLength,
      ) as ArrayBuffer;
      body.append(
        item.name,
        new Blob([fileBytes], { type: item.type || "application/octet-stream" }),
        item.filename,
      );
      continue;
    }

    body.append(item.name, item.data.toString());
  }

  return await useApi(event, "/study-sessions", {
    method: "POST",
    body,
    useJwt: true,
    skipContentType: true,
  });
});
