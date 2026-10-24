// Owner: Member 2 (Frontend Engineer)
// Main page — 3-panel layout

"use client";

import SavedNoticesList from "@/components/sidebar/SavedNoticesList";
import TextInput from "@/components/document/TextInput";

export default function Home() {
  // TODO:
  // - State: selectedDocId, currentRun, paragraphs, view mode (input | viewing)
  // - Left: SavedNoticesList (selecting a doc loads paragraphs + checklist)
  // - Center: TextInput (input mode) or ParagraphViewer (viewing mode)
  // - Right: DraftChecklist / ClarificationForm / ApproveButton / SavedChecklist / ErrorBanner
  //          depending on currentRun.status

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <SavedNoticesList />

      {/* Center Panel */}
      <main className="flex-1 border-r overflow-y-auto">
        <TextInput />
      </main>

      {/* Right Panel */}
      <aside className="w-96 overflow-y-auto p-4">
        <h2 className="text-lg font-semibold mb-4">Checklist</h2>
        <p className="text-sm text-gray-400">
          Paste a notice and click &quot;Analyze&quot; to generate a checklist.
        </p>
      </aside>
    </div>
  );
}
