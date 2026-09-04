import { z } from 'zod'

const documentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters')
    .trim(),
  ownerId: z.string().min(1, 'Owner ID is required'),
  templateId: z.string().optional(),
  isPublished: z.boolean().optional().default(false),
})

const blockSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'paragraph',
    'heading',
    'bulletList',
    'numberedList',
    'todo',
    'quote',
    'code',
    'divider',
    'image',
    'table',
  ]),
  content: z.array(
    z.object({
      text: z.string(),
      styles: z.record(z.boolean()).optional(),
      href: z.string().url().optional(),
    })
  ),
  props: z.record(z.unknown()).optional(),
  children: z.array(z.unknown()).optional(),
})

const collaboratorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['owner', 'editor', 'commenter', 'viewer']),
})

const commentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'),
  blockId: z.string().min(1, 'Block ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be under 2000 characters')
    .trim(),
})

const suggestionSchema = z.object({
  documentId: z.string().min(1),
  blockId: z.string().min(1),
  userId: z.string().min(1),
  type: z.enum(['insert', 'delete', 'replace']),
  originalContent: z.array(z.object({ text: z.string() })),
  suggestedContent: z.array(z.object({ text: z.string() })),
})

const userSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be under 100 characters')
    .trim(),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'editor', 'viewer']).optional().default('viewer'),
})

const exportOptionsSchema = z.object({
  format: z.enum(['markdown', 'html', 'pdf', 'docx', 'txt']),
  includeComments: z.boolean().optional().default(false),
  includeMetadata: z.boolean().optional().default(false),
})

const aiRequestSchema = z.object({
  type: z.enum(['rewrite', 'continue', 'summarize', 'expand', 'fixGrammar', 'changeTone']),
  content: z.string().min(1, 'Content is required'),
  tone: z.string().optional(),
  language: z.string().optional(),
})

export function validateDocument(data: unknown) {
  return documentSchema.safeParse(data)
}

export function validateBlock(data: unknown) {
  return blockSchema.safeParse(data)
}

export function validateCollaborator(data: unknown) {
  return collaboratorSchema.safeParse(data)
}

export function validateComment(data: unknown) {
  return commentSchema.safeParse(data)
}

export function validateSuggestion(data: unknown) {
  return suggestionSchema.safeParse(data)
}

export function validateUser(data: unknown) {
  return userSchema.safeParse(data)
}

export function validateExportOptions(data: unknown) {
  return exportOptionsSchema.safeParse(data)
}

export function validateAIRequest(data: unknown) {
  return aiRequestSchema.safeParse(data)
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
