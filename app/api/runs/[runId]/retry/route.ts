// Owner: Member 4 (Backend Engineer)
// POST /api/runs/:runId/retry — Retry a failed run

import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, errorResponse } from "../../../../../lib/api-response";
import { beginRunRetry, getRunById } from "../../../../../lib/db/queries";
import { runAgentPass } from "../../../../../lib/run-service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  let runExists = false;

  try {
    const run = await getRunById(runId);
    if (!run) throw new ApiRequestError("RUN_NOT_FOUND", "Run not found.", 404);
    runExists = true;
    if (run.status !== "error") throw new ApiRequestError("RUN_NOT_IN_ERROR", "Only failed runs can be retried.", 409);
    if (run.retry_count >= 3) throw new ApiRequestError("RETRY_LIMIT_REACHED", "This run has reached its retry limit.", 429);

    const running = await beginRunRetry(runId);
    if (!running) {
      const latest = await getRunById(runId);
      if (!latest) throw new ApiRequestError("RUN_NOT_FOUND", "Run not found.", 404);
      if (latest.status === "error" && latest.retry_count >= 3) {
        throw new ApiRequestError("RETRY_LIMIT_REACHED", "This run has reached its retry limit.", 429);
      }
      throw new ApiRequestError("RUN_NOT_IN_ERROR", "Only failed runs can be retried.", 409);
    }
    const updated = await runAgentPass(running, { clearSimulatedFailure: true });
    return NextResponse.json({ ok: true, data: { run: updated } });
  } catch (error) {
    return errorResponse(error, "The run could not be retried.", runExists ? runId : undefined);
  }
}
