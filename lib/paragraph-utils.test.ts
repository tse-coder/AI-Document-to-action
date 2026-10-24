import { describe, it, expect } from "vitest";
import { splitParagraphs } from "./paragraph-utils";

describe("FE-09 Paragraph Splitting Utility", () => {
  it("splits text on blank lines and numbers paragraphs", () => {
    const text =
      "First paragraph here.\n\nSecond paragraph has information.\n\nThird paragraph ends.";
    const paras = splitParagraphs(text, "DOC");
    expect(paras).toHaveLength(3);
    expect(paras[0]).toEqual({
      paragraph_id: "DOC-P1",
      position: 1,
      text: "First paragraph here.",
    });
    expect(paras[1]).toEqual({
      paragraph_id: "DOC-P2",
      position: 2,
      text: "Second paragraph has information.",
    });
    expect(paras[2]).toEqual({
      paragraph_id: "DOC-P3",
      position: 3,
      text: "Third paragraph ends.",
    });
  });

  it("trims whitespace and ignores extra empty lines", () => {
    const text = "   \n\n  P1 text  \n\n\n\n  P2 text   \n\n   ";
    const paras = splitParagraphs(text, "N1");
    expect(paras).toHaveLength(2);
    expect(paras[0].text).toBe("P1 text");
    expect(paras[1].text).toBe("P2 text");
  });

  it("caps maximum paragraphs at 40", () => {
    const manyParagraphs = Array.from({ length: 50 }, (_, i) => `Paragraph ${i + 1}`).join("\n\n");
    const paras = splitParagraphs(manyParagraphs);
    expect(paras).toHaveLength(40);
  });
});
