# Team 10 — AI Document to Action Agent
## Role Classification & User Story

---

## Part 1: User Story

### The One-Liner
> A university staff member pastes an administrative notice, and the app turns it into a verified, source-cited checklist they can edit, approve, and reopen later.

### Full User Story Walk-through

**Persona**: Abebe, a department secretary at a university.

---

#### Scene 1 — Landing & Input
Abebe opens the app. He sees a **left sidebar** listing saved notices (currently showing two demo notices: "Student ID Card Renewal" and "Lab Equipment Borrowing"). The **center panel** is empty with a large text area that says *"Paste your notice here…"* and an optional title field.

He pastes a 5-paragraph notice about student ID renewal. He clicks **"Analyze"**.

#### Scene 2 — Paragraph Indexing (Instant)
The center panel now shows his notice split into numbered paragraphs:
- **P1**: "The Registrar's Office will renew student ID cards…"
- **P2**: "Each student must submit two documents…"
- **P3**: "Both documents must be submitted to Room 12… by 15 November 2026."
- **P4**: "Final-year students are exempt from the passport photo…"
- **P5**: "The renewal form must be signed by the department head…"

The right panel shows a loading spinner: *"Agent is reading the notice…"*

#### Scene 3 — Draft Checklist Appears
After 3–8 seconds, the right panel populates with a **draft checklist**:

| # | Task | Deadline | Owner | Source | Condition |
|---|------|----------|-------|--------|-----------|
| 1 | Submit completed renewal form to Room 12 | 15 Nov 2026 | Student | P2, P3 | — |
| 2 | Submit one passport photo to Room 12 | 15 Nov 2026 | Student | P2, P3, P4 | Does not apply to final-year students |
| 3 | Get renewal form signed by department head | ⚠️ *No deadline stated* | ❓ *Who is responsible?* | P5 | — |

Below the table, a **clarification box** appears:
> **Question**: Paragraph P5 requires a department head signature but does not say who obtains it. Who is responsible?
> - Text field: `____________`
> - Button: **"Not stated in notice"**

An **"Absent Information"** section notes: *"The notice does not state any fee."*

#### Scene 4 — Clarification
Abebe types "Student" and submits. The agent re-runs briefly and updates Task 3's owner to "Student (provided by user)". The status changes to **"Ready for Approval"**.

#### Scene 5 — Review & Approve
Abebe reviews the three tasks. He notices Task 1's description could be clearer, so he edits it inline to add "completed" before "renewal form". He decides Task 2 is fine. He clicks **"Approve & Save"**.

A green banner appears: ✅ *"3 tasks saved successfully."*

#### Scene 6 — Reopen Later
The next day, Abebe returns. He clicks "Student ID Card Renewal" in the left sidebar. The center panel shows the original numbered paragraphs. The right panel shows his saved checklist with each task linking back to its source paragraphs. He can start a new analysis run on the same document if needed.

#### Scene 7 — Error Recovery (Edge Case)
If the AI model times out during analysis, the right panel shows:
> ⚠️ *"The model did not respond in time."*
> Button: **"Retry"** (up to 3 attempts)

The pasted text and any answers are preserved — nothing is lost.

---

## Part 2: Role Classification

### Stack Decision
**Unified Next.js (TypeScript)** with:
- **Frontend**: Next.js App Router + React + Tailwind CSS
- **Backend**: Next.js API Route Handlers (`app/api/...`)
- **AI**: Vercel AI SDK (`ai` + `@ai-sdk/google`) using Gemini 2.5 Flash
- **Database**: Supabase (PostgreSQL, free tier) or Cloudflare D1 (SQLite)
- **Deployment**: Vercel (free tier) or Cloudflare Pages

> All code lives in **one repository**, one language (TypeScript), one deploy target.

---

### Member 1 — Demo Data, Test Cases & Documentation

**Title**: QA & Documentation Lead

**Owns**: Everything that is NOT application code — seed data, test scripts, all submission documents.

**Deliverables** (in order):

| # | Deliverable | Deadline | Definition of Done |
|---|-------------|----------|-------------------|
| 1.1 | `seed.sql` — 2 demo notices with numbered paragraphs | First 30 min | File committed. Notice N1 has 5 paragraphs (includes a deadline + a condition + an ambiguous owner). Notice N2 has 6 paragraphs (includes a conditional rule). |
| 1.2 | `seed.sql` — 2 existing checklist tasks for N1 | First 30 min | Tasks TSK-0001 and TSK-0002 exist with source refs, so `read_checklist` returns data on first run. |
| 1.3 | Test Case Document (5 cases) | By 2:00 PM | Markdown table with: Case #, Input, Steps, Expected Output, Actual Output (blank until testing), Pass/Fail. |
| 1.4 | Execute all 5 test cases on live URL | By 4:00 PM | Every "Actual Output" cell filled. Screenshots captured. |
| 1.5 | Design Note (1–2 pages) | By 5:00 PM | Contains: workflow diagram, architecture diagram, tool descriptions, team roles. |
| 1.6 | Free-Service Register | By 5:00 PM | Table: Service, Plan Name, Link, Quota Limits. |
| 1.7 | Contribution Note | By 5:30 PM | Who did what + AI tool usage disclosure. |

**The 5 Test Cases (outline)**:

| Case | Type | Input | Key Check |
|------|------|-------|-----------|
| TC1 | Standard | Paste N1 text, request checklist | 3 tasks generated with correct paragraph refs and deadline |
| TC2 | Standard | Paste N2 text, request checklist | Tasks reflect N2's conditional rule |
| TC3 | Standard | Paste custom short notice (2 paragraphs) | Tasks extracted, saved, reopened successfully |
| TC4 | Ambiguous | Use N1 — agent should ask about P5 owner | Clarification question appears, answer updates the task |
| TC5 | Failure | Use `simulate_failure: "model"` flag | Error displayed, retry button works, retry succeeds |

**Hard boundaries**:
- Does NOT write React components, API routes, or agent prompts.
- Does NOT deploy. Coordinates with Member 5 for deployment verification.
- IS the final reviewer of all submission docs before 6:00 PM.

---

### Member 2 — Frontend UI

**Title**: Frontend Engineer

**Owns**: Everything inside `app/(pages)`, `components/`, and `lib/api-client.ts`. All visual rendering, user interactions, and client-side state.

**Does NOT own**: API route handler files (`app/api/**`), database queries, agent logic, deployment config.

**Deliverables** (in order):

| # | Deliverable | Deadline | Definition of Done |
|---|-------------|----------|-------------------|
| 2.1 | Page layout shell: 3-panel responsive layout | First 45 min | Left sidebar, center panel, right panel render. Tailwind only. No API calls yet. |
| 2.2 | Left Sidebar: Saved notices list | By 12:00 PM | Calls `GET /api/documents`, renders list. Click selects a document. |
| 2.3 | Center Panel: Text input + paragraph viewer | By 12:30 PM | Text area with "Analyze" button. After submission, shows numbered paragraphs (P1, P2…). Paragraph IDs are clickable/highlightable. |
| 2.4 | Right Panel: Draft checklist display | By 1:30 PM | Renders `proposal.tasks` as an editable table/card list. Each task shows description, deadline, owner, condition, and clickable source refs that highlight paragraphs in center panel. |
| 2.5 | Right Panel: Clarification UI | By 2:00 PM | When `status === "needs_clarification"`: render each question with a text input and a "Not stated" button. Submit calls `POST /api/runs/:id/answer`. |
| 2.6 | Right Panel: Approve & Save flow | By 2:30 PM | "Approve & Save" button calls `POST /api/runs/:id/confirm` with the (possibly edited) task list. Shows success banner or validation errors inline. |
| 2.7 | Saved checklist viewer | By 3:00 PM | When clicking a saved notice in sidebar: calls `GET /api/checklists/:docId`, renders saved tasks with source paragraph text. |
| 2.8 | Error & retry UI | By 3:30 PM | When `status === "error"`: show error message + "Retry" button. Loading spinners during all async operations. |
| 2.9 | Polish: empty states, responsiveness, edge cases | By 5:00 PM | No blank screens. Mobile-passable. Validation messages for empty input. |

**API Client Contract** (`lib/api-client.ts`):
Member 2 creates a thin typed client that wraps `fetch` calls. The types come from shared types defined in `lib/types.ts` (written jointly with Member 4 in the first 30 min):

```typescript
// lib/api-client.ts — Member 2 writes the fetch wrappers
export async function getDocuments(): Promise<Document[]>
export async function getDocument(docId: string): Promise<{ document: Document; paragraphs: Paragraph[] }>
export async function createRun(body: CreateRunRequest): Promise<{ run: Run }>
export async function getRun(runId: string): Promise<{ run: Run }>
export async function submitAnswers(runId: string, answers: AnswerInput[]): Promise<{ run: Run }>
export async function confirmRun(runId: string, body: ConfirmRequest): Promise<ConfirmResponse>
export async function retryRun(runId: string): Promise<{ run: Run }>
export async function getChecklists(): Promise<ChecklistSummary[]>
export async function getChecklist(docId: string): Promise<ChecklistDetail>
```

**Hard boundaries**:
- Does NOT write SQL, database migrations, or agent prompts.
- Does NOT configure deployment pipelines.
- CAN use mock/hardcoded JSON for UI development before APIs are ready (but must switch to real endpoints by 2:00 PM).

---

### Member 3 — Agent Logic & Tools

**Title**: AI Agent Engineer

**Owns**: The Gemini model orchestration, system prompts, tool definitions, the agent loop, the finalize call, and the server-side validation logic.

**Files owned**:
- `lib/agent/system-prompt.ts` — The system prompt text
- `lib/agent/tools.ts` — Tool definitions (search_document, read_checklist, save_checklist_changes)
- `lib/agent/run-agent.ts` — The orchestration function that manages the tool loop + finalize
- `lib/agent/validator.ts` — Post-finalize validation (checks source refs, dates, missing fields → generates questions or passes)
- `lib/agent/schemas.ts` — Zod schemas for the finalize call structured output

**Does NOT own**: API route files (Member 4), database queries (Member 4), React components (Member 2).

**Deliverables** (in order):

| # | Deliverable | Deadline | Definition of Done |
|---|-------------|----------|-------------------|
| 3.1 | System prompt (first draft) | First 30 min | Prompt instructs the model to: read the checklist, search the document, extract tasks with source_refs, flag missing info. Written as a string constant. |
| 3.2 | Tool definitions (3 tools) | First 45 min | Zod-based tool schemas compatible with Vercel AI SDK `tool()`. Each tool has: description, parameters schema, and a placeholder `execute` that calls a function provided by Member 4. |
| 3.3 | `runAgent()` orchestration function | By 12:30 PM | Takes `(docId, request, existingAnswers?)` → runs `generateText` with tools (max 4 steps) → runs finalize `generateObject` → returns raw proposal. Captures `tool_log` from steps. |
| 3.4 | `validateProposal()` function | By 1:30 PM | Takes `(proposal, paragraphIds[])` → returns `{ passed, issues[], questions[] }`. Implements all validation codes from the spec (UNKNOWN_PARAGRAPH, NO_SOURCE_REFS, DEADLINE_NOT_IN_SOURCE, etc.). |
| 3.5 | Clarification round handling | By 2:30 PM | When answers arrive, appends them as a user message context, re-runs finalize, re-validates. Round 2 auto-converts remaining gaps to `not_stated`. |
| 3.6 | `simulate_failure` support | By 3:00 PM | When flag is `"model"`, throw a controlled error. When `"tool"`, make a tool throw. |
| 3.7 | Prompt tuning based on test results | By 5:00 PM | Iterate on system prompt to pass all 5 test cases. |

**Interface contract with Member 4**:
Member 3 exports a single entry point that Member 4 calls from API routes:

```typescript
// lib/agent/run-agent.ts
export async function runAgent(params: {
  docId: string;
  request: string;
  round: number;
  previousMessages?: CoreMessage[];
  answers?: { questionId: string; answer: string; notStated: boolean }[];
  simulateFailure?: "none" | "model" | "tool";
  // Tool implementations injected by Member 4:
  searchDocument: (args: SearchArgs) => Promise<SearchResult>;
  readChecklist: (args: ReadArgs) => Promise<ReadResult>;
}): Promise<AgentResult>

type AgentResult = {
  status: "awaiting_approval" | "needs_clarification" | "error";
  proposal: Proposal | null;
  questions: Question[];
  toolLog: ToolLogEntry[];
  messages: CoreMessage[]; // to store for next round
  limitsUsed: { modelTurns: number; toolCalls: number };
  error: { code: string; message: string } | null;
}
```

**Hard boundaries**:
- Does NOT write database queries or API route handlers.
- Does NOT write React components.
- Does NOT handle HTTP request/response parsing (that's Member 4).
- DOES own the Gemini API key usage (via env var `GOOGLE_GENERATIVE_AI_API_KEY`).

---

### Member 4 — Backend API & Database

**Title**: Backend Engineer

**Owns**: Database schema, all API route handlers (`app/api/**`), database query functions, and the bridge between HTTP requests and agent logic.

**Files owned**:
- `lib/db/schema.sql` — Table definitions
- `lib/db/queries.ts` — All database read/write functions
- `lib/db/connection.ts` — Database client setup
- `lib/types.ts` — Shared TypeScript types (used by Members 2, 3, and 4)
- `app/api/health/route.ts`
- `app/api/documents/route.ts`
- `app/api/documents/[docId]/route.ts`
- `app/api/runs/route.ts`
- `app/api/runs/[runId]/route.ts`
- `app/api/runs/[runId]/answer/route.ts`
- `app/api/runs/[runId]/retry/route.ts`
- `app/api/runs/[runId]/confirm/route.ts`
- `app/api/checklists/route.ts`
- `app/api/checklists/[docId]/route.ts`

**Does NOT own**: Agent prompts, tool loop orchestration (Member 3), React components (Member 2), deployment config (Member 5).

**Deliverables** (in order):

| # | Deliverable | Deadline | Definition of Done |
|---|-------------|----------|-------------------|
| 4.1 | `lib/types.ts` — Shared types | First 30 min | All interfaces from the api-spec: `Document`, `Paragraph`, `Task`, `Run`, `Proposal`, `Question`, `ToolLogEntry`, `ValidationIssue`, request/response types. Committed. Member 2 and 3 import from here. |
| 4.2 | Database schema + connection | First 45 min | Tables created on remote DB. `schema.sql` committed. Connection verified with a health check query. |
| 4.3 | Seed data loaded | First 60 min | Member 1's `seed.sql` applied. `GET /api/documents` returns N1 and N2. `GET /api/checklists/N1` returns 2 seeded tasks. |
| 4.4 | Document endpoints | By 12:00 PM | `GET /api/documents`, `GET /api/documents/:docId` (with paragraph splitting for pasted text via `POST /api/runs`). |
| 4.5 | `POST /api/runs` — Full run endpoint | By 1:30 PM | Accepts `doc_id` or `text`, creates document if needed, creates run record, calls Member 3's `runAgent()`, stores results (proposal/questions/tool_log), returns full Run object. |
| 4.6 | `POST /api/runs/:runId/answer` | By 2:30 PM | Validates answers against open questions, calls `runAgent()` with answers, updates run record. |
| 4.7 | `POST /api/runs/:runId/confirm` — The save gate | By 3:00 PM | Validates proposal_version, re-validates tasks, executes transactional batch save (insert/update tasks + task_sources + save_event), returns saved response. |
| 4.8 | `POST /api/runs/:runId/retry` | By 3:30 PM | Checks retry_count < 3, clears simulate_failure, re-runs agent, updates run. |
| 4.9 | `GET /api/runs/:runId`, `GET /api/checklists`, `GET /api/checklists/:docId` | By 3:30 PM | Read endpoints with proper joins for source paragraphs. |
| 4.10 | Error envelope consistency | By 4:00 PM | All error responses use `{ ok: false, error: { code, message, retryable, run_id?, details } }`. |

**Database query functions contract** (`lib/db/queries.ts`):

```typescript
// These are called by API routes AND injected into Member 3's tool implementations
export async function getDocuments(): Promise<Document[]>
export async function getDocumentWithParagraphs(docId: string): Promise<{ doc: Document; paragraphs: Paragraph[] } | null>
export async function createDocument(text: string, title?: string): Promise<Document>
export async function searchDocument(docId: string, query: string, maxResults: number): Promise<SearchResult>
export async function readChecklist(docId: string): Promise<{ tasks: SavedTask[] }>
export async function createRun(docId: string, request: string): Promise<Run>
export async function updateRun(runId: string, data: Partial<Run>): Promise<void>
export async function saveChecklist(runId: string, docId: string, tasks: TaskInput[]): Promise<SaveResult>
// ... etc.
```

**Hard boundaries**:
- Does NOT write system prompts or tune the agent.
- Does NOT write React components or CSS.
- Does NOT configure CI/CD or hosting.
- DOES provide the tool execution functions that Member 3 plugs into the agent.

---

### Member 5 — Deployment, DevOps & Integration

**Title**: DevOps & Integration Lead

**Owns**: Repository setup, deployment pipeline, environment configuration, hosting, and cross-member integration.

**Deliverables** (in order):

| # | Deliverable | Deadline | Definition of Done |
|---|-------------|----------|-------------------|
| 5.1 | Repository setup | First 15 min | Next.js app initialized (`npx create-next-app@latest`), Tailwind configured, folder structure created, pushed to GitHub. |
| 5.2 | Folder structure created | First 20 min | All placeholder files for Members 2, 3, 4 created so they can start working in parallel without merge conflicts. See structure below. |
| 5.3 | Deployment pipeline live | First 45 min | App deployed to Vercel (or Cloudflare Pages). Public HTTPS URL works. Shows a placeholder "Team 10 — AI Document to Action" page. |
| 5.4 | Database provisioned | First 60 min | Supabase project (or D1 database) created. Connection string in `.env` (and in Vercel env vars). Schema applied. |
| 5.5 | Environment variables configured | First 60 min | `GOOGLE_GENERATIVE_AI_API_KEY` and `DATABASE_URL` set in hosting platform. `.env.example` committed with placeholder values. |
| 5.6 | Continuous deployment verified | By 12:00 PM | Push to `main` → auto-deploys. Team confirms they see changes live within 2 minutes. |
| 5.7 | Integration testing | 2:00 PM – 4:00 PM | End-to-end flow works on the live URL: paste → analyze → clarify → approve → reopen. Coordinate with Member 1 for test execution. |
| 5.8 | Production readiness | By 4:30 PM | Error logging works. No exposed secrets. App doesn't crash on empty input, long input, or rapid clicks. |
| 5.9 | Final deploy + smoke test | By 5:30 PM | All features merged. Live URL confirmed working. Share URL with team for final review. |

**Folder structure to create** (Deliverable 5.2):

```
app/
├── api/
│   ├── health/route.ts              ← Member 4
│   ├── documents/
│   │   ├── route.ts                 ← Member 4
│   │   └── [docId]/route.ts         ← Member 4
│   ├── runs/
│   │   ├── route.ts                 ← Member 4
│   │   └── [runId]/
│   │       ├── route.ts             ← Member 4
│   │       ├── answer/route.ts      ← Member 4
│   │       ├── retry/route.ts       ← Member 4
│   │       └── confirm/route.ts     ← Member 4
│   └── checklists/
│       ├── route.ts                 ← Member 4
│       └── [docId]/route.ts         ← Member 4
├── page.tsx                         ← Member 2
├── layout.tsx                       ← Member 2
└── globals.css                      ← Member 2

components/
├── sidebar/
│   └── SavedNoticesList.tsx         ← Member 2
├── document/
│   ├── TextInput.tsx                ← Member 2
│   └── ParagraphViewer.tsx          ← Member 2
├── checklist/
│   ├── DraftChecklist.tsx           ← Member 2
│   ├── ClarificationForm.tsx        ← Member 2
│   ├── ApproveButton.tsx            ← Member 2
│   └── SavedChecklist.tsx           ← Member 2
└── shared/
    ├── ErrorBanner.tsx              ← Member 2
    └── LoadingSpinner.tsx           ← Member 2

lib/
├── types.ts                         ← Member 4
├── api-client.ts                    ← Member 2
├── db/
│   ├── connection.ts                ← Member 4
│   ├── queries.ts                   ← Member 4
│   └── schema.sql                   ← Member 4
└── agent/
    ├── system-prompt.ts             ← Member 3
    ├── tools.ts                     ← Member 3
    ├── run-agent.ts                 ← Member 3
    ├── validator.ts                 ← Member 3
    └── schemas.ts                   ← Member 3

seed.sql                             ← Member 1
DESCRIPTION.md                       ← Existing
api-spec.md                          ← Existing
TEAM-PLAN.md                         ← This file
```

**Hard boundaries**:
- Does NOT write agent prompts, database queries, or React components.
- Does NOT design test cases (Member 1 does that).
- IS the single person who merges conflicting PRs and resolves integration issues.
- IS responsible for ensuring the live URL works at all times after noon.

---

## Part 3: Coordination Timeline

```
10:40 ─── START ───────────────────────────────────────────────────
  │
  │  ALL: 10-min standup. Agree on types (Member 4 screen-shares lib/types.ts).
  │
  │  Member 5: repo + deploy skeleton (HTTPS live by 11:15)
  │  Member 1: writing seed.sql + notices
  │  Member 4: schema.sql + DB provisioning
  │  Member 3: system prompt + tool schemas
  │  Member 2: layout shell (hardcoded mock data)
  │
11:30 ─── CHECKPOINT 1: "Skeleton Live" ──────────────────────────
  │
  │  ✓ HTTPS URL shows placeholder page
  │  ✓ seed.sql committed, DB seeded
  │  ✓ GET /api/health returns { ok: true }
  │  ✓ GET /api/documents returns N1, N2
  │
  │  Member 2: wire sidebar + paragraph viewer to real API
  │  Member 3: implement runAgent() with real Gemini calls
  │  Member 4: implement POST /api/runs + answer + confirm
  │  Member 1: write test case document
  │  Member 5: monitor deploys, help with integration
  │
13:00 ─── CHECKPOINT 2: "Agent Works" ────────────────────────────
  │
  │  ✓ POST /api/runs with N1 returns a proposal
  │  ✓ UI shows draft checklist from real API
  │  ✓ Clarification question renders and submits
  │
  │  Member 2: approval flow + saved checklist viewer
  │  Member 3: validation logic + simulate_failure
  │  Member 4: confirm gate + retry + checklist endpoints
  │  Member 1: begin manual testing
  │  Member 5: integration testing on live URL
  │
15:00 ─── CHECKPOINT 3: "Full Loop" ──────────────────────────────
  │
  │  ✓ End-to-end: paste → analyze → clarify → approve → reopen
  │  ✓ Error + retry works
  │  ✓ All 5 test cases pass on live URL
  │
  │  Member 2: polish UI, empty states, mobile
  │  Member 3: prompt tuning for edge cases
  │  Member 4: error envelope consistency
  │  Member 1: finalize test report + all docs
  │  Member 5: final deploy, smoke test
  │
17:00 ─── CHECKPOINT 4: "Submission Ready" ────────────────────────
  │
  │  ✓ All docs written (design note, test report, service register, contribution note)
  │  ✓ Live URL stable
  │  ✓ Repo clean (no secrets, seed data included)
  │
17:30 ─── CODE FREEZE ────────────────────────────────────────────
  │
  │  Only Member 5 can deploy (critical fixes only)
  │  Member 1 does final review of all submission docs
  │
18:00 ─── SUBMISSION ─────────────────────────────────────────────
```

---

## Part 4: Dependency Map (Who Blocks Whom)

```
Member 5 (repo + deploy)
  │
  ├── unblocks ALL (repo structure, HTTPS URL)
  │
Member 4 (types + DB + API routes)
  │
  ├── unblocks Member 2 (real API endpoints to call)
  ├── unblocks Member 3 (DB query functions to inject into tools)
  │
Member 1 (seed data)
  │
  ├── unblocks Member 4 (seed.sql to populate DB)
  │
Member 3 (agent logic)
  │
  ├── unblocks Member 4 (runAgent() function to call from API routes)
  │
Member 2 (frontend)
  │
  └── blocked by nothing after types.ts exists (can mock until APIs ready)
```

**Critical path**: Member 5 → Member 1 seed + Member 4 schema → Member 4 types → Everyone works in parallel.

---

## Part 5: Communication Rules

1. **All code in one repo, one branch (`main`)**. No feature branches for a hackathon — commit often, communicate conflicts verbally.
2. **File ownership is strict**. If you need a change in someone else's file, ask them. Don't edit it yourself.
3. **Types are the contract**. `lib/types.ts` is the single source of truth. If you need a new field, tell Member 4.
4. **Test on the live URL**, not just localhost. Member 5 ensures auto-deploy works by 11:30.
5. **Checkpoints are hard stops**. At each checkpoint, the whole team gathers for 5 minutes to verify the checklist above.
