// Owner: Member 4 (Backend Engineer)
// GET /api/documents/:docId — Get document with paragraphs
// DELETE /api/documents/:docId — Delete document and its dependent data

import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "../../../../lib/api-response";
import { requireApiAuth } from "../../../../lib/require-api-auth";
import { getDocumentWithParagraphs, deleteDocument } from "../../../../lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const authError = await requireApiAuth();
  if (authError) return authError;
  const { docId } = await params;

  try {
    const result = await getDocumentWithParagraphs(docId);
    if (!result) return NextResponse.json({ ok: false, error: {
      code: "DOCUMENT_NOT_FOUND", message: "Document not found.", retryable: false, details: [],
    } }, { status: 404 });
    return NextResponse.json({ ok: true, data: { document: result.doc, paragraphs: result.paragraphs } });
  } catch (error) {
    return errorResponse(error, "Document could not be loaded.");
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
    const deleted = await deleteDocument(docId);
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
    return errorResponse(error, "Document could not be deleted.");
  }
}

