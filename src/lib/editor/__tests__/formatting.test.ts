import {
  applyFormat,
  removeFormat,
  toggleFormat,
  setPlainText,
  getContentAsPlainText,
  insertText,
  deleteText,
  replaceText,
  getWordCount,
  getCharCount,
  getSentenceCount,
  getReadingTime,
  highlightText,
  createLink,
  removeLink,
} from '@/lib/editor/formatting'
import { BlockContent } from '@/types'

describe('formatting', () => {
  describe('applyFormat', () => {
    it('applies bold format to content', () => {
      const content: BlockContent[] = [{ text: 'Hello World', styles: {} }]
      const result = applyFormat(content, { start: 0, end: 5, style: 'bold' })
      expect(result[0]?.styles?.bold).toBe(true)
    })

    it('does not modify text', () => {
      const content: BlockContent[] = [{ text: 'Hello', styles: {} }]
      const result = applyFormat(content, { start: 0, end: 5, style: 'bold' })
      expect(result[0]?.text).toBe('Hello')
    })
  })

  describe('removeFormat', () => {
    it('removes format from content', () => {
      const content: BlockContent[] = [{ text: 'Hello', styles: { bold: true } }]
      const result = removeFormat(content, { start: 0, end: 5, style: 'bold' })
      expect(result[0]?.styles?.bold).toBeUndefined()
    })
  })

  describe('toggleFormat', () => {
    it('adds format when not present', () => {
      const content: BlockContent[] = [{ text: 'Hello', styles: {} }]
      const result = toggleFormat(content, { start: 0, end: 5, style: 'italic' })
      expect(result[0]?.styles?.italic).toBe(true)
    })

    it('removes format when present', () => {
      const content: BlockContent[] = [{ text: 'Hello', styles: { italic: true } }]
      const result = toggleFormat(content, { start: 0, end: 5, style: 'italic' })
      expect(result[0]?.styles?.italic).toBeUndefined()
    })
  })

  describe('setPlainText', () => {
    it('creates content from plain text', () => {
      const result = setPlainText('Hello world')
      expect(result).toEqual([{ text: 'Hello world', styles: {} }])
    })

    it('handles empty string', () => {
      const result = setPlainText('')
      expect(result).toEqual([{ text: '', styles: {} }])
    })
  })

  describe('getContentAsPlainText', () => {
    it('joins content text', () => {
      const content: BlockContent[] = [
        { text: 'Hello', styles: {} },
        { text: 'World', styles: {} },
      ]
      expect(getContentAsPlainText(content)).toBe('HelloWorld')
    })

    it('returns empty string for empty content', () => {
      expect(getContentAsPlainText([])).toBe('')
    })
  })

  describe('insertText', () => {
    it('inserts text at position', () => {
      const content: BlockContent[] = [{ text: 'Hello', styles: {} }]
      const result = insertText(content, 5, ' World')
      expect(result[0]?.text).toBe('Hello World')
    })

    it('inserts at beginning', () => {
      const content: BlockContent[] = [{ text: 'World', styles: {} }]
      const result = insertText(content, 0, 'Hello ')
      expect(result[0]?.text).toBe('Hello World')
    })

    it('creates new content if empty', () => {
      const result = insertText([], 0, 'Hello')
      expect(result[0]?.text).toBe('Hello')
    })
  })

  describe('deleteText', () => {
    it('deletes text in range', () => {
      const content: BlockContent[] = [{ text: 'Hello World', styles: {} }]
      const result = deleteText(content, 5, 11)
      expect(result[0]?.text).toBe('Hello')
    })

    it('returns original if empty content', () => {
      const result = deleteText([], 0, 5)
      expect(result).toHaveLength(0)
    })
  })

  describe('getWordCount', () => {
    it('counts words', () => {
      const content: BlockContent[] = [{ text: 'Hello World Foo', styles: {} }]
      expect(getWordCount(content)).toBe(3)
    })

    it('returns 0 for empty text', () => {
      const content: BlockContent[] = [{ text: '', styles: {} }]
      expect(getWordCount(content)).toBe(0)
    })

    it('handles multiple spaces', () => {
      const content: BlockContent[] = [{ text: 'Hello   World', styles: {} }]
      expect(getWordCount(content)).toBe(2)
    })
  })

  describe('getCharCount', () => {
    it('counts characters', () => {
      const content: BlockContent[] = [{ text: 'Hello', styles: {} }]
      expect(getCharCount(content)).toBe(5)
    })

    it('returns 0 for empty', () => {
      expect(getCharCount([])).toBe(0)
    })
  })

  describe('getSentenceCount', () => {
    it('counts sentences', () => {
      const content: BlockContent[] = [{ text: 'Hello. World! How are you?', styles: {} }]
      expect(getSentenceCount(content)).toBe(3)
    })

    it('returns 0 for empty', () => {
      expect(getSentenceCount([])).toBe(0)
    })
  })

  describe('getReadingTime', () => {
    it('calculates reading time in minutes', () => {
      const content: BlockContent[] = [{ text: 'word '.repeat(200), styles: {} }]
      expect(getReadingTime(content)).toBe(1)
    })

    it('returns 0 for empty', () => {
      expect(getReadingTime([])).toBe(0)
    })
  })

  describe('highlightText', () => {
    it('marks matching text with highlight style', () => {
      const content: BlockContent[] = [{ text: 'Hello World', styles: {} }]
      const result = highlightText(content, 'Hello')
      expect(result[0]?.styles?.highlight).toBe(true)
    })

    it('does not mark non-matching text', () => {
      const content: BlockContent[] = [{ text: 'Hello World', styles: {} }]
      const result = highlightText(content, 'xyz')
      expect(result[0]?.styles?.highlight).toBeUndefined()
    })

    it('handles empty search term', () => {
      const content: BlockContent[] = [{ text: 'Hello', styles: {} }]
      const result = highlightText(content, '')
      expect(result).toEqual(content)
    })
  })

  describe('createLink', () => {
    it('adds link to content', () => {
      const content: BlockContent[] = [{ text: 'Click here', styles: {} }]
      const result = createLink(content, 'https://example.com')
      expect(result[0]?.href).toBe('https://example.com')
      expect(result[0]?.styles?.link).toBe(true)
    })
  })

  describe('removeLink', () => {
    it('removes link from content', () => {
      const content: BlockContent[] = [
        { text: 'Click', styles: { link: true }, href: 'https://example.com' },
      ]
      const result = removeLink(content)
      expect(result[0]?.href).toBeUndefined()
      expect(result[0]?.styles?.link).toBeUndefined()
    })
  })
})
