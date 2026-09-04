import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
} from "@/lib/utils";
import { permissionSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Document not found", 404);

    const permissions = await prismadb.permission.findMany({
      where: { documentId: params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse({ permissions });
  } catch (error) {
    console.error("[PERMISSIONS_GET]", error);
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

    const access = await verifyDocAccess(user.id, params.id, "ADMIN");
    if (!access) return errorResponse("Access denied", 403);

    const body = await req.json();
    const result = permissionSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { userId, level } = result.data;

    const targetUser = await prismadb.user.findUnique({
      where: { id: userId },
    });
    if (!targetUser) return errorResponse("User not found", 404);

    const existing = await prismadb.permission.findUnique({
      where: { userId_documentId: { userId, documentId: params.id } },
    });

    if (existing) {
      const updated = await prismadb.permission.update({
        where: { userId_documentId: { userId, documentId: params.id } },
        data: { level },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
      });
      return successResponse(updated);
    }

    const permission = await prismadb.permission.create({
      data: {
        userId,
        documentId: params.id,
        level,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return successResponse(permission, 201);
  } catch (error) {
    console.error("[PERMISSIONS_POST]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "ADMIN");
    if (!access) return errorResponse("Access denied", 403);

    const { searchParams } = new URL(req.url);
    const permissionId = searchParams.get("permissionId");
    const userId = searchParams.get("userId");

    if (permissionId) {
      await prismadb.permission.delete({ where: { id: permissionId } });
    } else if (userId) {
      await prismadb.permission.delete({
        where: { userId_documentId: { userId, documentId: params.id } },
      });
    } else {
      return errorResponse("permissionId or userId required", 400);
    }

    return successResponse({ message: "Permission removed" });
  } catch (error) {
    console.error("[PERMISSIONS_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
