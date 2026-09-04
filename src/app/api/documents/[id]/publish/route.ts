import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
  trackActivity,
} from "@/lib/utils";
import { publishSchema } from "@/lib/validators";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "ADMIN");
    if (!access) return errorResponse("Access denied", 403);

    const body = await req.json();
    const result = publishSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { isPublished } = result.data;

    const document = await prismadb.document.update({
      where: { id: params.id },
      data: {
        isPublished,
        publishedAt: isPublished ? new Date() : null,
      },
      select: {
        id: true,
        title: true,
        isPublished: true,
        publishedAt: true,
      },
    });

    trackActivity(user.id, params.id, "PUBLISH", {
      isPublished,
    });

    return successResponse(document);
  } catch (error) {
    console.error("[DOCUMENT_PUBLISH]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prismadb.document.findUnique({
      where: { id: params.id, isPublished: true },
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        isPublished: true,
        publishedAt: true,
        emoji: true,
        coverImage: true,
        author: {
          select: { id: true, name: true, avatar: true },
        },
        org: {
          select: { id: true, name: true, slug: true },
        },
        blocks: {
          orderBy: { order: "asc" },
          select: { id: true, type: true, content: true, order: true },
        },
        _count: {
          select: { comments: true },
        },
      },
    });

    if (!document) return errorResponse("Document not found", 404);

    return successResponse(document);
  } catch (error) {
    console.error("[DOCUMENT_PUBLISH_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}
