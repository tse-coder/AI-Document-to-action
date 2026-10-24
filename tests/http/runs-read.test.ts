import { describe, expect, it, vi } from "vitest";
import type { ToolLogEntry } from "../../lib/types";

vi.mock("../../lib/agent/run-agent", () => ({
  runAgent: vi.fn(),
}));

import {
  callRoute,
  expectApiError,
  expectSuccess,
  expectRunObject,
} from "../support/assertions";
import {
  N1_REQUEST,
  agentAwaiting,
  newRunId,
} from "../support/fixtures";
import {
  HAS_TEST_DATABASE,
  db,
  fetchRunRow,
  insertErrorRun,
  insertRunningRun,
  startClarificationRun,
  startPendingRun,
  useHttpApi,
} from "../support/http";

describe.skipIf(!HAS_TEST_DATABASE)(
  "HTTP API",
  () => {
    const routes = useHttpApi();

    describe("GET /api/runs/:runId", () => {
      it("restores an awaiting-approval run with its proposal and tool log", async () => {
        const created = await startPendingRun();
        const result = await callRoute(routes.run, {
          path: `/api/runs/${created.run_id}`,
          params: { runId: created.run_id },
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expectRunObject(data.run, "awaiting_approval");
        expect(data.run.run_id).toBe(created.run_id);
        expect(data.run.proposal).toMatchObject({
          version: 1,
          tasks: expect.any(Array),
        });
        expect(data.run.questions).toEqual([]);
        expect(data.run.tool_log.length).toBeGreaterThan(0);
        expect(data.run.tool_log[0]).toMatchObject({
          seq: 1,
          phase: "finalize",
          tool: "finalize_proposal",
          args: { round: 1 },
          ok: true,
        });
      });

      it("returns only open questions while clarification is required", async () => {
        const created = await startClarificationRun();
        const result = await callRoute(routes.run, {
          path: `/api/runs/${created.run_id}`,
          params: { runId: created.run_id },
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expect(data.run.status).toBe("needs_clarification");
        expect(data.run.proposal).toBeNull();
        expect(data.run.questions).toEqual([
          expect.objectContaining({ question_id: "Q1" }),
        ]);
      });

      it("returns 404 RUN_NOT_FOUND for an unknown run", async () => {
        const result = await callRoute(routes.run, {
          path: "/api/runs/RUN-NOTFOUND1",
          params: { runId: "RUN-NOTFOUND1" },
        });
        expectApiError(result, {
          status: 404,
          code: "RUN_NOT_FOUND",
          retryable: false,
          runId: "absent",
        });
      });

      it("does not sweep a running run that is younger than 90 seconds", async () => {
        const runId = await insertRunningRun(newRunId(), 89);
        const result = await callRoute(routes.run, {
          path: `/api/runs/${runId}`,
          params: { runId },
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expect(data.run.status).toBe("running");
        expect(data.run.error).toBeNull();
        const stored = await fetchRunRow(runId);
        expect(stored.status).toBe("running");
      });

      it("sweeps a running run older than 90 seconds into MODEL_TIMEOUT", async () => {
        const runId = await insertRunningRun(newRunId(), 91);
        const result = await callRoute(routes.run, {
          path: `/api/runs/${runId}`,
          params: { runId },
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expect(data.run.status).toBe("error");
        expect(data.run.error).toEqual({
          code: "MODEL_TIMEOUT",
          message: expect.any(String),
        });

        const stored = await fetchRunRow(runId);
        expect(stored.status).toBe("error");
        expect(stored.error_code).toBe("MODEL_TIMEOUT");
        expect(typeof stored.error_message).toBe("string");
        expect(stored.error_message.length).toBeGreaterThan(0);

        const again = await callRoute(routes.run, {
          path: `/api/runs/${runId}`,
          params: { runId },
        });
        expectSuccess(again);
        expect(again.json?.data?.run?.status).toBe("error");
      });

      it("does not rewrite a non-running run", async () => {
        const runId = await insertErrorRun(newRunId(), 0);
        await db()`UPDATE runs
                  SET updated_at = now() - interval '500 seconds'
                  WHERE id = ${runId}`;
        const result = await callRoute(routes.run, {
          path: `/api/runs/${runId}`,
          params: { runId },
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expect(data.run.status).toBe("error");
        expect(data.run.error?.code).toBe("MODEL_ERROR");
        const stored = await fetchRunRow(runId);
        expect(stored.error_code).toBe("MODEL_ERROR");
      });

      it("orders the tool log by sequence number", async () => {
        const logs: ToolLogEntry[] = [
          {
            seq: 2,
            phase: "finalize",
            tool: "finalize_proposal",
            args: { round: 1 },
            ok: true,
            result_summary: "second",
            result: {},
            duration_ms: 3,
            at: "2026-10-24T07:15:36Z",
          },
          {
            seq: 1,
            phase: "loop",
            tool: "read_checklist",
            args: { doc_id: "N1" },
            ok: true,
            result_summary: "first",
            result: { doc_id: "N1", tasks: [] },
            duration_ms: 2,
            at: "2026-10-24T07:15:31Z",
          },
        ];
        const run = await startPendingRun(
          { doc_id: "N1", request: N1_REQUEST },
          { ...agentAwaiting(), toolLog: logs }
        );
        const result = await callRoute(routes.run, {
          path: `/api/runs/${run.run_id}`,
          params: { runId: run.run_id },
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expect(
          data.run.tool_log.map((entry: Record<string, any>) => entry.seq)
        ).toEqual([1, 2]);
      });
    });
  }
);
