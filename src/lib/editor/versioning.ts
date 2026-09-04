import { Block, DocumentVersion, Document } from '@/types'

export interface VersionDiff {
  blockId: string
  type: 'added' | 'removed' | 'modified'
  before?: Block
  after?: Block
}

export function createVersion(
  document: Document,
  userId: string,
  message: string
): DocumentVersion {
  return {
    id: Math.random().toString(36).substring(2, 15),
    documentId: document.id,
    blocks: document.blocks.map((b) => ({
      ...b,
      content: b.content.map((c) => ({ ...c, styles: { ...c.styles } })),
      children: b.children.map((child) => ({
        ...child,
        content: child.content.map((c) => ({ ...c, styles: { ...c.styles } })),
      })),
    })),
    createdBy: userId,
    message,
    createdAt: new Date().toISOString(),
  }
}

export function compareVersions(
  before: DocumentVersion,
  after: DocumentVersion
): VersionDiff[] {
  const diffs: VersionDiff[] = []
  const beforeMap = new Map(before.blocks.map((b) => [b.id, b]))
  const afterMap = new Map(after.blocks.map((b) => [b.id, b]))

  for (const [id, block] of afterMap) {
    if (!beforeMap.has(id)) {
      diffs.push({ blockId: id, type: 'added', after: block })
    } else {
      const beforeBlock = beforeMap.get(id)!
      if (JSON.stringify(beforeBlock) !== JSON.stringify(block)) {
        diffs.push({ blockId: id, type: 'modified', before: beforeBlock, after: block })
      }
    }
  }

  for (const [id, block] of beforeMap) {
    if (!afterMap.has(id)) {
      diffs.push({ blockId: id, type: 'removed', before: block })
    }
  }

  return diffs
}

export function getVersionById(
  versions: DocumentVersion[],
  versionId: string
): DocumentVersion | undefined {
  return versions.find((v) => v.id === versionId)
}

export function getLatestVersion(versions: DocumentVersion[]): DocumentVersion | undefined {
  if (versions.length === 0) return undefined
  return versions.reduce((latest, v) =>
    new Date(v.createdAt) > new Date(latest.createdAt) ? v : latest
  )
}

export function getVersionHistory(
  versions: DocumentVersion[],
  limit?: number
): DocumentVersion[] {
  const sorted = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return limit ? sorted.slice(0, limit) : sorted
}

export function restoreVersion(
  document: Document,
  version: DocumentVersion
): Document {
  return {
    ...document,
    blocks: version.blocks.map((b) => ({
      ...b,
      content: b.content.map((c) => ({ ...c, styles: { ...c.styles } })),
      children: b.children.map((child) => ({
        ...child,
        content: child.content.map((c) => ({ ...c, styles: { ...c.styles } })),
      })),
    })),
    updatedAt: new Date().toISOString(),
  }
}

export function pruneOldVersions(
  versions: DocumentVersion[],
  maxCount: number
): DocumentVersion[] {
  if (versions.length <= maxCount) return versions
  const sorted = getVersionHistory(versions)
  return sorted.slice(0, maxCount)
}

export function autoSaveVersion(
  document: Document,
  userId: string,
  lastVersion?: DocumentVersion
): DocumentVersion | null {
  if (!lastVersion) {
    return createVersion(document, userId, 'Auto-save')
  }

  const currentBlocks = JSON.stringify(document.blocks)
  const lastBlocks = JSON.stringify(lastVersion.blocks)

  if (currentBlocks === lastBlocks) return null

  const timeSinceLastSave =
    Date.now() - new Date(lastVersion.createdAt).getTime()

  if (timeSinceLastSave < 30000) return null

  return createVersion(document, userId, 'Auto-save')
}

export function getVersionStats(versions: DocumentVersion[]): {
  totalVersions: number
  contributors: string[]
  firstVersion: string | null
  lastVersion: string | null
} {
  const contributors = [...new Set(versions.map((v) => v.createdBy))]
  const sorted = getVersionHistory(versions)
  return {
    totalVersions: versions.length,
    contributors,
    firstVersion: sorted[sorted.length - 1]?.createdAt ?? null,
    lastVersion: sorted[0]?.createdAt ?? null,
  }
}
