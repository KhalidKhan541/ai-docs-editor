import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  paginateQuery,
  buildPaginationMeta,
} from "@/lib/utils";
import { createOrgSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");

    const { skip, take } = paginateQuery(page, limit);

    const [orgs, total] = await Promise.all([
      prismadb.organization.findMany({
        where: {
          members: { some: { userId: user.id } },
        },
        include: {
          _count: {
            select: { members: true, documents: true },
          },
          members: {
            where: { userId: user.id },
            select: { role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prismadb.organization.count({
        where: {
          members: { some: { userId: user.id } },
        },
      }),
    ]);

    const enriched = orgs.map((org) => ({
      ...org,
      myRole: org.members[0]?.role ?? "MEMBER",
      members: undefined,
    }));

    return successResponse({
      organizations: enriched,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("[ORGS_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = createOrgSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { name, slug } = result.data;

    const existingSlug = await prismadb.organization.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      return errorResponse("An organization with this slug already exists", 409);
    }

    const org = await prismadb.organization.create({
      data: {
        name,
        slug,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        _count: { select: { members: true, documents: true } },
      },
    });

    return successResponse(org, 201);
  } catch (error) {
    console.error("[ORGS_POST]", error);
    return errorResponse("Internal server error", 500);
  }
}
