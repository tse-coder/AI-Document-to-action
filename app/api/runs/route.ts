// Owner: Member 4 (Backend Engineer)
// POST /api/runs — Start a new agent run

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // TODO:
  // 1. Parse & validate body (doc_id or text, request field)
  // 2. If text provided, create new document with paragraphs
  // 3. Create run record in DB
  // 4. Call runAgent() from lib/agent/run-agent.ts
  // 5. Store results (proposal/questions/tool_log)
  // 6. Return full Run object

  return NextResponse.json({
    ok: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message: "POST /api/runs not yet implemented",
      retryable: false,
      details: [],
    },
  }, { status: 501 });
}
