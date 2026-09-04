import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
} from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; suggestionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Document not found", 404);

    const suggestion = await prismadb.suggestion.findUnique({
      where: { id: params.suggestionId },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!suggestion || suggestion.documentId !== params.id) {
      return errorResponse("Suggestion not found", 404);
    }

    return successResponse(suggestion);
  } catch (error) {
    console.error("[SUGGESTION_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(
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

    const body = await req.json();
    const { status } = body as { status?: string };

    if (!status || !["PENDING", "ACCEPTED", "REJECTED", "DISMISSED"].includes(status)) {
      return errorResponse("Invalid status", 400);
    }

    const updated = await prismadb.suggestion.update({
      where: { id: params.suggestionId },
      data: { status: status as "PENDING" | "ACCEPTED" | "REJECTED" | "DISMISSED" },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error("[SUGGESTION_PATCH]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; suggestionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "ADMIN");
    if (!access) return errorResponse("Access denied", 403);

    const suggestion = await prismadb.suggestion.findUnique({
      where: { id: params.suggestionId },
    });

    if (!suggestion || suggestion.documentId !== params.id) {
      return errorResponse("Suggestion not found", 404);
    }

    await prismadb.suggestion.delete({
      where: { id: params.suggestionId },
    });

    return successResponse({ message: "Suggestion deleted" });
  } catch (error) {
    console.error("[SUGGESTION_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
