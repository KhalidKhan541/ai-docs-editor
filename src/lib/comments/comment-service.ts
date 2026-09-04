import { Comment, CommentReply } from '@/types'

export interface CreateCommentInput {
  documentId: string
  blockId: string
  userId: string
  content: string
}

export interface CommentFilter {
  documentId: string
  resolved?: boolean
  userId?: string
  blockId?: string
}

const commentsDb: Map<string, Comment> = new Map()

export function createComment(input: CreateCommentInput): Comment {
  const now = new Date().toISOString()
  const comment: Comment = {
    id: Math.random().toString(36).substring(2, 15),
    documentId: input.documentId,
    blockId: input.blockId,
    userId: input.userId,
    content: input.content,
    resolved: false,
    replies: [],
    createdAt: now,
    updatedAt: now,
  }
  commentsDb.set(comment.id, comment)
  return comment
}

export function getComment(commentId: string): Comment | undefined {
  return commentsDb.get(commentId)
}

export function getComments(filter: CommentFilter): Comment[] {
  let results = Array.from(commentsDb.values()).filter(
    (c) => c.documentId === filter.documentId
  )
  if (filter.resolved !== undefined) {
    results = results.filter((c) => c.resolved === filter.resolved)
  }
  if (filter.userId) {
    results = results.filter((c) => c.userId === filter.userId)
  }
  if (filter.blockId) {
    results = results.filter((c) => c.blockId === filter.blockId)
  }
  return results
}

export function updateComment(
  commentId: string,
  updates: Partial<Pick<Comment, 'content' | 'resolved'>>
): Comment | null {
  const comment = commentsDb.get(commentId)
  if (!comment) return null
  const updated: Comment = {
    ...comment,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  commentsDb.set(commentId, updated)
  return updated
}

export function deleteComment(commentId: string): boolean {
  return commentsDb.delete(commentId)
}

export function addReply(
  commentId: string,
  userId: string,
  content: string
): CommentReply | null {
  const comment = commentsDb.get(commentId)
  if (!comment) return null
  const reply: CommentReply = {
    id: Math.random().toString(36).substring(2, 15),
    userId,
    content,
    createdAt: new Date().toISOString(),
  }
  comment.replies.push(reply)
  comment.updatedAt = new Date().toISOString()
  return reply
}

export function resolveComment(commentId: string): Comment | null {
  return updateComment(commentId, { resolved: true })
}

export function unresolveComment(commentId: string): Comment | null {
  return updateComment(commentId, { resolved: false })
}

export function getCommentCount(documentId: string): number {
  return Array.from(commentsDb.values()).filter(
    (c) => c.documentId === documentId
  ).length
}

export function getUnresolvedCommentCount(documentId: string): number {
  return Array.from(commentsDb.values()).filter(
    (c) => c.documentId === documentId && !c.resolved
  ).length
}

export function getCommentsByBlock(documentId: string, blockId: string): Comment[] {
  return getComments({ documentId, blockId })
}

export function clearComments(documentId?: string): void {
  if (documentId) {
    for (const [id, comment] of commentsDb) {
      if (comment.documentId === documentId) {
        commentsDb.delete(id)
      }
    }
  } else {
    commentsDb.clear()
  }
}

export function validateCommentInput(input: CreateCommentInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!input.documentId) errors.push('Document ID is required')
  if (!input.blockId) errors.push('Block ID is required')
  if (!input.userId) errors.push('User ID is required')
  if (!input.content.trim()) errors.push('Comment content is required')
  if (input.content.length > 2000) errors.push('Comment content must be under 2000 characters')
  return { valid: errors.length === 0, errors }
}
