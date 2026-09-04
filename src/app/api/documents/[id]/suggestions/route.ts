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
import { createSuggestionSchema } from "@/lib/validators";

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
    const limit = parseInt(searchParams.get("limit") ?? "50");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const { skip, take } = paginateQuery(page, limit);

    const where: Record<string, unknown> = { documentId: params.id };
    if (status) where.status = status;
    if (type) where.type = type;

    const [suggestions, total] = await Promise.all([
      prismadb.suggestion.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prismadb.suggestion.count({ where }),
    ]);

    return successResponse({
      suggestions,
      pagination: buildPaginationMeta(total, page, limit),
    });
  } catch (error) {
    console.error("[SUGGESTIONS_GET]", error);
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
    const result = createSuggestionSchema.safeParse(body);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      return errorResponse(
        Object.values(errors)
          .flat()
          .join(", "),
        400
      );
    }

    const suggestion = await prismadb.suggestion.create({
      data: {
        ...result.data,
        authorId: user.id,
        documentId: params.id,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return successResponse(suggestion, 201);
  } catch (error) {
    console.error("[SUGGESTIONS_POST]", error);
    return errorResponse("Internal server error", 500);
  }
}
