import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  paginateQuery,
  buildPaginationMeta,
  getOrgMembership,
} from "@/lib/utils";
import { templateSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const includePublic = searchParams.get("includePublic") !== "false";
    const { skip, take } = paginateQuery(page, limit);

    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership) return errorResponse("Access denied", 403);

    const where: Record<string, unknown> = {
      OR: [{ orgId }, ...(includePublic ? [{ isPublic: true }] : [])],
    };

    if (category) where.category = category;
    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      ];
    }

    const [templates, total] = await Promise.all([
      prismadb.template.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
          org: {
            select: { id: true, name: true },
          },
        },
        orderBy: { useCount: "desc" },
        skip,
        take,
      }),
      prismadb.template.count({ where }),
    ]);

    return successResponse({
      templates,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("[TEMPLATES_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = templateSchema.safeParse(body);

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

    const template = await prismadb.template.create({
      data: {
        ...result.data,
        content: (result.data.content ?? {}) as object,
        authorId: user.id,
        orgId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return successResponse(template, 201);
  } catch (error) {
    console.error("[TEMPLATES_POST]", error);
    return errorResponse("Internal server error", 500);
  }
}
