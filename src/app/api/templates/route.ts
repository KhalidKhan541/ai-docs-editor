import { NextRequest, NextResponse } from 'next/server'

interface Template {
  id: string
  name: string
  description: string
  category: string
  blocks: unknown[]
  isPublic: boolean
  createdBy: string
  createdAt: string
}

const templatesDb: Map<string, Template> = new Map()

const defaultTemplates: Template[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Start with a blank document',
    category: 'basic',
    blocks: [{ type: 'paragraph', content: [{ text: '' }] }],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Template for meeting notes',
    category: 'business',
    blocks: [
      { type: 'heading', content: [{ text: 'Meeting Notes' }] },
      { type: 'paragraph', content: [{ text: 'Date: ' }] },
      { type: 'paragraph', content: [{ text: 'Attendees: ' }] },
      { type: 'heading', content: [{ text: 'Agenda' }] },
      { type: 'bulletList', content: [{ text: '' }] },
      { type: 'heading', content: [{ text: 'Action Items' }] },
      { type: 'todo', content: [{ text: '' }] },
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'project-proposal',
    name: 'Project Proposal',
    description: 'Template for project proposals',
    category: 'business',
    blocks: [
      { type: 'heading', content: [{ text: 'Project Proposal' }] },
      { type: 'heading', content: [{ text: 'Executive Summary' }], props: { level: 2 } },
      { type: 'paragraph', content: [{ text: '' }] },
      { type: 'heading', content: [{ text: 'Objectives' }], props: { level: 2 } },
      { type: 'bulletList', content: [{ text: '' }] },
      { type: 'heading', content: [{ text: 'Timeline' }], props: { level: 2 } },
      { type: 'paragraph', content: [{ text: '' }] },
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'technical-doc',
    name: 'Technical Documentation',
    description: 'Template for technical docs',
    category: 'technical',
    blocks: [
      { type: 'heading', content: [{ text: 'Technical Documentation' }] },
      { type: 'heading', content: [{ text: 'Overview' }], props: { level: 2 } },
      { type: 'paragraph', content: [{ text: '' }] },
      { type: 'heading', content: [{ text: 'API Reference' }], props: { level: 2 } },
      { type: 'code', content: [{ text: '' }], props: { language: 'javascript' } },
      { type: 'heading', content: [{ text: 'Examples' }], props: { level: 2 } },
      { type: 'paragraph', content: [{ text: '' }] },
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  },
]

defaultTemplates.forEach((t) => templatesDb.set(t.id, t))

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const category = searchParams.get('category')

  if (id) {
    const template = templatesDb.get(id)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    return NextResponse.json(template)
  }

  let templates = Array.from(templatesDb.values()).filter((t) => t.isPublic)

  if (category) {
    templates = templates.filter((t) => t.category === category)
  }

  return NextResponse.json(templates)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, category, blocks, createdBy } = body

    if (!name || !createdBy) {
      return NextResponse.json(
        { error: 'Name and createdBy are required' },
        { status: 400 }
      )
    }

    const template: Template = {
      id: Math.random().toString(36).substring(2, 15),
      name,
      description: description ?? '',
      category: category ?? 'custom',
      blocks: blocks ?? [],
      isPublic: false,
      createdBy,
      createdAt: new Date().toISOString(),
    }

    templatesDb.set(template.id, template)
    return NextResponse.json(template, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
  }

  const template = templatesDb.get(id)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  if (template.createdBy === 'system') {
    return NextResponse.json({ error: 'Cannot delete default templates' }, { status: 403 })
  }

  templatesDb.delete(id)
  return NextResponse.json({ success: true })
}
