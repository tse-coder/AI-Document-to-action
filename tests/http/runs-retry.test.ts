import { describe, expect, it, vi } from "vitest";

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
  agentError,
  newRunId,
} from "../support/fixtures";
import {
  HAS_TEST_DATABASE,
  fetchRunRow,
  insertErrorRun,
  runAgentMock,
  startClarificationRun,
  startPendingRun,
  useHttpApi,
} from "../support/http";

describe.skipIf(!HAS_TEST_DATABASE)(
  "HTTP API",
  () => {
    const routes = useHttpApi();

    describe("POST /api/runs/:runId/retry", () => {
      async function startErrorRun(
        simulateFailure: "none" | "model" | "tool" = "model"
      ): Promise<string> {
        runAgentMock.mockResolvedValueOnce(
          agentError("MODEL_ERROR", "forced failure")
        );
        const result = await callRoute(routes.runsCreate, {
          method: "POST",
          path: "/api/runs",
          body: {
            doc_id: "N1",
            request: N1_REQUEST,
            simulate_failure: simulateFailure,
          },
        });
        expectApiError(result, {
          status: 502,
          code: "MODEL_ERROR",
          retryable: true,
          runId: "present",
        });
        return result.json?.error?.run_id as string;
      }

      it("retries an error run and increments retry_count", async () => {
        const runId = await startErrorRun();
        runAgentMock.mockResolvedValueOnce(agentAwaiting());

        const result = await callRoute(routes.retry, {
          method: "POST",
          path: `/api/runs/${runId}/retry`,
          params: { runId },
          body: {},
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expectRunObject(data.run, "awaiting_approval");
        expect(data.run.run_id).toBe(runId);
        expect(data.run.retry_count).toBe(1);

        const stored = await fetchRunRow(runId);
        expect(stored.status).toBe("awaiting_approval");
        expect(stored.retry_count).toBe(1);
      });

      it("retries with answers retained from a failed answer pass", async () => {
        const run = await startClarificationRun();
        runAgentMock.mockResolvedValueOnce(
          agentError("MODEL_ERROR", "answer pass failed")
        );
        const failedAnswer = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: {
            answers: [
              {
                question_id: "Q1",
                answer: "Student",
                not_stated: false,
              },
            ],
          },
        });
        expectApiError(failedAnswer, {
          status: 502,
          code: "MODEL_ERROR",
          retryable: true,
          runId: "present",
        });

        runAgentMock.mockImplementationOnce(async (params) => {
          const submitted = params.answers?.find(
            (entry) => entry.questionId === "Q1"
          );
          const base = agentAwaiting();
          return {
            ...base,
            proposal: {
              ...(base.proposal as Record<string, any>),
              summary:
                submitted?.answer === "Student"
                  ? "retained submitted answer"
                  : "missing retained answer",
            },
          };
        });

        const result = await callRoute(routes.retry, {
          method: "POST",
          path: `/api/runs/${run.run_id}/retry`,
          params: { runId: run.run_id },
          body: {},
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expect(data.run.retry_count).toBe(1);
        expect(data.run.proposal.summary).toBe("retained submitted answer");
      });

      it("clears simulate_failure before running the retry", async () => {
        const runId = await startErrorRun("model");
        const before = await fetchRunRow(runId);
        expect(before.simulate_failure).toBe("model");

        runAgentMock.mockResolvedValueOnce(agentAwaiting());
        const result = await callRoute(routes.retry, {
          method: "POST",
          path: `/api/runs/${runId}/retry`,
          params: { runId },
          body: {},
        });
        expectSuccess(result);

        const after = await fetchRunRow(runId);
        expect(after.simulate_failure).toBe("none");
      });

      it("rejects retry when the run is not in error", async () => {
        const run = await startPendingRun();
        const result = await callRoute(routes.retry, {
          method: "POST",
          path: `/api/runs/${run.run_id}/retry`,
          params: { runId: run.run_id },
          body: {},
        });
        expectApiError(result, {
          status: 409,
          code: "RUN_NOT_IN_ERROR",
          retryable: false,
          runId: "present",
        });
      });

      it("returns 404 for an unknown run", async () => {
        const result = await callRoute(routes.retry, {
          method: "POST",
          path: "/api/runs/RUN-NOTFOUND1/retry",
          params: { runId: "RUN-NOTFOUND1" },
          body: {},
        });
        expectApiError(result, {
          status: 404,
          code: "RUN_NOT_FOUND",
          retryable: false,
          runId: "absent",
        });
      });

      it("allows the third retry and records retry_count 3", async () => {
        const runId = await insertErrorRun(newRunId(), 2);
        runAgentMock.mockResolvedValueOnce(agentAwaiting());

        const result = await callRoute(routes.retry, {
          method: "POST",
          path: `/api/runs/${runId}/retry`,
          params: { runId },
          body: {},
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);
        expect(data.run.retry_count).toBe(3);
        expect((await fetchRunRow(runId)).retry_count).toBe(3);
      });

      it("rejects a fourth retry with RETRY_LIMIT_REACHED", async () => {
        const runId = await insertErrorRun(newRunId(), 3);
        const result = await callRoute(routes.retry, {
          method: "POST",
          path: `/api/runs/${runId}/retry`,
          params: { runId },
          body: {},
        });
        expectApiError(result, {
          status: 429,
          code: "RETRY_LIMIT_REACHED",
          retryable: false,
          runId: "present",
        });

        const stored = await fetchRunRow(runId);
        expect(stored.retry_count).toBe(3);
        expect(stored.status).toBe("error");
      });

      it("rejects a retry body with unknown fields", async () => {
        const runId = await startErrorRun();
        const result = await callRoute(routes.retry, {
          method: "POST",
          path: `/api/runs/${runId}/retry`,
          params: { runId },
          body: { force: true },
        });
        expectApiError(result, {
          status: 400,
          code: "INVALID_REQUEST",
          retryable: false,
        });
      });

      it("increments retry_count exactly once when the retry itself fails", async () => {
        const runId = await startErrorRun("model");
        runAgentMock.mockResolvedValueOnce(
          agentError("MODEL_TIMEOUT", "retry timed out")
        );

        const result = await callRoute(routes.retry, {
          method: "POST",
          path: `/api/runs/${runId}/retry`,
          params: { runId },
          body: {},
        });
        expectApiError(result, {
          status: 504,
          code: "MODEL_TIMEOUT",
          retryable: true,
          runId: "present",
        });

        const stored = await fetchRunRow(runId);
        expect(stored.retry_count).toBe(1);
        expect(stored.status).toBe("error");
        expect(stored.error_code).toBe("MODEL_TIMEOUT");
        expect(stored.simulate_failure).toBe("none");
      });
    });
  }
);
