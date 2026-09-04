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
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Document not found", 404);

    const comment = await prismadb.comment.findUnique({
      where: { id: params.commentId },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!comment || comment.documentId !== params.id) {
      return errorResponse("Comment not found", 404);
    }

    return successResponse(comment);
  } catch (error) {
    console.error("[COMMENT_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const comment = await prismadb.comment.findUnique({
      where: { id: params.commentId },
    });

    if (!comment || comment.documentId !== params.id) {
      return errorResponse("Comment not found", 404);
    }

    if (comment.authorId !== user.id) {
      return errorResponse("Only the author can edit this comment", 403);
    }

    const body = await req.json();
    const { content } = body as { content?: string };

    if (!content || content.trim().length === 0) {
      return errorResponse("Content is required", 400);
    }

    if (content.length > 2000) {
      return errorResponse("Comment too long (max 2000 characters)", 400);
    }

    const updated = await prismadb.comment.update({
      where: { id: params.commentId },
      data: { content },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error("[COMMENT_PATCH]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "ADMIN");
    if (!access) return errorResponse("Access denied", 403);

    const comment = await prismadb.comment.findUnique({
      where: { id: params.commentId },
    });

    if (!comment || comment.documentId !== params.id) {
      return errorResponse("Comment not found", 404);
    }

    await prismadb.comment.delete({ where: { id: params.commentId } });

    return successResponse({ message: "Comment deleted" });
  } catch (error) {
    console.error("[COMMENT_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
