import { NextRequest } from "next/server";
import prismadb from "@/lib/prisma";
import {
  successResponse,
  errorResponse,
  getCurrentUser,
  verifyDocAccess,
} from "@/lib/utils";
import { blockSchema } from "@/lib/validators";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id);
    if (!access) return errorResponse("Document not found", 404);

    const blocks = await prismadb.block.findMany({
      where: { documentId: params.id },
      orderBy: { order: "asc" },
    });

    return successResponse({ blocks });
  } catch (error) {
    console.error("[BLOCKS_GET]", error);
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
    const blocksInput = Array.isArray(body.blocks) ? body.blocks : [body];

    const parsedBlocks = blocksInput.map((b: Record<string, unknown>) => {
      const result = blockSchema.safeParse(b);
      if (!result.success) {
        throw new Error(
          result.error.errors.map((e) => e.message).join(", ")
        );
      }
      return result.data;
    });

    const maxOrder = await prismadb.block.aggregate({
      where: { documentId: params.id },
      _max: { order: true },
    });

    let currentOrder = (maxOrder._max.order ?? -1) + 1;

    const createdBlocks = await prismadb.$transaction(
      parsedBlocks.map((block) =>
        prismadb.block.create({
          data: {
            type: block.type,
            content: (block.content ?? {}) as object,
            order: block.order ?? currentOrder++,
            documentId: params.id,
          },
        })
      )
    );

    return successResponse({ blocks: createdBlocks }, 201);
  } catch (error) {
    console.error("[BLOCKS_POST]", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error",
      500
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "EDIT");
    if (!access) return errorResponse("Access denied", 403);

    const body = await req.json();
    const { blocks } = body as { blocks: Array<{ id: string; type?: string; content?: unknown; order?: number }> };

    if (!Array.isArray(blocks)) {
      return errorResponse("blocks array is required", 400);
    }

    const updatedBlocks = await prismadb.$transaction(
      blocks.map((block) =>
        prismadb.block.update({
          where: { id: block.id },
          data: {
            ...(block.type && { type: block.type }),
            ...(block.content !== undefined && { content: block.content as object }),
            ...(block.order !== undefined && { order: block.order }),
          },
        })
      )
    );

    return successResponse({ blocks: updatedBlocks });
  } catch (error) {
    console.error("[BLOCKS_PATCH]", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return errorResponse("Unauthorized", 401);

    const access = await verifyDocAccess(user.id, params.id, "EDIT");
    if (!access) return errorResponse("Access denied", 403);

    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get("blockId");

    if (blockId) {
      await prismadb.block.delete({ where: { id: blockId } });
    } else {
      const body = await req.json();
      const { blockIds } = body as { blockIds?: string[] };

      if (!Array.isArray(blockIds)) {
        return errorResponse("blockId query param or blockIds array required", 400);
      }

      await prismadb.block.deleteMany({
        where: { id: { in: blockIds }, documentId: params.id },
      });
    }

    return successResponse({ message: "Block(s) deleted" });
  } catch (error) {
    console.error("[BLOCKS_DELETE]", error);
    return errorResponse("Internal server error", 500);
  }
}
