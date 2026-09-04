import { BlockContent } from '@/types'

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  lineNumber: number
}

export interface DiffResult {
  lines: DiffLine[]
  additions: number
  deletions: number
  changes: number
}

export function computeDiff(
  oldText: string,
  newText: string
): DiffResult {
  const oldLines = oldText.split('\n')
  const newLines = newText.split('\n')
  const lines: DiffLine[] = []

  let oldIdx = 0
  let newIdx = 0
  let lineNum = 1

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (oldIdx >= oldLines.length) {
      lines.push({ type: 'added', content: newLines[newIdx]!, lineNumber: lineNum++ })
      newIdx++
    } else if (newIdx >= newLines.length) {
      lines.push({ type: 'removed', content: oldLines[oldIdx]!, lineNumber: lineNum++ })
      oldIdx++
    } else if (oldLines[oldIdx] === newLines[newIdx]) {
      lines.push({ type: 'unchanged', content: oldLines[oldIdx]!, lineNumber: lineNum++ })
      oldIdx++
      newIdx++
    } else {
      lines.push({ type: 'removed', content: oldLines[oldIdx]!, lineNumber: lineNum++ })
      lines.push({ type: 'added', content: newLines[newIdx]!, lineNumber: lineNum++ })
      oldIdx++
      newIdx++
    }
  }

  const additions = lines.filter((l) => l.type === 'added').length
  const deletions = lines.filter((l) => l.type === 'removed').length

  return { lines, additions, deletions, changes: additions + deletions }
}

export function computeWordDiff(
  oldText: string,
  newText: string
): DiffResult {
  const oldWords = oldText.split(/\s+/)
  const newWords = newText.split(/\s+/)
  const lines: DiffLine[] = []

  let lineNum = 1

  const maxLen = Math.max(oldWords.length, newWords.length)
  for (let i = 0; i < maxLen; i++) {
    if (i >= oldWords.length) {
      lines.push({ type: 'added', content: newWords[i]!, lineNumber: lineNum++ })
    } else if (i >= newWords.length) {
      lines.push({ type: 'removed', content: oldWords[i]!, lineNumber: lineNum++ })
    } else if (oldWords[i] === newWords[i]) {
      lines.push({ type: 'unchanged', content: oldWords[i]!, lineNumber: lineNum++ })
    } else {
      lines.push({ type: 'removed', content: oldWords[i]!, lineNumber: lineNum++ })
      lines.push({ type: 'added', content: newWords[i]!, lineNumber: lineNum++ })
    }
  }

  const additions = lines.filter((l) => l.type === 'added').length
  const deletions = lines.filter((l) => l.type === 'removed').length

  return { lines, additions, deletions, changes: additions + deletions }
}

export function contentToText(content: BlockContent[]): string {
  return content.map((c) => c.text).join('')
}

export function computeContentDiff(
  oldContent: BlockContent[],
  newContent: BlockContent[]
): DiffResult {
  return computeDiff(contentToText(oldContent), contentToText(newContent))
}

export function getDiffStats(diff: DiffResult): {
  totalChanges: number
  percentChanged: number
  summary: string
} {
  const totalLines = diff.lines.length
  const percentChanged = totalLines > 0 ? (diff.changes / totalLines) * 100 : 0

  let summary = ''
  if (diff.additions > 0 && diff.deletions > 0) {
    summary = `+${diff.additions} -${diff.deletions}`
  } else if (diff.additions > 0) {
    summary = `+${diff.additions} additions`
  } else if (diff.deletions > 0) {
    summary = `-${diff.deletions} deletions`
  } else {
    summary = 'No changes'
  }

  return { totalChanges: diff.changes, percentChanged, summary }
}

export function formatDiffAsMarkdown(diff: DiffResult): string {
  return diff.lines
    .map((line) => {
      switch (line.type) {
        case 'added':
          return `+ ${line.content}`
        case 'removed':
          return `- ${line.content}`
        case 'unchanged':
          return `  ${line.content}`
      }
    })
    .join('\n')
}

export function hasChanges(diff: DiffResult): boolean {
  return diff.changes > 0
}
