import {
  generateContent,
  generateFromTemplate,
  generateOutline,
  generateCode,
  generateTable,
  improvePrompt,
  getTemplates,
  getTemplatesByType,
} from '@/lib/ai/content-generator'

describe('content-generator', () => {
  describe('generateContent', () => {
    it('generates paragraph content', async () => {
      const result = await generateContent({
        prompt: 'Write about cats',
        type: 'paragraph',
      })
      expect(result.result).toBeTruthy()
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.tokens).toBeGreaterThan(0)
    })

    it('generates list content', async () => {
      const result = await generateContent({
        prompt: 'List benefits of exercise',
        type: 'list',
      })
      expect(result.result).toContain('1.')
    })

    it('generates code content', async () => {
      const result = await generateContent({
        prompt: 'Sort an array',
        type: 'code',
      })
      expect(result.result).toContain('function')
    })

    it('generates table content', async () => {
      const result = await generateContent({
        prompt: 'Compare features',
        type: 'table',
      })
      expect(result.result).toContain('|')
    })

    it('generates outline content', async () => {
      const result = await generateContent({
        prompt: 'Write about AI',
        type: 'outline',
      })
      expect(result.result).toContain('1.')
    })

    it('returns empty for empty prompt', async () => {
      const result = await generateContent({ prompt: '', type: 'paragraph' })
      expect(result.result).toBe('')
      expect(result.tokens).toBe(0)
    })
  })

  describe('generateFromTemplate', () => {
    it('generates from introduction template', async () => {
      const result = await generateFromTemplate('introduction', 'machine learning')
      expect(result.result).toBeTruthy()
    })

    it('returns empty for unknown template', async () => {
      const result = await generateFromTemplate('nonexistent', 'topic')
      expect(result.result).toBe('')
    })
  })

  describe('generateOutline', () => {
    it('generates outline with default sections', async () => {
      const result = await generateOutline('React development')
      expect(result.result).toContain('1.')
      expect(result.result).toContain('5.')
    })

    it('generates outline with custom section count', async () => {
      const result = await generateOutline('React development', 3)
      expect(result.result).toContain('1.')
      expect(result.result).toContain('3.')
      expect(result.result).not.toContain('4.')
    })
  })

  describe('generateCode', () => {
    it('generates code with default language', async () => {
      const result = await generateCode('sort an array')
      expect(result.result).toContain('javascript')
      expect(result.result).toContain('function')
    })

    it('generates code with specified language', async () => {
      const result = await generateCode('sort an array', 'python')
      expect(result.result).toContain('python')
    })
  })

  describe('generateTable', () => {
    it('generates table with headers and rows', async () => {
      const result = await generateTable(['Name', 'Age', 'City'], 2)
      expect(result.result).toContain('| Name | Age | City |')
      expect(result.result).toContain('| --- | --- | --- |')
      expect(result.result).toContain('Cell 1-0')
    })
  })

  describe('improvePrompt', () => {
    it('suggests improvements for short prompts', async () => {
      const result = await improvePrompt('cat')
      expect(result.suggestions.length).toBeGreaterThan(0)
      expect(result.improved).toContain('comprehensive')
    })

    it('adds fewer suggestions for detailed prompts', async () => {
      const result = await improvePrompt('Write a detailed example of async JavaScript with error handling')
      expect(result.improved).toContain('example')
    })

    it('suggests adding examples when missing', async () => {
      const result = await improvePrompt('Write about React hooks and state management')
      expect(result.suggestions.some((s) => s.includes('example'))).toBe(true)
    })
  })

  describe('getTemplates', () => {
    it('returns all templates', () => {
      const templates = getTemplates()
      expect(templates.length).toBeGreaterThan(0)
    })
  })

  describe('getTemplatesByType', () => {
    it('filters by type', () => {
      const listTemplates = getTemplatesByType('list')
      listTemplates.forEach((t) => expect(t.type).toBe('list'))
    })

    it('returns empty for no matches', () => {
      const result = getTemplatesByType('table')
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
