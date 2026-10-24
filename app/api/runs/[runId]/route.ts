// Owner: Member 4 (Backend Engineer)
// GET /api/runs/:runId — Get current run state

import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "../../../../lib/api-response";
import { getRunById, staleRunToError } from "../../../../lib/db/queries";
import { requireApiAuth } from "../../../../lib/require-api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const authError = await requireApiAuth();
  if (authError) return authError;
  const { runId } = await params;

  try {
    await staleRunToError(runId);
    const run = await getRunById(runId);
    if (!run) return NextResponse.json({ ok: false, error: {
      code: "RUN_NOT_FOUND", message: "Run not found.", retryable: false, details: [],
    } }, { status: 404 });
    return NextResponse.json({ ok: true, data: { run } });
  } catch (error) {
    return errorResponse(error, "Run state could not be loaded.");
  }
}
