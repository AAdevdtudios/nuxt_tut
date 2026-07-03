import { createError, readBody } from "h3";
import { useApi } from "../../../utils/api";

type CreateReportRequest = {
  topic?: string | null;
  objective?: string | null;
  libraryItemId?: string | null;
  urls?: string[] | null;
  includeWeb?: boolean;
  instructions?: string | null;
};

export default defineEventHandler(async (event) => {
  const documentId = getRouterParam(event, "documentId");

  if (!documentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Project ID is required",
    });
  }

  const body = (await readBody(event)) as CreateReportRequest;

  if (!body?.topic) {
    throw createError({
      statusCode: 400,
      statusMessage: "topic is required",
    });
  }

  const toStringArray = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      : [];

  const toNullableString = (value: unknown) => {
    const normalized = String(value ?? "").trim();
    return normalized ? normalized : null;
  };

  try {
    return await useApi<any>(event, "/reports", {
      method: "POST",
      useJwt: true,
      body: {
        topic: String(body.topic).trim(),
        objective: toNullableString(body.objective),
        libraryItemId: body.libraryItemId ?? null,
        urls: toStringArray(body.urls),
        includeWeb:
          body.includeWeb === undefined ? true : Boolean(body.includeWeb),
        instructions: toNullableString(body.instructions),
      },
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage || error?.message || "Failed to create report",
      data: error?.data,
    });
  }
});
