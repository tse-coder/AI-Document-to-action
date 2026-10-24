// Owner: Member 4 (Backend Engineer)
// GET /api/health — Returns service health status

import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Check DB connection and return status
  return NextResponse.json({
    ok: true,
    data: { status: "ok", db: "ok", model: "gemini-2.5-flash" },
  });
}
