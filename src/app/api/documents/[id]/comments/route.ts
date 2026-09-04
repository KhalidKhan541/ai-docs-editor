import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
  paginateQuery,
  buildPaginationMeta,
} from "@/lib/utils";
import { createCommentSchema } from "@/lib/validators";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Document not found", 404);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const resolved = searchParams.get("resolved");
    const { skip, take } = paginateQuery(page, limit);

    const where: Record<string, unknown> = { documentId: params.id };
    if (resolved !== null) {
      where.isResolved = resolved === "true";
    }

    const [comments, total] = await Promise.all([
      prismadb.comment.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prismadb.comment.count({ where }),
    ]);

    return successResponse({
      comments,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("[COMMENTS_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "COMMENT");
    if (!access) return errorResponse("Access denied", 403);

    const body = await req.json();
    const result = createCommentSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { content, selection } = result.data;

    const comment = await prismadb.comment.create({
      data: {
        content,
        selection: selection ?? undefined,
        authorId: user.id,
        documentId: params.id,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        replies: true,
      },
    });

    return successResponse(comment, 201);
  } catch (error) {
    console.error("[COMMENTS_POST]", error);
    return errorResponse("Internal server error", 500);
  }
}
