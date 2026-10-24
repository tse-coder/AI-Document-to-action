import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/agent/run-agent", () => ({
  runAgent: vi.fn(),
}));

import {
  callRoute,
  expectApiError,
  expectSuccess,
} from "../support/assertions";
import type { TaskBase, ValidationIssue } from "../../lib/types";
import {
  CREATED_TASK_ID_RE,
  N1_REQUEST,
  UTC_RE,
  agentAwaiting,
  createTask,
  proposalFixture,
  validTask,
} from "../support/fixtures";
import {
  HAS_TEST_DATABASE,
  db,
  fetchRunRow,
  rowCount,
  startClarificationRun,
  startPendingRun,
  useHttpApi,
} from "../support/http";

describe.skipIf(!HAS_TEST_DATABASE)(
  "HTTP API",
  () => {
    const routes = useHttpApi();

    describe("POST /api/runs/:runId/confirm", () => {
      function confirmBody(
        tasks: TaskBase[],
        proposalVersion = 1
      ): Record<string, unknown> {
        return {
          proposal_version: proposalVersion,
          tasks,
        };
      }

      async function createAwaitingRun(
        tasks: TaskBase[] = [validTask(), createTask()],
        issues: ValidationIssue[] = []
      ): Promise<Record<string, any>> {
        return startPendingRun(
          { doc_id: "N1", request: N1_REQUEST },
          agentAwaiting(proposalFixture(tasks, issues))
        );
      }

      it("saves updates and creates in one confirmed batch", async () => {
        const run = await createAwaitingRun();
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody([
            validTask({
              description: "Submit both renewal documents to Room 12",
            }),
            createTask(),
          ]),
        });
        const data = expectSuccess<Record<string, any>>(result);

        expect(data).toMatchObject({
          run_id: run.run_id,
          status: "saved",
          doc_id: "N1",
          reopen_path: "/api/checklists/N1",
        });
        expect(data.saved_at).toMatch(UTC_RE);
        expect(data.saved).toEqual([
          { client_id: "C1", task_id: "TSK-0001", action: "update" },
          {
            client_id: "C3",
            task_id: expect.stringMatching(CREATED_TASK_ID_RE),
            action: "create",
          },
        ]);
        expect(data.warnings).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: "DEADLINE_NOT_STATED",
              severity: "warning",
              task_client_id: "C3",
            }),
          ])
        );

        const stored = await fetchRunRow(run.run_id);
        expect(stored.status).toBe("saved");

        const events = await db()`SELECT * FROM save_events WHERE run_id = ${run.run_id}`;
        expect(events).toHaveLength(1);
        expect(events[0].doc_id).toBe("N1");
        expect(events[0].task_count).toBe(2);

        const tasks = await db()`SELECT * FROM checklist_tasks
                                    WHERE doc_id = 'N1'
                                    ORDER BY id`;
        expect(tasks).toHaveLength(3);
        expect(tasks.find((task: any) => task.id === "TSK-0001")).toMatchObject({
          description: "Submit both renewal documents to Room 12",
          deadline_date: "2026-11-15",
          deadline_text: "15 November 2026",
          deadline_source: "document",
          owner: "Student",
          owner_source: "document",
          status: "open",
          last_run_id: run.run_id,
        });

        const createId = data.saved.find(
          (entry: any) => entry.client_id === "C3"
        ).task_id;
        expect(createId).toMatch(CREATED_TASK_ID_RE);
        const created = tasks.find((task: any) => task.id === createId);
        expect(created).toMatchObject({
          doc_id: "N1",
          description: "Get the renewal form signed by the department head",
          status: "open",
          last_run_id: run.run_id,
        });

        const sources = await db()`
          SELECT task_id, paragraph_id, ord
          FROM task_sources
          WHERE task_id IN ('TSK-0001', ${createId})
          ORDER BY task_id, ord
        `;
        expect(sources).toEqual([
          {
            task_id: "TSK-0001",
            paragraph_id: "N1-P2",
            ord: 1,
          },
          {
            task_id: "TSK-0001",
            paragraph_id: "N1-P3",
            ord: 2,
          },
          {
            task_id: createId,
            paragraph_id: "N1-P5",
            ord: 1,
          },
        ]);
      });

      it("does not save tasks that the user removed from the confirm payload", async () => {
        const run = await createAwaitingRun();
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody([validTask()]),
        });
        const data = expectSuccess<Record<string, any>>(result);
        expect(data.saved).toHaveLength(1);
        expect(data.saved[0].client_id).toBe("C1");

        const tasks = await db()`SELECT * FROM checklist_tasks WHERE doc_id = 'N1'`;
        expect(tasks.map((task: any) => task.id).sort()).toEqual([
          "TSK-0001",
          "TSK-0002",
        ]);
        expect(
          tasks.find((task: any) => task.id === "TSK-0001")
        ).toMatchObject({
          description: "Submit the completed renewal form to Room 12",
        });
      });

      it("updates the task source references in payload order", async () => {
        const run = await createAwaitingRun();
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody([
            validTask({
              source_refs: ["N1-P3", "N1-P2", "N1-P4"],
            }),
          ]),
        });
        expectSuccess(result);

        const sources = await db()`
          SELECT paragraph_id, ord
          FROM task_sources
          WHERE task_id = 'TSK-0001'
          ORDER BY ord
        `;
        expect(sources).toEqual([
          { paragraph_id: "N1-P3", ord: 1 },
          { paragraph_id: "N1-P2", ord: 2 },
          { paragraph_id: "N1-P4", ord: 3 },
        ]);
      });

      it("accepts exactly 12 tasks", async () => {
        const run = await createAwaitingRun();
        const tasks = Array.from({ length: 12 }, (_, index) =>
          createTask({
            client_id: `C${index + 1}`,
            description: `Task number ${index + 1} must be completed`,
            source_refs: ["N1-P1"],
          })
        );
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody(tasks),
        });
        const data = expectSuccess<Record<string, any>>(result);
        expect(data.saved).toHaveLength(12);
        expect(
          new Set(data.saved.map((saved: any) => saved.task_id)).size
        ).toBe(12);
        expect(await rowCount("checklist_tasks")).toBe(14);
      });

      it("rejects 13 tasks", async () => {
        const run = await createAwaitingRun();
        const tasks = Array.from({ length: 13 }, (_, index) =>
          createTask({
            client_id: `C${index + 1}`,
            description: `Task number ${index + 1} must be completed`,
            source_refs: ["N1-P1"],
          })
        );
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody(tasks),
        });
        expectApiError(result, {
          status: 400,
          code: "INVALID_REQUEST",
          retryable: false,
          runId: "present",
        });
      });

      it("returns 404 for an unknown run before checking the proposal version", async () => {
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: "/api/runs/RUN-NOTFOUND1/confirm",
          params: { runId: "RUN-NOTFOUND1" },
          body: confirmBody([], 999),
        });
        expectApiError(result, {
          status: 404,
          code: "RUN_NOT_FOUND",
          retryable: false,
          runId: "absent",
        });
      });

      it("returns ALREADY_SAVED before checking a stale version", async () => {
        const run = await createAwaitingRun();
        const first = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody([validTask()]),
        });
        expectSuccess(first);

        const second = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody([], 999),
        });
        expectApiError(second, {
          status: 409,
          code: "ALREADY_SAVED",
          retryable: false,
          runId: "present",
        });
      });

      it("returns RUN_NOT_AWAITING_APPROVAL before checking the payload", async () => {
        const run = await startClarificationRun();
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: { proposal_version: 999, tasks: [] },
        });
        expectApiError(result, {
          status: 409,
          code: "RUN_NOT_AWAITING_APPROVAL",
          retryable: false,
          runId: "present",
        });
      });

      it("returns STALE_PROPOSAL before validating tasks", async () => {
        const run = await createAwaitingRun();
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: { proposal_version: 999, tasks: [] },
        });
        expectApiError(result, {
          status: 409,
          code: "STALE_PROPOSAL",
          retryable: false,
          runId: "present",
        });

        expect(await rowCount("save_events")).toBe(0);
        const stored = await fetchRunRow(run.run_id);
        expect(stored.status).toBe("awaiting_approval");
      });

      it("returns NO_TASKS for an empty task list", async () => {
        const run = await createAwaitingRun();
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody([]),
        });
        expectApiError(result, {
          status: 422,
          code: "NO_TASKS",
          retryable: false,
          runId: "present",
        });
      });

      it.each([
        {
          name: "an invalid payload",
          tasks: "not-an-array",
        },
        {
          name: "a missing proposal version",
          tasks: [validTask()],
          omitVersion: true,
        },
        {
          name: "a non-integer proposal version",
          tasks: [validTask()],
          version: "1",
        },
        {
          name: "a duplicated client_id",
          tasks: [
            validTask({ client_id: "C1" }),
            createTask({ client_id: "C1" }),
          ],
        },
        {
          name: "a create task with a task_id",
          tasks: [createTask({ action: "create", task_id: "TSK-0002" })],
        },
        {
          name: "an update task without a task_id",
          tasks: [validTask({ action: "update", task_id: null })],
        },
        {
          name: "a task with more than six sources",
          tasks: [
            validTask({
              source_refs: [
                "N1-P1",
                "N1-P2",
                "N1-P3",
                "N1-P4",
                "N1-P5",
                "N1-P1",
                "N1-P2",
              ],
            }),
          ],
        },
        {
          name: "a description under five characters",
          tasks: [validTask({ description: "abc" })],
        },
        {
          name: "an owner over 80 characters",
          tasks: [validTask({ owner: "o".repeat(81) })],
        },
        {
          name: "a condition over 200 characters",
          tasks: [validTask({ condition: "c".repeat(201) })],
        },
        {
          name: "a blank owner with a document owner source",
          tasks: [validTask({ owner: "   ", owner_source: "document" })],
        },
        {
          name: "a document deadline without deadline_text",
          tasks: [
            validTask({ deadline_text: null, deadline_source: "document" }),
          ],
        },
        {
          name: "a document deadline without a date",
          tasks: [
            validTask({ deadline_date: null, deadline_source: "document" }),
          ],
        },
        {
          name: "a user deadline with deadline_text",
          tasks: [
            validTask({
              deadline_source: "user",
              deadline_text: "15 November 2026",
            }),
          ],
        },
        {
          name: "a user deadline without a date",
          tasks: [
            validTask({
              deadline_date: null,
              deadline_text: null,
              deadline_source: "user",
            }),
          ],
        },
        {
          name: "a none deadline with a date",
          tasks: [
            validTask({
              deadline_source: "none",
              deadline_date: "2026-11-15",
              deadline_text: null,
            }),
          ],
        },
        {
          name: "a none deadline with deadline_text",
          tasks: [
            validTask({
              deadline_date: null,
              deadline_text: "15 November 2026",
              deadline_source: "none",
            }),
          ],
        },
        {
          name: "a null owner with a document source",
          tasks: [validTask({ owner: null, owner_source: "document" })],
        },
        {
          name: "an owner with a none source",
          tasks: [validTask({ owner: "Student", owner_source: "none" })],
        },
        {
          name: "a task with no source refs",
          tasks: [validTask({ source_refs: [] })],
        },
        {
          name: "an unknown field inside a task",
          tasks: [{ ...validTask(), extra: true }],
        },
      ])("rejects $name", async ({ tasks, omitVersion, version }) => {
        const run = await createAwaitingRun();
        const body: Record<string, unknown> = { tasks };
        if (!omitVersion) {
          body.proposal_version = version ?? 1;
        }

        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body,
        });
        expectApiError(result, {
          status: 400,
          code: "INVALID_REQUEST",
          retryable: false,
          runId: "present",
        });
        expect(await rowCount("save_events")).toBe(0);
      });

      it.each([
        {
          name: "an unknown paragraph",
          task: validTask({ source_refs: ["N1-P99"] }),
          code: "UNKNOWN_PARAGRAPH",
        },
        {
          name: "a paragraph from another document",
          task: validTask({ source_refs: ["N2-P1"] }),
          code: "UNKNOWN_PARAGRAPH",
        },
        {
          name: "a deadline not present in the cited source",
          task: validTask({
            deadline_date: "2026-11-20",
            deadline_text: "20 November 2026",
          }),
          code: "DEADLINE_NOT_IN_SOURCE",
        },
        {
          name: "a deadline date that does not match its text",
          task: validTask({
            deadline_date: "2026-11-20",
            deadline_text: "15 November 2026",
          }),
          code: "DEADLINE_DATE_MISMATCH",
        },
        {
          name: "an impossible calendar date",
          task: validTask({
            deadline_date: "2026-02-30",
            deadline_text: "15 November 2026",
          }),
          code: "INVALID_DATE",
        },
        {
          name: "an update target that does not exist",
          task: validTask({ task_id: "TSK-9999" }),
          code: "UPDATE_TARGET_NOT_FOUND",
        },
        {
          name: "a whitespace-only description",
          task: validTask({ description: "     " }),
          code: "EMPTY_DESCRIPTION",
        },
      ])("returns VALIDATION_FAILED for $name", async ({ task, code }) => {
        const run = await createAwaitingRun();
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody([task]),
        });
        expectApiError(result, {
          status: 422,
          code: "VALIDATION_FAILED",
          retryable: false,
          runId: "present",
          details: (details) => {
            expect(details).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  code,
                  severity: "error",
                  task_client_id: task.client_id,
                }),
              ])
            );
          },
        });
        expect(await rowCount("save_events")).toBe(0);
      });

      it("returns warnings while still saving", async () => {
        const run = await createAwaitingRun();
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody([
            validTask(),
            createTask({
              deadline_date: null,
              deadline_text: null,
              deadline_source: "none",
            }),
          ]),
        });
        const data = expectSuccess<Record<string, any>>(result);
        expect(data.warnings).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code: "DEADLINE_NOT_STATED",
              severity: "warning",
              task_client_id: "C3",
            }),
          ])
        );
        expect((await fetchRunRow(run.run_id)).status).toBe("saved");
      });

      it("rolls back every write when save_checklist fails", async () => {
        const run = await createAwaitingRun();
        await db().unsafe(`
          CREATE OR REPLACE FUNCTION test_fail_task_sources()
          RETURNS trigger LANGUAGE plpgsql AS $$
          BEGIN
            RAISE EXCEPTION 'forced task_sources failure';
          END;
          $$;
          CREATE TRIGGER test_fail_task_sources_trigger
          BEFORE INSERT ON task_sources
          FOR EACH ROW EXECUTE FUNCTION test_fail_task_sources();
        `);

        const before = {
          tasks: await rowCount("checklist_tasks"),
          events: await rowCount("save_events"),
        };
        const result = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody([validTask(), createTask()]),
        });
        expectApiError(result, {
          status: 500,
          code: "TOOL_FAILURE",
          retryable: true,
          runId: "present",
        });

        expect(await rowCount("checklist_tasks")).toBe(before.tasks);
        expect(await rowCount("save_events")).toBe(before.events);
        expect((await fetchRunRow(run.run_id)).status).toBe(
          "awaiting_approval"
        );
      });

      it("allows exactly one of two concurrent confirmations", async () => {
        const run = await createAwaitingRun();
        const body = confirmBody([validTask()]);
        const [first, second] = await Promise.all([
          callRoute(routes.confirm, {
            method: "POST",
            path: `/api/runs/${run.run_id}/confirm`,
            params: { runId: run.run_id },
            body,
          }),
          callRoute(routes.confirm, {
            method: "POST",
            path: `/api/runs/${run.run_id}/confirm`,
            params: { runId: run.run_id },
            body,
          }),
        ]);

        const statuses = [first.status, second.status].sort((a, b) => a - b);
        expect(statuses).toEqual([200, 409]);
        const rejected = first.status === 409 ? first : second;
        expectApiError(rejected, {
          status: 409,
          code: "ALREADY_SAVED",
          retryable: false,
          runId: "present",
        });
        expect(await rowCount("save_events")).toBe(1);
      });

      it("returns the saved checklist and saved run after confirmation", async () => {
        const run = await createAwaitingRun();
        const confirmResult = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: confirmBody([validTask(), createTask()]),
        });
        const confirmData = expectSuccess<Record<string, any>>(confirmResult);

        const runResult = await callRoute(routes.run, {
          path: `/api/runs/${run.run_id}`,
          params: { runId: run.run_id },
        });
        const runData = expectSuccess<{ run: Record<string, any> }>(runResult);
        expect(runData.run.status).toBe("saved");
        expect(runData.run.proposal).not.toBeNull();

        const checklistResult = await callRoute(routes.checklist, {
          path: "/api/checklists/N1",
          params: { docId: "N1" },
        });
        const checklistData = expectSuccess<Record<string, any>>(
          checklistResult
        );
        expect(
          checklistData.tasks.map((task: any) => task.task_id)
        ).toEqual([
          "TSK-0001",
          "TSK-0002",
          confirmData.saved.find((saved: any) => saved.client_id === "C3")
            .task_id,
        ]);
      });
    });
  }
);
