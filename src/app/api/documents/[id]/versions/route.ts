import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
  paginateQuery,
  buildPaginationMeta,
} from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Document not found", 404);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const { skip, take } = paginateQuery(page, limit);

    const [versions, total] = await Promise.all([
      prismadb.documentVersion.findMany({
        where: { documentId: params.id },
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { version: "desc" },
        skip,
        take,
      }),
      prismadb.documentVersion.count({
        where: { documentId: params.id },
      }),
    ]);

    return successResponse({
      versions,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("[VERSIONS_GET]", error);
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

    const access = await verifyDocAccess(user.id, params.id, "EDIT");
    if (!access) return errorResponse("Access denied", 403);

    const body = await req.json();
    const { title, content } = body;

    if (!title || !content) {
      return errorResponse("title and content are required", 400);
    }

    const lastVersion = await prismadb.documentVersion.findFirst({
      where: { documentId: params.id },
      orderBy: { version: "desc" },
    });

    const nextVersion = (lastVersion?.version ?? 0) + 1;

    const version = await prismadb.documentVersion.create({
      data: {
        version: nextVersion,
        title,
        content: content as object,
        authorId: user.id,
        documentId: params.id,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return successResponse(version, 201);
  } catch (error) {
    console.error("[VERSIONS_POST]", error);
    return errorResponse("Internal server error", 500);
  }
}
