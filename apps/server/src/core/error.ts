import type { ContentfulStatusCode } from "hono/utils/http-status";

export type AppErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<AppErrorCode, ContentfulStatusCode> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: ContentfulStatusCode;
  readonly details?: unknown;

  constructor(code: AppErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError("UNAUTHORIZED", message);
  }

  static forbidden(message = "Forbidden") {
    return new AppError("FORBIDDEN", message);
  }

  static notFound(message = "Not found") {
    return new AppError("NOT_FOUND", message);
  }

  static validation(message = "Invalid request", details?: unknown) {
    return new AppError("VALIDATION_ERROR", message, details);
  }

  static conflict(message = "Conflict") {
    return new AppError("CONFLICT", message);
  }

  static rateLimited(message = "Too many attempts") {
    return new AppError("RATE_LIMITED", message);
  }
}
