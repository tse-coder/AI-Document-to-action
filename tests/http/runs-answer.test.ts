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
import type { ValidationIssue } from "../../lib/types";
import {
  agentAwaiting,
  agentError,
  agentNeedsClarification,
  createTask,
  proposalFixture,
  question,
  validTask,
} from "../support/fixtures";
import {
  HAS_TEST_DATABASE,
  db,
  fetchRunRow,
  runAgentMock,
  startClarificationRun,
  startPendingRun,
  useHttpApi,
} from "../support/http";

describe.skipIf(!HAS_TEST_DATABASE)(
  "HTTP API",
  () => {
    const routes = useHttpApi();

    describe("POST /api/runs/:runId/answer", () => {
      function answer(overrides: Record<string, unknown> = {}) {
        return {
          question_id: "Q1",
          answer: "Student",
          not_stated: false,
          ...overrides,
        };
      }

      it("answers every open question and returns the next proposal", async () => {
        const run = await startClarificationRun();
        runAgentMock.mockResolvedValueOnce(
          agentAwaiting(proposalFixture([validTask(), createTask()], [], 2), 4, 2)
        );

        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: { answers: [answer()] },
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expectRunObject(data.run, "awaiting_approval");
        expect(data.run.questions).toEqual([]);
        expect(data.run.proposal?.version).toBe(2);
        expect(data.run.round).toBe(1);

        const stored = await fetchRunRow(run.run_id);
        expect(stored.status).toBe("awaiting_approval");

        const answered = await db()`
          SELECT answer, not_stated, answered_at
          FROM run_questions
          WHERE run_id = ${run.run_id} AND question_id = 'Q1'
        `;
        expect(answered).toHaveLength(1);
        expect(answered[0]).toMatchObject({
          answer: "Student",
          not_stated: false,
        });
        expect(answered[0].answered_at).not.toBeNull();
      });

      it("passes the submitted answer to the resumed agent", async () => {
        const run = await startClarificationRun();
        const baseProposal = proposalFixture(
          [validTask(), createTask()],
          [],
          2
        );
        runAgentMock.mockImplementationOnce(async (params) => {
          const submitted = params.answers?.find(
            (entry) => entry.questionId === "Q1"
          );
          return {
            ...agentAwaiting(baseProposal, 4, 2),
            proposal: {
              ...baseProposal,
              summary:
                submitted?.answer === "Student" &&
                submitted.notStated === false
                  ? "used submitted answer"
                  : "missing submitted answer",
            },
          };
        });

        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: { answers: [answer()] },
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expect(data.run.proposal.summary).toBe("used submitted answer");
      });

      it("allows an answer of exactly 200 characters", async () => {
        const run = await startClarificationRun();
        runAgentMock.mockResolvedValueOnce(agentAwaiting());
        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: { answers: [answer({ answer: "x".repeat(200) })] },
        });
        expectSuccess(result);
      });

      it("accepts a real ISO deadline answer", async () => {
        const run = await startClarificationRun([
          question({ field: "deadline" }),
        ]);
        runAgentMock.mockResolvedValueOnce(agentAwaiting());
        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: {
            answers: [answer({ answer: "2028-02-29", not_stated: false })],
          },
        });
        expectSuccess(result);
      });

      it("accepts not_stated when the question allows it", async () => {
        const run = await startClarificationRun([
          question({ allow_not_stated: true }),
        ]);
        runAgentMock.mockResolvedValueOnce(
          agentAwaiting(
            proposalFixture(
              [validTask(), createTask({ owner: null, owner_source: "none" })],
              [
                {
                  code: "OWNER_NOT_STATED",
                  severity: "warning",
                  task_client_id: "C3",
                  message: "Owner was acknowledged as not stated.",
                },
              ]
            )
          )
        );
        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: {
            answers: [answer({ answer: "", not_stated: true })],
          },
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);
        expect(data.run.proposal?.validation?.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ code: "OWNER_NOT_STATED" }),
          ])
        );

        const answered = await db()`
          SELECT answer, not_stated, answered_at
          FROM run_questions
          WHERE run_id = ${run.run_id} AND question_id = 'Q1'
        `;
        expect(answered[0]).toMatchObject({
          answer: null,
          not_stated: true,
        });
        expect(answered[0].answered_at).not.toBeNull();
      });

      it.each([
        {
          name: "a missing answers field",
          body: {},
        },
        {
          name: "an empty answers array",
          body: { answers: [] },
        },
        {
          name: "a missing open question",
          body: {
            answers: [answer({ question_id: "Q2", answer: "Student" })],
          },
        },
        {
          name: "a duplicate question id",
          body: { answers: [answer(), answer()] },
        },
        {
          name: "an unknown question id",
          body: { answers: [answer({ question_id: "Q9" })] },
        },
        {
          name: "a missing answer value",
          body: { answers: [{ question_id: "Q1", not_stated: false }] },
        },
        {
          name: "a null answer value",
          body: {
            answers: [{ question_id: "Q1", answer: null, not_stated: false }],
          },
        },
        {
          name: "a non-boolean not_stated flag",
          body: {
            answers: [
              { question_id: "Q1", answer: "Student", not_stated: "no" },
            ],
          },
        },
        {
          name: "an empty answer that is not marked not_stated",
          body: { answers: [answer({ answer: "" })] },
        },
        {
          name: "an answer over 200 characters",
          body: { answers: [answer({ answer: "x".repeat(201) })] },
        },
        {
          name: "an answer plus not_stated true",
          body: {
            answers: [answer({ answer: "Student", not_stated: true })],
          },
        },
        {
          name: "a non-ISO deadline answer",
          field: "deadline",
          body: {
            answers: [answer({ answer: "15 November 2026" })],
          },
        },
        {
          name: "an impossible deadline answer",
          field: "deadline",
          body: { answers: [answer({ answer: "2026-02-29" })] },
        },
        {
          name: "a deadline with a single-digit month",
          field: "deadline",
          body: { answers: [answer({ answer: "2026-1-15" })] },
        },
        {
          name: "a deadline with an impossible month",
          field: "deadline",
          body: { answers: [answer({ answer: "2026-13-01" })] },
        },
        {
          name: "an unknown body field",
          body: { answers: [answer()], extra: true },
        },
      ])("rejects $name", async ({ body, field }) => {
        const run = await startClarificationRun([
          question({ field: field as "owner" | "deadline" | undefined }),
        ]);
        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body,
        });
        expectApiError(result, {
          status: 400,
          code: "INVALID_REQUEST",
          retryable: false,
          details: (details) => expect(details.length).toBeGreaterThan(0),
        });
        const stored = await fetchRunRow(run.run_id);
        expect(stored.status).toBe("needs_clarification");

        const unanswered = await db()`
          SELECT answer, not_stated, answered_at
          FROM run_questions
          WHERE run_id = ${run.run_id}
        `;
        expect(unanswered).toEqual([
          {
            answer: null,
            not_stated: null,
            answered_at: null,
          },
        ]);
      });

      it("rejects not_stated when the question does not allow it", async () => {
        const run = await startClarificationRun([
          question({ allow_not_stated: false }),
        ]);
        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: {
            answers: [answer({ answer: "", not_stated: true })],
          },
        });
        expectApiError(result, {
          status: 400,
          code: "INVALID_REQUEST",
          retryable: false,
        });

        const rows = await db()`
          SELECT answer, not_stated, answered_at
          FROM run_questions
          WHERE run_id = ${run.run_id}
        `;
        expect(rows).toEqual([
          { answer: null, not_stated: null, answered_at: null },
        ]);
      });

      it("rejects an answer when the run is not awaiting answers", async () => {
        const run = await startPendingRun();
        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: { answers: [answer()] },
        });
        expectApiError(result, {
          status: 409,
          code: "RUN_NOT_AWAITING_ANSWERS",
          retryable: false,
          runId: "present",
        });
      });

      it("returns 404 for an unknown run", async () => {
        const result = await callRoute(routes.answer, {
          method: "POST",
          path: "/api/runs/RUN-NOTFOUND1/answer",
          params: { runId: "RUN-NOTFOUND1" },
          body: { answers: [answer()] },
        });
        expectApiError(result, {
          status: 404,
          code: "RUN_NOT_FOUND",
          retryable: false,
          runId: "absent",
        });
      });

      it("does not accept a question id that belongs to a different run", async () => {
        const first = await startClarificationRun([
          question({ question_id: "Q1" }),
        ]);
        await startClarificationRun([
          question({ question_id: "Q1" }),
          question({ question_id: "Q2", task_client_id: "C4" }),
        ]);

        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${first.run_id}/answer`,
          params: { runId: first.run_id },
          body: {
            answers: [
              { question_id: "Q1", answer: "Student", not_stated: false },
              { question_id: "Q2", answer: "Student", not_stated: false },
            ],
          },
        });
        expectApiError(result, {
          status: 400,
          code: "INVALID_REQUEST",
          retryable: false,
        });

        const rows = await db()`
          SELECT question_id, answer, not_stated, answered_at
          FROM run_questions
          WHERE run_id = ${first.run_id}
          ORDER BY question_id
        `;
        expect(rows).toEqual([
          {
            question_id: "Q1",
            answer: null,
            not_stated: null,
            answered_at: null,
          },
        ]);
      });

      it("keeps only new questions and increments the round when gaps remain", async () => {
        const run = await startClarificationRun([
          question({ question_id: "Q1" }),
        ]);
        const nextQuestion = question({
          question_id: "Q2",
          task_client_id: "C4",
          text: "When is the form due?",
        });
        runAgentMock.mockResolvedValueOnce(
          agentNeedsClarification([nextQuestion], 4, 2)
        );

        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: { answers: [answer()] },
        });
        const data = expectSuccess<{ run: Record<string, any> }>(result);

        expect(data.run.status).toBe("needs_clarification");
        expect(data.run.round).toBe(2);
        expect(data.run.questions.map((q: any) => q.question_id)).toEqual(["Q2"]);

        const rows = await db()`
          SELECT question_id, round, answer, answered_at
          FROM run_questions
          WHERE run_id = ${run.run_id}
          ORDER BY question_id
        `;
        expect(rows.map((row: any) => row.question_id)).toEqual(["Q1", "Q2"]);
        expect(rows[0]).toMatchObject({ round: 1, answer: "Student" });
        expect(rows[0].answered_at).not.toBeNull();
        expect(rows[1]).toMatchObject({
          round: 2,
          answer: null,
          answered_at: null,
        });
      });

      it("converts round-2 gaps into warnings instead of more questions", async () => {
        const run = await startClarificationRun([
          question({ question_id: "Q1" }),
        ]);
        const nextQuestion = question({
          question_id: "Q2",
          task_client_id: "C4",
          text: "When is the form due?",
        });
        runAgentMock.mockResolvedValueOnce(
          agentNeedsClarification([nextQuestion], 4, 2)
        );

        const firstAnswer = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: { answers: [answer()] },
        });
        const firstData = expectSuccess<{
          run: Record<string, any>;
        }>(firstAnswer);
        expect(firstData.run.round).toBe(2);
        expect(firstData.run.status).toBe("needs_clarification");
        expect(
          firstData.run.questions.map((q: any) => q.question_id)
        ).toEqual(["Q2"]);

        const warning: ValidationIssue = {
          code: "DEADLINE_NOT_STATED",
          severity: "warning",
          task_client_id: "C3",
          message: "No deadline is stated for the signature task.",
        };
        runAgentMock.mockResolvedValueOnce(
          agentAwaiting(
            proposalFixture([validTask(), createTask()], [warning]),
            4,
            2
          )
        );
        const secondAnswer = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: {
            answers: [
              {
                question_id: "Q2",
                answer: "2026-12-01",
                not_stated: false,
              },
            ],
          },
        });
        const secondData = expectSuccess<{
          run: Record<string, any>;
        }>(secondAnswer);
        expect(secondData.run.round).toBe(2);
        expect(secondData.run.status).toBe("awaiting_approval");
        expect(secondData.run.proposal.validation.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ code: "DEADLINE_NOT_STATED" }),
          ])
        );

        const rows = await db()`
          SELECT question_id, answer, not_stated, answered_at
          FROM run_questions
          WHERE run_id = ${run.run_id}
          ORDER BY question_id
        `;
        expect(rows).toEqual([
          {
            question_id: "Q1",
            answer: "Student",
            not_stated: false,
            answered_at: expect.any(Date),
          },
          {
            question_id: "Q2",
            answer: "2026-12-01",
            not_stated: false,
            answered_at: expect.any(Date),
          },
        ]);
      });

      it("maps a model failure during answer submission to the documented error", async () => {
        const run = await startClarificationRun();
        runAgentMock.mockResolvedValueOnce(
          agentError("MODEL_ERROR", "bad model output")
        );
        const result = await callRoute(routes.answer, {
          method: "POST",
          path: `/api/runs/${run.run_id}/answer`,
          params: { runId: run.run_id },
          body: { answers: [answer()] },
        });
        expectApiError(result, {
          status: 502,
          code: "MODEL_ERROR",
          retryable: true,
          runId: "present",
        });

        const stored = await fetchRunRow(run.run_id);
        expect(stored.status).toBe("error");
        expect(stored.error_code).toBe("MODEL_ERROR");

        const answered = await db()`
          SELECT answer, not_stated, answered_at
          FROM run_questions
          WHERE run_id = ${run.run_id} AND question_id = 'Q1'
        `;
        expect(answered[0]).toMatchObject({
          answer: "Student",
          not_stated: false,
        });
        expect(answered[0].answered_at).not.toBeNull();
      });
    });
  }
);
