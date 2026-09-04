import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
  calculateWordCount,
  calculateCharCount,
} from "@/lib/utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Document not found", 404);

    const original = await prismadb.document.findUnique({
      where: { id: params.id },
      include: {
        blocks: true,
        tags: true,
      },
    });

    if (!original) return errorResponse("Document not found", 404);

    const content = original.content as Record<string, unknown>;
    const wordCount = calculateWordCount(content);
    const charCount = calculateCharCount(content);

    const duplicated = await prismadb.document.create({
      data: {
        title: `${original.title} (Copy)`,
        content: original.content as object,
        excerpt: original.excerpt,
        emoji: original.emoji,
        coverImage: original.coverImage,
        wordCount,
        charCount,
        authorId: user.id,
        orgId: original.orgId,
        folderId: original.folderId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { comments: true, suggestions: true, versions: true },
        },
      },
    });

    if (original.blocks.length > 0) {
      await prismadb.$transaction(
        original.blocks.map((block, index) =>
          prismadb.block.create({
            data: {
              type: block.type,
              content: block.content as object,
              order: block.order,
              documentId: duplicated.id,
            },
          })
        )
      );
    }

    if (original.tags.length > 0) {
      await prismadb.documentTag.createMany({
        data: original.tags.map((tag) => ({
          name: tag.name,
          documentId: duplicated.id,
        })),
      });
    }

    await prismadb.version.create({
      data: {
        version: 1,
        title: duplicated.title,
        content: duplicated.content as object,
        authorId: user.id,
        documentId: duplicated.id,
      },
    });

    return successResponse(duplicated, 201);
  } catch (error) {
    console.error("[DOCUMENT_DUPLICATE]", error);
    return errorResponse("Internal server error", 500);
  }
}
