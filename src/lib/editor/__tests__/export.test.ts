import {
  exportDocument,
  getExportMimeType,
  getExportExtension,
  generateFilename,
  createDownloadBlob,
} from '@/lib/editor/export'
import { Block } from '@/types'

function makeBlocks(): Block[] {
  return [
    {
      id: 'h1',
      type: 'heading',
      content: [{ text: 'My Title', styles: {} }],
      children: [],
      props: { level: 1 },
      createdAt: '',
      updatedAt: '',
      createdBy: '',
    },
    {
      id: 'p1',
      type: 'paragraph',
      content: [{ text: 'Hello world', styles: {} }],
      children: [],
      props: {},
      createdAt: '',
      updatedAt: '',
      createdBy: '',
    },
    {
      id: 'ul1',
      type: 'bulletList',
      content: [{ text: 'Item 1', styles: {} }],
      children: [],
      props: {},
      createdAt: '',
      updatedAt: '',
      createdBy: '',
    },
    {
      id: 'ol1',
      type: 'numberedList',
      content: [{ text: 'Step 1', styles: {} }],
      children: [],
      props: {},
      createdAt: '',
      updatedAt: '',
      createdBy: '',
    },
    {
      id: 'todo1',
      type: 'todo',
      content: [{ text: 'Task 1', styles: {} }],
      children: [],
      props: { checked: true },
      createdAt: '',
      updatedAt: '',
      createdBy: '',
    },
    {
      id: 'q1',
      type: 'quote',
      content: [{ text: ' wise words', styles: {} }],
      children: [],
      props: {},
      createdAt: '',
      updatedAt: '',
      createdBy: '',
    },
    {
      id: 'code1',
      type: 'code',
      content: [{ text: 'console.log("hi")', styles: {} }],
      children: [],
      props: { language: 'javascript' },
      createdAt: '',
      updatedAt: '',
      createdBy: '',
    },
    {
      id: 'div1',
      type: 'divider',
      content: [],
      children: [],
      props: {},
      createdAt: '',
      updatedAt: '',
      createdBy: '',
    },
    {
      id: 'img1',
      type: 'image',
      content: [],
      children: [],
      props: { src: '/img.png', alt: 'test image' },
      createdAt: '',
      updatedAt: '',
      createdBy: '',
    },
  ]
}

describe('export', () => {
  describe('exportDocument', () => {
    describe('markdown format', () => {
      it('exports headings with correct prefix', () => {
        const md = exportDocument(makeBlocks(), { format: 'markdown' })
        expect(md).toContain('# My Title')
      })

      it('exports paragraphs', () => {
        const md = exportDocument(makeBlocks(), { format: 'markdown' })
        expect(md).toContain('Hello world')
      })

      it('exports bullet lists', () => {
        const md = exportDocument(makeBlocks(), { format: 'markdown' })
        expect(md).toContain('- Item 1')
      })

      it('exports numbered lists', () => {
        const md = exportDocument(makeBlocks(), { format: 'markdown' })
        expect(md).toContain('1. Step 1')
      })

      it('exports todo items', () => {
        const md = exportDocument(makeBlocks(), { format: 'markdown' })
        expect(md).toContain('- [x] Task 1')
      })

      it('exports quotes', () => {
        const md = exportDocument(makeBlocks(), { format: 'markdown' })
        expect(md).toContain('>  wise words')
      })

      it('exports code blocks', () => {
        const md = exportDocument(makeBlocks(), { format: 'markdown' })
        expect(md).toContain('```javascript')
        expect(md).toContain('console.log("hi")')
      })

      it('exports dividers', () => {
        const md = exportDocument(makeBlocks(), { format: 'markdown' })
        expect(md).toContain('---')
      })

      it('exports images', () => {
        const md = exportDocument(makeBlocks(), { format: 'markdown' })
        expect(md).toContain('![test image](/img.png)')
      })
    })

    describe('html format', () => {
      it('wraps in html structure', () => {
        const html = exportDocument(makeBlocks(), { format: 'html' })
        expect(html).toContain('<!DOCTYPE html>')
        expect(html).toContain('<html>')
        expect(html).toContain('</html>')
      })

      it('exports headings', () => {
        const html = exportDocument(makeBlocks(), { format: 'html' })
        expect(html).toContain('<h1>My Title</h1>')
      })

      it('exports paragraphs', () => {
        const html = exportDocument(makeBlocks(), { format: 'html' })
        expect(html).toContain('<p>Hello world</p>')
      })

      it('exports bullet lists', () => {
        const html = exportDocument(makeBlocks(), { format: 'html' })
        expect(html).toContain('<ul>')
      })

      it('exports code blocks', () => {
        const html = exportDocument(makeBlocks(), { format: 'html' })
        expect(html).toContain('<pre>')
      })
    })

    describe('txt format', () => {
      it('exports plain text', () => {
        const txt = exportDocument(makeBlocks(), { format: 'txt' })
        expect(txt).toContain('My Title')
        expect(txt).toContain('Hello world')
        expect(txt).not.toContain('<')
      })
    })
  })

  describe('getExportMimeType', () => {
    it('returns correct mime types', () => {
      expect(getExportMimeType('markdown')).toBe('text/markdown')
      expect(getExportMimeType('html')).toBe('text/html')
      expect(getExportMimeType('txt')).toBe('text/plain')
      expect(getExportMimeType('pdf')).toBe('application/pdf')
      expect(getExportMimeType('docx')).toContain('wordprocessingml')
    })
  })

  describe('getExportExtension', () => {
    it('returns correct extensions', () => {
      expect(getExportExtension('markdown')).toBe('.md')
      expect(getExportExtension('html')).toBe('.html')
      expect(getExportExtension('txt')).toBe('.txt')
      expect(getExportExtension('pdf')).toBe('.pdf')
      expect(getExportExtension('docx')).toBe('.docx')
    })
  })

  describe('generateFilename', () => {
    it('sanitizes title for filename', () => {
      const name = generateFilename('My Doc!', 'markdown')
      expect(name).toBe('my-doc.md')
    })

    it('handles spaces and special chars', () => {
      const name = generateFilename('Hello World @#$%', 'html')
      expect(name).toBe('hello-world-.html')
    })
  })

  describe('createDownloadBlob', () => {
    it('creates blob with correct mime type', () => {
      const blob = createDownloadBlob('content', 'markdown')
      expect(blob.type).toBe('text/markdown')
    })

    it('creates blob with correct content', async () => {
      const blob = createDownloadBlob('test content', 'txt')
      const text = await blob.text()
      expect(text).toBe('test content')
    })
  })
})
