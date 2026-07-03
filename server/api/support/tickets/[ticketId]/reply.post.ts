import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
} from "h3";
import { useApi } from "../../../../utils/api";

export default defineEventHandler(async (event) => {
  const ticketId = getRouterParam(event, "ticketId");
  const body = await readBody(event);

  if (!ticketId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ticket ID is required",
    });
  }

  return await useApi(event, `/support/tickets/${ticketId}/reply`, {
    method: "POST",
    body,
    useJwt: true,
  });
});
