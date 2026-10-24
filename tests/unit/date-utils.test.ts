import { describe, it, expect } from "vitest";
import {
  isValidCalendarDate,
  isTextInSources,
  parseDateFromText,
} from "../../lib/agent/date-utils";

describe("Date & Text Utilities", () => {
  describe("isValidCalendarDate", () => {
    it("accepts valid ISO calendar dates", () => {
      expect(isValidCalendarDate("2026-11-15")).toBe(true);
      expect(isValidCalendarDate("2026-02-28")).toBe(true);
      expect(isValidCalendarDate("2024-02-29")).toBe(true); // Leap year
    });

    it("rejects invalid calendar dates", () => {
      expect(isValidCalendarDate("2026-02-31")).toBe(false);
      expect(isValidCalendarDate("2026-13-01")).toBe(false);
      expect(isValidCalendarDate("not-a-date")).toBe(false);
      expect(isValidCalendarDate("")).toBe(false);
    });
  });

  describe("isTextInSources", () => {
    const paragraphs = [
      "The Registrar's Office will renew student ID cards for the 2026/27 academic year.",
      "Both documents must be submitted to Room 12 of the Registrar's Office by 15 November 2026.",
      "Final-year students are exempt from the passport photo requirement.",
    ];

    it("finds exact text in paragraphs", () => {
      expect(isTextInSources("15 November 2026", paragraphs)).toBe(true);
      expect(isTextInSources("Room 12", paragraphs)).toBe(true);
      expect(isTextInSources("passport photo requirement", paragraphs)).toBe(true);
    });

    it("returns false when text is not in paragraphs", () => {
      expect(isTextInSources("20 November 2026", paragraphs)).toBe(false);
      expect(isTextInSources("Room 101", paragraphs)).toBe(false);
      expect(isTextInSources("", paragraphs)).toBe(false);
    });
  });

  describe("parseDateFromText", () => {
    it("extracts ISO dates from natural language text", () => {
      const parsed = parseDateFromText("15 November 2026");
      expect(parsed).toBe("2026-11-15");
    });

    it("returns null on non-date strings", () => {
      expect(parseDateFromText("Room 12")).toBe(null);
    });
  });
});
