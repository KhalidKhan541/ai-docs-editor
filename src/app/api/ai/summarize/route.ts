import { NextRequest } from "next/server";
import { getCurrentUser, successResponse, errorResponse } from "@/lib/utils";
import { aiSummarizeSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = aiSummarizeSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { content, maxLength } = result.data;

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
            content: `You are a document summarization assistant. Create a clear, concise summary of the provided text.
The summary should be approximately ${maxLength} words or fewer.
Capture the main points, key arguments, and important details.
Use clear, professional language.
Do not add information that is not in the original text.`,
          },
          {
            role: "user",
            content: `Please summarize the following text:\n\n${content}`,
          },
        ],
        max_tokens: Math.min(maxLength * 2, 2000),
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("[AI_SUMMARIZE_API_ERROR]");
      return errorResponse("AI service error", 502);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content ?? "";

    if (!summary) {
      return errorResponse("No summary generated", 502);
    }

    return successResponse({
      summary,
      originalLength: content.length,
      summaryLength: summary.length,
      usage: data.usage,
    });
  } catch (error) {
    console.error("[AI_SUMMARIZE]", error);
    return errorResponse("Internal server error", 500);
  }
}
