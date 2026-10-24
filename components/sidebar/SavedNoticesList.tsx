// Owner: Member 2 (Frontend Engineer)
// Left sidebar: lists saved notices and demo documents

"use client";

export default function SavedNoticesList() {
  // TODO:
  // - Call getDocuments() on mount
  // - Call getChecklists() to show saved badge
  // - Render clickable list items
  // - Highlight currently selected document
  // - "New Notice" button at top

  return (
    <aside className="w-64 border-r p-4">
      <h2 className="text-lg font-semibold mb-4">Saved Notices</h2>
      <p className="text-sm text-gray-500">Loading...</p>
    </aside>
  );
}
