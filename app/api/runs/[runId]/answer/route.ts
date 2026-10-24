// Owner: Member 4 (Backend Engineer)
// POST /api/runs/:runId/answer — Submit answers to clarification questions

import { NextRequest, NextResponse } from "next/server";
import { ApiRequestError, errorResponse, parseJson } from "../../../../../lib/api-response";
import { getRunById, recordAnswers } from "../../../../../lib/db/queries";
import { runAgentPass } from "../../../../../lib/run-service";
import type { AnswerInput } from "../../../../../lib/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  let runExists = false;

  try {
    const run = await getRunById(runId);
    if (!run) throw new ApiRequestError("RUN_NOT_FOUND", "Run not found.", 404);
    runExists = true;
    if (run.status !== "needs_clarification") {
      throw new ApiRequestError("RUN_NOT_AWAITING_ANSWERS", "Run is not waiting for clarification answers.", 409);
    }
    const raw = await parseJson(request);
    if (!isRecord(raw) || !Array.isArray(raw.answers)) {
      throw new ApiRequestError("INVALID_REQUEST", "answers must be an array.", 400, [
        { field: "answers", message: "Provide one answer for every open question." },
      ]);
    }
    const parsed: AnswerInput[] = [];
    const details: { question_id: string; message: string }[] = [];
    const expected = new Map(run.questions.map((q) => [q.question_id, q]));
    const seen = new Set<string>();

    for (const item of raw.answers) {
      if (!isRecord(item) || typeof item.question_id !== "string") {
        details.push({ question_id: "", message: "Each answer must identify a question_id." });
        continue;
      }
      const questionId = item.question_id;
      const question = expected.get(questionId);
      if (!question) {
        details.push({ question_id: questionId, message: "This question is not open for this run." });
        continue;
      }
      if (seen.has(questionId)) {
        details.push({ question_id: questionId, message: "Each question must be answered exactly once." });
        continue;
      }
      seen.add(questionId);
      if (typeof item.not_stated !== "boolean" || typeof item.answer !== "string") {
        details.push({ question_id: questionId, message: "Answer and not_stated must have valid types." });
        continue;
      }
      if (item.not_stated) {
        if (!question.allow_not_stated || item.answer !== "") {
          details.push({ question_id: questionId, message: "Not stated is not allowed here, or answer must be empty." });
          continue;
        }
      } else if (question.field === "owner") {
        if (item.answer.trim().length < 1 || item.answer.length > 200) {
          details.push({ question_id: questionId, message: "Owner answers must be between 1 and 200 characters." });
          continue;
        }
      } else if (!isRealIsoDate(item.answer)) {
        details.push({ question_id: questionId, message: "Deadline answers must be a real YYYY-MM-DD date." });
        continue;
      }
      parsed.push({ question_id: questionId, answer: item.answer, not_stated: item.not_stated });
    }
    for (const questionId of expected.keys()) {
      if (!seen.has(questionId)) details.push({ question_id: questionId, message: "An answer is required for this open question." });
    }
    if (details.length) throw new ApiRequestError("INVALID_REQUEST", "Answers do not match the open questions.", 400, details);

    await recordAnswers(runId, parsed);
    const current = await getRunById(runId);
    if (!current) throw new ApiRequestError("RUN_NOT_FOUND", "Run not found.", 404);
    const updated = await runAgentPass(current, {
      answers: parsed.map((answer) => ({
        questionId: answer.question_id, answer: answer.answer, notStated: answer.not_stated,
      })),
    });
    return NextResponse.json({ ok: true, data: { run: updated } });
  } catch (error) {
    if (error instanceof Error && error.message === "ANSWER_NOT_OPEN") {
      return errorResponse(new ApiRequestError("INVALID_REQUEST", "One or more questions are no longer open.", 400),
        "Clarification answers could not be submitted.", runId);
    }
    return errorResponse(error, "Clarification answers could not be submitted.", runExists ? runId : undefined);
  }
}
