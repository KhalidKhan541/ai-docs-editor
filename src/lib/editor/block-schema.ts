import { Block, BlockType, BlockContent } from '@/types'

const BLOCK_SCHEMAS: Record<BlockType, { content: boolean; children: boolean; props: string[] }> = {
  paragraph: { content: true, children: false, props: [] },
  heading: { content: true, children: false, props: ['level'] },
  bulletList: { content: true, children: true, props: [] },
  numberedList: { content: true, children: true, props: [] },
  todo: { content: true, children: false, props: ['checked'] },
  quote: { content: true, children: false, props: ['author'] },
  code: { content: true, children: false, props: ['language'] },
  divider: { content: false, children: false, props: [] },
  image: { content: false, children: false, props: ['src', 'alt', 'width', 'height'] },
  table: { content: false, children: true, props: ['rows', 'columns'] },
}

export function createBlock(type: BlockType, overrides?: Partial<Block>): Block {
  const now = new Date().toISOString()
  return {
    id: Math.random().toString(36).substring(2, 15),
    type,
    content: type === 'divider' ? [] : [{ text: '', styles: {} }],
    children: [],
    props: {},
    createdAt: now,
    updatedAt: now,
    createdBy: 'system',
    ...overrides,
  }
}

export function validateBlock(block: Block): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const schema = BLOCK_SCHEMAS[block.type]

  if (!schema) {
    errors.push(`Unknown block type: ${block.type}`)
    return { valid: false, errors }
  }

  if (!block.id || typeof block.id !== 'string') {
    errors.push('Block must have a valid id')
  }

  if (!block.createdAt) {
    errors.push('Block must have a createdAt timestamp')
  }

  if (schema.content && block.content.length === 0 && block.type !== 'divider') {
    errors.push(`${block.type} blocks must have content`)
  }

  if (!schema.children && block.children.length > 0) {
    errors.push(`${block.type} blocks cannot have children`)
  }

  if (block.type === 'heading') {
    const level = block.props.level as number
    if (level && (level < 1 || level > 6)) {
      errors.push('Heading level must be between 1 and 6')
    }
  }

  if (block.type === 'todo') {
    if (block.props.checked !== undefined && typeof block.props.checked !== 'boolean') {
      errors.push('Todo checked prop must be boolean')
    }
  }

  if (block.type === 'code') {
    const validLanguages = ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown', '']
    const lang = block.props.language as string
    if (lang && !validLanguages.includes(lang)) {
      errors.push(`Invalid code language: ${lang}`)
    }
  }

  if (block.type === 'image') {
    const src = block.props.src as string
    if (!src) {
      errors.push('Image blocks must have a src prop')
    }
  }

  return { valid: errors.length === 0, errors }
}

export function getBlockSchema(type: BlockType) {
  return BLOCK_SCHEMAS[type]
}

export function isValidBlockType(type: string): type is BlockType {
  return type in BLOCK_SCHEMAS
}

export function getBlockContent(block: Block): string {
  return block.content.map((c) => c.text).join('')
}

export function setBlockContent(block: Block, text: string): Block {
  return {
    ...block,
    content: [{ text, styles: block.content[0]?.styles ?? {} }],
    updatedAt: new Date().toISOString(),
  }
}

export function cloneBlock(block: Block, newId?: string): Block {
  const now = new Date().toISOString()
  return {
    ...block,
    id: newId ?? Math.random().toString(36).substring(2, 15),
    content: block.content.map((c) => ({ ...c, styles: { ...c.styles } })),
    children: block.children.map((child) => cloneBlock(child)),
    createdAt: now,
    updatedAt: now,
  }
}
