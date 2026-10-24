// Owner: Member 4 (Backend Engineer)
// POST /api/runs/:runId/confirm — Approve and save the checklist

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  // TODO:
  // 1. Validate run exists and status === "awaiting_approval"
  // 2. Validate proposal_version matches stored version
  // 3. Validate task payload (schema + limits)
  // 4. Run validator on edited tasks
  // 5. Execute transactional batch save (save_events + tasks + task_sources)
  // 6. Update run status to "saved"
  // 7. Return saved confirmation with task IDs and warnings

  return NextResponse.json({
    ok: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "POST /api/runs/:runId/confirm not yet implemented",
      retryable: false,
      details: [],
    },
  }, { status: 501 });
}
