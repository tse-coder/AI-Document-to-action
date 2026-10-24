# API Specification: AI Document to Action Agent (Project 10)

Stack: Next.js (App Router, TypeScript) on Vercel Hobby, PostgreSQL on Supabase (transaction pooler), Gemini API Free Tier. One origin serves the page and the API, so no CORS is needed.

## 1. Conventions

| Item | Rule |
|---|---|
| Base path | `/api` |
| Format | JSON, UTF-8, `Content-Type: application/json` on every request body and response |
| Timestamps | ISO 8601 UTC, example `2026-10-24T07:15:30Z` |
| Dates | `YYYY-MM-DD` or `null` |
| Document IDs | Demo: `N1`, `N2`. Pasted: `U-` plus 6 uppercase hex characters, example `U-4F2A9C` |
| Paragraph IDs | `{docId}-P{n}` starting at 1, example `N1-P3` |
| Task IDs | `TSK-` plus 4 digits for seeds (`TSK-0001`), `TSK-` plus 8 uppercase hex for new tasks |
| Run IDs | `RUN-` plus 8 uppercase alphanumeric characters |
| Paragraph splitting | Application code splits pasted text on blank lines, trims, drops empty parts, maximum 40 paragraphs |

### Success envelope

```json
{ "ok": true, "data": { } }
```

### Error envelope

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human readable message safe to show in the UI.",
    "retryable": false,
    "run_id": "RUN-7K2M9QXA",
    "details": [ ]
  }
}
```

`run_id` is present only when a run exists. `details` is always an array (empty when unused).

### Input limits

| Field | Limit |
|---|---|
| Pasted `text` | 20 to 6000 characters |
| `title` | 1 to 80 characters |
| `request` | 3 to 500 characters |
| Answer `answer` | 1 to 200 characters |
| Task `description` | 5 to 300 characters |
| Task `owner` | 1 to 80 characters |
| Tasks per proposal or confirm | 1 to 12 |
| `source_refs` per task | 1 to 6 |

### Agent caps

| Cap | Value |
|---|---|
| Model turns in tool loop | 4 per pass |
| Tool calls in tool loop | 6 per pass |
| Finalize call | 1 per run pass, no tools |
| Clarification rounds | 2, after that unresolved gaps become `not_stated` |
| Manual retries per run | 3 |
| Stale `running` run | Older than 90 seconds, treated as `error` with code `MODEL_TIMEOUT` |

A pass is one start of model work: the initial run, an answer submission or a retry. Loop caps reset at the start of each pass.

## 2. Run status machine

| From | Event | To |
|---|---|---|
| (new) | `POST /api/runs` | `running` |
| `running` | Gaps found by validator | `needs_clarification` |
| `running` | Clean proposal | `awaiting_approval` |
| `running` | Model or tool failure | `error` |
| `needs_clarification` | `POST .../answer` | `running` |
| `error` | `POST .../retry` | `running` |
| `awaiting_approval` | `POST .../confirm` valid | `saved` |
| `saved` | Any write | Rejected with `ALREADY_SAVED` |

All endpoints that start model work respond only after the pass finishes, so the client never polls.

## 3. Shared object schemas

### Document

```json
{
  "doc_id": "N1",
  "title": "Student ID Card Renewal Notice",
  "origin": "demo",
  "paragraph_count": 5,
  "created_at": "2026-10-24T06:00:00Z"
}
```

`origin` is `demo` or `pasted`.

### Paragraph

```json
{ "paragraph_id": "N1-P3", "position": 3, "text": "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026." }
```

### Task (proposal, confirm input and saved shape share these fields)

```json
{
  "client_id": "C1",
  "action": "update",
  "task_id": "TSK-0001",
  "description": "Submit the completed renewal form to Room 12 of the Registrar's Office",
  "source_refs": ["N1-P2", "N1-P3"],
  "deadline_date": "2026-11-15",
  "deadline_text": "15 November 2026",
  "deadline_source": "document",
  "condition": null,
  "owner": "Student",
  "owner_source": "document"
}
```

| Field | Type | Rule |
|---|---|---|
| `client_id` | string | Unique within the payload, pattern `C` plus number |
| `action` | `"create"` or `"update"` | `update` requires an existing `task_id` for this document |
| `task_id` | string or null | Null for `create` |
| `description` | string | Limits above |
| `source_refs` | string[] | Every ID must exist in this document |
| `deadline_date` | string or null | Valid calendar date or null |
| `deadline_text` | string or null | Literal text copied from a cited paragraph. Null when `deadline_source` is `user` or `none` |
| `deadline_source` | `"document"`, `"user"` or `"none"` | `none` means not stated and acknowledged |
| `condition` | string or null | Plain statement of any condition or exception, max 200 characters |
| `owner` | string or null | Null only when `owner_source` is `none` |
| `owner_source` | `"document"`, `"user"` or `"none"` | Same meaning as deadline source |

Saved tasks add: `doc_id`, `status` (`open`) and `updated_at`.

### Question

```json
{
  "question_id": "Q1",
  "field": "owner",
  "task_client_id": "C3",
  "text": "Paragraph N1-P5 requires a department head signature but does not say who obtains it. Who is responsible?",
  "source_refs": ["N1-P5"],
  "allow_not_stated": true
}
```

`field` is `owner` or `deadline`.

### Validation issue

```json
{ "code": "DEADLINE_NOT_IN_SOURCE", "severity": "error", "task_client_id": "C2", "message": "Deadline text '20 November 2026' does not appear in the cited paragraphs." }
```

| Code | Severity | Meaning |
|---|---|---|
| `UNKNOWN_PARAGRAPH` | error | A source ref does not exist in the document |
| `NO_SOURCE_REFS` | error | Task has no source refs |
| `DEADLINE_NOT_IN_SOURCE` | error | `deadline_source` is `document` but text is absent from cited paragraphs |
| `DEADLINE_DATE_MISMATCH` | error | `deadline_date` does not match the parsed `deadline_text` |
| `INVALID_DATE` | error | `deadline_date` is not a real calendar date |
| `UPDATE_TARGET_NOT_FOUND` | error | `update` task_id is not in this document's checklist |
| `EMPTY_DESCRIPTION` | error | Description missing or under 5 characters |
| `MISSING_OWNER` | question | Owner empty and `owner_source` is not `none` |
| `MISSING_DEADLINE` | question | Source text implies a deadline but none was set and `deadline_source` is not `none` |
| `OWNER_NOT_STATED` | warning | Owner acknowledged as not stated |
| `DEADLINE_NOT_STATED` | warning | Deadline acknowledged as not stated |

Errors block confirm. Questions create clarification questions. Warnings never block.

### Tool log entry

```json
{
  "seq": 1,
  "phase": "loop",
  "tool": "search_document",
  "args": { "doc_id": "N1", "query": "documents deadline", "max_results": 5 },
  "ok": true,
  "result_summary": "3 paragraphs matched",
  "result": { "doc_id": "N1", "matches": [ ] },
  "duration_ms": 41,
  "at": "2026-10-24T07:15:31Z"
}
```

`phase` is `loop`, `finalize` or `gate`. The save tool is logged with phase `gate`. The finalize model call is logged with phase `finalize`, tool `finalize_proposal` and args `{ "round": n }`. `seq` counts across the whole run.

### Run object

```json
{
  "run_id": "RUN-7K2M9QXA",
  "doc_id": "N1",
  "status": "needs_clarification",
  "request": "Make a checklist for this notice",
  "round": 1,
  "retry_count": 0,
  "created_at": "2026-10-24T07:15:30Z",
  "updated_at": "2026-10-24T07:15:36Z",
  "questions": [ ],
  "proposal": null,
  "tool_log": [ ],
  "limits": {
    "max_model_turns": 4,
    "max_tool_calls": 6,
    "max_clarification_rounds": 2,
    "model_turns_used": 2,
    "tool_calls_used": 3,
    "limit_hit": false
  },
  "error": null
}
```

`proposal` is non null only in `awaiting_approval` and `saved`. `error` is `{ "code", "message" }` or null.

### Proposal object

```json
{
  "version": 1,
  "summary": "Students must submit a renewal form and a passport photo to Room 12 by 15 November 2026. Final-year students submit only the form.",
  "tasks": [ ],
  "absent_information": [
    { "topic": "Replacement card fee", "note": "The notice does not state any fee." }
  ],
  "answers_to_request": null,
  "validation": { "passed": true, "issues": [ ] }
}
```

`absent_information` lists things the user asked about or a checklist would normally need that the notice does not contain. `answers_to_request` is a string only when the user request was a question about the notice (example: "Is there a fee?"), otherwise null.

## 4. Endpoints

### 4.1 GET /api/health

Response 200:

```json
{ "ok": true, "data": { "status": "ok", "db": "ok", "model": "gemini-2.5-flash" } }
```

### 4.2 GET /api/documents

Lists demo and pasted documents, newest pasted first after demos.

Response 200:

```json
{
  "ok": true,
  "data": {
    "documents": [
      { "doc_id": "N1", "title": "Student ID Card Renewal Notice", "origin": "demo", "paragraph_count": 5, "created_at": "2026-10-24T06:00:00Z" },
      { "doc_id": "N2", "title": "Lab Equipment Borrowing Procedure", "origin": "demo", "paragraph_count": 6, "created_at": "2026-10-24T06:00:00Z" }
    ]
  }
}
```

### 4.3 GET /api/documents/:docId

Response 200:

```json
{
  "ok": true,
  "data": {
    "document": { "doc_id": "N1", "title": "Student ID Card Renewal Notice", "origin": "demo", "paragraph_count": 5, "created_at": "2026-10-24T06:00:00Z" },
    "paragraphs": [
      { "paragraph_id": "N1-P1", "position": 1, "text": "The Registrar's Office will renew student ID cards for the 2026/27 academic year." },
      { "paragraph_id": "N1-P2", "position": 2, "text": "Each student must submit two documents: a completed renewal form and one recent passport photo." },
      { "paragraph_id": "N1-P3", "position": 3, "text": "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026." },
      { "paragraph_id": "N1-P4", "position": 4, "text": "Final-year students are exempt from the passport photo requirement and submit only the form." },
      { "paragraph_id": "N1-P5", "position": 5, "text": "The renewal form must be signed by the department head before submission." }
    ]
  }
}
```

Errors: 404 `DOCUMENT_NOT_FOUND`.

### 4.4 POST /api/runs

Starts a run. Provide exactly one of `doc_id` or `text`. When `text` is given the server splits it, stores a new `U-` document and uses it.

Request (demo document):

```json
{
  "doc_id": "N1",
  "request": "Make a checklist for this notice",
  "simulate_failure": "none"
}
```

Request (pasted text):

```json
{
  "text": "Applicants must bring a national ID and a signed consent letter.\n\nThe interview takes place on 3 December 2026 at the main hall.",
  "title": "Interview Notice",
  "request": "Make a checklist for this notice",
  "simulate_failure": "none"
}
```

| Field | Required | Rule |
|---|---|---|
| `doc_id` | One of two | Must exist |
| `text` | One of two | 20 to 6000 characters |
| `title` | No | Defaults to the first 40 characters of the text |
| `request` | Yes | 3 to 500 characters |
| `simulate_failure` | No | `none` (default), `model` or `tool`. Forces a controlled failure for test case 5 |

Response 200 (run needs clarification):

```json
{
  "ok": true,
  "data": {
    "run": {
      "run_id": "RUN-7K2M9QXA",
      "doc_id": "N1",
      "status": "needs_clarification",
      "request": "Make a checklist for this notice",
      "round": 1,
      "retry_count": 0,
      "created_at": "2026-10-24T07:15:30Z",
      "updated_at": "2026-10-24T07:15:36Z",
      "questions": [
        {
          "question_id": "Q1",
          "field": "owner",
          "task_client_id": "C3",
          "text": "Paragraph N1-P5 requires a department head signature but does not say who obtains it. Who is responsible?",
          "source_refs": ["N1-P5"],
          "allow_not_stated": true
        }
      ],
      "proposal": null,
      "tool_log": [
        {
          "seq": 1,
          "phase": "loop",
          "tool": "read_checklist",
          "args": { "doc_id": "N1" },
          "ok": true,
          "result_summary": "2 existing tasks",
          "result": {
            "doc_id": "N1",
            "tasks": [
              { "task_id": "TSK-0001", "description": "Submit renewal form", "source_refs": ["N1-P2"], "deadline_date": null, "deadline_text": null, "condition": null, "owner": "Student", "status": "open" },
              { "task_id": "TSK-0002", "description": "Prepare passport photo", "source_refs": ["N1-P2"], "deadline_date": null, "deadline_text": null, "condition": null, "owner": "Student", "status": "open" }
            ]
          },
          "duration_ms": 12,
          "at": "2026-10-24T07:15:31Z"
        },
        {
          "seq": 2,
          "phase": "loop",
          "tool": "search_document",
          "args": { "doc_id": "N1", "query": "documents deadline exempt signed", "max_results": 5 },
          "ok": true,
          "result_summary": "4 paragraphs matched",
          "result": {
            "doc_id": "N1",
            "total_paragraphs": 5,
            "matches": [
              { "paragraph_id": "N1-P3", "position": 3, "text": "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.", "score": 3 },
              { "paragraph_id": "N1-P2", "position": 2, "text": "Each student must submit two documents: a completed renewal form and one recent passport photo.", "score": 2 },
              { "paragraph_id": "N1-P4", "position": 4, "text": "Final-year students are exempt from the passport photo requirement and submit only the form.", "score": 1 },
              { "paragraph_id": "N1-P5", "position": 5, "text": "The renewal form must be signed by the department head before submission.", "score": 1 }
            ]
          },
          "duration_ms": 38,
          "at": "2026-10-24T07:15:32Z"
        }
      ],
      "limits": {
        "max_model_turns": 4,
        "max_tool_calls": 6,
        "max_clarification_rounds": 2,
        "model_turns_used": 3,
        "tool_calls_used": 2,
        "limit_hit": false
      },
      "error": null
    }
  }
}
```

Response 200 (clean proposal): same shape with `"status": "awaiting_approval"`, `"questions": []` and `proposal` filled as in 4.6.

Errors:

| HTTP | Code | When |
|---|---|---|
| 400 | `INVALID_JSON` | Body is not valid JSON |
| 400 | `INVALID_REQUEST` | Field rule broken, `details` lists `{ "field", "message" }` |
| 404 | `DOCUMENT_NOT_FOUND` | Unknown `doc_id` |
| 413 | `TEXT_TOO_LONG` | Text over 6000 characters |
| 429 | `MODEL_QUOTA_EXCEEDED` | Gemini quota error after one automatic retry, `retryable: true` |
| 502 | `MODEL_ERROR` | Model call failed or returned unusable output, `retryable: true` |
| 504 | `MODEL_TIMEOUT` | Model call exceeded 25 seconds, `retryable: true` |
| 500 | `TOOL_FAILURE` | A tool threw, `retryable: true` |

For 429, 502, 504 and 500 the run is stored with status `error`, input retained, and the error body carries `run_id` so the UI can call retry.

### 4.5 GET /api/runs/:runId

Returns the current run object. Used to restore a screen after reload.

Response 200: `{ "ok": true, "data": { "run": { } } }`

Errors: 404 `RUN_NOT_FOUND`.

### 4.6 POST /api/runs/:runId/answer

Valid only when status is `needs_clarification`. The request must answer every open question.

Request:

```json
{
  "answers": [
    { "question_id": "Q1", "answer": "Student", "not_stated": false }
  ]
}
```

Not stated variant:

```json
{
  "answers": [
    { "question_id": "Q1", "answer": "", "not_stated": true }
  ]
}
```

| Rule | Detail |
|---|---|
| Coverage | Every open `question_id` appears exactly once |
| Owner answers | 1 to 200 characters when `not_stated` is false |
| Deadline answers | Must be `YYYY-MM-DD` and a real date when `not_stated` is false |
| Not stated | Allowed only when the question has `allow_not_stated: true`, `answer` must be empty |

The server resumes the loop with the answers appended as a user message, runs the finalize call and validates again. On round 2 any gap that remains is converted to `not_stated` with a warning.

Response 200 (proposal ready):

```json
{
  "ok": true,
  "data": {
    "run": {
      "run_id": "RUN-7K2M9QXA",
      "doc_id": "N1",
      "status": "awaiting_approval",
      "request": "Make a checklist for this notice",
      "round": 1,
      "retry_count": 0,
      "created_at": "2026-10-24T07:15:30Z",
      "updated_at": "2026-10-24T07:16:20Z",
      "questions": [],
      "proposal": {
        "version": 2,
        "summary": "Students must submit a renewal form and a passport photo to Room 12 by 15 November 2026. Final-year students submit only the form. The form needs a department head signature first.",
        "tasks": [
          {
            "client_id": "C1",
            "action": "update",
            "task_id": "TSK-0001",
            "description": "Submit the completed renewal form to Room 12 of the Registrar's Office",
            "source_refs": ["N1-P2", "N1-P3"],
            "deadline_date": "2026-11-15",
            "deadline_text": "15 November 2026",
            "deadline_source": "document",
            "condition": null,
            "owner": "Student",
            "owner_source": "document"
          },
          {
            "client_id": "C2",
            "action": "update",
            "task_id": "TSK-0002",
            "description": "Submit one recent passport photo to Room 12 of the Registrar's Office",
            "source_refs": ["N1-P2", "N1-P3", "N1-P4"],
            "deadline_date": "2026-11-15",
            "deadline_text": "15 November 2026",
            "deadline_source": "document",
            "condition": "Does not apply to final-year students",
            "owner": "Student",
            "owner_source": "document"
          },
          {
            "client_id": "C3",
            "action": "create",
            "task_id": null,
            "description": "Get the renewal form signed by the department head before submission",
            "source_refs": ["N1-P5"],
            "deadline_date": null,
            "deadline_text": null,
            "deadline_source": "none",
            "condition": null,
            "owner": "Student",
            "owner_source": "user"
          }
        ],
        "absent_information": [
          { "topic": "Signature deadline", "note": "The notice gives no separate date for the signature." }
        ],
        "answers_to_request": null,
        "validation": {
          "passed": true,
          "issues": [
            { "code": "DEADLINE_NOT_STATED", "severity": "warning", "task_client_id": "C3", "message": "No deadline is stated for the signature task." }
          ]
        }
      },
      "tool_log": [ ],
      "limits": {
        "max_model_turns": 4,
        "max_tool_calls": 6,
        "max_clarification_rounds": 2,
        "model_turns_used": 4,
        "tool_calls_used": 2,
        "limit_hit": false
      },
      "error": null
    }
  }
}
```

Response 200 (more questions): `status` stays `needs_clarification`, `round` increments, `questions` holds only new questions.

Errors: 400 `INVALID_REQUEST` (details list the failing `question_id`), 404 `RUN_NOT_FOUND`, 409 `RUN_NOT_AWAITING_ANSWERS`, plus the model errors from 4.4.

### 4.7 POST /api/runs/:runId/retry

Valid only when status is `error`. Re-runs the failed pass with the retained request, document and answers. Maximum 3 retries per run. A `simulate_failure` setting is cleared on retry so the retry runs normally.

Request: `{}`

Response 200: same as 4.4 or 4.6 depending on the outcome, with `retry_count` incremented.

Errors: 404 `RUN_NOT_FOUND`, 409 `RUN_NOT_IN_ERROR`, 429 `RETRY_LIMIT_REACHED` (not retryable), plus the model errors from 4.4.

### 4.8 POST /api/runs/:runId/confirm

The confirmation gate. Valid only when status is `awaiting_approval`. The body contains the final tasks as the user edited them. Tasks left out are not saved.

Request:

```json
{
  "proposal_version": 2,
  "tasks": [
    {
      "client_id": "C1",
      "action": "update",
      "task_id": "TSK-0001",
      "description": "Submit the completed renewal form to Room 12 of the Registrar's Office",
      "source_refs": ["N1-P2", "N1-P3"],
      "deadline_date": "2026-11-15",
      "deadline_text": "15 November 2026",
      "deadline_source": "document",
      "condition": null,
      "owner": "Student",
      "owner_source": "document"
    },
    {
      "client_id": "C3",
      "action": "create",
      "task_id": null,
      "description": "Get the renewal form signed by the department head before submission",
      "source_refs": ["N1-P5"],
      "deadline_date": null,
      "deadline_text": null,
      "deadline_source": "none",
      "condition": null,
      "owner": "Student",
      "owner_source": "user"
    }
  ]
}
```

Gate order on the server:

1. Run exists.
2. Status is `awaiting_approval`, otherwise `ALREADY_SAVED` or `RUN_NOT_AWAITING_APPROVAL`.
3. `proposal_version` equals the stored version, otherwise `STALE_PROPOSAL`.
4. Payload schema and limits pass.
5. Validator runs on the edited tasks and returns `VALIDATION_FAILED` on any error issue.
6. `save_checklist_changes` runs in one D1 batch that starts by inserting a `save_events` row for the run. A duplicate save violates its primary key, rolls the whole batch back and returns `ALREADY_SAVED`. All tasks save or none do.
7. Run status becomes `saved`.

If a user edits a deadline to a value that is not in the source, the client sends `deadline_source: "user"` and `deadline_text: null`.

Response 200:

```json
{
  "ok": true,
  "data": {
    "run_id": "RUN-7K2M9QXA",
    "status": "saved",
    "doc_id": "N1",
    "saved_at": "2026-10-24T07:17:02Z",
    "saved": [
      { "client_id": "C1", "task_id": "TSK-0001", "action": "update" },
      { "client_id": "C3", "task_id": "TSK-9F31C2AB", "action": "create" }
    ],
    "warnings": [
      { "code": "DEADLINE_NOT_STATED", "severity": "warning", "task_client_id": "C3", "message": "No deadline is stated for the signature task." }
    ],
    "reopen_path": "/api/checklists/N1"
  }
}
```

Errors:

| HTTP | Code | When |
|---|---|---|
| 400 | `INVALID_REQUEST` | Schema or limit broken |
| 404 | `RUN_NOT_FOUND` | Unknown run |
| 409 | `RUN_NOT_AWAITING_APPROVAL` | Status is not `awaiting_approval` |
| 409 | `ALREADY_SAVED` | Run already saved, prevents duplicates |
| 409 | `STALE_PROPOSAL` | `proposal_version` mismatch |
| 422 | `NO_TASKS` | Empty task list |
| 422 | `VALIDATION_FAILED` | One or more error issues, `details` is the issue array |
| 500 | `TOOL_FAILURE` | D1 batch failed, nothing saved, run stays `awaiting_approval`, `retryable: true` |

Example 422:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "2 problems must be fixed before saving.",
    "retryable": false,
    "run_id": "RUN-7K2M9QXA",
    "details": [
      { "code": "UNKNOWN_PARAGRAPH", "severity": "error", "task_client_id": "C3", "message": "Paragraph N1-P9 does not exist." },
      { "code": "DEADLINE_NOT_IN_SOURCE", "severity": "error", "task_client_id": "C1", "message": "Deadline text '20 November 2026' does not appear in the cited paragraphs." }
    ]
  }
}
```

### 4.9 GET /api/checklists

Lists documents that have at least one saved task.

Response 200:

```json
{
  "ok": true,
  "data": {
    "checklists": [
      { "doc_id": "N1", "title": "Student ID Card Renewal Notice", "task_count": 3, "last_saved_at": "2026-10-24T07:17:02Z" }
    ]
  }
}
```

Seeded tasks count, so N1 appears before any run.

### 4.10 GET /api/checklists/:docId

Returns the saved checklist with the full source paragraph text so the user can verify each reference.

Response 200:

```json
{
  "ok": true,
  "data": {
    "doc_id": "N1",
    "title": "Student ID Card Renewal Notice",
    "last_saved_at": "2026-10-24T07:17:02Z",
    "tasks": [
      {
        "task_id": "TSK-0001",
        "description": "Submit the completed renewal form to Room 12 of the Registrar's Office",
        "source_refs": ["N1-P2", "N1-P3"],
        "deadline_date": "2026-11-15",
        "deadline_text": "15 November 2026",
        "deadline_source": "document",
        "condition": null,
        "owner": "Student",
        "owner_source": "document",
        "status": "open",
        "updated_at": "2026-10-24T07:17:02Z",
        "sources": [
          { "paragraph_id": "N1-P2", "text": "Each student must submit two documents: a completed renewal form and one recent passport photo." },
          { "paragraph_id": "N1-P3", "text": "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026." }
        ]
      }
    ]
  }
}
```

Tasks are ordered by deadline (nulls last) then `task_id`. A document with no saved tasks returns 200 with `"tasks": []`.

Errors: 404 `DOCUMENT_NOT_FOUND`.

## 5. Internal tool contracts

These are the three Gemini tool declarations. The model sees all three, but the server executes `save_checklist_changes` only through the confirm gate.

### 5.1 search_document

Keyword retrieval: lowercase the query, drop stop words, score each paragraph by the count of distinct query terms it contains, return matches with score above 0 sorted by score then position.

Args:

```json
{
  "type": "object",
  "properties": {
    "doc_id": { "type": "string" },
    "query": { "type": "string", "minLength": 2, "maxLength": 120 },
    "max_results": { "type": "integer", "minimum": 1, "maximum": 8, "default": 5 }
  },
  "required": ["doc_id", "query"]
}
```

Result:

```json
{
  "doc_id": "N1",
  "total_paragraphs": 5,
  "matches": [
    { "paragraph_id": "N1-P3", "position": 3, "text": "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.", "score": 3 }
  ]
}
```

An empty `matches` array means the notice contains nothing on that query, and the model must report it under `absent_information`.

### 5.2 read_checklist

Args:

```json
{
  "type": "object",
  "properties": { "doc_id": { "type": "string" } },
  "required": ["doc_id"]
}
```

Result:

```json
{
  "doc_id": "N1",
  "tasks": [
    { "task_id": "TSK-0001", "description": "Submit renewal form", "source_refs": ["N1-P2"], "deadline_date": null, "deadline_text": null, "condition": null, "owner": "Student", "status": "open" }
  ]
}
```

### 5.3 save_checklist_changes

Args:

```json
{
  "type": "object",
  "properties": {
    "run_id": { "type": "string" },
    "doc_id": { "type": "string" },
    "tasks": {
      "type": "array",
      "minItems": 1,
      "maxItems": 12,
      "items": {
        "type": "object",
        "properties": {
          "client_id": { "type": "string" },
          "action": { "type": "string", "enum": ["create", "update"] },
          "task_id": { "type": "string", "nullable": true },
          "description": { "type": "string" },
          "source_refs": { "type": "array", "items": { "type": "string" } },
          "deadline_date": { "type": "string", "nullable": true },
          "deadline_text": { "type": "string", "nullable": true },
          "deadline_source": { "type": "string", "enum": ["document", "user", "none"] },
          "condition": { "type": "string", "nullable": true },
          "owner": { "type": "string", "nullable": true },
          "owner_source": { "type": "string", "enum": ["document", "user", "none"] }
        },
        "required": ["client_id", "action", "description", "source_refs", "deadline_source", "owner_source"]
      }
    }
  },
  "required": ["run_id", "doc_id", "tasks"]
}
```

Result:

```json
{
  "saved": [ { "client_id": "C1", "task_id": "TSK-0001", "action": "update" } ],
  "saved_at": "2026-10-24T07:17:02Z"
}
```

If the model emits a call to this tool during the loop, the server does not execute it. It records a `gate` log entry with `ok: false` and result `{ "blocked": "Awaiting user approval" }`, returns that result to the model and ends the loop so the finalize call produces the proposal.

## 6. Finalize call response schema (Gemini structured output)

The finalize call has no tools. Its response schema is the proposal without `version` and `validation`, which the server adds.

```json
{
  "type": "object",
  "properties": {
    "summary": { "type": "string" },
    "answers_to_request": { "type": "string", "nullable": true },
    "tasks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "client_id": { "type": "string" },
          "action": { "type": "string", "enum": ["create", "update"] },
          "task_id": { "type": "string", "nullable": true },
          "description": { "type": "string" },
          "source_refs": { "type": "array", "items": { "type": "string" } },
          "deadline_date": { "type": "string", "nullable": true },
          "deadline_text": { "type": "string", "nullable": true },
          "condition": { "type": "string", "nullable": true },
          "owner": { "type": "string", "nullable": true }
        },
        "required": ["client_id", "action", "description", "source_refs"]
      }
    },
    "absent_information": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": { "topic": { "type": "string" }, "note": { "type": "string" } },
        "required": ["topic", "note"]
      }
    }
  },
  "required": ["summary", "tasks", "absent_information"]
}
```

The server derives `deadline_source` and `owner_source` after the call: `document` when the value is present and verified, `user` when it came from an answer, `none` when the user chose not stated.

## 7. PostgreSQL schema on Supabase

The executable schema is `lib/db/schema.sql`. Demo data is `seed.sql`. A development reset is `lib/db/reset.sql`. The schema is PostgreSQL on the Supabase Free plan, reached only through `DATABASE_URL`, which is set to the Supabase transaction-pooler connection string. The application does not use supabase-js, an anon key, Supabase Auth or Supabase Storage.

Apply with:

```bash
psql "$DATABASE_URL" -f lib/db/schema.sql
psql "$DATABASE_URL" -f seed.sql
```

### Tables

| Table | Purpose |
|---|---|
| `documents` | Demo notices (`N1`, `N2`) and pasted notices (`U-XXXXXX`) |
| `paragraphs` | Numbered original text, immutable |
| `runs` | One agent run, status, counters, stored model messages and latest proposal |
| `run_questions` | Clarification questions and the user's answers |
| `tool_calls` | The visible tool log, one row per call |
| `checklist_tasks` | Confirmed tasks only |
| `task_sources` | Ordered paragraph references for each task |
| `save_events` | One row per saved run, makes duplicate saves impossible |

### Types and constraints

- Timestamps are `TIMESTAMPTZ DEFAULT now()` and are serialized by the API as `YYYY-MM-DDTHH:MM:SSZ` in UTC. `deadline_date` is `DATE`; the database client overrides the PostgreSQL DATE parser (OID 1082) so it returns the raw `YYYY-MM-DD` string.
- Every JSON text column is `JSONB`; the server passes objects with `sql.json`.
- `ok`, `limit_hit`, `allow_not_stated` and `not_stated` are `BOOLEAN`. All counters are `INTEGER`.
- SQLite GLOB checks became anchored PostgreSQL regular-expression checks using `~`. `json_valid` and `json_type` became `jsonb_typeof` checks. The messages cap is `length(messages::text) <= 400000`. The SQLite date round-trip check is unnecessary because `DATE` enforces validity.
- `WITHOUT ROWID` is removed. Composite foreign keys and the `UNIQUE (doc_id, id)` parent keys they require are retained.
- Every explicit `IS NOT NULL` guard is retained, including the `run_questions` answer check.
- `paragraphs` is immutable through a `BEFORE UPDATE` plpgsql trigger. The run status guard is a `BEFORE UPDATE OF status` trigger that fires when `OLD.status IS DISTINCT FROM NEW.status`.
- Row Level Security is enabled on every table with no policies. Supabase therefore blocks the exposed public REST roles; the server connects as the database owner, which bypasses RLS.

### Integrity enforced by the database

- Foreign keys are on. A task can only cite paragraphs of its own document, because `task_sources` uses composite keys on `(doc_id, id)`.
- Paragraphs cannot be updated, so a citation never drifts from the text it points to.
- Paragraph IDs must equal `{doc_id}-P{position}`. Document, run and task ID formats are checked.
- `deadline_date` must be a real calendar date. `deadline_source` decides which of `deadline_date` and `deadline_text` must be present (`document`: both, `user`: date only, `none`: neither). `owner_source` works the same way for `owner`.
- Run status moves only along the machine in section 2. A trigger rejects every other transition.
- A run in `awaiting_approval` or `saved` must have a proposal. A run in `error` must have an error code and message. Any other status must have neither.
- A question is either unanswered or answered. An answered question has either answer text (1 to 200 characters) or `not_stated`.
- Counters stay inside the agent caps in section 1.

The application validator still runs first and returns friendly errors. The database is the last line of defense. Unexpected application exceptions return `INTERNAL_ERROR` (HTTP 500, retryable false).

### API to column mapping

| API field | Storage |
|---|---|
| `tool_log` | Rows of `tool_calls` ordered by `seq`, `args` and `result` parsed from JSONB, `ok` as a boolean |
| `questions` | Rows of `run_questions` for the run. Open questions are rows with `answered_at` null |
| Answer `{ "answer": "", "not_stated": true }` | `answer` NULL, `not_stated` true, `answered_at` set |
| `proposal` | `runs.proposal` JSONB. Exposed only when status is `awaiting_approval` or `saved` |
| `proposal.version` | `runs.proposal_version`, incremented on every finalize call |
| `limits.*_used` and `limit_hit` | `runs.model_turns_used`, `runs.tool_calls_used`, `runs.limit_hit`, reset at the start of each pass |
| `error` | `{ "code": error_code, "message": error_message }`, null when both are null |
| Task `source_refs` | `task_sources.paragraph_id` ordered by `ord` |
| Task `condition` | `checklist_tasks.condition` |
| `saved_at` | `save_events.saved_at` |
| `finalize` phase log entry | `tool_calls` row with `tool` = `finalize_proposal` and `args` = `{ "round": n }` |

Question IDs are unique per run and keep counting across rounds (`Q1`, `Q2`, `Q3`).

### Confirm transaction

All statements run in one PostgreSQL transaction opened with `sql.begin`. The route first runs `SELECT ... FROM runs WHERE id = $1 FOR UPDATE`, then applies the gate order from section 4.8 inside the lock. The writes are:

1. `INSERT INTO save_events (run_id, doc_id, task_count)`. A second save of the same run violates the primary key, rolls back the whole transaction and is mapped to `ALREADY_SAVED`.
2. For each `create` task: `INSERT INTO checklist_tasks (...)` with a new `TSK-` plus 8 hex ID and `last_run_id` set.
3. For each `update` task: `UPDATE checklist_tasks SET ... WHERE id = $1 AND doc_id = $2`.
4. For each `update` task: `DELETE FROM task_sources WHERE task_id = $1`.
5. For every saved task: one `INSERT INTO task_sources (task_id, doc_id, paragraph_id, ord)` per source ref, `ord` starting at 1.
6. `UPDATE runs SET status = 'saved', updated_at = now() WHERE id = $1 AND status = 'awaiting_approval'`.

Any other failure rolls the transaction back and returns `TOOL_FAILURE` (HTTP 500, retryable true). No task is partially saved.

### Queries

Saved checklist for one document:

```sql
SELECT * FROM checklist_tasks
WHERE doc_id = $1
ORDER BY deadline_date IS NULL, deadline_date, id;

SELECT ts.task_id, ts.paragraph_id, p.text
FROM task_sources ts
JOIN paragraphs p ON p.doc_id = ts.doc_id AND p.id = ts.paragraph_id
WHERE ts.doc_id = $1
ORDER BY ts.task_id, ts.ord;
```

Checklist list:

```sql
SELECT d.id AS doc_id, d.title, COUNT(t.id)::int AS task_count, MAX(t.updated_at) AS last_saved_at
FROM documents d
JOIN checklist_tasks t ON t.doc_id = d.id
GROUP BY d.id, d.title
ORDER BY last_saved_at DESC;
```

Stale run sweep, run on every `GET /api/runs/:runId`:

```sql
UPDATE runs
SET status = 'error', error_code = 'MODEL_TIMEOUT',
    error_message = 'The model did not respond in time. Retry.', updated_at = now()
WHERE id = $1 AND status = 'running' AND updated_at < now() - interval '90 seconds';
```

### Agent pass budget

Each model pass has a 45 second wall-clock budget. Every model call uses a timeout of `min(25 seconds, remaining budget)`. An exhausted budget or a call timeout is `MODEL_TIMEOUT` (HTTP 504, retryable true). The budget is measured per pass: initial run, answer submission or retry.

### Housekeeping

- Seeded tasks belong to `N1`, so `N1` appears in the checklist list before any run.
- When pasted documents exceed 200, delete the oldest pasted documents that have no saved tasks. Cascades remove their paragraphs and runs.
- Cap `runs.messages` at 400000 characters by truncating old tool results before storing. The database rejects larger values.
- Apply `lib/db/schema.sql`, then `seed.sql`. The seed uses `ON CONFLICT DO NOTHING` and is safe to run twice.

## 8. Screen to endpoint map

| Screen section | Calls |
|---|---|
| Input | `GET /api/documents`, `GET /api/documents/:docId`, `POST /api/runs` |
| Review: tool log, questions | `GET /api/runs/:runId`, `POST /api/runs/:runId/answer`, `POST /api/runs/:runId/retry` |
| Review: editable proposal and Approve | `POST /api/runs/:runId/confirm` |
| Saved | `GET /api/checklists`, `GET /api/checklists/:docId` |

## 9. Test case hooks

| Test case | How the API supports it |
|---|---|
| Ordinary 1 to 3 | `POST /api/runs` with N1 or N2 and a normal request, then confirm |
| Ambiguous or incomplete | N1 request leads to question Q1 about the signature owner, then answer |
| Simulated failure | `POST /api/runs` with `simulate_failure: "model"` returns 502 `MODEL_ERROR` with `run_id`, input stays in the form, then `retry` succeeds |
