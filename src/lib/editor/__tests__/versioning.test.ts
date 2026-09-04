import {
  createVersion,
  compareVersions,
  getVersionById,
  getLatestVersion,
  getVersionHistory,
  restoreVersion,
  pruneOldVersions,
  autoSaveVersion,
  getVersionStats,
} from '@/lib/editor/versioning'
import { Document, DocumentVersion } from '@/types'
import { createBlock } from '@/lib/editor/block-schema'

function makeDocument(overrides?: Partial<Document>): Document {
  return {
    id: 'doc-1',
    title: 'Test Document',
    blocks: [createBlock('paragraph', { id: 'b1' })],
    ownerId: 'user-1',
    collaborators: [],
    versions: [],
    comments: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isPublished: false,
    ...overrides,
  }
}

function makeVersion(overrides?: Partial<DocumentVersion>): DocumentVersion {
  return {
    id: 'v1',
    documentId: 'doc-1',
    blocks: [createBlock('paragraph', { id: 'b1' })],
    createdBy: 'user-1',
    message: 'Initial version',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('versioning', () => {
  describe('createVersion', () => {
    it('creates a version from document state', () => {
      const doc = makeDocument()
      const version = createVersion(doc, 'user-1', 'Test version')
      expect(version.id).toBeTruthy()
      expect(version.documentId).toBe('doc-1')
      expect(version.createdBy).toBe('user-1')
      expect(version.message).toBe('Test version')
      expect(version.blocks).toHaveLength(1)
    })

    it('deep copies blocks', () => {
      const doc = makeDocument()
      const version = createVersion(doc, 'user-1', 'Test')
      expect(version.blocks[0]?.id).toBe(doc.blocks[0]?.id)
      expect(version.blocks).not.toBe(doc.blocks)
    })
  })

  describe('compareVersions', () => {
    it('detects added blocks', () => {
      const v1 = makeVersion({ blocks: [] })
      const v2 = makeVersion({ blocks: [createBlock('paragraph', { id: 'new' })] })
      const diffs = compareVersions(v1, v2)
      expect(diffs).toHaveLength(1)
      expect(diffs[0]?.type).toBe('added')
    })

    it('detects removed blocks', () => {
      const v1 = makeVersion({ blocks: [createBlock('paragraph', { id: 'old' })] })
      const v2 = makeVersion({ blocks: [] })
      const diffs = compareVersions(v1, v2)
      expect(diffs).toHaveLength(1)
      expect(diffs[0]?.type).toBe('removed')
    })

    it('detects modified blocks', () => {
      const v1 = makeVersion({
        blocks: [createBlock('paragraph', { id: 'b1', content: [{ text: 'Old', styles: {} }] })],
      })
      const v2 = makeVersion({
        blocks: [createBlock('paragraph', { id: 'b1', content: [{ text: 'New', styles: {} }] })],
      })
      const diffs = compareVersions(v1, v2)
      expect(diffs).toHaveLength(1)
      expect(diffs[0]?.type).toBe('modified')
    })

    it('returns empty for identical versions', () => {
      const v1 = makeVersion()
      const v2 = makeVersion({ id: 'v2' })
      const diffs = compareVersions(v1, v2)
      expect(diffs).toHaveLength(0)
    })
  })

  describe('getVersionById', () => {
    it('finds version by id', () => {
      const versions = [makeVersion({ id: 'v1' }), makeVersion({ id: 'v2' })]
      expect(getVersionById(versions, 'v2')?.id).toBe('v2')
    })

    it('returns undefined for unknown id', () => {
      expect(getVersionById([], 'v1')).toBeUndefined()
    })
  })

  describe('getLatestVersion', () => {
    it('returns most recent version', () => {
      const versions = [
        makeVersion({ id: 'v1', createdAt: '2024-01-01T00:00:00Z' }),
        makeVersion({ id: 'v2', createdAt: '2024-01-02T00:00:00Z' }),
      ]
      expect(getLatestVersion(versions)?.id).toBe('v2')
    })

    it('returns undefined for empty list', () => {
      expect(getLatestVersion([])).toBeUndefined()
    })
  })

  describe('getVersionHistory', () => {
    it('returns versions sorted by date descending', () => {
      const versions = [
        makeVersion({ id: 'v1', createdAt: '2024-01-01T00:00:00Z' }),
        makeVersion({ id: 'v3', createdAt: '2024-01-03T00:00:00Z' }),
        makeVersion({ id: 'v2', createdAt: '2024-01-02T00:00:00Z' }),
      ]
      const history = getVersionHistory(versions)
      expect(history[0]?.id).toBe('v3')
      expect(history[1]?.id).toBe('v2')
      expect(history[2]?.id).toBe('v1')
    })

    it('limits results', () => {
      const versions = [
        makeVersion({ id: 'v1', createdAt: '2024-01-01T00:00:00Z' }),
        makeVersion({ id: 'v2', createdAt: '2024-01-02T00:00:00Z' }),
        makeVersion({ id: 'v3', createdAt: '2024-01-03T00:00:00Z' }),
      ]
      expect(getVersionHistory(versions, 2)).toHaveLength(2)
    })
  })

  describe('restoreVersion', () => {
    it('restores document from version', () => {
      const doc = makeDocument({ blocks: [] })
      const version = makeVersion({
        blocks: [createBlock('paragraph', { id: 'restored' })],
      })
      const restored = restoreVersion(doc, version)
      expect(restored.blocks).toHaveLength(1)
      expect(restored.blocks[0]?.id).toBe('restored')
      expect(restored.updatedAt).not.toBe(doc.updatedAt)
    })
  })

  describe('pruneOldVersions', () => {
    it('keeps all versions if under limit', () => {
      const versions = [makeVersion({ id: 'v1' }), makeVersion({ id: 'v2' })]
      expect(pruneOldVersions(versions, 10)).toHaveLength(2)
    })

    it('prunes to max count', () => {
      const versions = [
        makeVersion({ id: 'v1', createdAt: '2024-01-01T00:00:00Z' }),
        makeVersion({ id: 'v2', createdAt: '2024-01-02T00:00:00Z' }),
        makeVersion({ id: 'v3', createdAt: '2024-01-03T00:00:00Z' }),
      ]
      expect(pruneOldVersions(versions, 2)).toHaveLength(2)
    })
  })

  describe('autoSaveVersion', () => {
    it('creates version when no previous version exists', () => {
      const doc = makeDocument()
      const result = autoSaveVersion(doc, 'user-1')
      expect(result).not.toBeNull()
      expect(result?.message).toBe('Auto-save')
    })

    it('returns null if no changes', () => {
      const doc = makeDocument()
      const lastVersion = createVersion(doc, 'user-1', 'Last')
      const result = autoSaveVersion(doc, 'user-1', lastVersion)
      expect(result).toBeNull()
    })

    it('creates version when there are changes', () => {
      const doc = makeDocument()
      const lastVersion = createVersion(doc, 'user-1', 'Last')
      lastVersion.createdAt = new Date(Date.now() - 60000).toISOString()
      doc.blocks = [createBlock('paragraph', { id: 'changed' })]
      const result = autoSaveVersion(doc, 'user-1', lastVersion)
      expect(result).not.toBeNull()
    })
  })

  describe('getVersionStats', () => {
    it('returns version statistics', () => {
      const versions = [
        makeVersion({ id: 'v1', createdBy: 'user-1', createdAt: '2024-01-01T00:00:00Z' }),
        makeVersion({ id: 'v2', createdBy: 'user-2', createdAt: '2024-01-02T00:00:00Z' }),
      ]
      const stats = getVersionStats(versions)
      expect(stats.totalVersions).toBe(2)
      expect(stats.contributors).toContain('user-1')
      expect(stats.contributors).toContain('user-2')
      expect(stats.firstVersion).toBeTruthy()
      expect(stats.lastVersion).toBeTruthy()
    })

    it('handles empty versions', () => {
      const stats = getVersionStats([])
      expect(stats.totalVersions).toBe(0)
      expect(stats.contributors).toHaveLength(0)
      expect(stats.firstVersion).toBeNull()
      expect(stats.lastVersion).toBeNull()
    })
  })
})
