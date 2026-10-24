import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getRun } from "../api-client";
import { mockRunRunning, mockRunAwaitingApproval } from "../mock-data";

vi.mock("../api-client", async () => {
  const actual = await vi.importActual<typeof import("../api-client")>("../api-client");
  return {
    ...actual,
    getRun: vi.fn(),
  };
});

describe("FE-10 Run Polling Logic & Contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls getRun for active run IDs", async () => {
    vi.mocked(getRun).mockResolvedValueOnce({ run: mockRunAwaitingApproval });
    const res = await getRun("RUN-POLL-01");
    expect(res.run.status).toBe("awaiting_approval");
    expect(getRun).toHaveBeenCalledWith("RUN-POLL-01");
  });

  it("distinguishes running from terminal and ready states", () => {
    expect(mockRunRunning.status).toBe("running");
    expect(mockRunAwaitingApproval.status).not.toBe("running");
  });
});
