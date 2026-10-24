import { expect } from "vitest";
import { NextRequest } from "next/server";
import { RUN_ID_RE, UTC_RE } from "./fixtures";

type RouteParams = { params: Promise<Record<string, string>> };
export type RouteHandler = (
  request: NextRequest,
  context: RouteParams
) => Promise<Response>;

type CallOptions = {
  method?: string;
  path: string;
  body?: unknown;
  rawBody?: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
};

export type RouteResult = {
  response: Response;
  status: number;
  headers: Headers;
  text: string;
  json: Record<string, any> | null;
};

export async function callRoute(
  handler: RouteHandler,
  options: CallOptions
): Promise<RouteResult> {
  const headers = new Headers(options.headers);
  const hasBody = options.body !== undefined || options.rawBody !== undefined;
  let body: string | undefined;

  if (hasBody) {
    body =
      options.rawBody !== undefined
        ? options.rawBody
        : JSON.stringify(options.body);
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
  }

  const request = new NextRequest(
    new URL(options.path, "http://localhost:3000"),
    {
      method: options.method ?? (hasBody ? "POST" : "GET"),
      headers,
      body,
    }
  );

  const response = await handler(request, {
    params: Promise.resolve(options.params ?? {}),
  });
  const text = await response.text();
  let json: Record<string, any> | null = null;
  try {
    json = JSON.parse(text) as Record<string, any>;
  } catch {
    json = null;
  }

  return {
    response,
    status: response.status,
    headers: response.headers,
    text,
    json,
  };
}

function expectJsonResponse(result: RouteResult): void {
  expect(
    result.headers.get("content-type"),
    `expected JSON, received: ${result.text.slice(0, 200)}`
  ).toMatch(/^application\/json\b/i);
}

export function expectSuccess<T = Record<string, any>>(
  result: RouteResult,
  status = 200
): T {
  expect(result.status, result.text).toBe(status);
  expectJsonResponse(result);
  expect(result.json).not.toBeNull();
  expect(result.json?.ok).toBe(true);
  expect(result.json).toHaveProperty("data");
  return result.json?.data as T;
}

type ErrorExpectation = {
  status: number;
  code: string;
  retryable: boolean;
  runId?: "present" | "absent" | "string";
  details?: (details: any[]) => void;
  message?: string | RegExp;
};

export function expectApiError(
  result: RouteResult,
  expected: ErrorExpectation
): void {
  expect(result.status, result.text).toBe(expected.status);
  expectJsonResponse(result);
  expect(result.json).not.toBeNull();
  expect(result.json?.ok).toBe(false);
  expect(result.json?.error).toMatchObject({
    code: expected.code,
    retryable: expected.retryable,
  });
  expect(typeof result.json?.error?.message).toBe("string");
  expect(result.json?.error?.message.length).toBeGreaterThan(0);
  expect(Array.isArray(result.json?.error?.details)).toBe(true);

  if (expected.message instanceof RegExp) {
    expect(result.json?.error?.message).toMatch(expected.message);
  } else if (typeof expected.message === "string") {
    expect(result.json?.error?.message).toContain(expected.message);
  }

  if (expected.runId === "present") {
    expect(typeof result.json?.error?.run_id).toBe("string");
    expect(result.json?.error?.run_id).toMatch(RUN_ID_RE);
  } else if (expected.runId === "absent") {
    expect(result.json?.error?.run_id).toBeUndefined();
  } else if (expected.runId === "string") {
    expect(typeof result.json?.error?.run_id).toBe("string");
  }

  expected.details?.(result.json?.error?.details ?? []);
}

export function expectRunObject(
  run: Record<string, any>,
  expectedStatus: string
): void {
  expect(run).toBeTypeOf("object");
  expect(run.run_id).toMatch(RUN_ID_RE);
  expect(run.doc_id).toMatch(/^(N[12]|U-[0-9A-F]{6})$/);
  expect(run.status).toBe(expectedStatus);
  expect(typeof run.request).toBe("string");
  expect(Number.isInteger(run.round)).toBe(true);
  expect(Number.isInteger(run.retry_count)).toBe(true);
  expect(run.created_at).toMatch(UTC_RE);
  expect(run.updated_at).toMatch(UTC_RE);
  expect(Array.isArray(run.questions)).toBe(true);
  expect(Array.isArray(run.tool_log)).toBe(true);
  expect(run.limits).toMatchObject({
    max_model_turns: 4,
    max_tool_calls: 6,
    max_clarification_rounds: 2,
  });
  expect(typeof run.limits.model_turns_used).toBe("number");
  expect(typeof run.limits.tool_calls_used).toBe("number");
  expect(typeof run.limits.limit_hit).toBe("boolean");
  expect(run.error === null || typeof run.error === "object").toBe(true);
}
