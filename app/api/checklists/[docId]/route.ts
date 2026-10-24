// Owner: Member 4 (Backend Engineer)
// GET /api/checklists/:docId — Get saved checklist with source paragraphs

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;

  // TODO: Query checklist_tasks + task_sources + paragraphs for this document
  // Return 404 DOCUMENT_NOT_FOUND if not found

  return NextResponse.json({
    ok: true,
    data: { doc_id: docId, title: "", last_saved_at: "", tasks: [] },
  });
}
