import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  getOrgMembership,
} from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership) return errorResponse("Access denied", 403);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalDocuments,
      totalPublished,
      totalTemplates,
      totalMembers,
      totalComments,
      totalSuggestions,
      documentsLast30Days,
      documentsLast7Days,
      recentActivity,
      topAuthors,
    ] = await Promise.all([
      prismadb.document.count({
        where: { orgId, isArchived: false },
      }),
      prismadb.document.count({
        where: { orgId, isPublished: true },
      }),
      prismadb.template.count({ where: { orgId } }),
      prismadb.membership.count({ where: { orgId } }),
      prismadb.comment.count({
        where: { document: { orgId } },
      }),
      prismadb.suggestion.count({
        where: { document: { orgId } },
      }),
      prismadb.document.count({
        where: {
          orgId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prismadb.document.count({
        where: {
          orgId,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prismadb.activity.findMany({
        where: {
          document: { orgId },
          createdAt: { gte: sevenDaysAgo },
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          document: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prismadb.activity.groupBy({
        by: ["userId"],
        where: {
          document: { orgId },
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
    ]);

    const topAuthorIds = topAuthors.map((a) => a.userId);
    const topAuthorUsers = await prismadb.user.findMany({
      where: { id: { in: topAuthorIds } },
      select: { id: true, name: true, avatar: true },
    });

    const enrichedTopAuthors = topAuthors.map((a) => ({
      ...topAuthorUsers.find((u) => u.id === a.userId),
      activityCount: a._count.id,
    }));

    const unresolvedComments = await prismadb.comment.count({
      where: {
        document: { orgId },
        isResolved: false,
      },
    });

    const pendingSuggestions = await prismadb.suggestion.count({
      where: {
        document: { orgId },
        status: "PENDING",
      },
    });

    return successResponse({
      overview: {
        totalDocuments,
        totalPublished,
        totalTemplates,
        totalMembers,
        totalComments,
        totalSuggestions,
        unresolvedComments,
        pendingSuggestions,
      },
      trends: {
        documentsLast30Days,
        documentsLast7Days,
      },
      recentActivity,
      topAuthors: enrichedTopAuthors,
    });
  } catch (error) {
    console.error("[DASHBOARD_STATS]", error);
    return errorResponse("Internal server error", 500);
  }
}
