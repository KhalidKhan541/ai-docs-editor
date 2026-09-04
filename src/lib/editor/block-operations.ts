import { Block, BlockType, BlockContent } from '@/types'
import { createBlock } from './block-schema'

export function insertBlock(
  blocks: Block[],
  index: number,
  type: BlockType,
  content?: BlockContent[]
): Block[] {
  const newBlock = createBlock(type)
  if (content) {
    newBlock.content = content
  }
  const newBlocks = [...blocks]
  newBlocks.splice(index, 0, newBlock)
  return newBlocks
}

export function insertBlockAfter(
  blocks: Block[],
  afterId: string,
  type: BlockType,
  content?: BlockContent[]
): Block[] {
  const index = blocks.findIndex((b) => b.id === afterId)
  if (index === -1) return blocks
  return insertBlock(blocks, index + 1, type, content)
}

export function insertBlockBefore(
  blocks: Block[],
  beforeId: string,
  type: BlockType,
  content?: BlockContent[]
): Block[] {
  const index = blocks.findIndex((b) => b.id === beforeId)
  if (index === -1) return blocks
  return insertBlock(blocks, index, type, content)
}

export function removeBlock(blocks: Block[], blockId: string): Block[] {
  return blocks.filter((b) => b.id !== blockId)
}

export function removeBlocks(blocks: Block[], blockIds: string[]): Block[] {
  const idSet = new Set(blockIds)
  return blocks.filter((b) => !idSet.has(b.id))
}

export function moveBlock(
  blocks: Block[],
  blockId: string,
  newIndex: number
): Block[] {
  const index = blocks.findIndex((b) => b.id === blockId)
  if (index === -1) return blocks
  const newBlocks = [...blocks]
  const [moved] = newBlocks.splice(index, 1)
  newBlocks.splice(newIndex, 0, moved)
  return newBlocks
}

export function moveBlockUp(blocks: Block[], blockId: string): Block[] {
  const index = blocks.findIndex((b) => b.id === blockId)
  if (index <= 0) return blocks
  return moveBlock(blocks, blockId, index - 1)
}

export function moveBlockDown(blocks: Block[], blockId: string): Block[] {
  const index = blocks.findIndex((b) => b.id === blockId)
  if (index === -1 || index >= blocks.length - 1) return blocks
  return moveBlock(blocks, blockId, index + 1)
}

export function duplicateBlock(blocks: Block[], blockId: string): Block[] {
  const index = blocks.findIndex((b) => b.id === blockId)
  if (index === -1) return blocks
  const original = blocks[index]
  const clone: Block = {
    ...original,
    id: Math.random().toString(36).substring(2, 15),
    content: original.content.map((c) => ({ ...c, styles: { ...c.styles } })),
    children: original.children.map((child) => ({
      ...child,
      id: Math.random().toString(36).substring(2, 15),
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const newBlocks = [...blocks]
  newBlocks.splice(index + 1, 0, clone)
  return newBlocks
}

export function updateBlock(
  blocks: Block[],
  blockId: string,
  updates: Partial<Block>
): Block[] {
  return blocks.map((b) =>
    b.id === blockId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
  )
}

export function updateBlockContent(
  blocks: Block[],
  blockId: string,
  content: BlockContent[]
): Block[] {
  return updateBlock(blocks, blockId, { content })
}

export function splitBlock(
  blocks: Block[],
  blockId: string,
  splitIndex: number
): Block[] {
  const index = blocks.findIndex((b) => b.id === blockId)
  if (index === -1) return blocks

  const block = blocks[index]
  const text = block.content.map((c) => c.text).join('')
  const firstPart = text.substring(0, splitIndex)
  const secondPart = text.substring(splitIndex)

  const updatedBlock: Block = {
    ...block,
    content: [{ text: firstPart, styles: {} }],
    updatedAt: new Date().toISOString(),
  }

  const newBlock: Block = createBlock(block.type, {
    content: [{ text: secondPart, styles: {} }],
  })

  const newBlocks = [...blocks]
  newBlocks.splice(index, 1, updatedBlock, newBlock)
  return newBlocks
}

export function mergeBlocks(
  blocks: Block[],
  firstBlockId: string,
  secondBlockId: string
): Block[] {
  const firstIndex = blocks.findIndex((b) => b.id === firstBlockId)
  const secondIndex = blocks.findIndex((b) => b.id === secondBlockId)
  if (firstIndex === -1 || secondIndex === -1) return blocks

  const firstBlock = blocks[firstIndex]
  const secondBlock = blocks[secondIndex]

  const mergedText =
    firstBlock.content.map((c) => c.text).join('') +
    secondBlock.content.map((c) => c.text).join('')

  const mergedBlock: Block = {
    ...firstBlock,
    content: [{ text: mergedText, styles: {} }],
    updatedAt: new Date().toISOString(),
  }

  const newBlocks = [...blocks]
  newBlocks.splice(firstIndex, 2, mergedBlock)
  return newBlocks
}

export function replaceBlockType(
  blocks: Block[],
  blockId: string,
  newType: BlockType
): Block[] {
  return blocks.map((b) =>
    b.id === blockId
      ? { ...b, type: newType, updatedAt: new Date().toISOString() }
      : b
  )
}

export function getBlockIndex(blocks: Block[], blockId: string): number {
  return blocks.findIndex((b) => b.id === blockId)
}

export function getBlockById(blocks: Block[], blockId: string): Block | undefined {
  return blocks.find((b) => b.id === blockId)
}

export function getAdjacentBlocks(
  blocks: Block[],
  blockId: string
): { prev: Block | null; next: Block | null } {
  const index = getBlockIndex(blocks, blockId)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? blocks[index - 1] : null,
    next: index < blocks.length - 1 ? blocks[index + 1] : null,
  }
}

export function flattenBlocks(blocks: Block[]): Block[] {
  const result: Block[] = []
  for (const block of blocks) {
    result.push(block)
    if (block.children.length > 0) {
      result.push(...flattenBlocks(block.children))
    }
  }
  return result
}
