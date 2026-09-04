import {
  createSuggestion,
  getSuggestion,
  getSuggestions,
  updateSuggestion,
  acceptSuggestion,
  rejectSuggestion,
  deleteSuggestion,
  getPendingSuggestions,
  getSuggestionCount,
  clearSuggestions,
  validateSuggestionInput,
} from '@/lib/suggestions/suggestion-service'

describe('suggestion-service', () => {
  beforeEach(() => {
    clearSuggestions()
  })

  describe('createSuggestion', () => {
    it('creates a suggestion', () => {
      const suggestion = createSuggestion({
        documentId: 'doc-1',
        blockId: 'block-1',
        userId: 'user-1',
        type: 'replace',
        originalContent: [{ text: 'old' }],
        suggestedContent: [{ text: 'new' }],
      })
      expect(suggestion.id).toBeTruthy()
      expect(suggestion.documentId).toBe('doc-1')
      expect(suggestion.type).toBe('replace')
      expect(suggestion.status).toBe('pending')
    })
  })

  describe('getSuggestion', () => {
    it('retrieves by id', () => {
      const s = createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'added' }],
      })
      expect(getSuggestion(s.id)?.id).toBe(s.id)
    })

    it('returns undefined for unknown id', () => {
      expect(getSuggestion('nonexistent')).toBeUndefined()
    })
  })

  describe('getSuggestions', () => {
    it('filters by documentId', () => {
      createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'x' }],
      })
      createSuggestion({
        documentId: 'doc-2',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'y' }],
      })
      expect(getSuggestions({ documentId: 'doc-1' })).toHaveLength(1)
    })

    it('filters by status', () => {
      const s = createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'x' }],
      })
      acceptSuggestion(s.id)
      createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'y' }],
      })
      expect(getSuggestions({ documentId: 'doc-1', status: 'accepted' })).toHaveLength(1)
      expect(getSuggestions({ documentId: 'doc-1', status: 'pending' })).toHaveLength(1)
    })
  })

  describe('updateSuggestion', () => {
    it('updates suggestion status', () => {
      const s = createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'x' }],
      })
      const updated = updateSuggestion(s.id, 'accepted')
      expect(updated?.status).toBe('accepted')
    })

    it('returns null for unknown id', () => {
      expect(updateSuggestion('nonexistent', 'accepted')).toBeNull()
    })
  })

  describe('acceptSuggestion', () => {
    it('accepts a suggestion', () => {
      const s = createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'replace',
        originalContent: [{ text: 'old' }],
        suggestedContent: [{ text: 'new' }],
      })
      const accepted = acceptSuggestion(s.id)
      expect(accepted?.status).toBe('accepted')
    })
  })

  describe('rejectSuggestion', () => {
    it('rejects a suggestion', () => {
      const s = createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'replace',
        originalContent: [{ text: 'old' }],
        suggestedContent: [{ text: 'new' }],
      })
      const rejected = rejectSuggestion(s.id)
      expect(rejected?.status).toBe('rejected')
    })
  })

  describe('deleteSuggestion', () => {
    it('deletes a suggestion', () => {
      const s = createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'x' }],
      })
      expect(deleteSuggestion(s.id)).toBe(true)
      expect(getSuggestion(s.id)).toBeUndefined()
    })

    it('returns false for unknown id', () => {
      expect(deleteSuggestion('nonexistent')).toBe(false)
    })
  })

  describe('getPendingSuggestions', () => {
    it('returns only pending suggestions', () => {
      const s1 = createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'x' }],
      })
      createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'y' }],
      })
      acceptSuggestion(s1.id)
      expect(getPendingSuggestions('doc-1')).toHaveLength(1)
    })
  })

  describe('getSuggestionCount', () => {
    it('counts suggestions for document', () => {
      createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'x' }],
      })
      createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'y' }],
      })
      expect(getSuggestionCount('doc-1')).toBe(2)
    })
  })

  describe('clearSuggestions', () => {
    it('clears suggestions for document', () => {
      createSuggestion({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'insert',
        originalContent: [{ text: '' }],
        suggestedContent: [{ text: 'x' }],
      })
      clearSuggestions('doc-1')
      expect(getSuggestionCount('doc-1')).toBe(0)
    })
  })

  describe('validateSuggestionInput', () => {
    it('validates correct input', () => {
      const result = validateSuggestionInput({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'replace',
        originalContent: [{ text: 'old' }],
        suggestedContent: [{ text: 'new' }],
      })
      expect(result.valid).toBe(true)
    })

    it('rejects missing documentId', () => {
      const result = validateSuggestionInput({
        documentId: '',
        blockId: 'b1',
        userId: 'u1',
        type: 'replace',
        originalContent: [{ text: 'old' }],
        suggestedContent: [{ text: 'new' }],
      })
      expect(result.valid).toBe(false)
    })

    it('rejects invalid type', () => {
      const result = validateSuggestionInput({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'invalid' as never,
        originalContent: [{ text: 'old' }],
        suggestedContent: [{ text: 'new' }],
      })
      expect(result.valid).toBe(false)
    })

    it('rejects empty original content', () => {
      const result = validateSuggestionInput({
        documentId: 'doc-1',
        blockId: 'b1',
        userId: 'u1',
        type: 'replace',
        originalContent: [],
        suggestedContent: [{ text: 'new' }],
      })
      expect(result.valid).toBe(false)
    })
  })
})
