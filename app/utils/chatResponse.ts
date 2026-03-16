function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonIfPossible(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return value;

  const candidates: string[] = [trimmed];

  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fencedMatch?.[1]) {
    candidates.push(fencedMatch[1].trim());
  }

  const firstCurly = trimmed.indexOf("{");
  const lastCurly = trimmed.lastIndexOf("}");
  if (firstCurly >= 0 && lastCurly > firstCurly) {
    candidates.push(trimmed.slice(firstCurly, lastCurly + 1));
  }

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    candidates.push(trimmed.slice(firstBracket, lastBracket + 1));
  }

  for (const candidate of candidates) {
    const normalized = candidate.trim();
    if (
      !(
        (normalized.startsWith("{") && normalized.endsWith("}")) ||
        (normalized.startsWith("[") && normalized.endsWith("]"))
      )
    ) {
      continue;
    }

    try {
      return JSON.parse(normalized);
    } catch {
      // Try next candidate
    }
  }

  return value;
}

function formatArray(values: unknown[]): string {
  return values
    .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
    .map((item) => `- ${item}`)
    .join("\n");
}

function formatStructuredAnswer(payload: Record<string, unknown>): string | null {
  const answer = payload.answer;
  if (typeof answer === "string") return answer;
  if (Array.isArray(answer)) return formatArray(answer);
  return null;
}

export function normalizeAssistantAnswer(input: unknown): string {
  const parsedInput =
    typeof input === "string" ? parseJsonIfPossible(input) : input;

  if (typeof parsedInput === "string") return parsedInput;

  if (Array.isArray(parsedInput)) {
    return formatArray(parsedInput);
  }

  if (isRecord(parsedInput)) {
    const formatted = formatStructuredAnswer(parsedInput);
    if (formatted) return formatted;
    return `\`\`\`json\n${JSON.stringify(parsedInput, null, 2)}\n\`\`\``;
  }

  if (parsedInput == null) return "";
  return String(parsedInput);
}
