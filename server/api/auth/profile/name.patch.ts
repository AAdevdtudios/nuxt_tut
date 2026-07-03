import { createError, defineEventHandler, readBody } from "h3";
import { z } from "zod";
import type { UserProfile } from "~~/server/types";
import { useApi } from "~~/server/utils/api";
import { formatValidationError } from "~~/server/utils/validation";

const UpdateProfileNameSchema = z.object({
  name: z.string().trim().min(3).max(100),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const payload = UpdateProfileNameSchema.parse(body);

    return await useApi<{
      message: string;
      user: UserProfile & { name?: string };
    }>(event, "/auth/profile/name", {
      method: "PATCH",
      body: payload,
      useJwt: true,
    });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      const message = formatValidationError(error) || "Invalid name";

      throw createError({
        statusCode: 400,
        statusMessage: message,
      });
    }

    throw error;
  }
});
