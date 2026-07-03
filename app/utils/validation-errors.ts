export type FormFieldError = {
  name: string;
  message: string;
};

const normalizeName = (value: string) =>
  value.replace(/[^a-z0-9]/gi, "").toLowerCase();

const cleanMessage = (message: string) =>
  message
    .replace(/^'[^']+'\s*/i, "")
    .replace(/^"[^"]+"\s*/i, "")
    .trim();

export function extractApiFieldErrors(
  error: any,
  allowedFields: string[],
): FormFieldError[] {
  const rawErrors =
    error?.data?.errors ??
    error?.data?.fieldErrors ??
    error?.cause?.data?.errors ??
    error?.cause?.data?.fieldErrors ??
    error?.response?._data?.errors ??
    error?.response?._data?.fieldErrors;

  if (!rawErrors || typeof rawErrors !== "object") return [];

  const normalizedAllowed = new Map(
    allowedFields.map((field) => [normalizeName(field), field]),
  );

  return Object.entries(rawErrors).flatMap(([rawKey, rawValue]) => {
    const key = normalizedAllowed.get(normalizeName(rawKey));
    if (!key) return [];

    const firstMessage = Array.isArray(rawValue)
      ? rawValue.find((entry) => typeof entry === "string")
      : typeof rawValue === "string"
        ? rawValue
        : null;

    if (!firstMessage) return [];

    return [{ name: key, message: cleanMessage(firstMessage) }];
  });
}

export function formatFieldErrors(errors: FormFieldError[]): string {
  return errors
    .map((entry) => `${entry.name}: ${entry.message}`)
    .join(" ");
}
