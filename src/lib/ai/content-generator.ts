import { AIResponse } from '@/types'

export interface GenerationRequest {
  prompt: string
  type: 'paragraph' | 'list' | 'code' | 'table' | 'outline'
  context?: string
  maxLength?: number
  language?: string
}

interface Template {
  name: string
  prompt: string
  type: GenerationRequest['type']
}

const TEMPLATES: Template[] = [
  { name: 'introduction', prompt: 'Write an introduction about', type: 'paragraph' },
  { name: 'conclusion', prompt: 'Write a conclusion about', type: 'paragraph' },
  { name: 'overview', prompt: 'Provide an overview of', type: 'paragraph' },
  { name: 'steps', prompt: 'List the steps to', type: 'list' },
  { name: 'pros-cons', prompt: 'List the pros and cons of', type: 'list' },
  { name: 'features', prompt: 'List the key features of', type: 'list' },
  { name: 'api-doc', prompt: 'Generate API documentation for', type: 'code' },
  { name: 'comparison', prompt: 'Create a comparison table for', type: 'table' },
  { name: 'outline', prompt: 'Create an outline for', type: 'outline' },
]

export async function generateContent(
  request: GenerationRequest
): Promise<AIResponse> {
  if (!request.prompt.trim()) {
    return { result: '', confidence: 0, tokens: 0, model: 'content-generator' }
  }

  const result = generateFromPrompt(request)

  return {
    result,
    confidence: 0.75,
    tokens: countGenTokens(request.prompt) + countGenTokens(result),
    model: 'content-generator',
  }
}

export async function generateFromTemplate(
  templateName: string,
  topic: string,
  context?: string
): Promise<AIResponse> {
  const template = TEMPLATES.find((t) => t.name === templateName)
  if (!template) {
    return { result: '', confidence: 0, tokens: 0, model: 'content-generator' }
  }

  const request: GenerationRequest = {
    prompt: `${template.prompt} ${topic}`,
    type: template.type,
    context,
  }

  return generateContent(request)
}

export async function generateOutline(
  topic: string,
  sections?: number
): Promise<AIResponse> {
  const count = sections ?? 5
  const outline = Array.from({ length: count }, (_, i) =>
    `${i + 1}. [Section ${i + 1}]: Topic related to ${topic}`
  ).join('\n')

  return {
    result: outline,
    confidence: 0.7,
    tokens: countGenTokens(topic) + countGenTokens(outline),
    model: 'content-generator',
  }
}

export async function generateCode(
  description: string,
  language?: string
): Promise<AIResponse> {
  const lang = language ?? 'javascript'
  const code = `// Generated ${lang} code for: ${description}\nfunction solution() {\n  // Implementation\n  return {}\n}`

  return {
    result: code,
    confidence: 0.72,
    tokens: countGenTokens(description) + countGenTokens(code),
    model: 'content-generator',
  }
}

export async function generateTable(
  headers: string[],
  rows: number
): Promise<AIResponse> {
  const headerRow = `| ${headers.join(' | ')} |`
  const separator = `| ${headers.map(() => '---').join(' | ')} |`
  const dataRows = Array.from({ length: rows }, (_, i) =>
    `| ${headers.map((_, j) => `Cell ${i + 1}-${j + 1}`).join(' | ')} |`
  ).join('\n')

  const table = `${headerRow}\n${separator}\n${dataRows}`

  return {
    result: table,
    confidence: 0.9,
    tokens: countGenTokens(table),
    model: 'content-generator',
  }
}

export async function improvePrompt(
  prompt: string
): Promise<{ improved: string; suggestions: string[] }> {
  const suggestions: string[] = []
  let improved = prompt

  if (prompt.length < 20) {
    suggestions.push('Consider adding more detail to your prompt')
    improved = `${improved}. Provide a comprehensive explanation with examples.`
  }

  if (!prompt.includes('example')) {
    suggestions.push('Adding "with examples" can improve output quality')
  }

  if (prompt.split(' ').length < 5) {
    suggestions.push('Longer prompts tend to produce better results')
  }

  return { improved, suggestions }
}

export function getTemplates(): Template[] {
  return TEMPLATES
}

export function getTemplatesByType(type: GenerationRequest['type']): Template[] {
  return TEMPLATES.filter((t) => t.type === type)
}

function generateFromPrompt(request: GenerationRequest): string {
  const { prompt, type } = request

  switch (type) {
    case 'paragraph':
      return `${prompt}. This is a generated paragraph that covers the main aspects of the topic. The content provides a clear and informative explanation.`
    case 'list':
      return `1. First point about ${prompt}\n2. Second point about ${prompt}\n3. Third point about ${prompt}`
    case 'code':
      return `// Code for: ${prompt}\nfunction main() {\n  console.log("Hello, World!");\n}`
    case 'table':
      return `| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |`
    case 'outline':
      return `1. Introduction to ${prompt}\n2. Key concepts\n3. Implementation\n4. Examples\n5. Conclusion`
    default:
      return `Generated content for: ${prompt}`
  }
}

function countGenTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3)
}
