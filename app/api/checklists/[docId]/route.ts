// Owner: Member 4 (Backend Engineer)
// GET /api/checklists/:docId — Get saved checklist with source paragraphs

import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "../../../../lib/api-response";
import { requireApiAuth } from "../../../../lib/require-api-auth";
import { getChecklist, deleteChecklist } from "../../../../lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const authError = await requireApiAuth();
  if (authError) return authError;
  const { docId } = await params;

  try {
    const checklist = await getChecklist(docId);
    if (!checklist) return NextResponse.json({ ok: false, error: {
      code: "DOCUMENT_NOT_FOUND", message: "Document not found.", retryable: false, details: [],
    } }, { status: 404 });
    return NextResponse.json({ ok: true, data: checklist });
  } catch (error) {
    return errorResponse(error, "Checklist could not be loaded.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const authError = await requireApiAuth();
  if (authError) return authError;
  const { docId } = await params;

  try {
    const deleted = await deleteChecklist(docId);
    if (!deleted) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "DOCUMENT_NOT_FOUND",
            message: "Document not found.",
            retryable: false,
            details: [],
          },
        },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, data: { doc_id: docId, deleted: true } });
  } catch (error) {
    return errorResponse(error, "Checklist could not be deleted.");
  }
}
