import { createError, defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { useApi } from "../utils/api";

const FeedbackCreateSchema = z.object({
  category: z.enum([
    "bug-report",
    "feature-request",
    "improvement",
    "praise",
  ]),
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  overallExperienceRating: z.number().int().min(1).max(5),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const payload = FeedbackCreateSchema.parse(body);

    return await useApi(event, "/feedback", {
      method: "POST",
      body: payload,
      useJwt: true,
    });
  } catch (error: any) {
    if (error?.name === "ZodError") {
      const fieldErrors = error.errors
        .map((issue: any) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");

      throw createError({
        statusCode: 400,
        statusMessage: fieldErrors || "Invalid feedback payload",
      });
    }

    throw error;
  }
});
