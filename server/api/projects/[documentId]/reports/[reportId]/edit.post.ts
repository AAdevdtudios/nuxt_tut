import { createError, readBody } from "h3";
import { useApi } from "../../../../../utils/api";

type EditReportRequest = {
  instruction: string;
};

export default defineEventHandler(async (event) => {
  const reportId = getRouterParam(event, "reportId");

  if (!reportId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Report ID is required",
    });
  }

  const body = (await readBody(event)) as EditReportRequest;

  if (!body?.instruction) {
    throw createError({
      statusCode: 400,
      statusMessage: "instruction is required",
    });
  }

  try {
    return await useApi<any>(event, `/reports/${reportId}/edit`, {
      method: "POST",
      useJwt: true,
      body: {
        instruction: String(body.instruction),
      },
    });
  } catch (error: any) {
    throw createError({
      statusCode: error?.statusCode || error?.status || 500,
      statusMessage:
        error?.statusMessage || error?.message || "Failed to edit report",
      data: error?.data,
    });
  }
});
