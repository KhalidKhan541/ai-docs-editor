'use client'

import React from 'react'

interface EditorToolbarProps {
  onBold?: () => void
  onItalic?: () => void
  onUnderline?: () => void
  onCode?: () => void
  onLink?: () => void
  onHeading?: (level: number) => void
  onBulletList?: () => void
  onNumberedList?: () => void
  onTodo?: () => void
  onQuote?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onExport?: () => void
  activeFormats?: string[]
  isReadOnly?: boolean
}

export function EditorToolbar({
  onBold,
  onItalic,
  onUnderline,
  onCode,
  onLink,
  onHeading,
  onBulletList,
  onNumberedList,
  onTodo,
  onQuote,
  onUndo,
  onRedo,
  onExport,
  activeFormats = [],
  isReadOnly = false,
}: EditorToolbarProps) {
  const isFormatActive = (format: string) => activeFormats.includes(format)

  if (isReadOnly) {
    return (
      <div className="editor-toolbar" data-testid="editor-toolbar">
        <button onClick={onExport} data-testid="export-button">
          Export
        </button>
      </div>
    )
  }

  return (
    <div className="editor-toolbar" data-testid="editor-toolbar">
      <div className="toolbar-group">
        <button
          onClick={onUndo}
          data-testid="undo-button"
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          onClick={onRedo}
          data-testid="redo-button"
          aria-label="Redo"
        >
          Redo
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <select
          onChange={(e) => onHeading?.(Number(e.target.value))}
          data-testid="heading-select"
          aria-label="Heading level"
        >
          <option value="0">Normal</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button
          onClick={onBold}
          className={isFormatActive('bold') ? 'active' : ''}
          data-testid="bold-button"
          aria-label="Bold"
          aria-pressed={isFormatActive('bold')}
        >
          B
        </button>
        <button
          onClick={onItalic}
          className={isFormatActive('italic') ? 'active' : ''}
          data-testid="italic-button"
          aria-label="Italic"
          aria-pressed={isFormatActive('italic')}
        >
          I
        </button>
        <button
          onClick={onUnderline}
          className={isFormatActive('underline') ? 'active' : ''}
          data-testid="underline-button"
          aria-label="Underline"
          aria-pressed={isFormatActive('underline')}
        >
          U
        </button>
        <button
          onClick={onCode}
          className={isFormatActive('code') ? 'active' : ''}
          data-testid="code-button"
          aria-label="Inline code"
          aria-pressed={isFormatActive('code')}
        >
          &lt;/&gt;
        </button>
        <button
          onClick={onLink}
          className={isFormatActive('link') ? 'active' : ''}
          data-testid="link-button"
          aria-label="Insert link"
          aria-pressed={isFormatActive('link')}
        >
          🔗
        </button>
      </div>

      <div className="toolbar-separator" />

      <div className="toolbar-group">
        <button onClick={onBulletList} data-testid="bullet-list-button" aria-label="Bullet list">
          • List
        </button>
        <button onClick={onNumberedList} data-testid="numbered-list-button" aria-label="Numbered list">
          1. List
        </button>
        <button onClick={onTodo} data-testid="todo-button" aria-label="To-do">
          ☑ Todo
        </button>
        <button onClick={onQuote} data-testid="quote-button" aria-label="Quote">
          " Quote
        </button>
      </div>

      <div className="toolbar-separator" />

      <button onClick={onExport} data-testid="export-button">
        Export
      </button>
    </div>
  )
}
