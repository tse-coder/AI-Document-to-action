// Owner: Member 4 (Backend Engineer)
// GET /api/documents — List all documents (demo + pasted)

import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Query documents table, return demo first then pasted by newest
  return NextResponse.json({
    ok: true,
    data: { documents: [] },
  });
}
