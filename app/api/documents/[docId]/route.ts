// Owner: Member 4 (Backend Engineer)
// GET /api/documents/:docId — Get document with paragraphs

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;

  // TODO: Query document + paragraphs by docId
  // Return 404 DOCUMENT_NOT_FOUND if not found

  return NextResponse.json({
    ok: true,
    data: { document: null, paragraphs: [] },
  });
}
