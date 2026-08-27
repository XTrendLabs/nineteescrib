type ApiErrorBody = {
  error?: { message?: string } | null;
};

function hasBody(error: unknown): error is { body: ApiErrorBody } {
  return (
    typeof error === "object" &&
    error !== null &&
    "body" in error &&
    typeof (error as { body: unknown }).body === "object"
  );
}

/**
 * True when a request failed because the caller lacks access, as opposed to
 * the resource not existing -- the two need different wording in the UI.
 */
export function isForbidden(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const status = (error as { status?: unknown }).status;
  if (status === 403) return true;

  const response = (error as { response?: { status?: unknown } }).response;
  return response?.status === 403;
}

export function getApiErrorMessage(
  error: unknown,
  fallback?: string,
): string | undefined {
  if (hasBody(error)) {
    const message = error.body.error?.message;
    if (message) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
