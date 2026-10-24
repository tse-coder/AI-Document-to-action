// Owner: Member 4 (Backend Engineer)
// GET /api/documents — List all documents (demo + pasted)

import { NextResponse } from "next/server";
import { errorResponse } from "../../../lib/api-response";
import { requireApiAuth, getOptionalUserId } from "../../../lib/require-api-auth";
import { getDocuments } from "../../../lib/db/queries";

export async function GET() {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const userId = await getOptionalUserId();

  try {
    return NextResponse.json({ ok: true, data: { documents: await getDocuments(userId) } });
  } catch (error) {
    return errorResponse(error, "Documents could not be loaded.");
  }
}
