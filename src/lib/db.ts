import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Soft Delete Helpers ─────────────────────────────────────────────────────

export async function softDeleteDocument(documentId: string) {
  return prisma.document.update({
    where: { id: documentId },
    data: {
      status: "TRASHED",
      deletedAt: new Date(),
    },
  });
}

export async function restoreDocument(documentId: string) {
  return prisma.document.update({
    where: { id: documentId },
    data: {
      status: "ACTIVE",
      deletedAt: null,
    },
  });
}

export async function permanentDeleteDocument(documentId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.block.deleteMany({ where: { documentId } });
    await tx.comment.deleteMany({ where: { documentId } });
    await tx.suggestion.deleteMany({ where: { documentId } });
    await tx.documentVersion.deleteMany({ where: { documentId } });
    await tx.documentPermission.deleteMany({ where: { documentId } });
    await tx.documentTag.deleteMany({ where: { documentId } });
    await tx.publish.deleteMany({ where: { documentId } });
    await tx.collaborationSession.deleteMany({ where: { documentId } });
    await tx.collaboratorPresence.deleteMany({ where: { documentId } });
    await tx.notification.deleteMany({ where: { documentId } });
    await tx.attachment.deleteMany({ where: { documentId } });
    await tx.documentBookmark.deleteMany({ where: { documentId } });
    await tx.recentDocument.deleteMany({ where: { documentId } });
    await tx.document.delete({ where: { id: documentId } });
  });
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface CursorPaginatedResult<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    nextCursor: string | null;
    hasMore: boolean;
    count: number;
  };
}

export async function paginate<T>(
  model: { findMany: (args: any) => Promise<T[]>; count: (args: any) => Promise<number> },
  options: PaginationOptions & { where?: any; include?: any; orderBy?: any; select?: any },
): Promise<PaginatedResult<T>> {
  const page = options.page ?? 1;
  const limit = Math.min(options.limit ?? 20, 100);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    model.findMany({
      where: options.where,
      include: options.include,
      select: options.select,
      orderBy: options.orderBy ?? { createdAt: "desc" },
      skip,
      take: limit,
    }),
    model.count({ where: options.where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export async function cursorPaginate<T extends { id: string }>(
  model: { findMany: (args: any) => Promise<T[]> },
  options: PaginationOptions & { where?: any; include?: any; orderBy?: any; select?: any },
): Promise<CursorPaginatedResult<T>> {
  const limit = Math.min(options.limit ?? 20, 100);
  const cursor = options.cursor;

  const args: any = {
    where: options.where,
    include: options.include,
    select: options.select,
    orderBy: options.orderBy ?? { createdAt: "desc" },
    take: limit + 1,
  };

  if (cursor) {
    args.cursor = { id: cursor };
    args.skip = 1;
  }

  const data = await model.findMany(args);
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  return {
    data: items,
    pagination: {
      cursor: cursor ?? null,
      nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
      hasMore,
      count: items.length,
    },
  };
}

// ─── Common Queries ──────────────────────────────────────────────────────────

export async function getDocumentsForUser(
  userId: string,
  options: PaginationOptions & { organizationId?: string; status?: string } = {},
) {
  const where: Prisma.DocumentWhereInput = {
    OR: [
      { ownerId: userId },
      { permissions: { some: { userId } } },
    ],
    deletedAt: null,
  };

  if (options.organizationId) {
    where.organizationId = options.organizationId;
  }

  if (options.status) {
    where.status = options.status as any;
  }

  return paginate(prisma.document, {
    where,
    include: {
      owner: { select: { id: true, name: true, image: true } },
      tags: { include: { tag: true } },
      _count: { select: { comments: true, blocks: true, versions: true } },
    },
    page: options.page,
    limit: options.limit,
  });
}

export async function getDocumentWithPermissions(documentId: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, image: true, email: true } },
      creator: { select: { id: true, name: true, image: true } },
      permissions: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      },
      tags: { include: { tag: true } },
      organization: { select: { id: true, name: true, slug: true } },
      _count: {
        select: {
          blocks: true,
          comments: true,
          versions: true,
          suggestions: true,
        },
      },
    },
  });

  if (!document) return null;

  const userPermission = document.permissions.find((p) => p.userId === userId);
  const isOwner = document.ownerId === userId;

  return {
    ...document,
    userPermission: isOwner ? "OWNER" : userPermission?.level ?? null,
    isOwner,
  };
}

export async function searchDocuments(
  userId: string,
  query: string,
  options: PaginationOptions = {},
) {
  const searchTerm = query.trim();

  return paginate(prisma.document, {
    where: {
      AND: [
        {
          OR: [
            { ownerId: userId },
            { permissions: { some: { userId } } },
          ],
        },
        { deletedAt: null },
        {
          OR: [
            { title: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
            { blocks: { some: { content: { path: "$.text", string_contains: searchTerm } } } },
          ],
        },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      tags: { include: { tag: true } },
    },
    page: options.page,
    limit: options.limit,
  });
}

// ─── Block Operations ────────────────────────────────────────────────────────

export async function getDocumentBlocks(documentId: string) {
  return prisma.block.findMany({
    where: { documentId },
    orderBy: { order: "asc" },
  });
}

export async function createBlock(
  documentId: string,
  data: {
    type: string;
    content: any;
    properties?: any;
    parentId?: string;
    order: number;
    depth?: number;
  },
) {
  return prisma.$transaction(async (tx) => {
    const block = await tx.block.create({
      data: {
        documentId,
        type: data.type as any,
        content: data.content,
        properties: data.properties,
        parentId: data.parentId,
        order: data.order,
        depth: data.depth ?? 0,
      },
    });

    await tx.document.update({
      where: { id: documentId },
      data: { lastEditedAt: new Date() },
    });

    return block;
  });
}

export async function updateBlock(blockId: string, data: { content?: any; properties?: any }) {
  const block = await prisma.block.update({
    where: { id: blockId },
    data,
  });

  await prisma.document.update({
    where: { id: block.documentId },
    data: { lastEditedAt: new Date() },
  });

  return block;
}

export async function deleteBlock(blockId: string) {
  const block = await prisma.block.delete({ where: { id: blockId } });

  await prisma.document.update({
    where: { id: block.documentId },
    data: { lastEditedAt: new Date() },
  });

  return block;
}

export async function reorderBlocks(documentId: string, blockOrders: { id: string; order: number }[]) {
  return prisma.$transaction(async (tx) => {
    await Promise.all(
      blockOrders.map((item) =>
        tx.block.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    await tx.document.update({
      where: { id: documentId },
      data: { lastEditedAt: new Date() },
    });
  });
}

// ─── Version Operations ──────────────────────────────────────────────────────

export async function createDocumentVersion(
  documentId: string,
  title: string,
  content: any,
  changeSummary?: string,
) {
  const lastVersion = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { version: "desc" },
  });

  const nextVersion = (lastVersion?.version ?? 0) + 1;

  return prisma.documentVersion.create({
    data: {
      documentId,
      version: nextVersion,
      title,
      content,
      changeSummary,
    },
  });
}

export async function getDocumentVersions(documentId: string, limit = 20) {
  return prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { version: "desc" },
    take: limit,
  });
}

export async function restoreDocumentVersion(documentId: string, versionId: string) {
  return prisma.$transaction(async (tx) => {
    const version = await tx.documentVersion.findUnique({
      where: { id: versionId },
    });

    if (!version) throw new Error("Version not found");

    await tx.document.update({
      where: { id: documentId },
      data: {
        title: version.title,
        content: version.content,
        lastEditedAt: new Date(),
      },
    });

    return createDocumentVersion(
      documentId,
      version.title,
      version.content,
      `Restored from version ${version.version}`,
    );
  });
}

// ─── Permission Checks ───────────────────────────────────────────────────────

export async function getUserDocumentPermission(userId: string, documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!document) return null;
  if (document.ownerId === userId) return "OWNER";

  const permission = await prisma.documentPermission.findUnique({
    where: {
      userId_documentId: { userId, documentId },
    },
  });

  return permission?.level ?? null;
}

export async function checkDocumentAccess(
  userId: string,
  documentId: string,
  requiredLevel: string[] = ["OWNER", "EDITOR", "COMMENTER", "VIEWER"],
) {
  const level = await getUserDocumentPermission(userId, documentId);
  if (!level) return false;

  const hierarchy: Record<string, number> = {
    OWNER: 4,
    EDITOR: 3,
    COMMENTER: 2,
    VIEWER: 1,
  };

  const required = Math.max(...requiredLevel.map((l) => hierarchy[l] ?? 0));
  const user = hierarchy[level] ?? 0;

  return user >= required;
}

// ─── Statistics ──────────────────────────────────────────────────────────────

export async function getDocumentStats(documentId: string) {
  const [blockCount, commentCount, versionCount, suggestionCount, collaboratorCount] =
    await Promise.all([
      prisma.block.count({ where: { documentId } }),
      prisma.comment.count({ where: { documentId } }),
      prisma.documentVersion.count({ where: { documentId } }),
      prisma.suggestion.count({ where: { documentId, status: "PENDING" } }),
      prisma.collaboratorPresence.count({
        where: { documentId, isActive: true },
      }),
    ]);

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { wordCount: true, readTimeMinutes: true },
  });

  return {
    blocks: blockCount,
    comments: commentCount,
    versions: versionCount,
    pendingSuggestions: suggestionCount,
    activeCollaborators: collaboratorCount,
    wordCount: document?.wordCount ?? 0,
    readTimeMinutes: document?.readTimeMinutes ?? 0,
  };
}

export async function getUserDashboardStats(userId: string) {
  const [
    totalDocuments,
    ownedDocuments,
    sharedDocuments,
    starredDocuments,
    recentDocuments,
    unreadNotifications,
  ] = await Promise.all([
    prisma.document.count({
      where: {
        OR: [{ ownerId: userId }, { permissions: { some: { userId } } }],
        deletedAt: null,
      },
    }),
    prisma.document.count({ where: { ownerId: userId, deletedAt: null } }),
    prisma.document.count({
      where: {
        permissions: { some: { userId } },
        deletedAt: null,
      },
    }),
    prisma.document.count({ where: { ownerId: userId, isStarred: true, deletedAt: null } }),
    prisma.recentDocument.findMany({
      where: { userId },
      include: {
        document: {
          select: {
            id: true,
            title: true,
            icon: true,
            updatedAt: true,
            owner: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { accessedAt: "desc" },
      take: 10,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    totalDocuments,
    ownedDocuments,
    sharedDocuments,
    starredDocuments,
    recentDocuments,
    unreadNotifications,
  };
}

export default prisma;
