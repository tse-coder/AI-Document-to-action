// Owner: Member 4 (Backend Engineer)
// POST /api/runs/:runId/retry — Retry a failed run

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  // TODO:
  // 1. Validate run exists and status === "error"
  // 2. Check retry_count < 3
  // 3. Clear simulate_failure flag
  // 4. Re-run agent with retained request/document/answers
  // 5. Increment retry_count, return updated Run

  return NextResponse.json({
    ok: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "POST /api/runs/:runId/retry not yet implemented",
      retryable: false,
      details: [],
    },
  }, { status: 501 });
}
