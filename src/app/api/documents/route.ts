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
import { createDocumentSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const folderId = searchParams.get("folderId");
    const isPublished = searchParams.get("isPublished");
    const isArchived = searchParams.get("isArchived");
    const isTemplate = searchParams.get("isTemplate");
    const sortBy = searchParams.get("sortBy") ?? "updatedAt";
    const sortOrder = searchParams.get("sortOrder") ?? "desc";
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");

    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership) return errorResponse("Access denied", 403);

    const { skip, take } = paginateQuery(page, limit);

    const where: Record<string, unknown> = { orgId };

    if (folderId) where.folderId = folderId;
    if (isPublished !== null) where.isPublished = isPublished === "true";
    if (isArchived !== null) where.isArchived = isArchived === "true";
    if (isTemplate !== null) where.isTemplate = isTemplate === "true";
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }
    if (tag) {
      where.tags = { some: { name: tag } };
    }

    const order = { [sortBy]: sortOrder };

    const [documents, total] = await Promise.all([
      prismadb.document.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
          folder: { select: { id: true, name: true } },
          tags: { select: { name: true } },
          _count: {
            select: { comments: true, suggestions: true, versions: true },
          },
        },
        orderBy: order,
        skip,
        take,
      }),
      prismadb.document.count({ where }),
    ]);

    return successResponse({
      documents,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("[DOCUMENTS_GET]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const result = createDocumentSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const { title, content, folderId, emoji, coverImage, isTemplate } = result.data;

    const orgId = body.orgId;
    if (!orgId) return errorResponse("orgId is required", 400);

    const membership = await getOrgMembership(user.id, orgId);
    if (!membership) return errorResponse("Access denied", 403);

    if (folderId) {
      const folder = await prismadb.folder.findUnique({
        where: { id: folderId },
      });
      if (!folder || folder.orgId !== orgId) {
        return errorResponse("Invalid folder", 400);
      }
    }

    const docContent = content ?? {};
    const wordCount = JSON.stringify(docContent)
      .replace(/<[^>]*>/g, "")
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    const charCount = JSON.stringify(docContent).replace(/<[^>]*>/g, "").length;

    const document = await prismadb.document.create({
      data: {
        title: title ?? "Untitled",
        content: docContent as object,
        folderId: folderId ?? null,
        emoji: emoji ?? null,
        coverImage: coverImage ?? null,
        isTemplate: isTemplate ?? false,
        wordCount,
        charCount,
        authorId: user.id,
        orgId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { comments: true, suggestions: true, versions: true },
        },
      },
    });

    await prismadb.documentVersion.create({
      data: {
        version: 1,
        title: document.title,
        content: document.content as object,
        authorId: user.id,
        documentId: document.id,
      },
    });

    return successResponse(document, 201);
  } catch (error) {
    console.error("[DOCUMENTS_POST]", error);
    return errorResponse("Internal server error", 500);
  }
}
