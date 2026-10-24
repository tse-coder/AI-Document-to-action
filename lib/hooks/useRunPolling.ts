// Owner: Member 2 (Frontend Engineer)
// Polling hook for background agent run progress (FE-10)
// Source of truth: docs/api-spec.md Section 2

"use client";

import { useEffect, useRef } from "react";
import { getRun, ApiError } from "@/lib/api-client";
import type { Run, RunStatus } from "@/lib/types";

interface UseRunPollingOptions {
  runId: string | null;
  status: RunStatus | null;
  onUpdate: (run: Run) => void;
  onError: (error: ApiError | Error) => void;
  intervalMs?: number; // default 1500ms (1-2s)
  timeoutMs?: number; // default 60000ms (60s)
  enabled?: boolean;
}

export function useRunPolling({
  runId,
  status,
  onUpdate,
  onError,
  intervalMs = 1500,
  timeoutMs = 60000,
  enabled = true,
}: UseRunPollingOptions) {
  const isPolling = enabled && Boolean(runId) && status === "running";
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!isPolling || !runId) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
      inFlightRef.current = false;
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const poll = async () => {
      if (inFlightRef.current) return;

      // Enforce client-side timeout cap of ~60 seconds
      if (
        startTimeRef.current &&
        Date.now() - startTimeRef.current >= timeoutMs
      ) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onError(
          new ApiError({
            code: "MODEL_TIMEOUT",
            message:
              "The model did not respond in time (60-second limit reached).",
            retryable: true,
            run_id: runId,
            details: [],
          })
        );
        return;
      }

      inFlightRef.current = true;
      try {
        const { run } = await getRun(runId);
        onUpdate(run);
      } catch (err) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        onError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        inFlightRef.current = false;
      }
    };

    timerRef.current = setInterval(poll, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      startTimeRef.current = null;
      inFlightRef.current = false;
    };
  }, [isPolling, runId, status, intervalMs, timeoutMs, onUpdate, onError]);
}
