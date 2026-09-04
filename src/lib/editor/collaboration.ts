import * as Y from 'yjs'
import { Block } from '@/types'

export interface PresenceState {
  userId: string
  name: string
  color: string
  cursor: { blockId: string; offset: number } | null
  lastActive: string
}

export interface CollaborationEvent {
  type: 'awareness' | 'update' | 'awareness:change'
  data: unknown
}

export class CollaborationManager {
  private doc: Y.Doc
  private awareness: Map<string, PresenceState> = new Map()
  private listeners: Map<string, Set<(event: CollaborationEvent) => void>> = new Map()
  private userId: string

  constructor(userId: string) {
    this.userId = userId
    this.doc = new Y.Doc()
  }

  getDoc(): Y.Doc {
    return this.doc
  }

  getBlocks(): Block[] {
    const yBlocks = this.doc.getArray<Block>('blocks')
    return yBlocks.toArray()
  }

  setBlocks(blocks: Block[]): void {
    const yBlocks = this.doc.getArray<Block>('blocks')
    this.doc.transact(() => {
      yBlocks.delete(0, yBlocks.length)
      yBlocks.push(blocks)
    })
  }

  updateBlock(blockId: string, updates: Partial<Block>): void {
    const yBlocks = this.doc.getArray<Block>('blocks')
    const blocks = yBlocks.toArray()
    const index = blocks.findIndex((b) => b.id === blockId)
    if (index === -1) return

    const updated = { ...blocks[index], ...updates, updatedAt: new Date().toISOString() }
    this.doc.transact(() => {
      yBlocks.delete(index, 1)
      yBlocks.insert(index, [updated])
    })
  }

  insertBlock(index: number, block: Block): void {
    const yBlocks = this.doc.getArray<Block>('blocks')
    this.doc.transact(() => {
      yBlocks.insert(index, [block])
    })
  }

  removeBlock(blockId: string): void {
    const yBlocks = this.doc.getArray<Block>('blocks')
    const blocks = yBlocks.toArray()
    const index = blocks.findIndex((b) => b.id === blockId)
    if (index === -1) return
    this.doc.transact(() => {
      yBlocks.delete(index, 1)
    })
  }

  updatePresence(presence: Partial<PresenceState>): void {
    const current = this.awareness.get(this.userId)
    const updated: PresenceState = {
      userId: this.userId,
      name: current?.name ?? 'Unknown',
      color: current?.color ?? '#000',
      cursor: null,
      lastActive: new Date().toISOString(),
      ...presence,
    }
    this.awareness.set(this.userId, updated)
    this.emit('awareness:change', { userId: this.userId, presence: updated })
  }

  getPresence(userId: string): PresenceState | undefined {
    return this.awareness.get(userId)
  }

  getAllPresence(): PresenceState[] {
    return Array.from(this.awareness.values())
  }

  removePresence(userId: string): void {
    this.awareness.delete(userId)
    this.emit('awareness:change', { userId, removed: true })
  }

  on(event: string, callback: (event: CollaborationEvent) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    return () => {
      this.listeners.get(event)?.delete(callback)
    }
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((cb) => cb({ type: event as CollaborationEvent['type'], data }))
    }
  }

  getUserId(): string {
    return this.userId
  }

  destroy(): void {
    this.awareness.clear()
    this.listeners.clear()
    this.doc.destroy()
  }
}

export function createCollaborationManager(userId: string): CollaborationManager {
  return new CollaborationManager(userId)
}

export function mergeYDocUpdates(
  doc1: Y.Doc,
  doc2: Y.Doc
): Y.Doc {
  const merged = new Y.Doc()
  Y.applyUpdate(merged, Y.encodeStateAsUpdate(doc1))
  Y.applyUpdate(merged, Y.encodeStateAsUpdate(doc2))
  return merged
}

export function encodeDocState(doc: Y.Doc): Uint8Array {
  return Y.encodeStateAsUpdate(doc)
}

export function decodeDocState(data: Uint8Array): Y.Doc {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, data)
  return doc
}
