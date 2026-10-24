// Owner: Member 4 (Backend Engineer)
// GET /api/documents/:docId — Get document with paragraphs

import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "../../../../lib/api-response";
import { getDocumentWithParagraphs } from "../../../../lib/db/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
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
