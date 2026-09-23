export type ApiErrorCode = "INVALID_REQUEST" | "VALIDATION_ERROR" | "EXTERNAL_SERVICE_ERROR" | "INTERNAL_ERROR"

export type ApiSuccess<T> = { success: true; data: T }
export type ApiFailure = { success: false; error: { code: ApiErrorCode; message: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export function apiSuccess<T>(data: T): ApiSuccess<T> {
  return { success: true, data }
}

export function apiFailure(code: ApiErrorCode, message: string): ApiFailure {
  return { success: false, error: { code, message } }
}
