import { NextRequest } from "next/server";
import { getCurrentUser, successResponse, errorResponse } from "@/lib/utils";
import { aiTranslateSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = aiTranslateSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { content, targetLanguage } = result.data;

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
            content: `You are a professional translator. Translate the following text to ${targetLanguage}.
- Preserve the original meaning and tone
- Maintain formatting and structure
- Use natural, fluent ${targetLanguage}
- If the text is already in ${targetLanguage}, return it as-is
- Do not add explanations or notes`,
          },
          {
            role: "user",
            content: `Please translate the following text to ${targetLanguage}:\n\n${content}`,
          },
        ],
        max_tokens: Math.min(content.length * 2, 4000),
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      console.error("[AI_TRANSLATE_API_ERROR]");
      return errorResponse("AI service error", 502);
    }

    const data = await response.json();
    const translated = data.choices?.[0]?.message?.content ?? "";

    if (!translated) {
      return errorResponse("No translation generated", 502);
    }

    return successResponse({
      translated,
      sourceLength: content.length,
      translatedLength: translated.length,
      targetLanguage,
      usage: data.usage,
    });
  } catch (error) {
    console.error("[AI_TRANSLATE]", error);
    return errorResponse("Internal server error", 500);
  }
}
