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
import { searchSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const result = searchSchema.safeParse({
      q: searchParams.get("q"),
      orgId: searchParams.get("orgId"),
      page: searchParams.get("page") ?? "1",
      limit: searchParams.get("limit") ?? "20",
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { q, orgId, page, limit } = result.data;

    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership) return errorResponse("Access denied", 403);

    const { skip, take } = paginateQuery(page, limit);

    const searchTerms = q.split(/\s+/).filter(Boolean);

    const where = {
      orgId,
      isArchived: false,
      OR: [
        {
          title: {
            contains: q,
            mode: "insensitive" as const,
          },
        },
        {
          excerpt: {
            contains: q,
            mode: "insensitive" as const,
          },
        },
        {
          tags: {
            some: {
              name: {
                in: searchTerms,
                mode: "insensitive" as const,
              },
            },
          },
        },
      ],
    };

    const [documents, total] = await Promise.all([
      prismadb.document.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
          tags: { select: { name: true } },
          folder: { select: { id: true, name: true } },
          _count: {
            select: { comments: true, suggestions: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      prismadb.document.count({ where }),
    ]);

    return successResponse({
      documents,
      query: q,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("[SEARCH_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}
