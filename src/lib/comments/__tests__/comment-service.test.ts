import {
  createComment,
  getComment,
  getComments,
  updateComment,
  deleteComment,
  addReply,
  resolveComment,
  unresolveComment,
  getCommentCount,
  getUnresolvedCommentCount,
  getCommentsByBlock,
  clearComments,
  validateCommentInput,
} from '@/lib/comments/comment-service'

describe('comment-service', () => {
  beforeEach(() => {
    clearComments()
  })

  describe('createComment', () => {
    it('creates a comment', () => {
      const comment = createComment({
        documentId: 'doc-1',
        blockId: 'block-1',
        userId: 'user-1',
        content: 'This is a comment',
      })
      expect(comment.id).toBeTruthy()
      expect(comment.documentId).toBe('doc-1')
      expect(comment.blockId).toBe('block-1')
      expect(comment.userId).toBe('user-1')
      expect(comment.content).toBe('This is a comment')
      expect(comment.resolved).toBe(false)
      expect(comment.replies).toEqual([])
    })
  })

  describe('getComment', () => {
    it('retrieves a comment by id', () => {
      const created = createComment({
        documentId: 'doc-1',
        blockId: 'block-1',
        userId: 'user-1',
        content: 'Test',
      })
      const found = getComment(created.id)
      expect(found?.id).toBe(created.id)
    })

    it('returns undefined for unknown id', () => {
      expect(getComment('nonexistent')).toBeUndefined()
    })
  })

  describe('getComments', () => {
    it('filters by documentId', () => {
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'c1' })
      createComment({ documentId: 'doc-2', blockId: 'b1', userId: 'u1', content: 'c2' })
      const results = getComments({ documentId: 'doc-1' })
      expect(results).toHaveLength(1)
      expect(results[0]?.documentId).toBe('doc-1')
    })

    it('filters by resolved status', () => {
      const c1 = createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'open' })
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'resolved' })
      resolveComment(c1.id)
      const open = getComments({ documentId: 'doc-1', resolved: false })
      const resolved = getComments({ documentId: 'doc-1', resolved: true })
      expect(open).toHaveLength(1)
      expect(resolved).toHaveLength(1)
    })

    it('filters by userId', () => {
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'c1' })
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u2', content: 'c2' })
      const results = getComments({ documentId: 'doc-1', userId: 'u1' })
      expect(results).toHaveLength(1)
    })

    it('filters by blockId', () => {
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'c1' })
      createComment({ documentId: 'doc-1', blockId: 'b2', userId: 'u1', content: 'c2' })
      const results = getComments({ documentId: 'doc-1', blockId: 'b1' })
      expect(results).toHaveLength(1)
    })
  })

  describe('updateComment', () => {
    it('updates comment content', () => {
      const comment = createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'old' })
      const updated = updateComment(comment.id, { content: 'new' })
      expect(updated?.content).toBe('new')
    })

    it('resolves a comment', () => {
      const comment = createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'test' })
      const updated = updateComment(comment.id, { resolved: true })
      expect(updated?.resolved).toBe(true)
    })

    it('returns null for unknown id', () => {
      expect(updateComment('nonexistent', { content: 'x' })).toBeNull()
    })
  })

  describe('deleteComment', () => {
    it('deletes a comment', () => {
      const comment = createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'test' })
      expect(deleteComment(comment.id)).toBe(true)
      expect(getComment(comment.id)).toBeUndefined()
    })

    it('returns false for unknown id', () => {
      expect(deleteComment('nonexistent')).toBe(false)
    })
  })

  describe('addReply', () => {
    it('adds a reply to a comment', () => {
      const comment = createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'test' })
      const reply = addReply(comment.id, 'u2', 'Great point!')
      expect(reply).not.toBeNull()
      expect(reply?.content).toBe('Great point!')
      expect(reply?.userId).toBe('u2')
    })

    it('returns null for unknown comment', () => {
      expect(addReply('nonexistent', 'u1', 'reply')).toBeNull()
    })
  })

  describe('resolveComment', () => {
    it('resolves a comment', () => {
      const comment = createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'test' })
      const resolved = resolveComment(comment.id)
      expect(resolved?.resolved).toBe(true)
    })
  })

  describe('unresolveComment', () => {
    it('unresolves a comment', () => {
      const comment = createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'test' })
      resolveComment(comment.id)
      const unresolved = unresolveComment(comment.id)
      expect(unresolved?.resolved).toBe(false)
    })
  })

  describe('getCommentCount', () => {
    it('counts comments for document', () => {
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'c1' })
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'c2' })
      createComment({ documentId: 'doc-2', blockId: 'b1', userId: 'u1', content: 'c3' })
      expect(getCommentCount('doc-1')).toBe(2)
    })
  })

  describe('getUnresolvedCommentCount', () => {
    it('counts unresolved comments', () => {
      const c1 = createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'open' })
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'also open' })
      resolveComment(c1.id)
      expect(getUnresolvedCommentCount('doc-1')).toBe(1)
    })
  })

  describe('getCommentsByBlock', () => {
    it('returns comments for specific block', () => {
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'c1' })
      createComment({ documentId: 'doc-1', blockId: 'b2', userId: 'u1', content: 'c2' })
      const results = getCommentsByBlock('doc-1', 'b1')
      expect(results).toHaveLength(1)
    })
  })

  describe('clearComments', () => {
    it('clears all comments for a document', () => {
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'c1' })
      createComment({ documentId: 'doc-2', blockId: 'b1', userId: 'u1', content: 'c2' })
      clearComments('doc-1')
      expect(getCommentCount('doc-1')).toBe(0)
      expect(getCommentCount('doc-2')).toBe(1)
    })

    it('clears all comments', () => {
      createComment({ documentId: 'doc-1', blockId: 'b1', userId: 'u1', content: 'c1' })
      clearComments()
      expect(getCommentCount('doc-1')).toBe(0)
    })
  })

  describe('validateCommentInput', () => {
    it('validates correct input', () => {
      const result = validateCommentInput({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        content: 'Great!',
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects missing documentId', () => {
      const result = validateCommentInput({
        documentId: '',
        blockId: 'b1',
        userId: 'u1',
        content: 'test',
      })
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual('Document ID is required')
    })

    it('rejects empty content', () => {
      const result = validateCommentInput({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        content: '',
      })
      expect(result.valid).toBe(false)
    })

    it('rejects content over 2000 chars', () => {
      const result = validateCommentInput({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        content: 'x'.repeat(2001),
      })
      expect(result.valid).toBe(false)
    })
  })
})
