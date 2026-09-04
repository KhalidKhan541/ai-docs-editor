import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  getOrgMembership,
  calculateWordCount,
  calculateCharCount,
} from "@/lib/utils";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const template = await prismadb.template.findUnique({
      where: { id: params.id },
    });

    if (!template) return errorResponse("Template not found", 404);

    if (!template.isPublic) {
      const membership = await getOrgMembership(user.id, template.orgId);
      if (!membership) return errorResponse("Access denied", 403);
    }

    const body = await req.json();
    const { title, orgId, folderId } = body as {
      title?: string;
      orgId?: string;
      folderId?: string;
    };

    const targetOrgId = orgId ?? template.orgId;
    const membership = await getOrgMembership(user.id, targetOrgId);
    if (!membership) return errorResponse("Access denied", 403);

    if (membership.role === "VIEWER") {
      return errorResponse("Insufficient permissions", 403);
    }

    const templateContent = template.content as Record<string, unknown>;
    const wordCount = calculateWordCount(templateContent);
    const charCount = calculateCharCount(templateContent);

    const document = await prismadb.document.create({
      data: {
        title: title ?? `${template.title} (from template)`,
        content: template.content as object,
        wordCount,
        charCount,
        authorId: user.id,
        orgId: targetOrgId,
        folderId: folderId ?? null,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    await prismadb.template.update({
      where: { id: params.id },
      data: { useCount: { increment: 1 } },
    });

    await prismadb.version.create({
      data: {
        version: 1,
        title: document.title,
        content: document.content as object,
        authorId: user.id,
        documentId: document.id,
      },
    });

    return successResponse(document, 201);
  } catch (error) {
    console.error("[TEMPLATE_USE]", error);
    return errorResponse("Internal server error", 500);
  }
}
