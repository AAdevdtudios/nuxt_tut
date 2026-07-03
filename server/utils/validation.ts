type ValidationIssueLike = {
  path?: Array<string | number>;
  message?: string;
};

function toValidationIssues(error: unknown): ValidationIssueLike[] {
  if (!error || typeof error !== "object") return [];

  const anyError = error as any;
  const issues = anyError.issues ?? anyError.errors ?? anyError.data?.errors;

  return Array.isArray(issues) ? issues : [];
}

export function formatValidationError(error: unknown): string {
  const issues = toValidationIssues(error);

  return issues
    .map((issue) => {
      const path = Array.isArray(issue.path) && issue.path.length
        ? issue.path.join(".")
        : "unknown";
      const message = String(issue.message ?? "").trim();
      return `${path} - ${message}`;
    })
    .filter(Boolean)
    .join(", ");
}

export function getValidationFieldErrors(
  error: unknown,
): Record<string, string[]> {
  const issues = toValidationIssues(error);
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of issues) {
    const field = Array.isArray(issue.path) && issue.path.length
      ? issue.path.join(".")
      : "unknown";
    const message = String(issue.message ?? "").trim();
    if (!message) continue;
    fieldErrors[field] = [...(fieldErrors[field] || []), message];
  }

  return fieldErrors;
}
