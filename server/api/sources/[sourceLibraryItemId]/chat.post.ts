import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { useApi } from "../../../utils/api";

export default defineEventHandler(async (event) => {
  const sourceLibraryItemId = getRouterParam(event, "sourceLibraryItemId");

  if (!sourceLibraryItemId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Source library item ID is required",
    });
  }

  const body = await readBody(event);

  return await useApi(event, `/sources/${sourceLibraryItemId}/chat`, {
    method: "POST",
    body,
    useJwt: true,
  });
});
