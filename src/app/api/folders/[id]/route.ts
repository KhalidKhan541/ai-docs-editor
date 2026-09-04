import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  getOrgMembership,
} from "@/lib/utils";
import { folderSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const folder = await prismadb.folder.findUnique({
      where: { id: params.id },
      include: {
        parent: { select: { id: true, name: true } },
        children: {
          include: {
            _count: { select: { documents: true, children: true } },
          },
          orderBy: { name: "asc" },
        },
        _count: { select: { documents: true } },
      },
    });

    if (!folder) return errorResponse("Folder not found", 404);

    const membership = await getOrgMembership(user.id, folder.orgId);
    if (!membership) return errorResponse("Access denied", 403);

    return successResponse(folder);
  } catch (error) {
    console.error("[FOLDER_GET]", error);
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

    const folder = await prismadb.folder.findUnique({
      where: { id: params.id },
    });

    if (!folder) return errorResponse("Folder not found", 404);

    const membership = await getOrgMembership(user.id, folder.orgId);
    if (!membership) return errorResponse("Access denied", 403);

    if (membership.role === "VIEWER") {
      return errorResponse("Insufficient permissions", 403);
    }

    const body = await req.json();
    const result = folderSchema.partial().safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const updated = await prismadb.folder.update({
      where: { id: params.id },
      data: result.data,
      include: {
        _count: { select: { documents: true, children: true } },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error("[FOLDER_PATCH]", error);
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

    const folder = await prismadb.folder.findUnique({
      where: { id: params.id },
      include: { _count: { select: { documents: true, children: true } } },
    });

    if (!folder) return errorResponse("Folder not found", 404);

    const membership = await getOrgMembership(user.id, folder.orgId);
    if (!membership) return errorResponse("Access denied", 403);

    if (membership.role === "VIEWER") {
      return errorResponse("Insufficient permissions", 403);
    }

    if (folder._count.documents > 0) {
      return errorResponse(
        "Cannot delete folder with documents. Move or delete them first.",
        400
      );
    }

    if (folder._count.children > 0) {
      return errorResponse(
        "Cannot delete folder with subfolders. Delete them first.",
        400
      );
    }

    await prismadb.folder.delete({ where: { id: params.id } });

    return successResponse({ message: "Folder deleted" });
  } catch (error) {
    console.error("[FOLDER_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
