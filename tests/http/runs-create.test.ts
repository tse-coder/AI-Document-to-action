import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/agent/run-agent", () => ({
  runAgent: vi.fn(),
}));

import {
  callRoute,
  expectApiError,
  expectRunObject,
  expectSuccess,
} from "../support/assertions";
import {
  N1_REQUEST,
  PASTED_DOC_ID_RE,
  agentAwaiting,
  agentError,
  proposalFixture,
} from "../support/fixtures";
import {
  HAS_TEST_DATABASE,
  fetchRunRow,
  rowCount,
  runAgentMock,
  startClarificationRun,
  startPendingRun,
  useHttpApi,
} from "../support/http";

describe.skipIf(!HAS_TEST_DATABASE)(
  "HTTP API",
  () => {
    const routes = useHttpApi();

    describe("POST /api/runs", () => {
      it("starts a run on N1 and returns the full run object", async () => {
        const run = await startPendingRun();

        expectRunObject(run, "awaiting_approval");
        expect(run.doc_id).toBe("N1");
        expect(run.request).toBe(N1_REQUEST);
        expect(run.round).toBe(1);
        expect(run.retry_count).toBe(0);
        expect(run.proposal).toMatchObject({
          version: 1,
          summary:
            "Submit a renewal form and passport photo by 15 November 2026.",
          validation: { passed: true, issues: [] },
        });
        expect(run.proposal.tasks).toHaveLength(2);
        expect(run.error).toBeNull();
        expect(run.limits.model_turns_used).toBe(2);
        expect(run.limits.tool_calls_used).toBe(2);
        expect(run.limits.limit_hit).toBe(false);

        const stored = await fetchRunRow(run.run_id);
        expect(stored.status).toBe("awaiting_approval");
        expect(stored.doc_id).toBe("N1");
      });

      it("replies with clarification questions without exposing a proposal", async () => {
        const run = await startClarificationRun();

        expectRunObject(run, "needs_clarification");
        expect(run.proposal).toBeNull();
        expect(run.questions).toEqual([
          expect.objectContaining({
            question_id: "Q1",
            field: "owner",
            task_client_id: "C3",
            allow_not_stated: true,
          }),
        ]);
      });

      it("creates a pasted document, splits it and applies the default title", async () => {
        const text =
          "Applicants must bring a national ID and a signed consent letter.\n\n" +
          "The interview takes place on 3 December 2026 at the main hall.";
        const run = await startPendingRun({
          text,
          request: N1_REQUEST,
          simulate_failure: "none",
        });

        expect(run.doc_id).toMatch(PASTED_DOC_ID_RE);
        expectRunObject(run, "awaiting_approval");

        const detail = await callRoute(routes.document, {
          path: `/api/documents/${run.doc_id}`,
          params: { docId: run.doc_id },
        });
        const data = expectSuccess<{
          document: Record<string, any>;
          paragraphs: Record<string, any>[];
        }>(detail);
        expect(data.document).toMatchObject({
          doc_id: run.doc_id,
          title: "Applicants must bring a national ID and ",
          origin: "pasted",
          paragraph_count: 2,
        });
        expect(data.paragraphs.map((paragraph) => paragraph.text)).toEqual([
          "Applicants must bring a national ID and a signed consent letter.",
          "The interview takes place on 3 December 2026 at the main hall.",
        ]);
      });

      it("uses an explicit pasted title and stores paragraph IDs with the new doc ID", async () => {
        const run = await startPendingRun({
          text:
            "Applicants must bring a national ID.\n\nSubmit it before 3 December 2026.",
          title: "Interview Notice",
          request: N1_REQUEST,
        });
        const detail = await callRoute(routes.document, {
          path: `/api/documents/${run.doc_id}`,
          params: { docId: run.doc_id },
        });
        const data = expectSuccess<{
          document: Record<string, any>;
          paragraphs: Record<string, any>[];
        }>(detail);

        expect(data.document.title).toBe("Interview Notice");
        expect(data.paragraphs.map((paragraph) => paragraph.paragraph_id)).toEqual(
          [`${run.doc_id}-P1`, `${run.doc_id}-P2`]
        );
      });

      it("accepts text and title at their documented maximum lengths", async () => {
        const text = "a".repeat(6000);
        const run = await startPendingRun({
          text,
          title: "t".repeat(80),
          request: "r".repeat(500),
        });
        expect(run.doc_id).toMatch(PASTED_DOC_ID_RE);
      });

      it("accepts text and request at their documented minimum lengths", async () => {
        const run = await startPendingRun({
          text: "a".repeat(20),
          title: "t",
          request: "abc",
        });
        expect(run.doc_id).toMatch(PASTED_DOC_ID_RE);
      });

      it("accepts exactly 40 pasted paragraphs", async () => {
        const text = Array.from(
          { length: 40 },
          (_, index) => `Paragraph ${index + 1} has enough characters.`
        ).join("\n\n");
        const run = await startPendingRun({ text, request: N1_REQUEST });
        const detail = await callRoute(routes.document, {
          path: `/api/documents/${run.doc_id}`,
          params: { docId: run.doc_id },
        });
        const data = expectSuccess<{
          paragraphs: Record<string, any>[];
        }>(detail);
        expect(data.paragraphs).toHaveLength(40);
      });

      it("rejects 41 pasted paragraphs", async () => {
        const text = Array.from(
          { length: 41 },
          (_, index) => `Paragraph ${index + 1} has enough characters.`
        ).join("\n\n");
        const result = await callRoute(routes.runsCreate, {
          method: "POST",
          path: "/api/runs",
          body: { text, request: N1_REQUEST },
        });
        expectApiError(result, {
          status: 400,
          code: "INVALID_REQUEST",
          retryable: false,
          runId: "absent",
        });
      });

      it.each([
        {
          name: "invalid JSON",
          rawBody: "{\"doc_id\":",
        },
        {
          name: "a JSON primitive",
          rawBody: "\"N1\"",
        },
        {
          name: "a JSON array",
          rawBody: "[]",
        },
        {
          name: "a JSON null",
          rawBody: "null",
        },
      ])("rejects $name with INVALID_JSON", async ({ rawBody }) => {
        const result = await callRoute(routes.runsCreate, {
          method: "POST",
          path: "/api/runs",
          rawBody,
        });
        expectApiError(result, {
          status: 400,
          code: "INVALID_JSON",
          retryable: false,
          runId: "absent",
        });
      });

      it.each([
        {
          name: "neither doc_id nor text",
          body: { request: N1_REQUEST },
        },
        {
          name: "both doc_id and text",
          body: {
            doc_id: "N1",
            text: "This pasted text is longer than twenty characters.",
            request: N1_REQUEST,
          },
        },
        {
          name: "null doc_id and null text",
          body: { doc_id: null, text: null, request: N1_REQUEST },
        },
        {
          name: "missing request",
          body: { doc_id: "N1" },
        },
        {
          name: "a request shorter than 3 characters",
          body: { doc_id: "N1", request: "ab" },
        },
        {
          name: "a request longer than 500 characters",
          body: { doc_id: "N1", request: "r".repeat(501) },
        },
        {
          name: "text shorter than 20 characters",
          body: { text: "a".repeat(19), request: N1_REQUEST },
        },
        {
          name: "a title longer than 80 characters",
          body: {
            text: "This pasted text is longer than twenty characters.",
            title: "t".repeat(81),
            request: N1_REQUEST,
          },
        },
        {
          name: "an empty title",
          body: {
            text: "This pasted text is longer than twenty characters.",
            title: "",
            request: N1_REQUEST,
          },
        },
        {
          name: "an empty simulate_failure",
          body: {
            doc_id: "N1",
            request: N1_REQUEST,
            simulate_failure: "",
          },
        },
        {
          name: "an unknown simulate_failure",
          body: {
            doc_id: "N1",
            request: N1_REQUEST,
            simulate_failure: "network",
          },
        },
        {
          name: "an unknown body field",
          body: {
            doc_id: "N1",
            request: N1_REQUEST,
            unexpected: true,
          },
        },
        {
          name: "a whitespace-only pasted document",
          body: { text: " ".repeat(24), request: N1_REQUEST },
        },
      ])("rejects $name", async ({ body }) => {
        const result = await callRoute(routes.runsCreate, {
          method: "POST",
          path: "/api/runs",
          body,
        });
        expectApiError(result, {
          status: 400,
          code: "INVALID_REQUEST",
          retryable: false,
          runId: "absent",
          details: (details) => {
            expect(details.length).toBeGreaterThan(0);
            for (const detail of details) {
              expect(typeof detail.message).toBe("string");
            }
          },
        });
        expect(await rowCount("runs")).toBe(0);
        expect(await rowCount("documents")).toBe(2);
      });

      it("returns 413 TEXT_TOO_LONG for more than 6000 characters", async () => {
        const result = await callRoute(routes.runsCreate, {
          method: "POST",
          path: "/api/runs",
          body: {
            text: "a".repeat(6001),
            request: N1_REQUEST,
          },
        });
        expectApiError(result, {
          status: 413,
          code: "TEXT_TOO_LONG",
          retryable: false,
          runId: "absent",
        });
        expect(await rowCount("runs")).toBe(0);
        expect(await rowCount("documents")).toBe(2);
      });

      it("returns 404 DOCUMENT_NOT_FOUND for an unknown doc_id", async () => {
        const result = await callRoute(routes.runsCreate, {
          method: "POST",
          path: "/api/runs",
          body: { doc_id: "N9", request: N1_REQUEST },
        });
        expectApiError(result, {
          status: 404,
          code: "DOCUMENT_NOT_FOUND",
          retryable: false,
          runId: "absent",
        });
        expect(await rowCount("runs")).toBe(0);
      });

      it.each([
        {
          code: "MODEL_QUOTA_EXCEEDED",
          httpStatus: 429,
        },
        {
          code: "MODEL_ERROR",
          httpStatus: 502,
        },
        {
          code: "MODEL_TIMEOUT",
          httpStatus: 504,
        },
        {
          code: "TOOL_FAILURE",
          httpStatus: 500,
        },
      ])(
        "maps agent error $code to HTTP $httpStatus and persists the error run",
        async ({ code, httpStatus }) => {
          runAgentMock.mockResolvedValueOnce(
            agentError(code, `forced ${code}`)
          );
          const result = await callRoute(routes.runsCreate, {
            method: "POST",
            path: "/api/runs",
            body: {
              doc_id: "N1",
              request: N1_REQUEST,
              simulate_failure: "none",
            },
          });

          expectApiError(result, {
            status: httpStatus,
            code,
            retryable: true,
            runId: "present",
          });

          const runId = result.json?.error?.run_id as string;
          const stored = await fetchRunRow(runId);
          expect(stored.status).toBe("error");
          expect(stored.error_code).toBe(code);
          expect(stored.request).toBe(N1_REQUEST);
          expect(stored.doc_id).toBe("N1");
        }
      );

      it("passes simulate_failure through to the agent", async () => {
        runAgentMock.mockImplementationOnce(async (params) =>
          params.simulateFailure === "model"
            ? agentError("MODEL_ERROR", "simulated model failure")
            : agentAwaiting()
        );

        const result = await callRoute(routes.runsCreate, {
          method: "POST",
          path: "/api/runs",
          body: {
            doc_id: "N1",
            request: N1_REQUEST,
            simulate_failure: "model",
          },
        });
        expectApiError(result, {
          status: 502,
          code: "MODEL_ERROR",
          retryable: true,
          runId: "present",
        });

        const runId = result.json?.error?.run_id as string;
        const stored = await fetchRunRow(runId);
        expect(stored.simulate_failure).toBe("model");
      });

      it("maps an unexpected thrown error to INTERNAL_ERROR without leaking details", async () => {
        runAgentMock.mockRejectedValueOnce(
          new Error("secret stack trace: AIzaSy-secret")
        );
        const result = await callRoute(routes.runsCreate, {
          method: "POST",
          path: "/api/runs",
          body: { doc_id: "N1", request: N1_REQUEST },
        });

        expectApiError(result, {
          status: 500,
          code: "INTERNAL_ERROR",
          retryable: false,
          details: (details) => expect(details).toEqual([]),
        });
        expect(result.text).not.toContain("AIzaSy-secret");
        expect(result.text).not.toContain("secret stack trace");
      });

      it("records limit_hit when a pass reaches a cap", async () => {
        const run = await startPendingRun(
          {
            doc_id: "N1",
            request: N1_REQUEST,
          },
          agentAwaiting(proposalFixture(), 4, 6)
        );

        expect(run.limits.model_turns_used).toBe(4);
        expect(run.limits.tool_calls_used).toBe(6);
        expect(run.limits.limit_hit).toBe(true);
      });
    });
  }
);
