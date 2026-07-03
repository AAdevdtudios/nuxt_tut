import { createError, defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { formatValidationError } from "../../../utils/validation";

const AskRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  selectedText: z.string().trim().max(5000).optional(),
  model: z.string().trim().max(100).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .max(30)
    .optional(),
});

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const payload = AskRequestSchema.parse(body);

    await sleep(1000);

    const context = payload.selectedText
      ? payload.selectedText.slice(0, 180).trim()
      : "";
    const modelName = payload.model || "default-demo-model";
    const turns = Array.isArray(payload.history) ? payload.history.length : 0;

    const reply = context
      ? `(${modelName}) Based on your selected text: "${context}"\n\nHere's a focused answer to "${payload.message}".`
      : `(${modelName}) Here's a focused answer to "${payload.message}".`;

    return {
      reply: `${reply}\n\nConversation turns tracked: ${turns}.`,
    };
  } catch (error: any) {
    if (error?.name === "ZodError") {
      throw createError({
        statusCode: 400,
        statusMessage:
          formatValidationError(error) || "Invalid ask request payload.",
      });
    }

    throw error;
  }
});
