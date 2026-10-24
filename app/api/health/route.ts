// Owner: Member 4 (Backend Engineer)
// GET /api/health — Returns service health status

import { NextResponse } from "next/server";
import { pingDatabase } from "../../../lib/db/connection";

export async function GET() {
  try {
    await pingDatabase();
    return NextResponse.json({ ok: true, data: { status: "ok", db: "ok", model: "gemini-2.5-flash" } });
  } catch (error) {
    // Keep internal details out of the response, but leave a trace in the
    // server log so intermittent connectivity failures are diagnosable.
    console.error("[health] database check failed:", error);
    return NextResponse.json({
      ok: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "The database is unavailable.",
        retryable: true,
        details: [],
      },
    }, { status: 503 });
  }
}
