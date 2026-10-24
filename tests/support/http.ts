import { afterAll, beforeAll, beforeEach, expect, vi } from "vitest";
import postgres from "postgres";

import { runAgent } from "../../lib/agent/run-agent";
import type { AgentResult } from "../../lib/agent/run-agent";
import type { Question } from "../../lib/types";
import { callRoute, expectSuccess, type RouteHandler } from "./assertions";
import {
  agentAwaiting,
  agentNeedsClarification,
  N1_DOC,
  N1_REQUEST,
  question,
} from "./fixtures";
import { resetSql, schemaSql, seedSql } from "./sql";

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
export const HAS_TEST_DATABASE = Boolean(TEST_DATABASE_URL);
export const runAgentMock = vi.mocked(runAgent);

type Routes = {
  health: RouteHandler;
  documents: RouteHandler;
  document: RouteHandler;
  runsCreate: RouteHandler;
  run: RouteHandler;
  answer: RouteHandler;
  retry: RouteHandler;
  confirm: RouteHandler;
  checklists: RouteHandler;
  checklist: RouteHandler;
};

let testSql: ReturnType<typeof postgres> | null = null;
let loadedRoutes: Routes | null = null;

export function db(): ReturnType<typeof postgres> {
  if (!testSql) {
    throw new Error("TEST_DATABASE_URL is not configured");
  }
  return testSql;
}

async function resetDatabase(): Promise<void> {
  await db().unsafe(resetSql);
  await db().unsafe(schemaSql);
  await db().unsafe(seedSql);
}

export async function rowCount(table: string): Promise<number> {
  if (!/^[a-z_]+$/.test(table)) {
    throw new Error(`Invalid test table name: ${table}`);
  }
  const rows = await db().unsafe<{ count: number }[]>(
    `SELECT count(*)::int AS count FROM ${table}`
  );
  return rows[0]?.count ?? -1;
}

export async function insertRunningRun(
  id: string,
  ageSeconds: number
): Promise<string> {
  await db()`
    INSERT INTO runs (id, doc_id, status, request, round, messages, updated_at)
    VALUES (
      ${id}, ${N1_DOC}, 'running', ${N1_REQUEST}, 1, '[]'::jsonb,
      now() - ${ageSeconds} * interval '1 second'
    )
  `;
  return id;
}

export async function insertErrorRun(
  id: string,
  retryCount = 0,
  simulateFailure: "none" | "model" | "tool" = "none"
): Promise<string> {
  await db()`
    INSERT INTO runs (
      id, doc_id, status, request, round, retry_count, simulate_failure,
      messages, error_code, error_message
    )
    VALUES (
      ${id}, ${N1_DOC}, 'error', ${N1_REQUEST}, 1, ${retryCount},
      ${simulateFailure}, '[]'::jsonb, 'MODEL_ERROR', 'failed once'
    )
  `;
  return id;
}

export async function fetchRunRow(id: string): Promise<Record<string, any>> {
  const rows = await db()`SELECT * FROM runs WHERE id = ${id}`;
  expect(rows).toHaveLength(1);
  return rows[0] as Record<string, any>;
}

export async function startPendingRun(
  body: Record<string, unknown> = {
    doc_id: N1_DOC,
    request: N1_REQUEST,
    simulate_failure: "none",
  },
  result: AgentResult = agentAwaiting()
): Promise<Record<string, any>> {
  runAgentMock.mockResolvedValueOnce(result);
  const response = await callRoute(loadedRoutes!.runsCreate, {
    method: "POST",
    path: "/api/runs",
    body,
  });
  const data = expectSuccess<{ run: Record<string, any> }>(response);
  return data.run;
}

export async function startClarificationRun(
  questions: Question[] = [question()]
): Promise<Record<string, any>> {
  return startPendingRun(
    {
      doc_id: N1_DOC,
      request: N1_REQUEST,
      simulate_failure: "none",
    },
    agentNeedsClarification(questions)
  );
}

export function useHttpApi(): Routes {
  beforeAll(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    process.env.ALLOW_SIMULATION = "true";
    process.env.GEMINI_MODEL = "gemini-2.5-flash";
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-gemini-key";

    testSql = postgres(TEST_DATABASE_URL!, {
      max: 1,
      prepare: false,
      ssl: TEST_DATABASE_URL!.includes("supabase") ? "require" : false,
      onnotice: () => undefined,
    });
    await resetDatabase();

    loadedRoutes = {
      health: (await import("../../app/api/health/route"))
        .GET as unknown as RouteHandler,
      documents: (await import("../../app/api/documents/route"))
        .GET as unknown as RouteHandler,
      document: (await import("../../app/api/documents/[docId]/route"))
        .GET as unknown as RouteHandler,
      runsCreate: (await import("../../app/api/runs/route"))
        .POST as unknown as RouteHandler,
      run: (await import("../../app/api/runs/[runId]/route"))
        .GET as unknown as RouteHandler,
      answer: (await import("../../app/api/runs/[runId]/answer/route"))
        .POST as unknown as RouteHandler,
      retry: (await import("../../app/api/runs/[runId]/retry/route"))
        .POST as unknown as RouteHandler,
      confirm: (await import("../../app/api/runs/[runId]/confirm/route"))
        .POST as unknown as RouteHandler,
      checklists: (await import("../../app/api/checklists/route"))
        .GET as unknown as RouteHandler,
      checklist: (await import("../../app/api/checklists/[docId]/route"))
        .GET as unknown as RouteHandler,
    };
  });

  beforeEach(async () => {
    runAgentMock.mockReset();
    await resetDatabase();
  });

  afterAll(async () => {
    await testSql?.end({ timeout: 5 });
    testSql = null;
    loadedRoutes = null;
  });

  return new Proxy({} as Routes, {
    get(_target, property: string | symbol) {
      if (!loadedRoutes) {
        throw new Error("HTTP test routes are not loaded yet");
      }
      if (
        typeof property !== "string" ||
        !(property in loadedRoutes)
      ) {
        throw new Error(`Unknown test route: ${String(property)}`);
      }
      return loadedRoutes[property as keyof Routes];
    },
  });
}
