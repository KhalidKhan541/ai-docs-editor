import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyOrgAccess,
} from "@/lib/utils";
import { memberRoleSchema, permissionSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const membership = await verifyOrgAccess(user.id, params.id);
    if (!membership) return errorResponse("Organization not found", 404);

    const members = await prismadb.membership.findMany({
      where: { orgId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse({ members });
  } catch (error) {
    console.error("[MEMBERS_GET]", error);
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

    const membership = await verifyOrgAccess(user.id, params.id);
    if (!membership) return errorResponse("Organization not found", 404);

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return errorResponse("Insufficient permissions", 403);
    }

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

    const existingMembership = await prismadb.membership.findUnique({
      where: { userId_orgId: { userId, orgId: params.id } },
    });

    if (existingMembership) {
      return errorResponse("User is already a member of this organization", 409);
    }

    const roleMap: Record<string, string> = {
      ADMIN: "ADMIN",
      EDIT: "MEMBER",
      COMMENT: "MEMBER",
      VIEW: "VIEWER",
    };

    const newMember = await prismadb.membership.create({
      data: {
        userId,
        orgId: params.id,
        role: (roleMap[level] ?? "MEMBER") as "OWNER" | "ADMIN" | "MEMBER" | "VIEWER",
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return successResponse(newMember, 201);
  } catch (error) {
    console.error("[MEMBERS_POST]", error);
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
    const result = memberRoleSchema.merge(permissionSchema.pick({ userId: true })).safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { userId, role } = result.data;

    if (userId === params.id) {
      return errorResponse("Cannot change your own role", 400);
    }

    const targetMembership = await prismadb.membership.findUnique({
      where: { userId_orgId: { userId, orgId: params.id } },
    });

    if (!targetMembership) {
      return errorResponse("Member not found in this organization", 404);
    }

    if (targetMembership.role === "OWNER") {
      return errorResponse("Cannot change the owner's role", 403);
    }

    const updated = await prismadb.membership.update({
      where: { userId_orgId: { userId, orgId: params.id } },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error("[MEMBERS_PATCH]", error);
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

    const membership = await verifyOrgAccess(user.id, params.id);
    if (!membership) return errorResponse("Organization not found", 404);

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return errorResponse("Insufficient permissions", 403);
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) return errorResponse("userId is required", 400);

    if (userId === user.id) {
      return errorResponse("Cannot remove yourself from the organization", 400);
    }

    const targetMembership = await prismadb.membership.findUnique({
      where: { userId_orgId: { userId, orgId: params.id } },
    });

    if (!targetMembership) {
      return errorResponse("Member not found", 404);
    }

    if (targetMembership.role === "OWNER") {
      return errorResponse("Cannot remove the owner", 403);
    }

    await prismadb.membership.delete({
      where: { userId_orgId: { userId, orgId: params.id } },
    });

    return successResponse({ message: "Member removed" });
  } catch (error) {
    console.error("[MEMBERS_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
