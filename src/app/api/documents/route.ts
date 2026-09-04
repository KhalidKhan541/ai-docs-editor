import { NextRequest, NextResponse } from 'next/server'

interface Document {
  id: string
  title: string
  blocks: unknown[]
  ownerId: string
  createdAt: string
  updatedAt: string
}

const documentsDb: Map<string, Document> = new Map()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (id) {
    const doc = documentsDb.get(id)
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    return NextResponse.json(doc)
  }

  const docs = Array.from(documentsDb.values())
  return NextResponse.json(docs)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, ownerId, blocks } = body

    if (!title || !ownerId) {
      return NextResponse.json(
        { error: 'Title and ownerId are required' },
        { status: 400 }
      )
    }

    const doc: Document = {
      id: Math.random().toString(36).substring(2, 15),
      title,
      blocks: blocks ?? [],
      ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    documentsDb.set(doc.id, doc)
    return NextResponse.json(doc, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, blocks } = body

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
    }

    const doc = documentsDb.get(id)
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const updated: Document = {
      ...doc,
      ...(title && { title }),
      ...(blocks && { blocks }),
      updatedAt: new Date().toISOString(),
    }

    documentsDb.set(id, updated)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 })
  }

  if (!documentsDb.has(id)) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  documentsDb.delete(id)
  return NextResponse.json({ success: true })
}
