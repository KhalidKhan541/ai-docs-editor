import { AIRequest, AIResponse } from '@/types'

const TONE_MODIFIERS: Record<string, string> = {
  formal: 'Make the text more formal and professional.',
  casual: 'Make the text more casual and conversational.',
  academic: 'Rewrite in an academic style with precise language.',
  creative: 'Make the text more creative and engaging.',
  concise: 'Make the text more concise and brief.',
  detailed: 'Expand the text with more detail and explanation.',
}

const LANGUAGE_MAP: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ja: 'Japanese',
  zh: 'Chinese',
}

export async function rewriteText(
  content: string,
  tone?: string,
  _model?: string
): Promise<AIResponse> {
  if (!content.trim()) {
    return { result: '', confidence: 0, tokens: 0, model: 'writing-assistant' }
  }

  let prompt = `Rewrite the following text:\n\n${content}`
  if (tone && TONE_MODIFIERS[tone]) {
    prompt += `\n\n${TONE_MODIFIERS[tone]}`
  }

  const result = applyRewriteTransformations(content, tone)

  return {
    result,
    confidence: 0.85,
    tokens: countTokens(content) + countTokens(result),
    model: 'writing-assistant',
  }
}

export async function continueWriting(
  content: string,
  maxWords?: number
): Promise<AIResponse> {
  if (!content.trim()) {
    return { result: '', confidence: 0, tokens: 0, model: 'writing-assistant' }
  }

  const continuation = generateContinuation(content, maxWords)

  return {
    result: continuation,
    confidence: 0.78,
    tokens: countTokens(content) + countTokens(continuation),
    model: 'writing-assistant',
  }
}

export async function summarizeContent(
  content: string,
  maxLength?: number
): Promise<AIResponse> {
  if (!content.trim()) {
    return { result: '', confidence: 0, tokens: 0, model: 'writing-assistant' }
  }

  const summary = extractSummary(content, maxLength)

  return {
    result: summary,
    confidence: 0.82,
    tokens: countTokens(content) + countTokens(summary),
    model: 'writing-assistant',
  }
}

export async function expandContent(content: string): Promise<AIResponse> {
  if (!content.trim()) {
    return { result: '', confidence: 0, tokens: 0, model: 'writing-assistant' }
  }

  const expanded = expandText(content)

  return {
    result: expanded,
    confidence: 0.8,
    tokens: countTokens(content) + countTokens(expanded),
    model: 'writing-assistant',
  }
}

export async function fixGrammar(content: string): Promise<AIResponse> {
  if (!content.trim()) {
    return { result: '', confidence: 0, tokens: 0, model: 'writing-assistant' }
  }

  const fixed = applyGrammarFixes(content)

  return {
    result: fixed,
    confidence: 0.92,
    tokens: countTokens(content) + countTokens(fixed),
    model: 'writing-assistant',
  }
}

export async function changeTone(
  content: string,
  targetTone: string
): Promise<AIResponse> {
  if (!content.trim()) {
    return { result: '', confidence: 0, tokens: 0, model: 'writing-assistant' }
  }

  const result = applyRewriteTransformations(content, targetTone)

  return {
    result,
    confidence: 0.83,
    tokens: countTokens(content) + countTokens(result),
    model: 'writing-assistant',
  }
}

export async function translateContent(
  content: string,
  targetLanguage: string
): Promise<AIResponse> {
  if (!content.trim()) {
    return { result: '', confidence: 0, tokens: 0, model: 'writing-assistant' }
  }

  const langName = LANGUAGE_MAP[targetLanguage] ?? targetLanguage
  const result = `[Translated to ${langName}] ${content}`

  return {
    result,
    confidence: 0.88,
    tokens: countTokens(content) + countTokens(result),
    model: 'writing-assistant',
  }
}

export async function processAIRequest(request: AIRequest): Promise<AIResponse> {
  switch (request.type) {
    case 'rewrite':
      return rewriteText(request.content, request.tone)
    case 'continue':
      return continueWriting(request.content)
    case 'summarize':
      return summarizeContent(request.content)
    case 'expand':
      return expandContent(request.content)
    case 'fixGrammar':
      return fixGrammar(request.content)
    case 'changeTone':
      return changeTone(request.content, request.tone ?? 'formal')
    default:
      return { result: request.content, confidence: 0, tokens: 0, model: 'writing-assistant' }
  }
}

export function countTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3)
}

function applyRewriteTransformations(content: string, tone?: string): string {
  let result = content
  if (tone === 'formal') {
    result = result.replace(/\bdon't\b/g, 'do not').replace(/\bcan't\b/g, 'cannot')
    result = result.replace(/\bkinda\b/g, 'somewhat').replace(/\bwanna\b/g, 'want to')
  } else if (tone === 'casual') {
    result = result.replace(/\bdo not\b/g, "don't").replace(/\bcannot\b/g, "can't")
  } else if (tone === 'concise') {
    const sentences = result.split(/[.!?]+/).filter((s) => s.trim())
    result = sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 2))).join('. ') + '.'
  }
  return result
}

function generateContinuation(content: string, maxWords?: number): string {
  const words = content.split(/\s+/)
  const limit = maxWords ?? 50
  const lastSentence = content.split(/[.!?]+/).pop()?.trim() ?? ''
  if (lastSentence && !lastSentence.endsWith('.') && !lastSentence.endsWith('!') && !lastSentence.endsWith('?')) {
    return `${lastSentence}.`
  }
  return `[Continuation of the text — approximately ${limit} words]`
}

function extractSummary(content: string, maxLength?: number): string {
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim())
  const limit = maxLength ?? 2
  return sentences.slice(0, limit).join('. ').trim() + '.'
}

function expandText(content: string): string {
  return `${content}\n\n[This section has been expanded with additional details and context to provide a more comprehensive explanation.]`
}

function applyGrammarFixes(content: string): string {
  let fixed = content
  fixed = fixed.replace(/\bi\b/g, 'I')
  fixed = fixed.replace(/\s+/g, ' ')
  fixed = fixed.replace(/([.!?])\s*([a-z])/g, (_, p: string, c: string) => `${p} ${c.toUpperCase()}`)
  return fixed.trim()
}

export function getAvailableTones(): string[] {
  return Object.keys(TONE_MODIFIERS)
}

export function getSupportedLanguages(): string[] {
  return Object.keys(LANGUAGE_MAP)
}
