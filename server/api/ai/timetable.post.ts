import { createError, defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { useApi } from "../../utils/api";

const TimetableRequestSchema = z.object({
  subjects: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        priority: z.enum(["high", "medium"]),
      }),
    )
    .min(1),
  studyHoursPerDay: z.number().int().min(1).max(24),
  breakMinutes: z.number().int().min(0).max(180),
  studyStyle: z.enum(["intensive", "balanced", "light"]),
  unavailableSlots: z.array(
    z.object({
      day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]),
      start: z.string().min(1),
      end: z.string().min(1),
    }),
  ),
  deadlines: z.array(
    z.object({
      type: z.enum(["exam", "assignment"]),
      subject: z.string().trim().min(1),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }),
  ),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const payload = TimetableRequestSchema.parse(body);

    return await useApi(event, "/api/ai/timetable", {
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
        statusMessage: fieldErrors || "Invalid timetable payload",
      });
    }

    throw error;
  }
});
