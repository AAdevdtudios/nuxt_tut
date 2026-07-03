import { createError, defineEventHandler, getRouterParam } from "h3";
import { useApi } from "../../../utils/api";

export default defineEventHandler(async (event) => {
  const ticketId = getRouterParam(event, "ticketId");

  if (!ticketId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Ticket ID is required",
    });
  }

  return await useApi(event, `/support/tickets/${ticketId}`, {
    method: "GET",
    useJwt: true,
  });
});
