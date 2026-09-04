'use client'

import React, { useState, useMemo } from 'react'
import { searchSlashCommands, SlashCommandDef } from '@/lib/editor/slash-commands'

interface SlashMenuProps {
  onSelect: (command: string) => void
  onClose: () => void
  position?: { x: number; y: number }
}

export function SlashMenu({ onSelect, onClose, position }: SlashMenuProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const commands = useMemo(() => searchSlashCommands(query), [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, commands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (commands[selectedIndex]) {
          onSelect(commands[selectedIndex].name)
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }

  const grouped = commands.reduce(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = []
      acc[cmd.category].push(cmd)
      return acc
    },
    {} as Record<string, SlashCommandDef[]>
  )

  return (
    <div
      className="slash-menu"
      style={position ? { left: position.x, top: position.y } : undefined}
      data-testid="slash-menu"
      onKeyDown={handleKeyDown}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setSelectedIndex(0)
        }}
        placeholder="Search commands..."
        className="slash-menu-search"
        autoFocus
        data-testid="slash-menu-search"
      />
      <div className="slash-menu-list">
        {Object.entries(grouped).map(([category, cmds]) => (
          <div key={category} className="slash-menu-group">
            <div className="slash-menu-group-title">{category}</div>
            {cmds.map((cmd) => {
              const globalIndex = commands.indexOf(cmd)
              return (
                <div
                  key={cmd.name}
                  className={`slash-menu-item ${globalIndex === selectedIndex ? 'selected' : ''}`}
                  onClick={() => onSelect(cmd.name)}
                  data-testid={`slash-command-${cmd.name}`}
                >
                  <span className="slash-menu-icon">{cmd.icon}</span>
                  <div className="slash-menu-text">
                    <div className="slash-menu-label">{cmd.label}</div>
                    <div className="slash-menu-description">{cmd.description}</div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        {commands.length === 0 && (
          <div className="slash-menu-empty" data-testid="slash-menu-empty">
            No commands found
          </div>
        )}
      </div>
    </div>
  )
}
