// =============================================
// Database Queries
// Owner: Member 4 (Backend Engineer)
// =============================================
// All database read/write functions live here.
// API routes and agent tool implementations call these.
// =============================================

// --- Document queries ---

export async function getDocuments() {
  // TODO: SELECT from documents, demo first then pasted by newest
  return [];
}

export async function getDocumentWithParagraphs(docId: string) {
  // TODO: SELECT document + paragraphs WHERE doc_id = docId
  return null;
}

export async function createDocument(text: string, title?: string) {
  // TODO: Split text on blank lines, assign paragraph IDs, INSERT document + paragraphs
  return null;
}

// --- Search (for search_document tool) ---

export async function searchDocument(
  docId: string,
  query: string,
  maxResults: number = 5
) {
  // TODO: Keyword search — lowercase query, drop stop words,
  // score paragraphs by distinct term matches, return top results
  return { doc_id: docId, total_paragraphs: 0, matches: [] };
}

// --- Checklist queries (for read_checklist tool) ---

export async function readChecklist(docId: string) {
  // TODO: SELECT from checklist_tasks WHERE doc_id = docId
  return { doc_id: docId, tasks: [] };
}

// --- Run queries ---

export async function createRun(docId: string, request: string) {
  // TODO: INSERT into runs, return new Run object
  return null;
}

export async function getRunById(runId: string) {
  // TODO: SELECT run + questions + tool_log
  return null;
}

export async function updateRun(runId: string, data: Record<string, unknown>) {
  // TODO: UPDATE runs SET ... WHERE id = runId
}

// --- Save gate ---

export async function saveChecklist(
  runId: string,
  docId: string,
  tasks: unknown[]
) {
  // TODO: Transactional batch:
  // 1. INSERT save_events (anti-duplicate)
  // 2. INSERT/UPDATE checklist_tasks
  // 3. DELETE + INSERT task_sources
  // 4. UPDATE run status → 'saved'
  return null;
}
