import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  getOrgMembership,
  paginateQuery,
  buildPaginationMeta,
} from "@/lib/utils";
import { folderSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    const parentId = searchParams.get("parentId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const { skip, take } = paginateQuery(page, limit);

    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership) return errorResponse("Access denied", 403);

    const where: Record<string, unknown> = { orgId };
    if (parentId !== undefined) {
      where.parentId = parentId === "null" ? null : parentId;
    }

    const [folders, total] = await Promise.all([
      prismadb.folder.findMany({
        where,
        include: {
          _count: {
            select: { documents: true, children: true },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take,
      }),
      prismadb.folder.count({ where }),
    ]);

    return successResponse({
      folders,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("[FOLDERS_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = folderSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const orgId = body.orgId;
    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership) return errorResponse("Access denied", 403);

    if (membership.role === "VIEWER") {
      return errorResponse("Insufficient permissions", 403);
    }

    if (result.data.parentId) {
      const parentFolder = await prismadb.folder.findUnique({
        where: { id: result.data.parentId },
      });
      if (!parentFolder || parentFolder.orgId !== orgId) {
        return errorResponse("Invalid parent folder", 400);
      }
    }

    const folder = await prismadb.folder.create({
      data: {
        ...result.data,
        parentId: result.data.parentId ?? null,
        orgId,
      },
      include: {
        _count: {
          select: { documents: true, children: true },
        },
      },
    });

    return successResponse(folder, 201);
  } catch (error) {
    console.error("[FOLDERS_POST]", error);
    return errorResponse("Internal server error", 500);
  }
}
