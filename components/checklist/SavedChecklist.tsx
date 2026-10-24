// Owner: Member 2 (Frontend Engineer)
// Displays a saved checklist with source paragraphs

"use client";

import type { ChecklistDetail } from "@/lib/types";

interface Props {
  checklist: ChecklistDetail;
}

export default function SavedChecklist({ checklist }: Props) {
  // TODO:
  // - Render each saved task with description, deadline, owner, condition
  // - Show source paragraphs inline (expandable)
  // - "Last saved" timestamp

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2">Saved Checklist</h3>
      <p className="text-xs text-gray-400">Last saved: {checklist.last_saved_at}</p>
      <p className="text-sm text-gray-500 mt-2">{checklist.tasks.length} tasks</p>
    </div>
  );
}
