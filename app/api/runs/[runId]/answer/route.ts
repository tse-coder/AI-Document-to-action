// Owner: Member 4 (Backend Engineer)
// POST /api/runs/:runId/answer — Submit answers to clarification questions

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  // TODO:
  // 1. Validate run exists and status === "needs_clarification"
  // 2. Validate all open questions are answered
  // 3. Store answers in run_questions table
  // 4. Re-run agent with answers appended
  // 5. Return updated Run object

  return NextResponse.json({
    ok: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "POST /api/runs/:runId/answer not yet implemented",
      retryable: false,
      details: [],
    },
  }, { status: 501 });
}
