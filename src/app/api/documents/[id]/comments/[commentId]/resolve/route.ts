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
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Access denied", 403);

    const comment = await prismadb.comment.findUnique({
      where: { id: params.commentId },
    });

    if (!comment || comment.documentId !== params.id) {
      return errorResponse("Comment not found", 404);
    }

    const body = await req.json();
    const { isResolved } = body as { isResolved?: boolean };

    if (typeof isResolved !== "boolean") {
      return errorResponse("isResolved must be a boolean", 400);
    }

    const updated = await prismadb.comment.update({
      where: { id: params.commentId },
      data: { isResolved },
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

    trackActivity(user.id, params.id, "COMMENT", {
      action: isResolved ? "resolve" : "unresolve",
      commentId: params.commentId,
    });

    return successResponse(updated);
  } catch (error) {
    console.error("[COMMENT_RESOLVE]", error);
    return errorResponse("Internal server error", 500);
  }
}
