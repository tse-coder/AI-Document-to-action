// Owner: Member 4 (Backend Engineer)
// GET /api/checklists — List documents with saved tasks

import { NextResponse } from "next/server";
import { errorResponse } from "../../../lib/api-response";
import { getChecklists } from "../../../lib/db/queries";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, data: { checklists: await getChecklists() } });
  } catch (error) {
    return errorResponse(error, "Checklists could not be loaded.");
  }
}
