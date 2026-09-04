import {
  validateDocument,
  validateBlock,
  validateCollaborator,
  validateComment,
  validateSuggestion,
  validateUser,
  validateExportOptions,
  validateAIRequest,
  sanitizeHtml,
  isValidEmail,
  isValidUrl,
  truncateText,
  slugify,
} from '@/lib/validators'

describe('validators', () => {
  describe('validateDocument', () => {
    it('validates correct document', () => {
      const result = validateDocument({
        title: 'My Document',
        ownerId: 'user-1',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty title', () => {
      const result = validateDocument({ title: '', ownerId: 'u1' })
      expect(result.success).toBe(false)
    })

    it('rejects long title', () => {
      const result = validateDocument({ title: 'x'.repeat(201), ownerId: 'u1' })
      expect(result.success).toBe(false)
    })

    it('rejects missing ownerId', () => {
      const result = validateDocument({ title: 'Test' })
      expect(result.success).toBe(false)
    })
  })

  describe('validateBlock', () => {
    it('validates correct block', () => {
      const result = validateBlock({
        id: 'b1',
        type: 'paragraph',
        content: [{ text: 'Hello', styles: {} }],
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type', () => {
      const result = validateBlock({
        id: 'b1',
        type: 'invalid',
        content: [{ text: 'Hello' }],
      })
      expect(result.success).toBe(false)
    })

    it('accepts all valid block types', () => {
      const types = ['paragraph', 'heading', 'bulletList', 'numberedList', 'todo', 'quote', 'code', 'divider', 'image', 'table']
      types.forEach((type) => {
        const result = validateBlock({ id: 'b1', type, content: [{ text: '' }] })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('validateCollaborator', () => {
    it('validates correct collaborator', () => {
      const result = validateCollaborator({ userId: 'u1', role: 'editor' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid role', () => {
      const result = validateCollaborator({ userId: 'u1', role: 'admin' })
      expect(result.success).toBe(false)
    })
  })

  describe('validateComment', () => {
    it('validates correct comment', () => {
      const result = validateComment({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        content: 'Great work!',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty content', () => {
      const result = validateComment({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        content: '',
      })
      expect(result.success).toBe(false)
    })

    it('rejects content over 2000 chars', () => {
      const result = validateComment({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        content: 'x'.repeat(2001),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validateSuggestion', () => {
    it('validates correct suggestion', () => {
      const result = validateSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'replace',
        originalContent: [{ text: 'old' }],
        suggestedContent: [{ text: 'new' }],
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type', () => {
      const result = validateSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'invalid',
        originalContent: [{ text: 'old' }],
        suggestedContent: [{ text: 'new' }],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('validateUser', () => {
    it('validates correct user', () => {
      const result = validateUser({
        name: 'Alice',
        email: 'alice@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid email', () => {
      const result = validateUser({ name: 'Alice', email: 'not-an-email' })
      expect(result.success).toBe(false)
    })

    it('rejects empty name', () => {
      const result = validateUser({ name: '', email: 'a@b.com' })
      expect(result.success).toBe(false)
    })
  })

  describe('validateExportOptions', () => {
    it('validates correct options', () => {
      const result = validateExportOptions({ format: 'markdown' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid format', () => {
      const result = validateExportOptions({ format: 'invalid' })
      expect(result.success).toBe(false)
    })
  })

  describe('validateAIRequest', () => {
    it('validates correct request', () => {
      const result = validateAIRequest({
        type: 'rewrite',
        content: 'Hello world',
      })
      expect(result.success).toBe(true)
    })

    it('rejects invalid type', () => {
      const result = validateAIRequest({ type: 'invalid', content: 'test' })
      expect(result.success).toBe(false)
    })

    it('rejects empty content', () => {
      const result = validateAIRequest({ type: 'rewrite', content: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('sanitizeHtml', () => {
    it('escapes HTML entities', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toContain('&lt;script&gt;')
      expect(sanitizeHtml('"quote"')).toContain('&quot;')
      expect(sanitizeHtml("it's")).toContain('&#x27;')
    })

    it('escapes ampersand', () => {
      expect(sanitizeHtml('a & b')).toContain('&amp;')
    })
  })

  describe('isValidEmail', () => {
    it('validates correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co')).toBe(true)
    })

    it('rejects invalid emails', () => {
      expect(isValidEmail('not-an-email')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('user@')).toBe(false)
    })
  })

  describe('isValidUrl', () => {
    it('validates correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://localhost:3000')).toBe(true)
    })

    it('rejects invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('ftp://')).toBe(false)
    })
  })

  describe('truncateText', () => {
    it('returns text if under limit', () => {
      expect(truncateText('Hello', 10)).toBe('Hello')
    })

    it('truncates with ellipsis', () => {
      expect(truncateText('Hello World', 8)).toBe('Hello...')
    })
  })

  describe('slugify', () => {
    it('creates slug from text', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('removes special characters', () => {
      expect(slugify('Hello! @World#')).toBe('hello-world')
    })

    it('handles multiple spaces', () => {
      expect(slugify('Hello   World')).toBe('hello-world')
    })
  })
})
