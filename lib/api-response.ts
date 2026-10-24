import { NextResponse } from "next/server";
import type { ApiErrorDetail } from "./types";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  options: { retryable?: boolean; run_id?: string; details?: ApiErrorDetail[] } = {},
) {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code,
        message,
        retryable: options.retryable ?? false,
        ...(options.run_id ? { run_id: options.run_id } : {}),
        details: options.details ?? [],
      },
    },
    { status },
  );
}

export async function parseJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiRequestError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }
}

export class ApiRequestError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details: ApiErrorDetail[] = [],
    public retryable = false,
    public runId?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function errorResponse(
  error: unknown,
  fallback = "The request could not be completed.",
  runId?: string,
) {
  if (error instanceof ApiRequestError) {
    return apiError(error.code, error.message, error.status, {
      retryable: error.retryable,
      // A run ID is meaningful only after the run was found. Callers may pass
      // it as context for errors raised later in that request.
      run_id: error.code === "RUN_NOT_FOUND" ? error.runId : error.runId ?? runId,
      details: error.details,
    });
  }
  // Generic route exceptions are application failures. Tool and transactional
  // save failures are mapped explicitly at their call sites.
  return apiError("INTERNAL_ERROR", fallback, 500, { retryable: false, run_id: runId });
}
