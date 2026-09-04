import {
  getSlashCommands,
  getSlashCommand,
  searchSlashCommands,
  getSlashCommandsByCategory,
  executeSlashCommand,
  isSlashCommand,
  parseSlashCommand,
  getCommandCategories,
  formatSlashCommandPreview,
} from '@/lib/editor/slash-commands'
import { createBlock } from '@/lib/editor/block-schema'

describe('slash-commands', () => {
  describe('getSlashCommands', () => {
    it('returns all available commands', () => {
      const commands = getSlashCommands()
      expect(commands.length).toBeGreaterThan(0)
    })

    it('includes basic commands', () => {
      const commands = getSlashCommands()
      const names = commands.map((c) => c.name)
      expect(names).toContain('heading')
      expect(names).toContain('bullet-list')
      expect(names).toContain('code')
    })
  })

  describe('getSlashCommand', () => {
    it('finds command by name', () => {
      const cmd = getSlashCommand('heading')
      expect(cmd).toBeDefined()
      expect(cmd?.name).toBe('heading')
    })

    it('finds command by alias', () => {
      const cmd = getSlashCommand('h1')
      expect(cmd).toBeDefined()
      expect(cmd?.name).toBe('heading')
    })

    it('returns undefined for unknown command', () => {
      expect(getSlashCommand('unknown')).toBeUndefined()
    })
  })

  describe('searchSlashCommands', () => {
    it('filters commands by query', () => {
      const results = searchSlashCommands('head')
      expect(results.length).toBeGreaterThan(0)
      expect(results.some((c) => c.name === 'heading')).toBe(true)
    })

    it('filters by alias', () => {
      const results = searchSlashCommands('ul')
      expect(results.some((c) => c.name === 'bullet-list')).toBe(true)
    })

    it('returns all for empty query', () => {
      const results = searchSlashCommands('')
      expect(results.length).toBe(getSlashCommands().length)
    })

    it('returns empty for no match', () => {
      const results = searchSlashCommands('zzzznonexistent')
      expect(results).toHaveLength(0)
    })

    it('is case insensitive', () => {
      const results = searchSlashCommands('HEADING')
      expect(results.some((c) => c.name === 'heading')).toBe(true)
    })
  })

  describe('getSlashCommandsByCategory', () => {
    it('returns commands for a category', () => {
      const basic = getSlashCommandsByCategory('basic')
      expect(basic.length).toBeGreaterThan(0)
      basic.forEach((cmd) => expect(cmd.category).toBe('basic'))
    })

    it('returns ai commands', () => {
      const ai = getSlashCommandsByCategory('ai')
      expect(ai.length).toBeGreaterThan(0)
      ai.forEach((cmd) => expect(cmd.category).toBe('ai'))
    })
  })

  describe('executeSlashCommand', () => {
    it('executes heading command', () => {
      const block = createBlock('paragraph')
      const result = executeSlashCommand('heading', block)
      expect(result[0]?.type).toBe('heading')
    })

    it('executes bullet-list command', () => {
      const block = createBlock('paragraph')
      const result = executeSlashCommand('bullet-list', block)
      expect(result[0]?.type).toBe('bulletList')
    })

    it('executes code command', () => {
      const block = createBlock('paragraph')
      const result = executeSlashCommand('code', block)
      expect(result[0]?.type).toBe('code')
    })

    it('executes divider command', () => {
      const block = createBlock('paragraph')
      const result = executeSlashCommand('divider', block)
      expect(result[0]?.type).toBe('divider')
      expect(result[0]?.content).toEqual([])
    })

    it('returns original block for unknown command', () => {
      const block = createBlock('paragraph')
      const result = executeSlashCommand('unknown', block)
      expect(result).toHaveLength(1)
      expect(result[0]?.type).toBe('paragraph')
    })
  })

  describe('isSlashCommand', () => {
    it('returns true for slash commands', () => {
      expect(isSlashCommand('/heading')).toBe(true)
      expect(isSlashCommand('/code')).toBe(true)
    })

    it('returns false for non-slash text', () => {
      expect(isSlashCommand('heading')).toBe(false)
      expect(isSlashCommand('')).toBe(false)
    })
  })

  describe('parseSlashCommand', () => {
    it('parses command and args', () => {
      const result = parseSlashCommand('/heading level=2')
      expect(result).toEqual({ command: 'heading', args: 'level=2' })
    })

    it('parses command without args', () => {
      const result = parseSlashCommand('/code')
      expect(result).toEqual({ command: 'code', args: '' })
    })

    it('returns null for non-slash text', () => {
      expect(parseSlashCommand('heading')).toBeNull()
    })
  })

  describe('getCommandCategories', () => {
    it('returns unique categories', () => {
      const categories = getCommandCategories()
      expect(categories).toContain('basic')
      expect(categories).toContain('media')
      expect(categories).toContain('ai')
      expect(new Set(categories).size).toBe(categories.length)
    })
  })

  describe('formatSlashCommandPreview', () => {
    it('formats command for display', () => {
      const cmd = getSlashCommand('heading')!
      const preview = formatSlashCommandPreview(cmd)
      expect(preview).toContain(cmd.label)
      expect(preview).toContain(cmd.description)
    })
  })
})
