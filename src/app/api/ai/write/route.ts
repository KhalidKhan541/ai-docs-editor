import { NextRequest } from "next/server";
import { getCurrentUser, successResponse, errorResponse } from "@/lib/utils";
import { aiWriteSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = aiWriteSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { prompt, context, tone, length } = result.data;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return errorResponse("AI service not configured", 503);
    }

    const toneMap: Record<string, string> = {
      professional: "Write in a clear, professional tone.",
      casual: "Write in a friendly, conversational tone.",
      formal: "Write in a formal, academic tone.",
      creative: "Write in a creative, engaging style.",
      academic: "Write in a scholarly, research-oriented tone.",
    };

    const lengthMap: Record<string, string> = {
      short: "Keep it concise, around 100-200 words.",
      medium: "Write a moderate length, around 300-500 words.",
      long: "Write a detailed, comprehensive piece, around 600-1000 words.",
    };

    const systemPrompt = `You are an AI writing assistant for a collaborative document editor.
${toneMap[tone ?? "professional"]}
${lengthMap[length ?? "medium"]}
Output well-structured text with appropriate paragraphs. Do not use markdown headers.
If context is provided, write content that fits naturally within the existing document.`;

    const userMessage = context
      ? `Context from the document:\n${context}\n\nWrite request: ${prompt}`
      : prompt;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: length === "long" ? 1500 : length === "short" ? 400 : 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[AI_WRITE_API_ERROR]", error);
      return errorResponse("AI service error", 502);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content ?? "";

    if (!generatedText) {
      return errorResponse("No content generated", 502);
    }

    return successResponse({
      text: generatedText,
      usage: data.usage,
    });
  } catch (error) {
    console.error("[AI_WRITE]", error);
    return errorResponse("Internal server error", 500);
  }
}
