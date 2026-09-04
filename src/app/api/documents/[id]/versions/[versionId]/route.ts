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
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Document not found", 404);

    const version = await prismadb.documentVersion.findUnique({
      where: { id: params.versionId },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    if (!version || version.documentId !== params.id) {
      return errorResponse("Version not found", 404);
    }

    return successResponse(version);
  } catch (error) {
    console.error("[VERSION_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "ADMIN");
    if (!access) return errorResponse("Access denied", 403);

    const version = await prismadb.documentVersion.findUnique({
      where: { id: params.versionId },
    });

    if (!version || version.documentId !== params.id) {
      return errorResponse("Version not found", 404);
    }

    await prismadb.document.update({
      where: { id: params.id },
      data: {
        title: version.title,
        content: version.content as object,
      },
    });

    return successResponse({ message: "Document restored to this version" });
  } catch (error) {
    console.error("[VERSION_RESTORE]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "ADMIN");
    if (!access) return errorResponse("Access denied", 403);

    const version = await prismadb.documentVersion.findUnique({
      where: { id: params.versionId },
    });

    if (!version || version.documentId !== params.id) {
      return errorResponse("Version not found", 404);
    }

    const latestVersion = await prismadb.documentVersion.findFirst({
      where: { documentId: params.id },
      orderBy: { version: "desc" },
    });

    if (latestVersion?.id === params.versionId) {
      return errorResponse("Cannot delete the latest version", 400);
    }

    await prismadb.documentVersion.delete({
      where: { id: params.versionId },
    });

    return successResponse({ message: "Version deleted" });
  } catch (error) {
    console.error("[VERSION_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
