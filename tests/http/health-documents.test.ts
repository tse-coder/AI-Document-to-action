import { describe, expect, it, vi } from "vitest";

vi.mock("../../lib/agent/run-agent", () => ({
  runAgent: vi.fn(),
}));

import {
  callRoute,
  expectApiError,
  expectSuccess,
} from "../support/assertions";
import { N1_REQUEST, N1_TITLE } from "../support/fixtures";
import {
  HAS_TEST_DATABASE,
  db,
  startPendingRun,
  useHttpApi,
} from "../support/http";

describe.skipIf(!HAS_TEST_DATABASE)(
  "HTTP API",
  () => {
    const routes = useHttpApi();

    describe("GET /api/health", () => {
      it("returns the documented health payload as JSON", async () => {
        const result = await callRoute(routes.health, {
          path: "/api/health",
        });
        const data = expectSuccess<{
          status: string;
          db: string;
          model: string;
        }>(result);
        expect(data).toEqual({
          status: "ok",
          db: "ok",
          model: "gemini-2.5-flash",
        });
      });
    });

    describe("documents", () => {
      it("lists both demo notices, demo first, with counts and UTC timestamps", async () => {
        const result = await callRoute(routes.documents, {
          path: "/api/documents",
        });
        const data = expectSuccess<{
          documents: Record<string, any>[];
        }>(result);

        expect(data.documents.map((doc) => doc.doc_id)).toEqual(["N1", "N2"]);
        expect(data.documents).toEqual([
          expect.objectContaining({
            doc_id: "N1",
            title: N1_TITLE,
            origin: "demo",
            paragraph_count: 5,
            created_at: "2026-10-24T06:00:00Z",
          }),
          expect.objectContaining({
            doc_id: "N2",
            title: "Lab Equipment Borrowing Procedure",
            origin: "demo",
            paragraph_count: 6,
            created_at: "2026-10-24T06:00:00Z",
          }),
        ]);
      });

      it("returns N1 paragraphs in position order", async () => {
        const result = await callRoute(routes.document, {
          path: "/api/documents/N1",
          params: { docId: "N1" },
        });
        const data = expectSuccess<{
          document: Record<string, any>;
          paragraphs: Record<string, any>[];
        }>(result);

        expect(data.document).toMatchObject({
          doc_id: "N1",
          title: N1_TITLE,
          origin: "demo",
          paragraph_count: 5,
        });
        expect(data.paragraphs).toHaveLength(5);
        expect(data.paragraphs.map((paragraph) => paragraph.paragraph_id)).toEqual(
          ["N1-P1", "N1-P2", "N1-P3", "N1-P4", "N1-P5"]
        );
        expect(data.paragraphs.map((paragraph) => paragraph.position)).toEqual([
          1, 2, 3, 4, 5,
        ]);
        expect(data.paragraphs[2].text).toContain("15 November 2026");
      });

      it("returns N2 with six paragraphs", async () => {
        const result = await callRoute(routes.document, {
          path: "/api/documents/N2",
          params: { docId: "N2" },
        });
        const data = expectSuccess<{
          paragraphs: Record<string, any>[];
        }>(result);
        expect(data.paragraphs).toHaveLength(6);
        expect(data.paragraphs.map((paragraph) => paragraph.position)).toEqual([
          1, 2, 3, 4, 5, 6,
        ]);
      });

      it("returns 404 DOCUMENT_NOT_FOUND for an unknown document", async () => {
        const result = await callRoute(routes.document, {
          path: "/api/documents/DOES-NOT-EXIST",
          params: { docId: "DOES-NOT-EXIST" },
        });
        expectApiError(result, {
          status: 404,
          code: "DOCUMENT_NOT_FOUND",
          retryable: false,
          runId: "absent",
        });
      });

      it.each(["../N1", "%00", "U-12345", "N1 "])(
        "returns 404 rather than 500 for malformed document id %s",
        async (docId) => {
          const result = await callRoute(routes.document, {
            path: `/api/documents/${encodeURIComponent(docId)}`,
            params: { docId },
          });
          expectApiError(result, {
            status: 404,
            code: "DOCUMENT_NOT_FOUND",
            retryable: false,
          });
        }
      );

      it("places newest pasted documents after the demo documents", async () => {
        const firstText =
          "First pasted notice paragraph with enough characters.\n\nSecond pasted notice paragraph.";
        const secondText =
          "Another pasted notice paragraph with enough characters.\n\nIts second paragraph.";
        const firstRun = await startPendingRun({
          text: firstText,
          title: "Older Notice",
          request: N1_REQUEST,
        });
        const secondRun = await startPendingRun({
          text: secondText,
          title: "Newer Notice",
          request: N1_REQUEST,
        });
        await db()`UPDATE documents
                  SET created_at = '2026-10-24T08:00:00Z'
                  WHERE id = ${firstRun.doc_id}`;
        await db()`UPDATE documents
                  SET created_at = '2026-10-24T09:00:00Z'
                  WHERE id = ${secondRun.doc_id}`;

        const result = await callRoute(routes.documents, {
          path: "/api/documents",
        });
        const data = expectSuccess<{
          documents: Record<string, any>[];
        }>(result);
        const ids = data.documents.map((doc) => doc.doc_id);

        expect(ids).toEqual([
          "N1",
          "N2",
          secondRun.doc_id,
          firstRun.doc_id,
        ]);
      });
    });
  }
);
