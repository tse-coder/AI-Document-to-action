// Owner: Member 2 (Frontend Engineer)
// Error banner with retry button

"use client";

interface Props {
  message: string;
  retryable?: boolean;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, retryable, onRetry }: Props) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <p className="text-sm text-red-700">⚠️ {message}</p>
      {retryable && onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Retry
        </button>
      )}
    </div>
  );
}
