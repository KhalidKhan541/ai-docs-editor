import { Block, BlockContent } from '@/types'

export interface FormatRange {
  start: number
  end: number
  style: string
}

export function applyFormat(
  content: BlockContent[],
  range: FormatRange
): BlockContent[] {
  return content.map((item) => {
    const text = item.text
    const before = text.substring(0, range.start)
    const selected = text.substring(range.start, range.end)
    const after = text.substring(range.end)

    if (!selected) return item

    return {
      text: item.text,
      styles: {
        ...item.styles,
        [range.style]: true,
      },
    }
  })
}

export function removeFormat(
  content: BlockContent[],
  range: FormatRange
): BlockContent[] {
  return content.map((item) => {
    const newStyles = { ...item.styles }
    delete newStyles[range.style]
    return { ...item, styles: newStyles }
  })
}

export function toggleFormat(
  content: BlockContent[],
  range: FormatRange
): BlockContent[] {
  const currentStyles = content[0]?.styles ?? {}
  if (currentStyles[range.style]) {
    return removeFormat(content, range)
  }
  return applyFormat(content, range)
}

export function setPlainText(text: string): BlockContent[] {
  return [{ text, styles: {} }]
}

export function getContentAsPlainText(content: BlockContent[]): string {
  return content.map((c) => c.text).join('')
}

export function insertText(
  content: BlockContent[],
  position: number,
  text: string
): BlockContent[] {
  if (content.length === 0) {
    return [{ text, styles: {} }]
  }

  const item = content[0]
  const newText =
    item.text.substring(0, position) + text + item.text.substring(position)

  return [{ ...item, text: newText }]
}

export function deleteText(
  content: BlockContent[],
  start: number,
  end: number
): BlockContent[] {
  if (content.length === 0) return content

  const item = content[0]
  const newText =
    item.text.substring(0, start) + item.text.substring(end)

  return [{ ...item, text: newText }]
}

export function replaceText(
  content: BlockContent[],
  start: number,
  end: number,
  replacement: string
): BlockContent[] {
  return deleteText(content, start, end).then
    ? deleteText(content, start, end)
    : insertText(deleteText(content, start, end), start, replacement)
}

export function getWordCount(content: BlockContent[]): number {
  const text = getContentAsPlainText(content)
  if (!text.trim()) return 0
  return text.split(/\s+/).filter(Boolean).length
}

export function getCharCount(content: BlockContent[]): number {
  return getContentAsPlainText(content).length
}

export function getSentenceCount(content: BlockContent[]): number {
  const text = getContentAsPlainText(content)
  if (!text.trim()) return 0
  return text.split(/[.!?]+/).filter((s) => s.trim()).length
}

export function getReadingTime(content: BlockContent[]): number {
  const words = getWordCount(content)
  return Math.ceil(words / 200)
}

export function highlightText(
  content: BlockContent[],
  searchTerm: string
): BlockContent[] {
  if (!searchTerm) return content
  return content.map((item) => {
    if (!item.text.toLowerCase().includes(searchTerm.toLowerCase())) {
      return item
    }
    return {
      ...item,
      styles: {
        ...item.styles,
        highlight: true,
      },
    }
  })
}

export function createLink(
  content: BlockContent[],
  url: string
): BlockContent[] {
  return content.map((item) => ({
    ...item,
    href: url,
    styles: {
      ...item.styles,
      link: true,
    },
  }))
}

export function removeLink(content: BlockContent[]): BlockContent[] {
  return content.map((item) => {
    const newStyles = { ...item.styles }
    delete newStyles.link
    return { ...item, href: undefined, styles: newStyles }
  })
}
