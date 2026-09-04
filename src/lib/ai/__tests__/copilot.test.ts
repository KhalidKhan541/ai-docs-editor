import {
  getCopilotSuggestions,
  applyCopilotSuggestion,
  shouldShowCopilot,
  getBestSuggestion,
  filterSuggestionsByType,
  CopilotContext,
  CopilotSuggestion,
} from '@/lib/ai/copilot'
import { createBlock } from '@/lib/editor/block-schema'
import { Block } from '@/types'

function makeContext(overrides?: Partial<CopilotContext>): CopilotContext {
  return {
    blocks: [
      createBlock('paragraph', {
        id: 'b1',
        content: [{ text: 'Hello world', styles: {} }],
      }),
    ],
    currentBlockId: 'b1',
    cursorPosition: 11,
    ...overrides,
  }
}

describe('copilot', () => {
  describe('getCopilotSuggestions', () => {
    it('returns suggestions for non-empty text', () => {
      const context = makeContext()
      const suggestions = getCopilotSuggestions(context)
      expect(Array.isArray(suggestions)).toBe(true)
    })

    it('returns empty for empty block', () => {
      const context = makeContext({
        blocks: [createBlock('paragraph', { id: 'b1', content: [{ text: '', styles: {} }] })],
      })
      const suggestions = getCopilotSuggestions(context)
      expect(suggestions).toHaveLength(0)
    })

    it('returns suggestions for code blocks', () => {
      const context = makeContext({
        blocks: [
          createBlock('code', {
            id: 'b1',
            content: [{ text: 'const x = ', styles: {} }],
            props: { language: 'javascript' },
          }),
        ],
      })
      const suggestions = getCopilotSuggestions(context)
      expect(suggestions.some((s) => s.type === 'code')).toBe(true)
    })

    it('returns suggestions for long text', () => {
      const longText = 'word '.repeat(30)
      const context = makeContext({
        blocks: [createBlock('paragraph', { id: 'b1', content: [{ text: longText, styles: {} }] })],
      })
      const suggestions = getCopilotSuggestions(context)
      expect(suggestions.some((s) => s.type === 'explain')).toBe(true)
    })

    it('returns rewrite suggestions for selected text', () => {
      const context = makeContext({ selectedText: 'Hello' })
      const suggestions = getCopilotSuggestions(context)
      expect(suggestions.some((s) => s.type === 'rewrite')).toBe(true)
    })
  })

  describe('applyCopilotSuggestion', () => {
    it('applies completion suggestion', async () => {
      const blocks = [createBlock('paragraph', { id: 'b1' })]
      const suggestion: CopilotSuggestion = {
        id: 'test',
        type: 'completion',
        content: 'Completed text',
        confidence: 0.9,
      }
      const result = await applyCopilotSuggestion(suggestion, blocks, 'b1')
      expect(result[0]?.content[0]?.text).toBe('Completed text')
    })

    it('applies code suggestion', async () => {
      const blocks = [createBlock('code', { id: 'b1' })]
      const suggestion: CopilotSuggestion = {
        id: 'test',
        type: 'code',
        content: 'console.log("hi")',
        confidence: 0.9,
      }
      const result = await applyCopilotSuggestion(suggestion, blocks, 'b1')
      expect(result[0]?.content[0]?.text).toBe('console.log("hi")')
    })

    it('returns unchanged for rewrite suggestion', async () => {
      const blocks = [createBlock('paragraph', { id: 'b1' })]
      const suggestion: CopilotSuggestion = {
        id: 'test',
        type: 'rewrite',
        content: 'Rewritten text',
        confidence: 0.9,
      }
      const result = await applyCopilotSuggestion(suggestion, blocks, 'b1')
      expect(result[0]?.type).toBe('paragraph')
    })
  })

  describe('shouldShowCopilot', () => {
    it('shows for non-empty text', () => {
      const context = makeContext()
      expect(shouldShowCopilot(context)).toBe(true)
    })

    it('hides for empty text without selection', () => {
      const context = makeContext({
        blocks: [createBlock('paragraph', { id: 'b1', content: [{ text: '', styles: {} }] })],
      })
      expect(shouldShowCopilot(context)).toBe(false)
    })

    it('shows when text is selected', () => {
      const context = makeContext({ selectedText: 'Hello' })
      expect(shouldShowCopilot(context)).toBe(true)
    })

    it('hides for non-existent block', () => {
      const context = makeContext({ currentBlockId: 'nonexistent' })
      expect(shouldShowCopilot(context)).toBe(false)
    })
  })

  describe('getBestSuggestion', () => {
    it('returns suggestion with highest confidence', () => {
      const suggestions: CopilotSuggestion[] = [
        { id: '1', type: 'completion', content: 'a', confidence: 0.5 },
        { id: '2', type: 'completion', content: 'b', confidence: 0.9 },
        { id: '3', type: 'completion', content: 'c', confidence: 0.7 },
      ]
      expect(getBestSuggestion(suggestions)?.id).toBe('2')
    })

    it('returns null for empty list', () => {
      expect(getBestSuggestion([])).toBeNull()
    })
  })

  describe('filterSuggestionsByType', () => {
    it('filters by type', () => {
      const suggestions: CopilotSuggestion[] = [
        { id: '1', type: 'completion', content: 'a', confidence: 0.5 },
        { id: '2', type: 'rewrite', content: 'b', confidence: 0.9 },
        { id: '3', type: 'completion', content: 'c', confidence: 0.7 },
      ]
      const filtered = filterSuggestionsByType(suggestions, 'completion')
      expect(filtered).toHaveLength(2)
      filtered.forEach((s) => expect(s.type).toBe('completion'))
    })
  })
})
