import { z } from "zod";

// ─── Auth Validators ─────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
  remember: z.boolean().optional().default(false),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Name is required")
      .max(100, "Name must be less than 100 characters")
      .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .max(255, "Email must be less than 255 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    organizationName: z
      .string()
      .max(100, "Organization name must be less than 100 characters")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

// ─── User Validators ─────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
  locale: z.string().min(2).max(5).optional(),
  timezone: z.string().max(50).optional(),
});

// ─── Document Validators ─────────────────────────────────────────────────────

export const createDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .trim(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  organizationId: z.string().cuid().optional(),
  templateId: z.string().cuid().optional(),
  folderId: z.string().cuid().optional(),
  icon: z.string().max(10).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
});

export const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be less than 255 characters")
    .trim()
    .optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  icon: z.string().max(10).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  isStarred: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "TRASHED"]).optional(),
});

export const documentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED", "TRASHED"]).optional(),
  sort: z.enum(["title", "createdAt", "updatedAt", "wordCount"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  tag: z.string().optional(),
  folder: z.string().cuid().optional(),
});

export const moveDocumentSchema = z.object({
  folderId: z.string().cuid().nullable(),
});

export const bulkDocumentSchema = z.object({
  documentIds: z.array(z.string().cuid()).min(1).max(50),
  action: z.enum(["delete", "archive", "restore", "star", "unstar", "move"]),
  folderId: z.string().cuid().optional(),
});

// ─── Block Validators ────────────────────────────────────────────────────────

export const createBlockSchema = z.object({
  type: z.enum([
    "paragraph",
    "heading",
    "bulletList",
    "numberedList",
    "checklist",
    "toggle",
    "quote",
    "codeBlock",
    "divider",
    "image",
    "video",
    "audio",
    "file",
    "table",
    "callout",
    "bookmark",
    "equation",
    "tableOfContents",
    "column",
    "columnList",
    "syncBlock",
    "mention",
    "aiGenerated",
  ]),
  content: z.any(),
  properties: z.any().optional(),
  parentId: z.string().cuid().optional(),
  order: z.number().int().min(0),
  depth: z.number().int().min(0).max(10).optional(),
});

export const updateBlockSchema = z.object({
  content: z.any().optional(),
  properties: z.any().optional(),
  order: z.number().int().min(0).optional(),
});

export const reorderBlocksSchema = z.object({
  blocks: z
    .array(
      z.object({
        id: z.string().cuid(),
        order: z.number().int().min(0),
      }),
    )
    .min(1)
    .max(500),
});

export const deleteBlocksSchema = z.object({
  blockIds: z.array(z.string().cuid()).min(1).max(100),
});

// ─── Comment Validators ──────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment must be less than 5000 characters")
    .trim(),
  blockId: z.string().cuid().optional(),
  parentId: z.string().cuid().optional(),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment must be less than 5000 characters")
    .trim(),
});

export const resolveCommentSchema = z.object({
  status: z.enum(["RESOLVED", "ARCHIVED"]),
});

export const commentReactionSchema = z.object({
  emoji: z
    .string()
    .min(1)
    .max(10)
    .regex(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]$/u, "Invalid emoji"),
});

// ─── Suggestion Validators ───────────────────────────────────────────────────

export const createSuggestionSchema = z.object({
  content: z.any(),
  originalContent: z.any().optional(),
  blockId: z.string().cuid().optional(),
  reason: z.string().max(500).optional(),
});

export const reviewSuggestionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "DISMISSED"]),
  reason: z.string().max(500).optional(),
});

// ─── Permission Validators ───────────────────────────────────────────────────

export const shareDocumentSchema = z.object({
  email: z.string().email("Invalid email address"),
  level: z.enum(["EDITOR", "COMMENTER", "VIEWER"]),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export const updatePermissionSchema = z.object({
  permissionId: z.string().cuid(),
  level: z.enum(["EDITOR", "COMMENTER", "VIEWER"]),
});

export const revokePermissionSchema = z.object({
  permissionId: z.string().cuid(),
});

// ─── Organization Validators ─────────────────────────────────────────────────

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters")
    .trim(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters")
    .trim()
    .optional(),
  description: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
  logo: z.string().url().optional().or(z.literal("")),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER", "GUEST"]).default("MEMBER"),
});

// ─── Template Validators ─────────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be less than 100 characters")
    .trim(),
  description: z.string().max(500).optional(),
  content: z.any(),
  categoryId: z.string().cuid().optional(),
  isPublic: z.boolean().default(false),
  icon: z.string().max(10).optional(),
});

export const updateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required")
    .max(100, "Template name must be less than 100 characters")
    .trim()
    .optional(),
  description: z.string().max(500).optional(),
  content: z.any().optional(),
  categoryId: z.string().cuid().optional(),
  isPublic: z.boolean().optional(),
  icon: z.string().max(10).optional(),
});

// ─── Publish Validators ──────────────────────────────────────────────────────

export const publishDocumentSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  customDomain: z.string().optional().or(z.literal("")),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoImage: z.string().url().optional().or(z.literal("")),
  password: z.string().min(4).max(100).optional(),
  allowComments: z.boolean().default(true),
  scheduledAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export const updatePublishSettingsSchema = z.object({
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoImage: z.string().url().optional().or(z.literal("")),
  password: z.string().min(4).max(100).optional().nullable(),
  allowComments: z.boolean().optional(),
});

// ─── Folder Validators ───────────────────────────────────────────────────────

export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(100, "Folder name must be less than 100 characters")
    .trim(),
  parentId: z.string().cuid().optional().nullable(),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
    .optional(),
});

export const updateFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(100, "Folder name must be less than 100 characters")
    .trim()
    .optional(),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
    .optional(),
});

export const moveFolderSchema = z.object({
  parentId: z.string().cuid().nullable(),
});

// ─── Tag Validators ──────────────────────────────────────────────────────────

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag name is required")
    .max(50, "Tag name must be less than 50 characters")
    .trim()
    .toLowerCase(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
    .optional(),
});

export const documentTagSchema = z.object({
  documentId: z.string().cuid(),
  tagId: z.string().cuid(),
});

// ─── Search & Query Validators ───────────────────────────────────────────────

export const globalSearchSchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(200, "Query must be less than 200 characters"),
  type: z.enum(["documents", "blocks", "comments", "all"]).default("all"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  page: z.coerce.number().int().min(1).default(1),
});

// ─── Collaboration Validators ────────────────────────────────────────────────

export const cursorUpdateSchema = z.object({
  blockId: z.string().cuid(),
  offset: z.number().int().min(0),
});

export const selectionUpdateSchema = z.object({
  startBlockId: z.string().cuid(),
  startOffset: z.number().int().min(0),
  endBlockId: z.string().cuid(),
  endOffset: z.number().int().min(0),
});

// ─── Notification Validators ─────────────────────────────────────────────────

export const notificationQuerySchema = z.object({
  read: z.coerce.boolean().optional(),
  type: z
    .enum(["COMMENT", "MENTION", "SUGGESTION", "INVITE", "SHARE", "UPDATE", "SYSTEM"])
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// ─── API Key Validators ──────────────────────────────────────────────────────

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "API key name is required")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  permissions: z
    .object({
      documents: z.boolean().default(true),
      comments: z.boolean().default(true),
      blocks: z.boolean().default(false),
      admin: z.boolean().default(false),
    })
    .optional(),
});

// ─── Export Validators ───────────────────────────────────────────────────────

export const exportDocumentSchema = z.object({
  format: z.enum(["markdown", "html", "pdf", "docx", "txt", "json"]),
  includeComments: z.boolean().optional().default(false),
  includeMetadata: z.boolean().optional().default(false),
  pageSize: z.enum(["A4", "Letter", "Legal"]).optional().default("A4"),
  margins: z
    .object({
      top: z.number().min(0).max(100),
      right: z.number().min(0).max(100),
      bottom: z.number().min(0).max(100),
      left: z.number().min(0).max(100),
    })
    .optional(),
});

// ─── AI Request Validators ───────────────────────────────────────────────────

export const aiRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(10000, "Prompt too long"),
  context: z.string().max(50000).optional(),
  documentId: z.string().cuid().optional(),
  blockId: z.string().cuid().optional(),
  type: z.enum(["continue", "rewrite", "summarize", "expand", "fix", "translate", "brainstorm"]),
  language: z.string().max(50).optional(),
  tone: z.enum(["formal", "casual", "professional", "creative"]).optional(),
});

// ─── Validation Helpers ──────────────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type DocumentQueryInput = z.infer<typeof documentQuerySchema>;
export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
export type ReorderBlocksInput = z.infer<typeof reorderBlocksSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
export type CreateSuggestionInput = z.infer<typeof createSuggestionSchema>;
export type ReviewSuggestionInput = z.infer<typeof reviewSuggestionSchema>;
export type ShareDocumentInput = z.infer<typeof shareDocumentSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type PublishDocumentInput = z.infer<typeof publishDocumentSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type GlobalSearchInput = z.infer<typeof globalSearchSchema>;
export type ExportDocumentInput = z.infer<typeof exportDocumentSchema>;
export type AIRequestInput = z.infer<typeof aiRequestSchema>;

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new Error(firstError?.message ?? "Validation failed");
  }
  return result.data;
}

export function validateInputPartial<T>(schema: z.ZodObject<any>, data: unknown): Partial<T> {
  const result = schema.partial().safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new Error(firstError?.message ?? "Validation failed");
  }
  return result.data;
}
