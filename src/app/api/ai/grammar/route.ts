import { NextRequest } from "next/server";
import { getCurrentUser, successResponse, errorResponse } from "@/lib/utils";
import { aiGrammarSchema } from "@/lib/validators";

interface GrammarIssue {
  original: string;
  suggestion: string;
  explanation: string;
  offset: number;
  length: number;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = aiGrammarSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { content } = result.data;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return errorResponse("AI service not configured", 503);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a grammar and writing quality checker. Analyze the provided text and return a JSON array of issues found.
For each issue, return:
{
  "original": "the problematic text",
  "suggestion": "the corrected text",
  "explanation": "brief explanation of the issue",
  "offset": number (character position in original text),
  "length": number (length of the problematic text)
}

Focus on:
- Grammar errors
- Spelling mistakes
- Punctuation issues
- Unclear or awkward phrasing
- Word choice improvements

If no issues are found, return an empty array.
Return ONLY the JSON array, no other text.`,
          },
          {
            role: "user",
            content: `Check the following text for grammar and writing issues:\n\n${content}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("[AI_GRAMMAR_API_ERROR]");
      return errorResponse("AI service error", 502);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content ?? "[]";

    let issues: GrammarIssue[];
    try {
      const cleaned = rawContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      issues = JSON.parse(cleaned);
    } catch {
      issues = [];
    }

    let correctedText = content;
    const sortedIssues = [...issues].sort((a, b) => b.offset - a.offset);

    for (const issue of sortedIssues) {
      correctedText =
        correctedText.slice(0, issue.offset) +
        issue.suggestion +
        correctedText.slice(issue.offset + issue.length);
    }

    return successResponse({
      issues,
      correctedText,
      issueCount: issues.length,
      originalLength: content.length,
      correctedLength: correctedText.length,
      usage: data.usage,
    });
  } catch (error) {
    console.error("[AI_GRAMMAR]", error);
    return errorResponse("Internal server error", 500);
  }
}
