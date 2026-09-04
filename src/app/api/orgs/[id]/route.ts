import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyOrgAccess,
} from "@/lib/utils";
import { updateOrgSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const membership = await verifyOrgAccess(user.id, params.id);
    if (!membership) return errorResponse("Organization not found", 404);

    const org = await prismadb.organization.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { members: true, documents: true, templates: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return successResponse(org);
  } catch (error) {
    console.error("[ORG_GET]", error);
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

    const membership = await verifyOrgAccess(user.id, params.id);
    if (!membership) return errorResponse("Organization not found", 404);

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return errorResponse("Insufficient permissions", 403);
    }

    const body = await req.json();
    const result = updateOrgSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const org = await prismadb.organization.update({
      where: { id: params.id },
      data: result.data,
    });

    return successResponse(org);
  } catch (error) {
    console.error("[ORG_PATCH]", error);
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

    const membership = await verifyOrgAccess(user.id, params.id);
    if (!membership) return errorResponse("Organization not found", 404);

    if (membership.role !== "OWNER") {
      return errorResponse("Only the owner can delete this organization", 403);
    }

    await prismadb.organization.delete({ where: { id: params.id } });

    return successResponse({ message: "Organization deleted" });
  } catch (error) {
    console.error("[ORG_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
