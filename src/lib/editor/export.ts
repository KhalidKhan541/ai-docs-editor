import { Block, ExportOptions } from '@/types'

function blocksToMarkdown(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'heading': {
          const level = (block.props.level as number) || 1
          const prefix = '#'.repeat(level)
          const text = block.content.map((c) => c.text).join('')
          return `${prefix} ${text}`
        }
        case 'paragraph':
          return block.content.map((c) => c.text).join('')
        case 'bulletList':
          return `- ${block.content.map((c) => c.text).join('')}`
        case 'numberedList':
          return `1. ${block.content.map((c) => c.text).join('')}`
        case 'todo': {
          const checked = block.props.checked ? 'x' : ' '
          return `- [${checked}] ${block.content.map((c) => c.text).join('')}`
        }
        case 'quote':
          return `> ${block.content.map((c) => c.text).join('')}`
        case 'code': {
          const lang = (block.props.language as string) || ''
          return `\`\`\`${lang}\n${block.content.map((c) => c.text).join('')}\n\`\`\``
        }
        case 'divider':
          return '---'
        case 'image': {
          const src = (block.props.src as string) || ''
          const alt = (block.props.alt as string) || 'image'
          return `![${alt}](${src})`
        }
        default:
          return block.content.map((c) => c.text).join('')
      }
    })
    .join('\n\n')
}

function blocksToHtml(blocks: Block[]): string {
  const body = blocks
    .map((block) => {
      switch (block.type) {
        case 'heading': {
          const level = (block.props.level as number) || 1
          const text = block.content.map((c) => c.text).join('')
          return `<h${level}>${text}</h${level}>`
        }
        case 'paragraph': {
          const text = block.content.map((c) => {
            let t = c.text
            if (c.styles?.bold) t = `<strong>${t}</strong>`
            if (c.styles?.italic) t = `<em>${t}</em>`
            if (c.styles?.code) t = `<code>${t}</code>`
            if (c.href) t = `<a href="${c.href}">${t}</a>`
            return t
          }).join('')
          return `<p>${text}</p>`
        }
        case 'bulletList':
          return `<ul><li>${block.content.map((c) => c.text).join('')}</li></ul>`
        case 'numberedList':
          return `<ol><li>${block.content.map((c) => c.text).join('')}</li></ol>`
        case 'todo': {
          const checked = block.props.checked ? 'checked' : ''
          return `<div><input type="checkbox" ${checked} /> ${block.content.map((c) => c.text).join('')}</div>`
        }
        case 'quote':
          return `<blockquote>${block.content.map((c) => c.text).join('')}</blockquote>`
        case 'code': {
          const lang = (block.props.language as string) || ''
          return `<pre><code class="${lang}">${block.content.map((c) => c.text).join('')}</code></pre>`
        }
        case 'divider':
          return '<hr />'
        case 'image': {
          const src = (block.props.src as string) || ''
          const alt = (block.props.alt as string) || ''
          return `<img src="${src}" alt="${alt}" />`
        }
        default:
          return `<p>${block.content.map((c) => c.text).join('')}</p>`
      }
    })
    .join('\n')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    blockquote { border-left: 3px solid #ccc; margin-left: 0; padding-left: 1rem; color: #666; }
    code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 3px; font-size: 0.9em; }
  </style>
</head>
<body>
${body}
</body>
</html>`
}

function blocksToTxt(blocks: Block[]): string {
  return blocks
    .map((block) => block.content.map((c) => c.text).join(''))
    .join('\n')
}

export function exportDocument(
  blocks: Block[],
  options: ExportOptions
): string {
  switch (options.format) {
    case 'markdown':
      return blocksToMarkdown(blocks)
    case 'html':
      return blocksToHtml(blocks)
    case 'txt':
      return blocksToTxt(blocks)
    case 'pdf':
      return blocksToMarkdown(blocks)
    case 'docx':
      return blocksToMarkdown(blocks)
    default:
      return blocksToTxt(blocks)
  }
}

export function getExportMimeType(format: ExportOptions['format']): string {
  switch (format) {
    case 'markdown':
      return 'text/markdown'
    case 'html':
      return 'text/html'
    case 'txt':
      return 'text/plain'
    case 'pdf':
      return 'application/pdf'
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    default:
      return 'text/plain'
  }
}

export function getExportExtension(format: ExportOptions['format']): string {
  switch (format) {
    case 'markdown':
      return '.md'
    case 'html':
      return '.html'
    case 'txt':
      return '.txt'
    case 'pdf':
      return '.pdf'
    case 'docx':
      return '.docx'
    default:
      return '.txt'
  }
}

export function generateFilename(title: string, format: ExportOptions['format']): string {
  const sanitized = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-').toLowerCase()
  return `${sanitized}${getExportExtension(format)}`
}

export function createDownloadBlob(content: string, format: ExportOptions['format']): Blob {
  const mimeType = getExportMimeType(format)
  return new Blob([content], { type: mimeType })
}

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
