// Owner: Member 4 (Backend Engineer)
// POST /api/runs — Start a new agent run

import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, errorResponse, parseJson } from "../../../lib/api-response";
import { createDocument, createRun, getDocumentWithParagraphs } from "../../../lib/db/queries";
import { runAgentPass } from "../../../lib/run-service";
import type { CreateRunRequest } from "../../../lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  try {
    const raw = await parseJson(request);
    if (!isRecord(raw)) throw new ApiRequestError("INVALID_JSON", "Request body must be a JSON object.", 400);
    const body = raw as Partial<CreateRunRequest>;
    const details: { field: string; message: string }[] = [];
    const ALLOWED_FIELDS = new Set(["doc_id", "text", "title", "request", "simulate_failure"]);
    for (const key of Object.keys(raw)) {
      if (!ALLOWED_FIELDS.has(key)) {
        details.push({ field: key, message: `Unknown field '${key}'.` });
      }
    }
    const docIdProvided = body.doc_id !== undefined;
    const textProvided = body.text !== undefined;
    const hasDocId = docIdProvided && typeof body.doc_id === "string" && body.doc_id.trim().length > 0;
    const hasText = textProvided && typeof body.text === "string";
    if (docIdProvided === textProvided) details.push({ field: "doc_id", message: "Provide exactly one of doc_id or text." });
    if (docIdProvided && !hasDocId) details.push({ field: "doc_id", message: "doc_id must be a non-empty string." });
    if (textProvided && !hasText) details.push({ field: "text", message: "text must be a string." });
    if (typeof body.request !== "string" || body.request.trim().length < 3 || body.request.length > 500) {
      details.push({ field: "request", message: "Request must be between 3 and 500 characters." });
    }
    if (hasText && body.text!.length > 6000) {
      throw new ApiRequestError("TEXT_TOO_LONG", "Pasted text must be 6000 characters or fewer.", 413);
    }
    if (hasText && (body.text!.trim().length < 20 || !body.text!.trim())) {
      details.push({ field: "text", message: "Pasted text must contain at least 20 characters." });
    }
    if (body.title !== undefined && (typeof body.title !== "string" || body.title.trim().length < 1 || body.title.length > 80)) {
      details.push({ field: "title", message: "Title must be between 1 and 80 characters." });
    }
    if (body.simulate_failure !== undefined && !["none", "model", "tool"].includes(String(body.simulate_failure))) {
      details.push({ field: "simulate_failure", message: "simulate_failure must be none, model, or tool." });
    }
    if (details.length) throw new ApiRequestError("INVALID_REQUEST", "One or more request fields are invalid.", 400, details);

    let docId: string;
    if (hasText) {
      const paragraphCount = body.text!.split(/\n\s*\n/u).map((p) => p.trim()).filter(Boolean).length;
      if (paragraphCount < 1 || paragraphCount > 40) {
        throw new ApiRequestError("INVALID_REQUEST", "Pasted text must contain no more than 40 paragraphs.", 400, [
          { field: "text", message: "Pasted text must contain between 1 and 40 paragraphs." },
        ]);
      }
      const document = await createDocument(body.text!, body.title);
      docId = document.doc_id;
    } else {
      docId = body.doc_id!.trim();
      if (!(await getDocumentWithParagraphs(docId))) {
        throw new ApiRequestError("DOCUMENT_NOT_FOUND", "Document not found.", 404);
      }
    }

    const run = await createRun(docId, body.request!, body.simulate_failure as CreateRunRequest["simulate_failure"]);
    const updated = await runAgentPass(run);
    return NextResponse.json({ ok: true, data: { run: updated } });
  } catch (error) {
    return errorResponse(error, "The run could not be started.");
  }
}
