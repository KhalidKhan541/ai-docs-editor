import { Suggestion, BlockContent } from '@/types'

export interface CreateSuggestionInput {
  documentId: string
  blockId: string
  userId: string
  type: Suggestion['type']
  originalContent: BlockContent[]
  suggestedContent: BlockContent[]
}

const suggestionsDb: Map<string, Suggestion> = new Map()

export function createSuggestion(input: CreateSuggestionInput): Suggestion {
  const now = new Date().toISOString()
  const suggestion: Suggestion = {
    id: Math.random().toString(36).substring(2, 15),
    documentId: input.documentId,
    blockId: input.blockId,
    userId: input.userId,
    type: input.type,
    originalContent: input.originalContent.map((c) => ({ ...c, styles: { ...c.styles } })),
    suggestedContent: input.suggestedContent.map((c) => ({ ...c, styles: { ...c.styles } })),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  }
  suggestionsDb.set(suggestion.id, suggestion)
  return suggestion
}

export function getSuggestion(id: string): Suggestion | undefined {
  return suggestionsDb.get(id)
}

export function getSuggestions(filter: {
  documentId: string
  status?: Suggestion['status']
  blockId?: string
  userId?: string
}): Suggestion[] {
  let results = Array.from(suggestionsDb.values()).filter(
    (s) => s.documentId === filter.documentId
  )
  if (filter.status) {
    results = results.filter((s) => s.status === filter.status)
  }
  if (filter.blockId) {
    results = results.filter((s) => s.blockId === filter.blockId)
  }
  if (filter.userId) {
    results = results.filter((s) => s.userId === filter.userId)
  }
  return results
}

export function updateSuggestion(
  id: string,
  status: Suggestion['status']
): Suggestion | null {
  const suggestion = suggestionsDb.get(id)
  if (!suggestion) return null
  const updated: Suggestion = {
    ...suggestion,
    status,
    updatedAt: new Date().toISOString(),
  }
  suggestionsDb.set(id, updated)
  return updated
}

export function acceptSuggestion(id: string): Suggestion | null {
  return updateSuggestion(id, 'accepted')
}

export function rejectSuggestion(id: string): Suggestion | null {
  return updateSuggestion(id, 'rejected')
}

export function deleteSuggestion(id: string): boolean {
  return suggestionsDb.delete(id)
}

export function getPendingSuggestions(documentId: string): Suggestion[] {
  return getSuggestions({ documentId, status: 'pending' })
}

export function getSuggestionCount(documentId: string): number {
  return Array.from(suggestionsDb.values()).filter(
    (s) => s.documentId === documentId
  ).length
}

export function clearSuggestions(documentId?: string): void {
  if (documentId) {
    for (const [id, suggestion] of suggestionsDb) {
      if (suggestion.documentId === documentId) {
        suggestionsDb.delete(id)
      }
    }
  } else {
    suggestionsDb.clear()
  }
}

export function validateSuggestionInput(
  input: CreateSuggestionInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (!input.documentId) errors.push('Document ID is required')
  if (!input.blockId) errors.push('Block ID is required')
  if (!input.userId) errors.push('User ID is required')
  if (!['insert', 'delete', 'replace'].includes(input.type)) {
    errors.push('Invalid suggestion type')
  }
  if (input.originalContent.length === 0) errors.push('Original content is required')
  if (input.suggestedContent.length === 0) errors.push('Suggested content is required')
  return { valid: errors.length === 0, errors }
}
