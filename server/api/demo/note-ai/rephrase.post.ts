import { createError, defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { formatValidationError } from "../../../utils/validation";

const RephraseRequestSchema = z.object({
  text: z.string().trim().min(1).max(5000),
});

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const toSentenceCase = (value: string) => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { text } = RephraseRequestSchema.parse(body);
    const normalized = text.replace(/\s+/g, " ").trim();

    await sleep(1400);

    const concise = normalized.length > 180
      ? `${normalized.slice(0, 177).trimEnd()}...`
      : normalized;

    const options = [
      concise,
      toSentenceCase(`in simple terms, ${normalized.toLowerCase()}`),
      toSentenceCase(`a clearer way to say this is: ${normalized.toLowerCase()}`),
      toSentenceCase(`for academic writing: ${normalized}`),
    ];

    return { options };
  } catch (error: any) {
    if (error?.name === "ZodError") {
      throw createError({
        statusCode: 400,
        statusMessage:
          formatValidationError(error) || "Invalid rephrase request payload.",
      });
    }

    throw error;
  }
});
