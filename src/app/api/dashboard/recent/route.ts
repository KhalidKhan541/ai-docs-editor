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

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const { skip, take } = paginateQuery(page, limit);

    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership) return errorResponse("Access denied", 403);

    const [documents, total] = await Promise.all([
      prismadb.document.findMany({
        where: { orgId, isArchived: false },
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
          folder: { select: { id: true, name: true } },
          tags: { select: { name: true } },
          _count: {
            select: {
              comments: true,
              suggestions: true,
              versions: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      prismadb.document.count({
        where: { orgId, isArchived: false },
      }),
    ]);

    const enriched = documents.map((doc) => {
      const recentActivity = prismadb.activity.findFirst({
        where: {
          documentId: doc.id,
        },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        ...doc,
        lastActivity: recentActivity,
      };
    });

    const enrichedDocs = await Promise.all(enriched);

    return successResponse({
      documents: enrichedDocs,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("[DASHBOARD_RECENT]", error);
    return errorResponse("Internal server error", 500);
  }
}
