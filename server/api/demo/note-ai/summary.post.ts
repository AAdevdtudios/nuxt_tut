import { createError, defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { formatValidationError } from "../../../utils/validation";

const SummaryRequestSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const buildSummary = (text: string) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentences.length === 0) {
    return "No summary available.";
  }

  const topSentences = sentences.slice(0, 2).join(" ");
  const detail = sentences.slice(2, 4).join(" ");

  return [topSentences, detail].filter(Boolean).join("\n\n");
};

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { text } = SummaryRequestSchema.parse(body);

    await sleep(1200);

    return {
      summary: buildSummary(text),
    };
  } catch (error: any) {
    if (error?.name === "ZodError") {
      throw createError({
        statusCode: 400,
        statusMessage:
          formatValidationError(error) || "Invalid summary request payload.",
      });
    }

    throw error;
  }
});
