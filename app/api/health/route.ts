// Owner: Member 4 (Backend Engineer)
// GET /api/health — Returns service health status

import { NextResponse } from "next/server";
import { sql } from "../../../lib/db/connection";

export async function GET() {
  try {
    await sql`SELECT 1`;
    return NextResponse.json({ ok: true, data: { status: "ok", db: "ok", model: "gemini-2.5-flash" } });
  } catch {
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
