// Owner: Member 2 (Frontend Engineer)
// "Approve & Save" button with confirmation logic (FE-16)
// Source of truth: docs/api-spec.md Section 4.8 (POST /api/runs/:runId/confirm)

"use client";

interface Props {
  disabled?: boolean;
  loading?: boolean;
  taskCount?: number;
  onApprove: () => void | Promise<void>;
}

export default function ApproveButton({
  disabled = false,
  loading = false,
  taskCount,
  onApprove,
}: Props) {
  const isDisabled = disabled || loading;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isDisabled) return;
    void onApprove();
  };

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        aria-busy={loading}
        className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg shadow-sm transition-all duration-150 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 select-none"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span>Saving checklist…</span>
          </>
        ) : (
          <>
            <span aria-hidden="true">✓</span>
            <span>
              Approve &amp; Save
              {taskCount !== undefined && taskCount > 0
                ? ` (${taskCount} task${taskCount === 1 ? "" : "s"})`
                : ""}
            </span>
          </>
        )}
      </button>
      <p className="text-[11px] text-gray-500 text-center mt-1.5">
        Approving persists these tasks as the official checklist for this notice.
      </p>
    </div>
  );
}
