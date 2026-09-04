import {
  createBlock,
  validateBlock,
  getBlockSchema,
  isValidBlockType,
  getBlockContent,
  setBlockContent,
  cloneBlock,
} from '@/lib/editor/block-schema'
import { Block, BlockType } from '@/types'

describe('block-schema', () => {
  describe('createBlock', () => {
    it('creates a paragraph block with default values', () => {
      const block = createBlock('paragraph')
      expect(block.type).toBe('paragraph')
      expect(block.id).toBeTruthy()
      expect(block.content).toEqual([{ text: '', styles: {} }])
      expect(block.children).toEqual([])
      expect(block.createdAt).toBeTruthy()
      expect(block.updatedAt).toBeTruthy()
    })

    it('creates a heading block with level prop', () => {
      const block = createBlock('heading', { props: { level: 2 } })
      expect(block.type).toBe('heading')
      expect(block.props.level).toBe(2)
    })

    it('creates a divider block with empty content', () => {
      const block = createBlock('divider')
      expect(block.type).toBe('divider')
      expect(block.content).toEqual([])
    })

    it('creates a todo block with checked prop', () => {
      const block = createBlock('todo', { props: { checked: true } })
      expect(block.type).toBe('todo')
      expect(block.props.checked).toBe(true)
    })

    it('creates a code block with language prop', () => {
      const block = createBlock('code', { props: { language: 'typescript' } })
      expect(block.type).toBe('code')
      expect(block.props.language).toBe('typescript')
    })

    it('creates an image block with src prop', () => {
      const block = createBlock('image', { props: { src: '/img.png', alt: 'test' } })
      expect(block.type).toBe('image')
      expect(block.props.src).toBe('/img.png')
    })

    it('creates block with custom id', () => {
      const block = createBlock('paragraph', { id: 'custom-id' })
      expect(block.id).toBe('custom-id')
    })

    it('creates block with custom content', () => {
      const block = createBlock('paragraph', {
        content: [{ text: 'Hello', styles: { bold: true } }],
      })
      expect(block.content[0]?.text).toBe('Hello')
      expect(block.content[0]?.styles?.bold).toBe(true)
    })
  })

  describe('validateBlock', () => {
    it('validates a correct paragraph block', () => {
      const block = createBlock('paragraph')
      const result = validateBlock(block)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects block with unknown type', () => {
      const block = { id: '1', type: 'unknown' as BlockType, content: [{ text: 'x', styles: {} }], children: [], props: {}, createdAt: '', createdBy: '' }
      const result = validateBlock(block)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Unknown block type')
    })

    it('rejects block without id', () => {
      const block = createBlock('paragraph')
      block.id = ''
      const result = validateBlock(block)
      expect(result.valid).toBe(false)
      expect(result.errors).toContainEqual('Block must have a valid id')
    })

    it('rejects paragraph without content', () => {
      const block = createBlock('paragraph')
      block.content = []
      const result = validateBlock(block)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('must have content')
    })

    it('allows divider without content', () => {
      const block = createBlock('divider')
      block.content = []
      const result = validateBlock(block)
      expect(result.valid).toBe(true)
    })

    it('rejects heading with invalid level', () => {
      const block = createBlock('heading', { props: { level: 8 } })
      const result = validateBlock(block)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('level must be between')
    })

    it('validates heading with level 1-6', () => {
      for (let level = 1; level <= 6; level++) {
        const block = createBlock('heading', { props: { level } })
        const result = validateBlock(block)
        expect(result.valid).toBe(true)
      }
    })

    it('rejects todo with non-boolean checked', () => {
      const block = createBlock('todo', { props: { checked: 'yes' } })
      const result = validateBlock(block)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('boolean')
    })

    it('rejects code block with invalid language', () => {
      const block = createBlock('code', { props: { language: 'cobol' } })
      const result = validateBlock(block)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('Invalid code language')
    })

    it('rejects image block without src', () => {
      const block = createBlock('image', { props: {} })
      const result = validateBlock(block)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('must have a src')
    })

    it('rejects paragraph with children', () => {
      const block = createBlock('paragraph', {
        children: [createBlock('paragraph')],
      })
      const result = validateBlock(block)
      expect(result.valid).toBe(false)
      expect(result.errors[0]).toContain('cannot have children')
    })

    it('allows bulletList with children', () => {
      const block = createBlock('bulletList', {
        children: [createBlock('paragraph')],
      })
      const result = validateBlock(block)
      expect(result.valid).toBe(true)
    })
  })

  describe('getBlockSchema', () => {
    it('returns schema for paragraph', () => {
      const schema = getBlockSchema('paragraph')
      expect(schema.content).toBe(true)
      expect(schema.children).toBe(false)
    })

    it('returns schema for bulletList', () => {
      const schema = getBlockSchema('bulletList')
      expect(schema.content).toBe(true)
      expect(schema.children).toBe(true)
    })
  })

  describe('isValidBlockType', () => {
    it('returns true for valid types', () => {
      expect(isValidBlockType('paragraph')).toBe(true)
      expect(isValidBlockType('heading')).toBe(true)
      expect(isValidBlockType('code')).toBe(true)
    })

    it('returns false for invalid types', () => {
      expect(isValidBlockType('invalid')).toBe(false)
      expect(isValidBlockType('')).toBe(false)
    })
  })

  describe('getBlockContent', () => {
    it('returns joined text from content', () => {
      const block = createBlock('paragraph', {
        content: [{ text: 'Hello world', styles: {} }],
      })
      expect(getBlockContent(block)).toBe('Hello world')
    })

    it('returns empty string for empty content', () => {
      const block = createBlock('divider')
      expect(getBlockContent(block)).toBe('')
    })
  })

  describe('setBlockContent', () => {
    it('updates block content text', () => {
      const block = createBlock('paragraph')
      const updated = setBlockContent(block, 'New text')
      expect(updated.content[0]?.text).toBe('New text')
      expect(updated.updatedAt).not.toBe(block.updatedAt)
    })
  })

  describe('cloneBlock', () => {
    it('creates a deep copy with new id', () => {
      const block = createBlock('paragraph', {
        content: [{ text: 'Test', styles: { bold: true } }],
      })
      const cloned = cloneBlock(block)
      expect(cloned.id).not.toBe(block.id)
      expect(cloned.content[0]?.text).toBe('Test')
      expect(cloned.content[0]?.styles?.bold).toBe(true)
      expect(cloned).not.toBe(block)
    })

    it('preserves custom id when provided', () => {
      const block = createBlock('paragraph')
      const cloned = cloneBlock(block, 'custom-id')
      expect(cloned.id).toBe('custom-id')
    })
  })
})
