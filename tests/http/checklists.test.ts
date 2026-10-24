import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/agent/run-agent", () => ({
  runAgent: vi.fn(),
}));

import {
  callRoute,
  expectApiError,
  expectSuccess,
} from "../support/assertions";
import {
  N1_REQUEST,
  N1_TITLE,
  UTC_RE,
  agentAwaiting,
  createTask,
  proposalFixture,
  validTask,
} from "../support/fixtures";
import {
  HAS_TEST_DATABASE,
  startPendingRun,
  useHttpApi,
} from "../support/http";

describe.skipIf(!HAS_TEST_DATABASE)(
  "HTTP API",
  () => {
    const routes = useHttpApi();

    describe("checklists", () => {
      it("lists N1 from the seed before any run is confirmed", async () => {
        const result = await callRoute(routes.checklists, {
          path: "/api/checklists",
        });
        const data = expectSuccess<{
          checklists: Record<string, any>[];
        }>(result);

        expect(data.checklists).toEqual([
          {
            doc_id: "N1",
            title: N1_TITLE,
            task_count: 2,
            last_saved_at: "2026-10-24T06:00:00Z",
          },
        ]);
      });

      it("does not list documents without saved tasks", async () => {
        const result = await callRoute(routes.checklists, {
          path: "/api/checklists",
        });
        const data = expectSuccess<{
          checklists: Record<string, any>[];
        }>(result);
        expect(data.checklists.map((entry) => entry.doc_id)).toEqual(["N1"]);
        expect(data.checklists).toEqual([
          expect.objectContaining({
            doc_id: "N1",
            title: N1_TITLE,
            task_count: 2,
          }),
        ]);
      });

      it("returns the seeded N1 tasks with their citation text", async () => {
        const result = await callRoute(routes.checklist, {
          path: "/api/checklists/N1",
          params: { docId: "N1" },
        });
        const data = expectSuccess<Record<string, any>>(result);

        expect(data).toMatchObject({
          doc_id: "N1",
          title: N1_TITLE,
          last_saved_at: "2026-10-24T06:00:00Z",
        });
        expect(
          data.tasks.map((task: Record<string, any>) => task.task_id)
        ).toEqual(["TSK-0001", "TSK-0002"]);
        expect(data.tasks[0]).toMatchObject({
          description: "Submit renewal form",
          deadline_date: null,
          deadline_text: null,
          deadline_source: "none",
          condition: null,
          owner: "Student",
          owner_source: "document",
          status: "open",
          updated_at: "2026-10-24T06:00:00Z",
        });
        expect(data.tasks[0].sources).toEqual([
          {
            paragraph_id: "N1-P2",
            text: "Each student must submit two documents: a completed renewal form and one recent passport photo.",
          },
        ]);
        expect(data.tasks[1].sources).toEqual([
          {
            paragraph_id: "N1-P2",
            text: "Each student must submit two documents: a completed renewal form and one recent passport photo.",
          },
        ]);
      });

      it("returns 200 with empty tasks for an existing document with no checklist", async () => {
        const result = await callRoute(routes.checklist, {
          path: "/api/checklists/N2",
          params: { docId: "N2" },
        });
        const data = expectSuccess<Record<string, any>>(result);

        expect(data.doc_id).toBe("N2");
        expect(data.title).toBe("Lab Equipment Borrowing Procedure");
        expect(data.tasks).toEqual([]);
        expect(data.last_saved_at).toBeNull();
      });

      it("returns 404 for an unknown document", async () => {
        const result = await callRoute(routes.checklist, {
          path: "/api/checklists/N9",
          params: { docId: "N9" },
        });
        expectApiError(result, {
          status: 404,
          code: "DOCUMENT_NOT_FOUND",
          retryable: false,
          runId: "absent",
        });
      });

      it("updates the list count and newest timestamp after confirmation", async () => {
        const run = await startPendingRun(
          { doc_id: "N1", request: N1_REQUEST },
          agentAwaiting(proposalFixture([validTask(), createTask()]))
        );
        const confirm = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: {
            proposal_version: 1,
            tasks: [validTask(), createTask()],
          },
        });
        expectSuccess(confirm);

        const list = await callRoute(routes.checklists, {
          path: "/api/checklists",
        });
        const data = expectSuccess<{
          checklists: Record<string, any>[];
        }>(list);
        expect(data.checklists[0]).toMatchObject({
          doc_id: "N1",
          task_count: 3,
        });
        expect(data.checklists[0].last_saved_at).toMatch(UTC_RE);
        expect(data.checklists[0].last_saved_at >= "2026-10-24T06:00:00Z").toBe(
          true
        );
      });

      it("orders deadlines before null deadlines in the saved checklist", async () => {
        const run = await startPendingRun(
          { doc_id: "N1", request: N1_REQUEST },
          agentAwaiting(proposalFixture([validTask(), createTask()]))
        );
        const confirm = await callRoute(routes.confirm, {
          method: "POST",
          path: `/api/runs/${run.run_id}/confirm`,
          params: { runId: run.run_id },
          body: {
            proposal_version: 1,
            tasks: [validTask(), createTask()],
          },
        });
        const confirmData = expectSuccess<Record<string, any>>(confirm);
        const newId = confirmData.saved.find(
          (saved: any) => saved.client_id === "C3"
        ).task_id;

        const detail = await callRoute(routes.checklist, {
          path: "/api/checklists/N1",
          params: { docId: "N1" },
        });
        const data = expectSuccess<Record<string, any>>(detail);
        expect(data.tasks.map((task: any) => task.task_id)).toEqual([
          "TSK-0001",
          "TSK-0002",
          newId,
        ]);
      });
    });
  }
);
