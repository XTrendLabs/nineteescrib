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
