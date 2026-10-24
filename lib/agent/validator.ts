// =============================================
// Proposal Validator
// Owner: Member 3 (AI Agent Engineer)
// =============================================
// Validates the agent's finalize output against
// the document's actual paragraphs and spec rules.
// =============================================

import type { TaskBase, ValidationIssue, Question } from "../types";

export interface ValidatorInput {
  tasks: TaskBase[];
  paragraphIds: string[];           // All valid paragraph IDs for this document
  paragraphTexts: Map<string, string>; // paragraph_id → text
  existingTaskIds: string[];        // task_ids already in the checklist
}

export interface ValidatorResult {
  passed: boolean;
  issues: ValidationIssue[];
  questions: Question[];
}

export function validateProposal(input: ValidatorInput): ValidatorResult {
  // TODO: Implement validation checks from api-spec.md:
  //
  // ERROR-level (block confirm):
  //   UNKNOWN_PARAGRAPH      — source_ref not in paragraphIds
  //   NO_SOURCE_REFS         — task has empty source_refs
  //   DEADLINE_NOT_IN_SOURCE — deadline_source is "document" but deadline_text not found in cited paragraphs
  //   DEADLINE_DATE_MISMATCH — deadline_date doesn't match parsed deadline_text
  //   INVALID_DATE           — deadline_date is not a real calendar date
  //   UPDATE_TARGET_NOT_FOUND — action is "update" but task_id not in existingTaskIds
  //   EMPTY_DESCRIPTION      — description missing or under 5 chars
  //
  // QUESTION-level (generate clarification questions):
  //   MISSING_OWNER          — owner empty and owner_source is not "none"
  //   MISSING_DEADLINE       — source implies deadline but none set, deadline_source not "none"
  //
  // WARNING-level (never block):
  //   OWNER_NOT_STATED       — owner acknowledged as not stated
  //   DEADLINE_NOT_STATED    — deadline acknowledged as not stated

  const issues: ValidationIssue[] = [];
  const questions: Question[] = [];

  // ... validation logic here ...

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    passed: !hasErrors && questions.length === 0,
    issues,
    questions,
  };
}
