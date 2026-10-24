// Owner: Member 2 (Frontend Engineer)
// Renders the agent's draft checklist proposal as an editable table

"use client";

import type { Proposal } from "@/lib/types";

interface Props {
  proposal: Proposal;
  onTaskEdit?: (clientId: string, field: string, value: string) => void;
  onSourceRefHover?: (refs: string[]) => void;
}

export default function DraftChecklist({ proposal, onTaskEdit, onSourceRefHover }: Props) {
  // TODO:
  // - Render proposal.summary at top
  // - Table/cards for each task: description (editable), deadline, owner, condition, source_refs
  // - Source refs are clickable → trigger onSourceRefHover to highlight in ParagraphViewer
  // - Validation warnings shown inline (yellow badges)
  // - absent_information section at bottom

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2">Draft Checklist</h3>
      <p className="text-sm text-gray-600 mb-4">{proposal.summary}</p>
      <p className="text-sm text-gray-400">Task rendering not yet implemented</p>
    </div>
  );
}
