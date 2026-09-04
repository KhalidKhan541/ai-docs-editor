'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Block, Document, User } from '@/types'
import { createBlock } from '@/lib/editor/block-schema'
import {
  insertBlock,
  removeBlock,
  moveBlockUp,
  moveBlockDown,
  updateBlockContent,
} from '@/lib/editor/block-operations'

interface DocumentEditorProps {
  document: Document
  user: User
  onSave?: (blocks: Block[]) => void
  onCollaborate?: () => void
  isReadOnly?: boolean
}

export function DocumentEditor({
  document: doc,
  user,
  onSave,
  isReadOnly = false,
}: DocumentEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(doc.blocks)
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null)
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashMenuPosition, setSlashMenuPosition] = useState({ x: 0, y: 0 })
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setBlocks(doc.blocks)
  }, [doc.blocks])

  const handleBlockChange = useCallback(
    (blockId: string, content: string) => {
      if (isReadOnly) return
      setBlocks((prev) =>
        updateBlockContent(prev, blockId, [{ text: content, styles: {} }])
      )
    },
    [isReadOnly]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, blockId: string) => {
      if (isReadOnly) return

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const index = blocks.findIndex((b) => b.id === blockId)
        const newBlock = createBlock('paragraph')
        setBlocks((prev) => insertBlock(prev, index + 1, 'paragraph'))
        setActiveBlockId(newBlock.id)
      }

      if (e.key === 'Backspace') {
        const block = blocks.find((b) => b.id === blockId)
        if (block && block.content.map((c) => c.text).join('') === '') {
          e.preventDefault()
          setBlocks((prev) => removeBlock(prev, blockId))
        }
      }

      if (e.key === '/' && blocks.find((b) => b.id === blockId)?.content.map((c) => c.text).join('') === '') {
        setShowSlashMenu(true)
        setSlashMenuPosition({ x: 0, y: 0 })
      }
    },
    [blocks, isReadOnly]
  )

  const handleSlashCommand = useCallback(
    (command: string, blockId: string) => {
      const index = blocks.findIndex((b) => b.id === blockId)
      if (index === -1) return

      let type: Block['type'] = 'paragraph'
      switch (command) {
        case 'heading':
          type = 'heading'
          break
        case 'bullet-list':
          type = 'bulletList'
          break
        case 'numbered-list':
          type = 'numberedList'
          break
        case 'todo':
          type = 'todo'
          break
        case 'quote':
          type = 'quote'
          break
        case 'code':
          type = 'code'
          break
        case 'divider':
          type = 'divider'
          break
      }

      setBlocks((prev) => {
        const updated = removeBlock(prev, blockId)
        return insertBlock(updated, index, type)
      })
      setShowSlashMenu(false)
    },
    [blocks]
  )

  const handleSave = useCallback(() => {
    onSave?.(blocks)
  }, [blocks, onSave])

  return (
    <div className="document-editor" ref={editorRef} data-testid="document-editor">
      <div className="editor-content">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`editor-block ${activeBlockId === block.id ? 'active' : ''}`}
            data-testid={`block-${block.id}`}
            onClick={() => setActiveBlockId(block.id)}
          >
            <div
              contentEditable={!isReadOnly}
              suppressContentEditableWarning
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              onInput={(e) =>
                handleBlockChange(block.id, (e.target as HTMLDivElement).textContent ?? '')
              }
              className="block-content"
              data-placeholder={
                block.type === 'paragraph' ? "Type '/' for commands..." : undefined
              }
            >
              {block.content.map((c, i) => c.text).join('')}
            </div>
            {!isReadOnly && activeBlockId === block.id && (
              <div className="block-controls">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setBlocks((prev) => moveBlockUp(prev, block.id))
                  }}
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setBlocks((prev) => moveBlockDown(prev, block.id))
                  }}
                  aria-label="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setBlocks((prev) => removeBlock(prev, block.id))
                  }}
                  aria-label="Delete block"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      {showSlashMenu && (
        <div
          className="slash-menu"
          style={{ left: slashMenuPosition.x, top: slashMenuPosition.y }}
          data-testid="slash-menu"
        >
          <div onClick={() => handleSlashCommand('heading', activeBlockId!)}>
            Heading
          </div>
          <div onClick={() => handleSlashCommand('bullet-list', activeBlockId!)}>
            Bullet List
          </div>
          <div onClick={() => handleSlashCommand('code', activeBlockId!)}>
            Code Block
          </div>
        </div>
      )}
      {!isReadOnly && (
        <button className="save-button" onClick={handleSave} data-testid="save-button">
          Save
        </button>
      )}
    </div>
  )
}
