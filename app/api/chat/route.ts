// Owner: Member 4 (Backend Engineer) & Member 2 (Frontend Engineer)
// POST /api/chat — Chat with notice assistant with paragraph citations

import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { errorResponse, parseJson, ApiRequestError } from "../../../lib/api-response";
import { requireApiAuth } from "../../../lib/require-api-auth";
import { getDocumentWithParagraphs } from "../../../lib/db/queries";

export async function POST(request: NextRequest) {
  const authError = await requireApiAuth();
  if (authError) return authError;

  try {
    const raw = await parseJson(request);
    const body = raw as {
      doc_id?: string;
      message?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!body.doc_id || typeof body.doc_id !== "string") {
      throw new ApiRequestError("INVALID_REQUEST", "doc_id is required.", 400);
    }
    if (!body.message || typeof body.message !== "string" || !body.message.trim()) {
      throw new ApiRequestError("INVALID_REQUEST", "message is required.", 400);
    }

    const docResult = await getDocumentWithParagraphs(body.doc_id.trim());
    if (!docResult) {
      throw new ApiRequestError("DOCUMENT_NOT_FOUND", "Document not found.", 404);
    }

    const paragraphsText = docResult.paragraphs
      .map((p) => `[${p.paragraph_id}] (Paragraph ${p.position}): ${p.text}`)
      .join("\n\n");

    const systemPrompt = `You are the AI Document Assistant for Project 10. The user is reading the administrative notice titled "${docResult.doc.title}".

Here are the numbered paragraphs of the notice:
${paragraphsText}

Guidelines:
1. Answer the user's questions clearly, accurately, and concisely based strictly on the text.
2. ALWAYS cite the source paragraphs in square brackets, for example [${docResult.paragraphs[0]?.paragraph_id || "P1"}] or [P2], whenever referencing requirements, deadlines, fees, owners, or exceptions.
3. If the notice does not contain the information, state clearly that it is not mentioned in the notice.
4. Keep responses well-structured and helpful for turning administrative text into action items.`;

    const history = Array.isArray(body.history) ? body.history : [];
    const conversation = [
      ...history.slice(-6).map((h) => ({
        role: h.role as "user" | "assistant",
        content: String(h.content),
      })),
      { role: "user" as const, content: body.message.trim() },
    ];

    let answer = "";
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey && apiKey !== "your-gemini-api-key-here") {
      try {
        const response = await generateText({
          model: google("gemini-2.5-flash"),
          system: systemPrompt,
          messages: conversation,
        });
        answer = response.text;
      } catch {
        // Fall back to rule-based paragraph search if model call encounters quota/network issues
        answer = generateFallbackAnswer(docResult.paragraphs, body.message, docResult.doc.title);
      }
    } else {
      answer = generateFallbackAnswer(docResult.paragraphs, body.message, docResult.doc.title);
    }

    // Extract cited paragraph IDs from answer
    const rawMatches = answer.match(/\[([A-Za-z0-9_-]+P\d+|P\d+)\]/g) || [];
    const citedParas = Array.from(
      new Set(rawMatches.map((m) => m.replace(/[\[\]]/g, "")))
    );

    return NextResponse.json({
      ok: true,
      data: {
        answer,
        cited_paragraphs: citedParas,
      },
    });
  } catch (error) {
    return errorResponse(error, "Could not process chat message.");
  }
}

function generateFallbackAnswer(
  paragraphs: { paragraph_id: string; position: number; text: string }[],
  userMessage: string,
  title: string
): string {
  const lower = userMessage.toLowerCase();
  const searchTerms = lower
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["what", "when", "where", "who", "which", "how", "does", "this", "that"].includes(w));

  const matching = paragraphs.filter((p) =>
    searchTerms.some((term) => p.text.toLowerCase().includes(term))
  );

  if (matching.length > 0) {
    const citations = matching.map((m) => `[${m.paragraph_id}]`).join(", ");
    return `Based on notice "${title}", relevant details were found in ${citations}:\n\n` +
      matching.map((m) => `• [${m.paragraph_id}] ${m.text}`).join("\n\n");
  }

  const firstPara = paragraphs[0];
  const ref = firstPara ? `[${firstPara.paragraph_id}]` : "";
  return `Regarding "${title}": The notice mentions ${ref} "${firstPara?.text.slice(0, 120)}...". If you need specific deadline or requirement information, ask about deadlines, owners, or procedures!`;
}
