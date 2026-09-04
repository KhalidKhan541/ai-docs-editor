import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
  calculateWordCount,
  calculateCharCount,
  trackActivity,
} from "@/lib/utils";
import { updateDocumentSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Document not found", 404);

    const document = await prismadb.document.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        org: {
          select: { id: true, name: true, slug: true },
        },
        folder: {
          select: { id: true, name: true },
        },
        tags: { select: { name: true } },
        permissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: {
          select: {
            comments: true,
            suggestions: true,
            versions: true,
          },
        },
      },
    });

    return successResponse({
      ...document,
      accessLevel: access.accessLevel,
    });
  } catch (error) {
    console.error("[DOCUMENT_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "EDIT");
    if (!access) return errorResponse("Access denied", 403);

    const body = await req.json();
    const result = updateDocumentSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const data = result.data;

    const updateData: Record<string, unknown> = { ...data };

    if (data.content !== undefined) {
      updateData.wordCount = calculateWordCount(data.content);
      updateData.charCount = calculateCharCount(data.content);
    }

    const document = await prismadb.document.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        tags: { select: { name: true } },
        _count: {
          select: { comments: true, suggestions: true, versions: true },
        },
      },
    });

    trackActivity(user.id, params.id, "UPDATE", {
      fields: Object.keys(data),
    });

    return successResponse(document);
  } catch (error) {
    console.error("[DOCUMENT_PATCH]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "ADMIN");
    if (!access) return errorResponse("Access denied", 403);

    await prismadb.document.delete({ where: { id: params.id } });

    return successResponse({ message: "Document deleted" });
  } catch (error) {
    console.error("[DOCUMENT_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
