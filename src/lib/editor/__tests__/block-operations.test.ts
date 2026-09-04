import {
  insertBlock,
  insertBlockAfter,
  insertBlockBefore,
  removeBlock,
  removeBlocks,
  moveBlock,
  moveBlockUp,
  moveBlockDown,
  duplicateBlock,
  updateBlock,
  updateBlockContent,
  splitBlock,
  mergeBlocks,
  replaceBlockType,
  getBlockIndex,
  getBlockById,
  getAdjacentBlocks,
  flattenBlocks,
} from '@/lib/editor/block-operations'
import { createBlock } from '@/lib/editor/block-schema'
import { Block } from '@/types'

function makeBlocks(count: number): Block[] {
  return Array.from({ length: count }, (_, i) =>
    createBlock('paragraph', { id: `block-${i}`, content: [{ text: `Block ${i}`, styles: {} }] })
  )
}

describe('block-operations', () => {
  describe('insertBlock', () => {
    it('inserts a block at the beginning', () => {
      const blocks = makeBlocks(3)
      const result = insertBlock(blocks, 0, 'heading')
      expect(result).toHaveLength(4)
      expect(result[0]?.type).toBe('heading')
    })

    it('inserts a block at the end', () => {
      const blocks = makeBlocks(3)
      const result = insertBlock(blocks, 3, 'code')
      expect(result).toHaveLength(4)
      expect(result[3]?.type).toBe('code')
    })

    it('inserts a block in the middle', () => {
      const blocks = makeBlocks(3)
      const result = insertBlock(blocks, 2, 'quote')
      expect(result).toHaveLength(4)
      expect(result[2]?.type).toBe('quote')
    })

    it('does not mutate original array', () => {
      const blocks = makeBlocks(2)
      insertBlock(blocks, 0, 'heading')
      expect(blocks).toHaveLength(2)
    })

    it('sets custom content on new block', () => {
      const blocks = makeBlocks(1)
      const result = insertBlock(blocks, 0, 'paragraph', [{ text: 'Custom', styles: {} }])
      expect(result[0]?.content[0]?.text).toBe('Custom')
    })
  })

  describe('insertBlockAfter', () => {
    it('inserts after specified block', () => {
      const blocks = makeBlocks(3)
      const result = insertBlockAfter(blocks, 'block-1', 'heading')
      const index = result.findIndex((b) => b.type === 'heading')
      expect(index).toBe(2)
    })

    it('returns original if block not found', () => {
      const blocks = makeBlocks(2)
      const result = insertBlockAfter(blocks, 'nonexistent', 'heading')
      expect(result).toHaveLength(2)
    })
  })

  describe('insertBlockBefore', () => {
    it('inserts before specified block', () => {
      const blocks = makeBlocks(3)
      const result = insertBlockBefore(blocks, 'block-1', 'heading')
      const index = result.findIndex((b) => b.type === 'heading')
      expect(index).toBe(1)
    })

    it('returns original if block not found', () => {
      const blocks = makeBlocks(2)
      const result = insertBlockBefore(blocks, 'nonexistent', 'heading')
      expect(result).toHaveLength(2)
    })
  })

  describe('removeBlock', () => {
    it('removes a block by id', () => {
      const blocks = makeBlocks(3)
      const result = removeBlock(blocks, 'block-1')
      expect(result).toHaveLength(2)
      expect(result.find((b) => b.id === 'block-1')).toBeUndefined()
    })

    it('returns original if block not found', () => {
      const blocks = makeBlocks(2)
      const result = removeBlock(blocks, 'nonexistent')
      expect(result).toHaveLength(2)
    })
  })

  describe('removeBlocks', () => {
    it('removes multiple blocks', () => {
      const blocks = makeBlocks(5)
      const result = removeBlocks(blocks, ['block-0', 'block-2', 'block-4'])
      expect(result).toHaveLength(2)
    })

    it('handles empty removal list', () => {
      const blocks = makeBlocks(3)
      const result = removeBlocks(blocks, [])
      expect(result).toHaveLength(3)
    })
  })

  describe('moveBlock', () => {
    it('moves a block to a new position', () => {
      const blocks = makeBlocks(3)
      const result = moveBlock(blocks, 'block-0', 2)
      expect(result[2]?.id).toBe('block-0')
      expect(result[0]?.id).toBe('block-1')
    })

    it('returns original if block not found', () => {
      const blocks = makeBlocks(2)
      const result = moveBlock(blocks, 'nonexistent', 0)
      expect(result).toEqual(blocks)
    })
  })

  describe('moveBlockUp', () => {
    it('moves block up one position', () => {
      const blocks = makeBlocks(3)
      const result = moveBlockUp(blocks, 'block-1')
      expect(result[0]?.id).toBe('block-1')
      expect(result[1]?.id).toBe('block-0')
    })

    it('does not move first block up', () => {
      const blocks = makeBlocks(3)
      const result = moveBlockUp(blocks, 'block-0')
      expect(result[0]?.id).toBe('block-0')
    })
  })

  describe('moveBlockDown', () => {
    it('moves block down one position', () => {
      const blocks = makeBlocks(3)
      const result = moveBlockDown(blocks, 'block-0')
      expect(result[0]?.id).toBe('block-1')
      expect(result[1]?.id).toBe('block-0')
    })

    it('does not move last block down', () => {
      const blocks = makeBlocks(3)
      const result = moveBlockDown(blocks, 'block-2')
      expect(result[2]?.id).toBe('block-2')
    })
  })

  describe('duplicateBlock', () => {
    it('duplicates a block after the original', () => {
      const blocks = makeBlocks(3)
      const result = duplicateBlock(blocks, 'block-1')
      expect(result).toHaveLength(4)
      expect(result[1]?.id).not.toBe(result[2]?.id)
    })

    it('returns original if block not found', () => {
      const blocks = makeBlocks(2)
      const result = duplicateBlock(blocks, 'nonexistent')
      expect(result).toHaveLength(2)
    })
  })

  describe('updateBlock', () => {
    it('updates block properties', () => {
      const blocks = makeBlocks(2)
      const result = updateBlock(blocks, 'block-0', { type: 'heading' })
      expect(result[0]?.type).toBe('heading')
    })

    it('does not update other blocks', () => {
      const blocks = makeBlocks(2)
      const result = updateBlock(blocks, 'block-0', { type: 'heading' })
      expect(result[1]?.type).toBe('paragraph')
    })
  })

  describe('updateBlockContent', () => {
    it('updates block content', () => {
      const blocks = makeBlocks(1)
      const result = updateBlockContent(blocks, 'block-0', [{ text: 'Updated', styles: {} }])
      expect(result[0]?.content[0]?.text).toBe('Updated')
    })
  })

  describe('splitBlock', () => {
    it('splits a block at the given index', () => {
      const blocks = [createBlock('paragraph', { id: 'b1', content: [{ text: 'Hello World', styles: {} }] })]
      const result = splitBlock(blocks, 'b1', 5)
      expect(result).toHaveLength(2)
      expect(result[0]?.content[0]?.text).toBe('Hello')
      expect(result[1]?.content[0]?.text).toBe(' World')
    })

    it('returns original if block not found', () => {
      const blocks = makeBlocks(1)
      const result = splitBlock(blocks, 'nonexistent', 5)
      expect(result).toHaveLength(1)
    })
  })

  describe('mergeBlocks', () => {
    it('merges two adjacent blocks', () => {
      const blocks = makeBlocks(2)
      const result = mergeBlocks(blocks, 'block-0', 'block-1')
      expect(result).toHaveLength(1)
      expect(result[0]?.content[0]?.text).toContain('Block 0')
      expect(result[0]?.content[0]?.text).toContain('Block 1')
    })

    it('returns original if blocks not found', () => {
      const blocks = makeBlocks(2)
      const result = mergeBlocks(blocks, 'nonexistent', 'block-1')
      expect(result).toHaveLength(2)
    })
  })

  describe('replaceBlockType', () => {
    it('changes block type', () => {
      const blocks = makeBlocks(1)
      const result = replaceBlockType(blocks, 'block-0', 'heading')
      expect(result[0]?.type).toBe('heading')
    })
  })

  describe('getBlockIndex', () => {
    it('returns correct index', () => {
      const blocks = makeBlocks(3)
      expect(getBlockIndex(blocks, 'block-1')).toBe(1)
    })

    it('returns -1 for missing block', () => {
      const blocks = makeBlocks(2)
      expect(getBlockIndex(blocks, 'nonexistent')).toBe(-1)
    })
  })

  describe('getBlockById', () => {
    it('returns the block', () => {
      const blocks = makeBlocks(3)
      expect(getBlockById(blocks, 'block-2')?.id).toBe('block-2')
    })

    it('returns undefined for missing block', () => {
      const blocks = makeBlocks(2)
      expect(getBlockById(blocks, 'nonexistent')).toBeUndefined()
    })
  })

  describe('getAdjacentBlocks', () => {
    it('returns prev and next blocks', () => {
      const blocks = makeBlocks(3)
      const result = getAdjacentBlocks(blocks, 'block-1')
      expect(result.prev?.id).toBe('block-0')
      expect(result.next?.id).toBe('block-2')
    })

    it('returns null for first block', () => {
      const blocks = makeBlocks(3)
      const result = getAdjacentBlocks(blocks, 'block-0')
      expect(result.prev).toBeNull()
      expect(result.next?.id).toBe('block-1')
    })

    it('returns null for last block', () => {
      const blocks = makeBlocks(3)
      const result = getAdjacentBlocks(blocks, 'block-2')
      expect(result.prev?.id).toBe('block-1')
      expect(result.next).toBeNull()
    })
  })

  describe('flattenBlocks', () => {
    it('flattens nested blocks', () => {
      const parent = createBlock('bulletList', { id: 'parent' })
      const child = createBlock('paragraph', { id: 'child' })
      parent.children = [child]
      const result = flattenBlocks([parent])
      expect(result).toHaveLength(2)
      expect(result[0]?.id).toBe('parent')
      expect(result[1]?.id).toBe('child')
    })

    it('handles flat blocks', () => {
      const blocks = makeBlocks(3)
      expect(flattenBlocks(blocks)).toHaveLength(3)
    })
  })
})
