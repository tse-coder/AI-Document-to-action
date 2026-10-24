// Owner: Member 4 (Backend Engineer)
// GET /api/documents — List all documents (demo + pasted)

import { NextResponse } from "next/server";
import { errorResponse } from "../../../lib/api-response";
import { getDocuments } from "../../../lib/db/queries";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, data: { documents: await getDocuments() } });
  } catch (error) {
    return errorResponse(error, "Documents could not be loaded.");
  }
}
