import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
  trackActivity,
} from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; suggestionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "EDIT");
    if (!access) return errorResponse("Access denied", 403);

    const suggestion = await prismadb.suggestion.findUnique({
      where: { id: params.suggestionId },
    });

    if (!suggestion || suggestion.documentId !== params.id) {
      return errorResponse("Suggestion not found", 404);
    }

    if (suggestion.status !== "PENDING") {
      return errorResponse("Suggestion has already been processed", 400);
    }

    const document = await prismadb.document.findUnique({
      where: { id: params.id },
    });

    if (!document) return errorResponse("Document not found", 404);

    const content = document.content as Record<string, unknown>;
    const updatedContent = JSON.stringify(content).replace(
      suggestion.originalText,
      suggestion.suggestedText
    );

    const parsedContent = JSON.parse(updatedContent);

    const updated = await prismadb.$transaction([
      prismadb.document.update({
        where: { id: params.id },
        data: {
          content: parsedContent,
          wordCount: parsedContent.toString().split(/\s+/).filter(Boolean).length,
          charCount: parsedContent.toString().length,
        },
      }),
      prismadb.suggestion.update({
        where: { id: params.suggestionId },
        data: { status: "ACCEPTED" },
      }),
    ]);

    trackActivity(user.id, params.id, "SUGGESTION", {
      action: "accept",
      suggestionId: params.suggestionId,
      type: suggestion.type,
    });

    return successResponse({
      document: updated[0],
      suggestion: updated[1],
    });
  } catch (error) {
    console.error("[SUGGESTION_ACCEPT]", error);
    return errorResponse("Internal server error", 500);
  }
}
