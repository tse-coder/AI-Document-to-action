# UI Modernization Plan: Conversational Agent Workspace

## 1. Overview & Objective

Transform the current **AI Document to Action Agent** into a modern 3-column AI assistant workspace where:
- **Left Column (Unchanged)**: Saved & Demo Notices list, active selection, and "New Notice" trigger.
- **Center Column (New — Chat Interface)**: Interactive conversational agent feed where the user pastes notices, prompts the agent, sees tool execution & reasoning, and answers clarification questions inline.
- **Right Column (Refined — Actionable Checklist)**: Dedicated, persistent checklist workspace displaying generated draft tasks, inline task editing, source citation chips, and the final "Approve & Save" gate.

```
┌────────────────────┬──────────────────────────────────────────┬─────────────────────────────┐
│    LEFT SIDEBAR    │            CENTER: CHAT FEED             │      RIGHT: CHECKLIST       │
│  (Saved Notices)   │         (Interactive Agent Feed)         │     (Draft / Saved Tasks)   │
├────────────────────┼──────────────────────────────────────────┼─────────────────────────────┤
│ • N1 (Demo)        │ [Document Header: N1 (5 Paras) 👁️ View]   │ Draft Checklist (v1)        │
│ • N2 (Demo)        │                                          │ ┌─────────────────────────┐ │
│ • U-XXXX (Pasted)  │ 🤖 Agent: "I've analyzed the notice      │ │ Task 1: Submit form     │ │
│                    │    and extracted 3 tasks."               │ │ Deadline: 2026-11-15    │ │
│ [+ New Notice]     │                                          │ │ Owner: Student [P2, P3] │ │
│                    │ ❓ Clarification Bubble:                 │ └─────────────────────────┘ │
│                    │    "Who obtains the P5 signature?"       │ ┌─────────────────────────┐ │
│                    │    [Student] [Not stated] [Custom...]    │ │ Task 2: Passport photo  │ │
│                    │                                          │ └─────────────────────────┘ │
│                    │ 👤 User: "Student"                       │                             │
│                    │                                          │ [ ✅ Approve & Save (3) ]   │
│                    │ 🤖 Agent: "Updated Task 3. Ready!"       │                             │
│                    │                                          │ ▾ Tool Execution Log        │
│                    │ ┌──────────────────────────────────────┐ │   (Observability)           │
│                    │ │ Type message or paste notice...  [▲] │ │                             │
│                    │ └──────────────────────────────────────┘ │                             │
└────────────────────┴──────────────────────────────────────────┴─────────────────────────────┘
```

---

## 2. User Journey & Conversational Flow

### Phase 1: Initiation
1. **Empty State**: Secretary Abebe enters the app.
   - The center panel presents an inviting agent greeting:
     > *"Hello! Paste an administrative notice here or select one from the sidebar, and I will extract a verified, source-cited action checklist."*
   - Includes quick-start suggestions:
     - `[ 📄 Paste Notice Text ]`
     - `[ 🔍 Load Demo: Student ID Card Renewal ]`
     - `[ 🔬 Load Demo: Lab Equipment Borrowing ]`

### Phase 2: Notice Submission & Analysis
1. Abebe pastes a notice into the chat input (or clicks the expandable notice drawer) and sends it with the request *"Create an action checklist for this notice"*.
2. The user message appears in the chat stream with an attached document card preview.
3. The Agent responds with live status / step indicators:
   - `[⚙️ Splitting & indexing 5 paragraphs]`
   - `[🔍 Scanning notice for dates and actors]`
   - `[📋 Generating initial draft checklist]`
4. The **Right Panel** automatically populates with the draft tasks in real-time as the proposal lands.

### Phase 3: Conversational Clarification
1. When the agent identifies ambiguous information (e.g., paragraph P5 specifies a signature is required but not who collects it), a **Clarification Card** is rendered in the chat stream.
2. The card provides instant single-click answer chips:
   - `[ Student ]`
   - `[ Department Head ]`
   - `[ ⚠️ Not stated in notice ]`
   - Or an inline text input.
3. When the user responds, the answer is appended to the chat, the agent updates the draft checklist in the right panel, and confirms:
   > *"Got it. I've updated Task 3's owner to 'Student (provided by user)'. The checklist is now ready for approval in the right panel."*

### Phase 4: Review, Inline Edit & Approval
1. Abebe looks at the Right Column:
   - He can click citation chips (e.g., `P2, P3`) $\rightarrow$ highlights relevant paragraphs in the document viewer.
   - He edits Task 1's title or deadline inline if desired.
2. Abebe clicks **"Approve & Save"** in the right column (or types *"looks good, approve it"* in the chat).
3. The right column shows a green success state (`✅ 3 tasks saved successfully`).
4. The notice is stored and added to the Left Sidebar under Saved Notices.

---

## 3. Detailed Panel Specifications

### 3.1 Center Panel: Agent Chat Interface
- **Sticky Document Reference Bar (Top)**:
  - Displays the active notice title, paragraph count, and a toggleable `[👁️ View Full Text & Paragraphs]` drawer/sheet.
  - When opened, slides down or overlays the numbered paragraphs (`P1`, `P2`...) with citation highlighting without obscuring the chat history.
- **Message Stream**:
  - **User Messages**: Distinct right-aligned or styled bubbles showing pasted notice excerpts, instructions, or clarification answers.
  - **Agent Messages**: Formatted markdown responses, analytical reasoning summaries, and status badges.
  - **Tool Activity Accordion**: Collapsible badge row showing tool calls (e.g., `search_document`, `read_checklist`).
  - **Interactive Clarification Bubble**: Embeds open questions with direct interactive choices so the user never has to leave the conversation flow.
- **Chat Input Bar (Bottom)**:
  - Auto-expanding textarea with support for multiline pasting (up to 6,000 characters).
  - Quick action toolbar:
    - `[📋 Paste Notice template]`
    - Character counter (`120 / 6000`)
    - Send button with keyboard shortcut (`Cmd+Enter` or `Enter`).

### 3.2 Right Panel: Actionable Checklist
- **Header**:
  - Title: "Action Checklist"
  - Status pill: `Idle` | `Analyzing...` | `Needs Clarification` | `Ready for Approval` | `Saved`
- **Draft Mode (`DraftChecklist.tsx`)**:
  - Tasks rendered as clean, high-density cards with inline editable fields (description, deadline, owner, condition).
  - Source reference chips (`N1-P2`, `N1-P3`) that trigger document highlighting.
  - Absent Information warnings (e.g., *"The notice does not state any fee."*).
- **Saved Mode (`SavedChecklist.tsx`)**:
  - Displays confirmed tasks and the full verbatim source paragraph text for audits.
  - "Run New Analysis" button to re-analyze or update tasks against the document.
- **Approve Gate (`ApproveButton.tsx`)**:
  - Prominent sticky button at the bottom of the checklist.
  - Disabled during active streaming or unresolved questions.
  - Displays error banners and inline field validation if the user edited invalid dates.
- **Observability (`ToolLog.tsx`)**:
  - Kept as a neat collapsible drawer at the very bottom for hackathon judges / demo observability.

---

## 4. Component Structure & Migration Plan

### 4.1 New Components to Create
1. **`components/chat/ChatInterface.tsx`**:
   - The primary center container orchestrating message history, scroll-to-bottom, sticky document header, and input bar.
2. **`components/chat/ChatMessageItem.tsx`**:
   - Renders individual user/agent bubbles, system events, and tool execution badges.
3. **`components/chat/ChatInput.tsx`**:
   - Multiline input box with notice paste button, char count, and submit handlers.
4. **`components/chat/DocumentDrawer.tsx`**:
   - Slide-over or dropdown sheet containing `ParagraphViewer.tsx` so users can inspect verbatim paragraphs `P1`–`P40` on demand.

### 4.2 Components to Refactor / Reuse
- **`app/page.tsx`**: Replace the center panel's `TextInput`/`ParagraphViewer` switch with `ChatInterface`.
- **`lib/hooks/useWorkspace.ts`**:
  - Add `chatMessages: ChatMessage[]` state.
  - Sync agent run events (`status`, `questions`, `proposal`) automatically into the chat message stream.
  - Add `sendMessage(text: string)` handler that detects whether text is a notice paste or a clarification reply.
- **`components/checklist/ClarificationForm.tsx`**:
  - Keep right-panel fallback or adapt its interactive question items for inline rendering inside `ChatInterface`.

---

## 5. Mobile & Responsive Layout

- On screens `< 768px` (mobile):
  - Bottom navigation tab bar with 3 tabs:
    1. **Notices** (Left sidebar)
    2. **Chat** (Center panel)
    3. **Checklist** (Right panel)
  - Badge counter on **Checklist** tab showing draft task count (e.g., `Checklist (3)`).
  - Tapping a citation chip in the checklist automatically switches to the Document viewer with the paragraph pre-highlighted.

---

## 6. Verification & Definition of Done

1. **User can start from chat**: Pasting notice in chat starts analysis and renders agent response.
2. **Questions answered in chat**: Clarification question appears in chat; answering it re-runs agent pass.
3. **Checklist stays live in right column**: Real-time sync between chat run state and right checklist cards.
4. **Paragraph inspection intact**: User can easily inspect numbered paragraphs and see citation highlights.
5. **Approve & Save works**: Saved checklist persists to Supabase and sidebar updates.
6. **Tests pass**: `npm run typecheck` and `npm test` remain green.
