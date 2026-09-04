import { Block, AIResponse } from '@/types'

export interface CopilotSuggestion {
  id: string
  type: 'completion' | 'rewrite' | 'explain' | 'code' | 'format'
  content: string
  confidence: number
  range?: { start: number; end: number }
}

export interface CopilotContext {
  blocks: Block[]
  currentBlockId: string
  cursorPosition: number
  selectedText?: string
}

const CODE_COMPLETIONS: Record<string, string[]> = {
  javascript: [
    'const result = await fetch(url)',
    'return data.map(item => item.value)',
    'if (condition) { /* ... */ }',
  ],
  typescript: [
    'const result: Result = await fetch(url)',
    'return data.map((item: Item) => item.value)',
    'if (condition) { /* ... */ }',
  ],
  python: [
    'result = await fetch(url)',
    'return [item.value for item in data]',
    'if condition:\n    pass',
  ],
}

const REWRITE_SUGGESTIONS: CopilotSuggestion[] = [
  {
    id: 'formal',
    type: 'rewrite',
    content: 'Consider making this more formal',
    confidence: 0.7,
  },
  {
    id: 'concise',
    type: 'rewrite',
    content: 'This could be more concise',
    confidence: 0.75,
  },
  {
    id: 'clear',
    type: 'rewrite',
    content: 'Try simplifying the language',
    confidence: 0.8,
  },
]

export function getCopilotSuggestions(
  context: CopilotContext
): CopilotSuggestion[] {
  const suggestions: CopilotSuggestion[] = []
  const currentBlock = context.blocks.find((b) => b.id === context.currentBlockId)

  if (!currentBlock) return suggestions

  const text = currentBlock.content.map((c) => c.text).join('')

  if (text.endsWith(' ')) {
    suggestions.push(...getCompletionSuggestions(text, currentBlock))
  }

  if (context.selectedText) {
    suggestions.push(...getRewriteSuggestions(context.selectedText))
  }

  if (currentBlock.type === 'code') {
    suggestions.push(...getCodeSuggestions(text, currentBlock))
  }

  if (text.length > 100) {
    suggestions.push({
      id: 'summarize',
      type: 'explain',
      content: 'This block is quite long. Consider summarizing it.',
      confidence: 0.6,
    })
  }

  return suggestions
}

function getCompletionSuggestions(text: string, block: Block): CopilotSuggestion[] {
  const suggestions: CopilotSuggestion[] = []
  const words = text.trim().split(/\s+/)
  const lastWord = words[words.length - 1] ?? ''

  if (lastWord.toLowerCase().startsWith('the') || lastWord.toLowerCase().startsWith('a')) {
    suggestions.push({
      id: 'article',
      type: 'completion',
      content: `${lastWord} [subject]`,
      confidence: 0.65,
    })
  }

  if (block.type === 'heading') {
    suggestions.push({
      id: 'heading-completion',
      type: 'completion',
      content: `${text} [add subtitle or description]`,
      confidence: 0.6,
    })
  }

  return suggestions
}

function getRewriteSuggestions(selectedText: string): CopilotSuggestion[] {
  return REWRITE_SUGGESTIONS.map((s) => ({
    ...s,
    content: `${s.content}: "${selectedText.substring(0, 30)}..."`,
  }))
}

function getCodeSuggestions(code: string, block: Block): CopilotSuggestion[] {
  const suggestions: CopilotSuggestion[] = []
  const language = (block.props.language as string) ?? 'javascript'
  const completions = CODE_COMPLETIONS[language] ?? CODE_COMPLETIONS.javascript

  completions.forEach((completion, i) => {
    suggestions.push({
      id: `code-${i}`,
      type: 'code',
      content: completion,
      confidence: 0.7,
    })
  })

  return suggestions
}

export async function applyCopilotSuggestion(
  suggestion: CopilotSuggestion,
  blocks: Block[],
  blockId: string
): Promise<Block[]> {
  return blocks.map((b) => {
    if (b.id !== blockId) return b
    if (suggestion.type === 'completion' || suggestion.type === 'code') {
      return {
        ...b,
        content: [{ text: suggestion.content, styles: {} }],
        updatedAt: new Date().toISOString(),
      }
    }
    return b
  })
}

export function shouldShowCopilot(context: CopilotContext): boolean {
  const currentBlock = context.blocks.find((b) => b.id === context.currentBlockId)
  if (!currentBlock) return false
  const text = currentBlock.content.map((c) => c.text).join('')
  return text.length > 0 || context.selectedText !== undefined
}

export function getBestSuggestion(suggestions: CopilotSuggestion[]): CopilotSuggestion | null {
  if (suggestions.length === 0) return null
  return suggestions.reduce((best, s) =>
    s.confidence > best.confidence ? s : best
  )
}

export function filterSuggestionsByType(
  suggestions: CopilotSuggestion[],
  type: CopilotSuggestion['type']
): CopilotSuggestion[] {
  return suggestions.filter((s) => s.type === type)
}
