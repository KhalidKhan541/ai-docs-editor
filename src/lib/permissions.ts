import { prisma } from "./db";
import {
  AuthorizationError,
  InsufficientPermissionsError,
  DocumentNotFoundError,
  NotFoundError,
} from "./errors";

// ─── Permission Levels ───────────────────────────────────────────────────────

export type PermissionLevel = "OWNER" | "EDITOR" | "COMMENTER" | "VIEWER";

export const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  OWNER: 4,
  EDITOR: 3,
  COMMENTER: 2,
  VIEWER: 1,
};

export const PERMISSION_LABELS: Record<PermissionLevel, string> = {
  OWNER: "Owner",
  EDITOR: "Can edit",
  COMMENTER: "Can comment",
  VIEWER: "Can view",
};

export const PERMISSION_DESCRIPTIONS: Record<PermissionLevel, string> = {
  OWNER: "Full access including sharing, settings, and deletion",
  EDITOR: "Can edit content, add comments, and suggest changes",
  COMMENTER: "Can view and add comments but cannot edit content",
  VIEWER: "Can only view the document",
};

// ─── Core Permission Functions ───────────────────────────────────────────────

export function hasPermission(userLevel: PermissionLevel, requiredLevel: PermissionLevel): boolean {
  return (PERMISSION_HIERARCHY[userLevel] ?? 0) >= (PERMISSION_HIERARCHY[requiredLevel] ?? 0);
}

export function getHighestPermission(...levels: (PermissionLevel | null)[]): PermissionLevel | null {
  const validLevels = levels.filter((l): l is PermissionLevel => l !== null);
  if (validLevels.length === 0) return null;

  return validLevels.reduce<PermissionLevel>((highest, current) =>
    PERMISSION_HIERARCHY[current] > PERMISSION_HIERARCHY[highest] ? current : highest,
  );
}

export function comparePermissions(a: PermissionLevel, b: PermissionLevel): number {
  return PERMISSION_HIERARCHY[a] - PERMISSION_HIERARCHY[b];
}

// ─── Document Permission Checks ──────────────────────────────────────────────

export async function getDocumentPermission(
  userId: string,
  documentId: string,
): Promise<PermissionLevel | null> {
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
    select: { level: true },
  });

  return (permission?.level as PermissionLevel) ?? null;
}

export async function requireDocumentPermission(
  userId: string,
  documentId: string,
  requiredLevel: PermissionLevel,
): Promise<PermissionLevel> {
  const level = await getDocumentPermission(userId, documentId);

  if (!level) {
    throw new InsufficientPermissionsError(requiredLevel, "NO_ACCESS");
  }

  if (!hasPermission(level, requiredLevel)) {
    throw new InsufficientPermissionsError(requiredLevel, level);
  }

  return level;
}

export async function canEditDocument(userId: string, documentId: string): Promise<boolean> {
  const level = await getDocumentPermission(userId, documentId);
  return level !== null && hasPermission(level, "EDITOR");
}

export async function canCommentOnDocument(userId: string, documentId: string): Promise<boolean> {
  const level = await getDocumentPermission(userId, documentId);
  return level !== null && hasPermission(level, "COMMENTER");
}

export async function canViewDocument(userId: string, documentId: string): Promise<boolean> {
  const level = await getDocumentPermission(userId, documentId);
  return level !== null && hasPermission(level, "VIEWER");
}

export async function canManageDocument(userId: string, documentId: string): Promise<boolean> {
  const level = await getDocumentPermission(userId, documentId);
  return level !== null && hasPermission(level, "OWNER");
}

export async function canShareDocument(userId: string, documentId: string): Promise<boolean> {
  const level = await getDocumentPermission(userId, documentId);
  return level === "OWNER";
}

export async function canDeleteDocument(userId: string, documentId: string): Promise<boolean> {
  const level = await getDocumentPermission(userId, documentId);
  return level === "OWNER";
}

// ─── Permission Management ───────────────────────────────────────────────────

export async function grantDocumentPermission(
  grantorId: string,
  documentId: string,
  granteeId: string,
  level: PermissionLevel,
): Promise<void> {
  if (level === "OWNER") {
    throw new AuthorizationError("Cannot grant owner permission through this method");
  }

  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!document) throw new DocumentNotFoundError(documentId);

  if (document.ownerId === granteeId) {
    throw new AuthorizationError("Cannot change permission for the document owner");
  }

  const grantorPermission = await getDocumentPermission(grantorId, documentId);
  if (grantorPermission !== "OWNER") {
    throw new InsufficientPermissionsError("OWNER", grantorPermission ?? "NO_ACCESS");
  }

  await prisma.documentPermission.upsert({
    where: {
      userId_documentId: { userId: granteeId, documentId },
    },
    create: {
      userId: granteeId,
      documentId,
      level,
      grantedBy: grantorId,
    },
    update: {
      level,
      grantedBy: grantorId,
    },
  });
}

export async function revokeDocumentPermission(
  grantorId: string,
  documentId: string,
  granteeId: string,
): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!document) throw new DocumentNotFoundError(documentId);

  if (document.ownerId === granteeId) {
    throw new AuthorizationError("Cannot revoke owner permission");
  }

  const grantorPermission = await getDocumentPermission(grantorId, documentId);
  if (grantorPermission !== "OWNER") {
    throw new InsufficientPermissionsError("OWNER", grantorPermission ?? "NO_ACCESS");
  }

  await prisma.documentPermission.deleteMany({
    where: {
      userId: granteeId,
      documentId,
    },
  });
}

export async function transferOwnership(
  currentOwnerId: string,
  documentId: string,
  newOwnerId: string,
): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!document) throw new DocumentNotFoundError(documentId);
  if (document.ownerId !== currentOwnerId) {
    throw new InsufficientPermissionsError("OWNER", "NO_ACCESS");
  }

  await prisma.$transaction(async (tx) => {
    await tx.document.update({
      where: { id: documentId },
      data: { ownerId: newOwnerId },
    });

    await tx.documentPermission.upsert({
      where: {
        userId_documentId: { userId: currentOwnerId, documentId },
      },
      create: {
        userId: currentOwnerId,
        documentId,
        level: "EDITOR",
      },
      update: {
        level: "EDITOR",
      },
    });

    await tx.documentPermission.deleteMany({
      where: {
        userId: newOwnerId,
        documentId,
      },
    });
  });
}

// ─── Folder Permission Checks ────────────────────────────────────────────────

export async function getFolderPermission(
  userId: string,
  folderId: string,
): Promise<PermissionLevel | null> {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    select: { ownerId: true },
  });

  if (!folder) return null;
  if (folder.ownerId === userId) return "OWNER";

  const permission = await prisma.folderPermission.findUnique({
    where: {
      userId_folderId: { userId, folderId },
    },
    select: { level: true },
  });

  return (permission?.level as PermissionLevel) ?? null;
}

export async function requireFolderPermission(
  userId: string,
  folderId: string,
  requiredLevel: PermissionLevel,
): Promise<PermissionLevel> {
  const level = await getFolderPermission(userId, folderId);

  if (!level) {
    throw new InsufficientPermissionsError(requiredLevel, "NO_ACCESS");
  }

  if (!hasPermission(level, requiredLevel)) {
    throw new InsufficientPermissionsError(requiredLevel, level);
  }

  return level;
}

// ─── Organization Permission Checks ──────────────────────────────────────────

export async function getOrgRole(
  userId: string,
  organizationId: string,
): Promise<string | null> {
  const membership = await prisma.orgMember.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    select: { role: true },
  });

  return membership?.role ?? null;
}

export async function requireOrgRole(
  userId: string,
  organizationId: string,
  requiredRoles: string[],
): Promise<string> {
  const role = await getOrgRole(userId, organizationId);

  if (!role) {
    throw new InsufficientPermissionsError(requiredRoles.join(", "), "NOT_A_MEMBER");
  }

  if (!requiredRoles.includes(role)) {
    throw new InsufficientPermissionsError(requiredRoles.join(", "), role);
  }

  return role;
}

export async function isOrgAdmin(userId: string, organizationId: string): Promise<boolean> {
  const role = await getOrgRole(userId, organizationId);
  return role === "OWNER" || role === "ADMIN";
}

// ─── Bulk Permission Checks ──────────────────────────────────────────────────

export async function checkDocumentPermissions(
  userId: string,
  documentIds: string[],
): Promise<Map<string, PermissionLevel | null>> {
  const permissions = await prisma.documentPermission.findMany({
    where: {
      userId,
      documentId: { in: documentIds },
    },
    select: {
      documentId: true,
      level: true,
    },
  });

  const permissionMap = new Map<string, PermissionLevel | null>();
  const documents = await prisma.document.findMany({
    where: { id: { in: documentIds } },
    select: { id: true, ownerId: true },
  });

  for (const doc of documents) {
    if (doc.ownerId === userId) {
      permissionMap.set(doc.id, "OWNER");
    } else {
      const perm = permissions.find((p) => p.documentId === doc.id);
      permissionMap.set(doc.id, (perm?.level as PermissionLevel) ?? null);
    }
  }

  return permissionMap;
}

export async function getDocumentsWithPermission(
  userId: string,
  requiredLevel: PermissionLevel,
  organizationId?: string,
): Promise<string[]> {
  const where: any = {
    deletedAt: null,
  };

  if (organizationId) {
    where.organizationId = organizationId;
  }

  const documents = await prisma.document.findMany({
    where: {
      ...where,
      OR: [
        { ownerId: userId },
        {
          permissions: {
            some: {
              userId,
              level: { gte: PERMISSION_HIERARCHY[requiredLevel] },
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  return documents.map((d) => d.id);
}

// ─── Permission Aggregation ──────────────────────────────────────────────────

export async function getDocumentPermissionSummary(documentId: string) {
  const permissions = await prisma.documentPermission.findMany({
    where: { documentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  const summary = {
    total: permissions.length,
    byLevel: {
      OWNER: 0,
      EDITOR: 0,
      COMMENTER: 0,
      VIEWER: 0,
    } as Record<PermissionLevel, number>,
    users: permissions.map((p) => ({
      id: p.user.id,
      name: p.user.name,
      email: p.user.email,
      image: p.user.image,
      level: p.level as PermissionLevel,
      grantedAt: p.createdAt,
    })),
  };

  for (const perm of permissions) {
    const level = perm.level as PermissionLevel;
    summary.byLevel[level] = (summary.byLevel[level] ?? 0) + 1;
  }

  return summary;
}

// ─── Permission Inheritance ──────────────────────────────────────────────────

export async function inheritFolderPermissions(
  folderId: string,
  documentId: string,
): Promise<void> {
  const folderPermissions = await prisma.folderPermission.findMany({
    where: { folderId },
  });

  for (const fp of folderPermissions) {
    await prisma.documentPermission.upsert({
      where: {
        userId_documentId: { userId: fp.userId, documentId },
      },
      create: {
        userId: fp.userId,
        documentId,
        level: fp.level,
        grantedBy: fp.grantedBy,
      },
      update: {
        level: fp.level,
      },
    });
  }
}

// ─── Permission Helpers for API Routes ───────────────────────────────────────

export function permissionGuard(requiredLevel: PermissionLevel) {
  return async function (userId: string, resourceType: string, resourceId: string): Promise<boolean> {
    switch (resourceType) {
      case "document":
        return hasPermission(
          (await getDocumentPermission(userId, resourceId)) ?? "VIEWER",
          requiredLevel,
        );
      case "folder":
        return hasPermission(
          (await getFolderPermission(userId, resourceId)) ?? "VIEWER",
          requiredLevel,
        );
      default:
        return false;
    }
  };
}

export function requirePermission(requiredLevel: PermissionLevel) {
  return async function (userId: string, resourceType: string, resourceId: string): Promise<void> {
    const allowed = await permissionGuard(requiredLevel)(userId, resourceType, resourceId);
    if (!allowed) {
      throw new InsufficientPermissionsError(requiredLevel, "NO_ACCESS");
    }
  };
}
