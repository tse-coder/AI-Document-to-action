// Owner: Member 2 (Frontend Engineer)
// "Approve & Save" button with confirmation logic

"use client";

interface Props {
  disabled?: boolean;
  loading?: boolean;
  onApprove: () => void;
}

export default function ApproveButton({ disabled, loading, onApprove }: Props) {
  // TODO:
  // - Green button, disabled when loading or no proposal
  // - On click → calls confirmRun() via parent
  // - Shows success banner or validation errors

  return (
    <button
      onClick={onApprove}
      disabled={disabled || loading}
      className="w-full px-4 py-3 bg-green-600 text-white rounded font-semibold disabled:opacity-50"
    >
      {loading ? "Saving..." : "✓ Approve & Save"}
    </button>
  );
}
