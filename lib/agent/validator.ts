// =============================================
// Proposal Validator
// Owner: Member 3 (AI Agent Engineer)
// =============================================
// Validates the agent's proposal tasks against the
// actual document paragraphs and spec rules.
// Enforces deterministic integrity rules.
// =============================================

import type { TaskBase, ValidationIssue, Question } from "../types";
import { isTextInSources, isValidCalendarDate, parseDateFromText } from "./date-utils";

export interface ValidatorInput {
  tasks: TaskBase[];
  paragraphIds: string[] | Set<string>;
  paragraphTexts: Map<string, string>; // paragraph_id -> text
  existingTaskIds?: string[] | Set<string>; // existing task_ids from read_checklist
  round?: number;                      // Clarification round (1, 2)
}

export interface ValidatorResult {
  passed: boolean;
  issues: ValidationIssue[];
  questions: Question[];
  tasks: TaskBase[];                   // Normalized tasks
}

const DEADLINE_CUE_REGEX = /\b(by|before|until|deadline|due|no later than)\b/i;

/**
 * Validates a list of proposed tasks and determines whether clarification is needed.
 */
export function validateProposal(input: ValidatorInput): ValidatorResult {
  const { tasks, paragraphTexts, round = 1 } = input;
  const paragraphIdSet =
    input.paragraphIds instanceof Set
      ? input.paragraphIds
      : new Set(input.paragraphIds || []);
  const existingTaskIdSet =
    input.existingTaskIds instanceof Set
      ? input.existingTaskIds
      : new Set(input.existingTaskIds || []);

  const issues: ValidationIssue[] = [];
  const questions: Question[] = [];
  let questionCounter = 1;

  const normalizedTasks: TaskBase[] = [];

  for (const task of tasks) {
    const clientId = task.client_id || `C${normalizedTasks.length + 1}`;

    // 1. Description validation
    if (!task.description || task.description.trim().length < 5) {
      issues.push({
        code: "EMPTY_DESCRIPTION",
        severity: "error",
        task_client_id: clientId,
        message: `Task ${clientId} description is missing or under 5 characters.`,
      });
    }

    // 2. Source refs validation
    if (!task.source_refs || task.source_refs.length === 0) {
      issues.push({
        code: "NO_SOURCE_REFS",
        severity: "error",
        task_client_id: clientId,
        message: `Task ${clientId} has no cited source paragraphs.`,
      });
    } else {
      for (const ref of task.source_refs) {
        if (!paragraphIdSet.has(ref)) {
          issues.push({
            code: "UNKNOWN_PARAGRAPH",
            severity: "error",
            task_client_id: clientId,
            message: `Paragraph ${ref} does not exist in the document.`,
          });
        }
      }
    }

    // 3. Update action validation
    if (task.action === "update") {
      if (!task.task_id || !existingTaskIdSet.has(task.task_id)) {
        issues.push({
          code: "UPDATE_TARGET_NOT_FOUND",
          severity: "error",
          task_client_id: clientId,
          message: `Update target task_id '${task.task_id || ""}' does not exist in the checklist.`,
        });
      }
    }

    // Cited paragraph texts for verification
    const citedTexts: string[] = (task.source_refs || [])
      .map((ref) => paragraphTexts.get(ref) || "")
      .filter(Boolean);

    // 4. Deadline validation & date checks
    const hasDeadlineDate = Boolean(task.deadline_date && task.deadline_date.trim());
    const hasDeadlineText = Boolean(task.deadline_text && task.deadline_text.trim());

    if (task.deadline_source === "document") {
      if (!hasDeadlineDate && !hasDeadlineText) {
        // Missing deadline when source text has one
        if (citedTexts.some((txt) => DEADLINE_CUE_REGEX.test(txt))) {
          if (round < 2) {
            issues.push({
              code: "MISSING_DEADLINE",
              severity: "question",
              task_client_id: clientId,
              message: `Paragraph implies a deadline but none was set.`,
            });
            questions.push({
              question_id: `Q${questionCounter++}`,
              field: "deadline",
              task_client_id: clientId,
              text: `A deadline is implied for '${task.description}', but no specific date was given. When is it due?`,
              source_refs: task.source_refs || [],
              allow_not_stated: true,
            });
          } else {
            task.deadline_source = "none";
            issues.push({
              code: "DEADLINE_NOT_STATED",
              severity: "warning",
              task_client_id: clientId,
              message: `No deadline provided; marked as not stated.`,
            });
          }
        }
      } else {
        if (!hasDeadlineText || !isTextInSources(task.deadline_text!, citedTexts)) {
          issues.push({
            code: "DEADLINE_NOT_IN_SOURCE",
            severity: "error",
            task_client_id: clientId,
            message: `Deadline text '${task.deadline_text || ""}' does not appear in cited paragraphs.`,
          });
        }

        if (hasDeadlineDate) {
          if (!isValidCalendarDate(task.deadline_date!)) {
            issues.push({
              code: "INVALID_DATE",
              severity: "error",
              task_client_id: clientId,
              message: `Deadline date '${task.deadline_date}' is not a valid calendar date.`,
            });
          } else if (hasDeadlineText) {
            const parsed = parseDateFromText(task.deadline_text!);
            if (parsed && parsed !== task.deadline_date) {
              issues.push({
                code: "DEADLINE_DATE_MISMATCH",
                severity: "error",
                task_client_id: clientId,
                message: `Deadline date '${task.deadline_date}' does not match text '${task.deadline_text}' (parsed as ${parsed}).`,
              });
            }
          }
        }
      }
    } else if (task.deadline_source === "user") {
      if (hasDeadlineDate && !isValidCalendarDate(task.deadline_date!)) {
        issues.push({
          code: "INVALID_DATE",
          severity: "error",
          task_client_id: clientId,
          message: `Deadline date '${task.deadline_date}' is not a valid calendar date.`,
        });
      }
    } else if (task.deadline_source === "none") {
      issues.push({
        code: "DEADLINE_NOT_STATED",
        severity: "warning",
        task_client_id: clientId,
        message: `No deadline is stated for task ${clientId}.`,
      });
    }

    // 5. Owner validation & checks
    const hasOwner = Boolean(task.owner && task.owner.trim());

    if (task.owner_source === "none") {
      issues.push({
        code: "OWNER_NOT_STATED",
        severity: "warning",
        task_client_id: clientId,
        message: `Owner acknowledged as not stated for task ${clientId}.`,
      });
    } else if (!hasOwner) {
      if (round < 2) {
        issues.push({
          code: "MISSING_OWNER",
          severity: "question",
          task_client_id: clientId,
          message: `Owner is empty and not acknowledged as not stated.`,
        });
        questions.push({
          question_id: `Q${questionCounter++}`,
          field: "owner",
          task_client_id: clientId,
          text: `Paragraph ${task.source_refs?.[0] || ""} requires '${task.description}' but does not state who is responsible. Who should be assigned?`,
          source_refs: task.source_refs || [],
          allow_not_stated: true,
        });
      } else {
        task.owner_source = "none";
        task.owner = null;
        issues.push({
          code: "OWNER_NOT_STATED",
          severity: "warning",
          task_client_id: clientId,
          message: `Owner unresolved after round 2; marked as not stated.`,
        });
      }
    }

    normalizedTasks.push({
      ...task,
      client_id: clientId,
    });
  }

  const hasErrors = issues.some((i) => i.severity === "error" || i.severity === "question");
  const passed = !hasErrors && questions.length === 0;

  return {
    passed,
    issues,
    questions,
    tasks: normalizedTasks,
  };
}
