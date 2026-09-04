import { CollaborationManager, createCollaborationManager, encodeDocState, decodeDocState, mergeYDocUpdates } from '@/lib/editor/collaboration'
import { createBlock } from '@/lib/editor/block-schema'

describe('collaboration', () => {
  let manager: CollaborationManager

  beforeEach(() => {
    manager = createCollaborationManager('user-1')
  })

  afterEach(() => {
    manager.destroy()
  })

  describe('CollaborationManager', () => {
    it('creates a manager with user id', () => {
      expect(manager.getUserId()).toBe('user-1')
    })

    it('gets the Y.Doc instance', () => {
      const doc = manager.getDoc()
      expect(doc).toBeDefined()
    })

    it('sets and gets blocks', () => {
      const blocks = [createBlock('paragraph', { id: 'b1' })]
      manager.setBlocks(blocks)
      expect(manager.getBlocks()).toHaveLength(1)
      expect(manager.getBlocks()[0]?.id).toBe('b1')
    })

    it('replaces all blocks on setBlocks', () => {
      manager.setBlocks([createBlock('paragraph', { id: 'b1' })])
      manager.setBlocks([createBlock('paragraph', { id: 'b2' })])
      expect(manager.getBlocks()).toHaveLength(1)
      expect(manager.getBlocks()[0]?.id).toBe('b2')
    })

    it('inserts block at index', () => {
      manager.setBlocks([createBlock('paragraph', { id: 'b1' })])
      manager.insertBlock(0, createBlock('heading', { id: 'h1' }))
      expect(manager.getBlocks()).toHaveLength(2)
      expect(manager.getBlocks()[0]?.id).toBe('h1')
    })

    it('updates a block', () => {
      manager.setBlocks([createBlock('paragraph', { id: 'b1' })])
      manager.updateBlock('b1', { type: 'heading' })
      expect(manager.getBlocks()[0]?.type).toBe('heading')
    })

    it('does nothing for non-existent block update', () => {
      manager.setBlocks([createBlock('paragraph', { id: 'b1' })])
      manager.updateBlock('nonexistent', { type: 'heading' })
      expect(manager.getBlocks()).toHaveLength(1)
    })

    it('removes a block', () => {
      manager.setBlocks([
        createBlock('paragraph', { id: 'b1' }),
        createBlock('paragraph', { id: 'b2' }),
      ])
      manager.removeBlock('b1')
      expect(manager.getBlocks()).toHaveLength(1)
      expect(manager.getBlocks()[0]?.id).toBe('b2')
    })

    it('does nothing for non-existent block removal', () => {
      manager.setBlocks([createBlock('paragraph', { id: 'b1' })])
      manager.removeBlock('nonexistent')
      expect(manager.getBlocks()).toHaveLength(1)
    })
  })

  describe('presence', () => {
    it('updates own presence', () => {
      manager.updatePresence({ name: 'Alice', color: '#ff0000' })
      const presence = manager.getPresence('user-1')
      expect(presence).toBeDefined()
      expect(presence?.name).toBe('Alice')
      expect(presence?.color).toBe('#ff0000')
    })

    it('gets all presence states', () => {
      manager.updatePresence({ name: 'Alice' })
      const all = manager.getAllPresence()
      expect(all).toHaveLength(1)
    })

    it('removes presence', () => {
      manager.updatePresence({ name: 'Alice' })
      manager.removePresence('user-1')
      expect(manager.getPresence('user-1')).toBeUndefined()
    })

    it('sets cursor position', () => {
      manager.updatePresence({
        cursor: { blockId: 'b1', offset: 5 },
      })
      const presence = manager.getPresence('user-1')
      expect(presence?.cursor?.blockId).toBe('b1')
    })
  })

  describe('events', () => {
    it('emits awareness:change on update', () => {
      const callback = jest.fn()
      manager.on('awareness:change', callback)
      manager.updatePresence({ name: 'Alice' })
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'awareness:change',
          data: expect.objectContaining({ userId: 'user-1' }),
        })
      )
    })

    it('emits event on presence removal', () => {
      const callback = jest.fn()
      manager.on('awareness:change', callback)
      manager.removePresence('user-2')
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'awareness:change',
          data: expect.objectContaining({ userId: 'user-2', removed: true }),
        })
      )
    })

    it('returns unsubscribe function', () => {
      const callback = jest.fn()
      const unsubscribe = manager.on('awareness:change', callback)
      unsubscribe()
      manager.updatePresence({ name: 'Alice' })
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('destroy', () => {
    it('cleans up resources', () => {
      const mgr = createCollaborationManager('user-2')
      mgr.setBlocks([createBlock('paragraph')])
      mgr.updatePresence({ name: 'Bob' })
      mgr.destroy()
      expect(mgr.getAllPresence()).toHaveLength(0)
    })
  })
})

describe('encodeDocState / decodeDocState', () => {
  it('round-trips document state', () => {
    const mgr = createCollaborationManager('user-1')
    mgr.setBlocks([createBlock('paragraph', { id: 'b1' })])
    const encoded = encodeDocState(mgr.getDoc())
    const decoded = decodeDocState(encoded)
    expect(decoded).toBeDefined()
    mgr.destroy()
    decoded.destroy()
  })
})

describe('mergeYDocUpdates', () => {
  it('merges two documents', () => {
    const mgr1 = createCollaborationManager('u1')
    const mgr2 = createCollaborationManager('u2')
    mgr1.setBlocks([createBlock('paragraph', { id: 'b1' })])
    mgr2.setBlocks([createBlock('heading', { id: 'h1' })])

    const merged = mergeYDocUpdates(mgr1.getDoc(), mgr2.getDoc())
    expect(merged).toBeDefined()

    mgr1.destroy()
    mgr2.destroy()
    merged.destroy()
  })
})
