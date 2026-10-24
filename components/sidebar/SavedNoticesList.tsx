// Owner: Member 2 (Frontend Engineer)
// Left sidebar: lists saved notices and lets the user select one (FE-06)

"use client";

import { useEffect, useState, useCallback } from "react";
import type { Document } from "@/lib/types";
import { getDocuments } from "@/lib/api-client";
import ErrorBanner from "@/components/shared/ErrorBanner";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

import { FileTextIcon, PlusIcon, TrashIcon } from "@/components/icons";

interface Props {
  documents?: Document[];
  selectedId?: string | null;
  loading?: boolean;
  error?: string | null;
  onSelect?: (docId: string) => void;
  onRetry?: () => void;
  onNewNotice?: () => void;
  onDeleteNotice?: (docId: string) => Promise<void> | void;
}

export default function SavedNoticesList({
  documents: externalDocs,
  selectedId: externalSelectedId = null,
  loading: externalLoading,
  error: externalError = null,
  onSelect,
  onRetry,
  onNewNotice,
  onDeleteNotice,
}: Props) {
  // Internal state when used in standalone mode
  const [internalDocs, setInternalDocs] = useState<Document[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-5 h-5 text-gray-500" />
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Saved Notices</h2>
        </div>
        {onNewNotice && (
          <button
            type="button"
            onClick={onNewNotice}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors shadow-2xs"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>New notice</span>
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
        <div className="p-5 rounded-lg border border-dashed border-gray-300 bg-white text-center space-y-2.5">
          <div className="w-10 h-10 mx-auto rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-200">
            <FileTextIcon className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-gray-800">No saved notices yet</p>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            Paste a notice in the center panel and click Analyze to generate actionable checklists.
          </p>
          {onNewNotice && (
            <button
              type="button"
              onClick={onNewNotice}
              className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[40px] transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Paste a notice</span>
            </button>
          )}
        </div>
      )}

      {!isLoading && !errorMsg && docs.length > 0 && (
        <ul aria-label="Saved notices" className="space-y-2">
          {docs.map((doc) => {
            const isSelected = selectedId === doc.doc_id;
            const isConfirmingDelete = confirmDeleteId === doc.doc_id;

            return (
              <li key={doc.doc_id}>
                <div
                  className={`rounded-lg border p-3 transition-all duration-150 ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/70 ring-1 ring-blue-500 shadow-2xs"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelect(doc.doc_id)}
                      aria-current={isSelected ? "true" : undefined}
                      className="flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded flex items-start gap-2.5"
                    >
                      <FileTextIcon
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          isSelected ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className={`block text-sm leading-snug truncate ${
                            isSelected
                              ? "font-semibold text-blue-900"
                              : "font-medium text-gray-800"
                          }`}
                        >
                          {doc.title}
                        </span>
                        <span className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            doc.origin === "demo" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {doc.origin === "demo" ? "Demo" : "Pasted"}
                          </span>
                          <span>·</span>
                          <span>
                            {doc.paragraph_count}{" "}
                            {doc.paragraph_count === 1 ? "para" : "paras"}
                          </span>
                        </span>
                      </div>
                      {isSelected && <span className="sr-only"> (selected)</span>}
                    </button>
                    {onDeleteNotice && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(isConfirmingDelete ? null : doc.doc_id);
                        }}
                        aria-label={`Delete notice ${doc.title}`}
                        title="Delete notice"
                        className="opacity-70 hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded transition-colors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isConfirmingDelete && (
                    <div
                      className="mt-2.5 pt-2 border-t border-gray-200 flex items-center justify-between gap-1 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-red-700 font-medium">Delete notice?</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={deletingId === doc.doc_id}
                          onClick={async (e) => {
                            e.stopPropagation();
                            setDeletingId(doc.doc_id);
                            try {
                              await onDeleteNotice?.(doc.doc_id);
                            } finally {
                              setDeletingId(null);
                              setConfirmDeleteId(null);
                            }
                          }}
                          className="px-2 py-1 font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:bg-red-300"
                        >
                          {deletingId === doc.doc_id ? "Deleting..." : "Delete"}
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === doc.doc_id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

