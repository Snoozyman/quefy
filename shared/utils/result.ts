export type ApiResponse<T> = Result<never, Error> | Result<T, never>;

export type Result<T, E extends Error | string> =
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function failure(error: Error | string): Result<never, Error> {
  return {
    success: false,
    error: error instanceof Error ? error : new Error(String(error)),
  };
}
