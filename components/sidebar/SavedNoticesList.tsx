// Owner: Member 2 (Frontend Engineer)
// Left sidebar: lists saved notices and lets the user select one (FE-06)

"use client";

import { useEffect, useState, useCallback } from "react";
import type { Document } from "@/lib/types";
import { getDocuments } from "@/lib/api-client";
import ErrorBanner from "@/components/shared/ErrorBanner";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

interface Props {
  documents?: Document[];
  selectedId?: string | null;
  loading?: boolean;
  error?: string | null;
  onSelect?: (docId: string) => void;
  onRetry?: () => void;
  onNewNotice?: () => void;
}

export default function SavedNoticesList({
  documents: externalDocs,
  selectedId: externalSelectedId = null,
  loading: externalLoading,
  error: externalError = null,
  onSelect,
  onRetry,
  onNewNotice,
}: Props) {
  // Internal state when used in standalone mode
  const [internalDocs, setInternalDocs] = useState<Document[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const isControlled = externalDocs !== undefined;

  const fetchInternalDocs = useCallback(async () => {
    setInternalLoading(true);
    setInternalError(null);
    try {
      const res = await getDocuments();
      setInternalDocs(res.documents);
    } catch (err) {
      setInternalError(
        err instanceof Error
          ? err.message
          : "Could not load saved notices. Please try again."
      );
    } finally {
      setInternalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isControlled) {
      void fetchInternalDocs();
    }
  }, [isControlled, fetchInternalDocs]);

  const docs = isControlled ? externalDocs : internalDocs;
  const isLoading = isControlled ? Boolean(externalLoading) : internalLoading;
  const errorMsg = isControlled ? externalError : internalError;
  const selectedId = isControlled ? externalSelectedId : internalSelectedId;

  const handleSelect = (docId: string) => {
    if (!isControlled) {
      setInternalSelectedId(docId);
    }
    onSelect?.(docId);
  };

  const handleRetry = () => {
    if (isControlled && onRetry) {
      onRetry();
    } else {
      void fetchInternalDocs();
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Saved Notices</h2>
        {onNewNotice && (
          <button
            type="button"
            onClick={onNewNotice}
            className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            New notice
          </button>
        )}
      </div>

      {isLoading && (
        <div className="py-4">
          <LoadingSpinner label="Loading notices..." />
        </div>
      )}

      {!isLoading && errorMsg && (
        <ErrorBanner message={errorMsg} onRetry={handleRetry} />
      )}

      {!isLoading && !errorMsg && docs.length === 0 && (
        <div className="p-4 rounded-md border border-dashed border-gray-300 bg-white text-center space-y-2">
          <p className="text-sm font-medium text-gray-700">No saved notices yet</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Paste a notice in the center panel and click Analyze to create one.
          </p>
          {onNewNotice && (
            <button
              type="button"
              onClick={onNewNotice}
              className="mt-2 inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[40px] transition-colors"
            >
              Paste a notice
            </button>
          )}
        </div>
      )}

      {!isLoading && !errorMsg && docs.length > 0 && (
        <ul aria-label="Saved notices" className="space-y-1">
          {docs.map((doc) => {
            const isSelected = selectedId === doc.doc_id;

            return (
              <li key={doc.doc_id}>
                <button
                  type="button"
                  onClick={() => handleSelect(doc.doc_id)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`w-full rounded-md border px-3 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-transparent hover:bg-gray-100"
                  }`}
                >
                  <span
                    className={`block text-sm leading-snug ${
                      isSelected
                        ? "font-semibold text-blue-900"
                        : "font-medium text-gray-800"
                    }`}
                  >
                    {doc.title}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {doc.origin === "demo" ? "Demo" : "Pasted"} ·{" "}
                    {doc.paragraph_count}{" "}
                    {doc.paragraph_count === 1 ? "paragraph" : "paragraphs"}
                  </span>
                  {isSelected && <span className="sr-only"> (selected)</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
