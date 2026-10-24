// Owner: Member 4 (Backend Engineer)
// GET /api/checklists — List documents with saved tasks

import { NextResponse } from "next/server";
import { errorResponse } from "../../../lib/api-response";
import { requireApiAuth, getOptionalUserId } from "../../../lib/require-api-auth";
import { getChecklists } from "../../../lib/db/queries";

export async function GET() {
  const authError = await requireApiAuth();
  if (authError) return authError;

  const userId = await getOptionalUserId();

  try {
    return NextResponse.json({ ok: true, data: { checklists: await getChecklists(userId) } });
  } catch (error) {
    return errorResponse(error, "Checklists could not be loaded.");
  }
}
