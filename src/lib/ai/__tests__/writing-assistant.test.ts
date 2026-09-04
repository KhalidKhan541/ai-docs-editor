import {
  rewriteText,
  continueWriting,
  summarizeContent,
  expandContent,
  fixGrammar,
  changeTone,
  translateContent,
  processAIRequest,
  countTokens,
  getAvailableTones,
  getSupportedLanguages,
} from '@/lib/ai/writing-assistant'

describe('writing-assistant', () => {
  describe('rewriteText', () => {
    it('rewrites content', async () => {
      const result = await rewriteText('Hello world')
      expect(result.result).toBeTruthy()
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.tokens).toBeGreaterThan(0)
    })

    it('returns empty for empty content', async () => {
      const result = await rewriteText('')
      expect(result.result).toBe('')
      expect(result.tokens).toBe(0)
    })

    it('applies formal tone', async () => {
      const result = await rewriteText("I don't want to go", 'formal')
      expect(result.result).toContain('do not')
    })

    it('applies casual tone', async () => {
      const result = await rewriteText('I do not want to go', 'casual')
      expect(result.result).toContain("don't")
    })

    it('applies concise tone', async () => {
      const result = await rewriteText('First sentence. Second sentence. Third sentence.', 'concise')
      expect(result.result).toBeTruthy()
    })
  })

  describe('continueWriting', () => {
    it('generates continuation', async () => {
      const result = await continueWriting('The quick brown fox')
      expect(result.result).toBeTruthy()
      expect(result.confidence).toBeGreaterThan(0)
    })

    it('returns empty for empty content', async () => {
      const result = await continueWriting('')
      expect(result.result).toBe('')
    })

    it('respects maxWords parameter', async () => {
      const result = await continueWriting('Test content', 10)
      expect(result.result).toBeTruthy()
    })
  })

  describe('summarizeContent', () => {
    it('summarizes content', async () => {
      const result = await summarizeContent('First sentence. Second sentence. Third sentence.')
      expect(result.result).toBeTruthy()
      expect(result.result).toContain('.')
    })

    it('returns empty for empty content', async () => {
      const result = await summarizeContent('')
      expect(result.result).toBe('')
    })
  })

  describe('expandContent', () => {
    it('expands content', async () => {
      const result = await expandContent('Short text')
      expect(result.result).toContain('Short text')
      expect(result.result.length).toBeGreaterThan('Short text'.length)
    })

    it('returns empty for empty content', async () => {
      const result = await expandContent('')
      expect(result.result).toBe('')
    })
  })

  describe('fixGrammar', () => {
    it('capitalizes lowercase i', async () => {
      const result = await fixGrammar('this is a test with i in it')
      expect(result.result).toContain(' I ')
    })

    it('capitalizes first letter after period', async () => {
      const result = await fixGrammar('hello. world')
      expect(result.result).toContain('. W')
    })

    it('returns empty for empty content', async () => {
      const result = await fixGrammar('')
      expect(result.result).toBe('')
    })
  })

  describe('changeTone', () => {
    it('changes to formal tone', async () => {
      const result = await changeTone("can't stop", 'formal')
      expect(result.result).toContain('cannot')
    })

    it('changes to casual tone', async () => {
      const result = await changeTone('cannot stop', 'casual')
      expect(result.result).toContain("can't")
    })
  })

  describe('translateContent', () => {
    it('translates to target language', async () => {
      const result = await translateContent('Hello', 'es')
      expect(result.result).toContain('Spanish')
    })

    it('handles unknown language code', async () => {
      const result = await translateContent('Hello', 'xx')
      expect(result.result).toContain('xx')
    })
  })

  describe('processAIRequest', () => {
    it('processes rewrite request', async () => {
      const result = await processAIRequest({ type: 'rewrite', content: 'test' })
      expect(result.result).toBeTruthy()
    })

    it('processes continue request', async () => {
      const result = await processAIRequest({ type: 'continue', content: 'test' })
      expect(result.result).toBeTruthy()
    })

    it('processes summarize request', async () => {
      const result = await processAIRequest({ type: 'summarize', content: 'test content' })
      expect(result.result).toBeTruthy()
    })

    it('processes expand request', async () => {
      const result = await processAIRequest({ type: 'expand', content: 'test' })
      expect(result.result).toBeTruthy()
    })

    it('processes fixGrammar request', async () => {
      const result = await processAIRequest({ type: 'fixGrammar', content: 'test' })
      expect(result.result).toBeTruthy()
    })

    it('processes changeTone request', async () => {
      const result = await processAIRequest({
        type: 'changeTone',
        content: 'test',
        tone: 'formal',
      })
      expect(result.result).toBeTruthy()
    })
  })

  describe('countTokens', () => {
    it('counts tokens from text', () => {
      const tokens = countTokens('Hello world test')
      expect(tokens).toBeGreaterThan(0)
    })

    it('returns 0 for empty text', () => {
      expect(countTokens('')).toBe(0)
    })
  })

  describe('getAvailableTones', () => {
    it('returns list of tones', () => {
      const tones = getAvailableTones()
      expect(tones).toContain('formal')
      expect(tones).toContain('casual')
      expect(tones).toContain('concise')
    })
  })

  describe('getSupportedLanguages', () => {
    it('returns list of languages', () => {
      const langs = getSupportedLanguages()
      expect(langs).toContain('en')
      expect(langs).toContain('es')
      expect(langs).toContain('fr')
    })
  })
})
