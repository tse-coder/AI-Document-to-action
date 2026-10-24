// Owner: Member 4 (Backend Engineer)
// GET /api/runs/:runId — Get current run state

import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  // TODO: Query run by ID, include questions, proposal, tool_log, limits
  // Run stale check (if running && updated_at < 90s ago → set to error)
  // Return 404 RUN_NOT_FOUND if not found

  return NextResponse.json({
    ok: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "GET /api/runs/:runId not yet implemented",
      retryable: false,
      details: [],
    },
  }, { status: 501 });
}
