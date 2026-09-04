import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  getOrgMembership,
} from "@/lib/utils";
import { templateSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const template = await prismadb.template.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        org: {
          select: { id: true, name: true },
        },
      },
    });

    if (!template) return errorResponse("Template not found", 404);

    if (!template.isPublic) {
      const membership = await getOrgMembership(user.id, template.orgId);
      if (!membership) return errorResponse("Access denied", 403);
    }

    return successResponse(template);
  } catch (error) {
    console.error("[TEMPLATE_GET]", error);
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

    const template = await prismadb.template.findUnique({
      where: { id: params.id },
    });

    if (!template) return errorResponse("Template not found", 404);

    if (template.authorId !== user.id) {
      const membership = await getOrgMembership(user.id, template.orgId);
      if (!membership || membership.role === "VIEWER") {
        return errorResponse("Insufficient permissions", 403);
      }
    }

    const body = await req.json();
    const result = templateSchema.partial().safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const updateData: Record<string, unknown> = { ...result.data };
    if (result.data.content !== undefined) {
      updateData.content = result.data.content as object;
    }

    const updated = await prismadb.template.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error("[TEMPLATE_PATCH]", error);
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

    const template = await prismadb.template.findUnique({
      where: { id: params.id },
    });

    if (!template) return errorResponse("Template not found", 404);

    if (template.authorId !== user.id) {
      const membership = await getOrgMembership(user.id, template.orgId);
      if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
        return errorResponse("Insufficient permissions", 403);
      }
    }

    await prismadb.template.delete({ where: { id: params.id } });

    return successResponse({ message: "Template deleted" });
  } catch (error) {
    console.error("[TEMPLATE_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
