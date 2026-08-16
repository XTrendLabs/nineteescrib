import type { AppErrorCode } from "./error";

export type ApiSuccess<T> = {
  data: T;
  error: null;
};

export type ApiFailure = {
  data: null;
  error: {
    code: AppErrorCode;
    message: string;
    details?: unknown;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T): ApiSuccess<T> {
  return { data, error: null };
}

export function fail(
  code: AppErrorCode,
  message: string,
  details?: unknown,
): ApiFailure {
  return { data: null, error: { code, message, details } };
}
