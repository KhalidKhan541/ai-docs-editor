import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
} from "@/lib/utils";
import { replySchema } from "@/lib/validators";

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
    });

    if (!comment || comment.documentId !== params.id) {
      return errorResponse("Comment not found", 404);
    }

    const replies = await prismadb.commentReply.findMany({
      where: { commentId: params.commentId },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse({ replies });
  } catch (error) {
    console.error("[REPLY_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "COMMENT");
    if (!access) return errorResponse("Access denied", 403);

    const comment = await prismadb.comment.findUnique({
      where: { id: params.commentId },
    });

    if (!comment || comment.documentId !== params.id) {
      return errorResponse("Comment not found", 404);
    }

    const body = await req.json();
    const result = replySchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const reply = await prismadb.commentReply.create({
      data: {
        content: result.data.content,
        authorId: user.id,
        commentId: params.commentId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return successResponse(reply, 201);
  } catch (error) {
    console.error("[REPLY_POST]", error);
    return errorResponse("Internal server error", 500);
  }
}
