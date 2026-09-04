import {
  computeDiff,
  computeWordDiff,
  contentToText,
  computeContentDiff,
  getDiffStats,
  formatDiffAsMarkdown,
  hasChanges,
} from '@/lib/suggestions/diff-engine'
import { BlockContent } from '@/types'

describe('diff-engine', () => {
  describe('computeDiff', () => {
    it('detects identical text', () => {
      const diff = computeDiff('Hello', 'Hello')
      expect(diff.additions).toBe(0)
      expect(diff.deletions).toBe(0)
      expect(diff.lines.every((l) => l.type === 'unchanged')).toBe(true)
    })

    it('detects additions', () => {
      const diff = computeDiff('', 'New line')
      expect(diff.additions).toBe(1)
      expect(diff.deletions).toBe(0)
    })

    it('detects deletions', () => {
      const diff = computeDiff('Old line', '')
      expect(diff.additions).toBe(0)
      expect(diff.deletions).toBe(1)
    })

    it('detects modifications', () => {
      const diff = computeDiff('Hello', 'World')
      expect(diff.additions).toBe(1)
      expect(diff.deletions).toBe(1)
    })

    it('handles multi-line diffs', () => {
      const old = 'Line 1\nLine 2\nLine 3'
      const new_ = 'Line 1\nModified\nLine 3'
      const diff = computeDiff(old, new_)
      expect(diff.additions).toBe(1)
      expect(diff.deletions).toBe(1)
      expect(diff.lines).toHaveLength(5)
    })

    it('handles empty strings', () => {
      const diff = computeDiff('', '')
      expect(diff.changes).toBe(0)
    })
  })

  describe('computeWordDiff', () => {
    it('detects word-level changes', () => {
      const diff = computeWordDiff('Hello World', 'Hello Universe')
      expect(diff.additions).toBe(1)
      expect(diff.deletions).toBe(1)
    })

    it('detects word additions', () => {
      const diff = computeWordDiff('Hello', 'Hello World')
      expect(diff.additions).toBe(1)
    })

    it('detects word deletions', () => {
      const diff = computeWordDiff('Hello World', 'Hello')
      expect(diff.deletions).toBe(1)
    })
  })

  describe('contentToText', () => {
    it('joins content text', () => {
      const content: BlockContent[] = [
        { text: 'Hello', styles: {} },
        { text: ' World', styles: {} },
      ]
      expect(contentToText(content)).toBe('Hello World')
    })

    it('returns empty for empty content', () => {
      expect(contentToText([])).toBe('')
    })
  })

  describe('computeContentDiff', () => {
    it('computes diff between content arrays', () => {
      const old: BlockContent[] = [{ text: 'Hello', styles: {} }]
      const new_: BlockContent[] = [{ text: 'World', styles: {} }]
      const diff = computeContentDiff(old, new_)
      expect(diff.changes).toBeGreaterThan(0)
    })
  })

  describe('getDiffStats', () => {
    it('calculates stats for changes', () => {
      const diff = computeDiff('Hello', 'World')
      const stats = getDiffStats(diff)
      expect(stats.totalChanges).toBe(2)
      expect(stats.percentChanged).toBeGreaterThan(0)
      expect(stats.summary).toContain('+')
      expect(stats.summary).toContain('-')
    })

    it('reports no changes', () => {
      const diff = computeDiff('Hello', 'Hello')
      const stats = getDiffStats(diff)
      expect(stats.totalChanges).toBe(0)
      expect(stats.summary).toBe('No changes')
    })

    it('reports only additions', () => {
      const diff = computeDiff('', 'New')
      const stats = getDiffStats(diff)
      expect(stats.summary).toContain('additions')
    })

    it('reports only deletions', () => {
      const diff = computeDiff('Old', '')
      const stats = getDiffStats(diff)
      expect(stats.summary).toContain('deletions')
    })
  })

  describe('formatDiffAsMarkdown', () => {
    it('formats additions with + prefix', () => {
      const diff = computeDiff('', 'New')
      const md = formatDiffAsMarkdown(diff)
      expect(md).toContain('+ New')
    })

    it('formats deletions with - prefix', () => {
      const diff = computeDiff('Old', '')
      const md = formatDiffAsMarkdown(diff)
      expect(md).toContain('- Old')
    })

    it('formats unchanged with space prefix', () => {
      const diff = computeDiff('Hello', 'Hello')
      const md = formatDiffAsMarkdown(diff)
      expect(md).toContain('  Hello')
    })
  })

  describe('hasChanges', () => {
    it('returns true when there are changes', () => {
      const diff = computeDiff('Hello', 'World')
      expect(hasChanges(diff)).toBe(true)
    })

    it('returns false when no changes', () => {
      const diff = computeDiff('Hello', 'Hello')
      expect(hasChanges(diff)).toBe(false)
    })
  })
})
