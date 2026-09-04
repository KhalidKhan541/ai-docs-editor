import { NextRequest, NextResponse } from 'next/server'

interface Comment {
  id: string
  documentId: string
  blockId: string
  userId: string
  content: string
  resolved: boolean
  replies: unknown[]
  createdAt: string
  updatedAt: string
}

const commentsDb: Map<string, Comment> = new Map()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('documentId')
  const resolved = searchParams.get('resolved')

  let comments = Array.from(commentsDb.values())

  if (documentId) {
    comments = comments.filter((c) => c.documentId === documentId)
  }

  if (resolved !== null && resolved !== undefined) {
    comments = comments.filter((c) => c.resolved === (resolved === 'true'))
  }

  return NextResponse.json(comments)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, blockId, userId, content } = body

    if (!documentId || !blockId || !userId || !content) {
      return NextResponse.json(
        { error: 'documentId, blockId, userId, and content are required' },
        { status: 400 }
      )
    }

    const comment: Comment = {
      id: Math.random().toString(36).substring(2, 15),
      documentId,
      blockId,
      userId,
      content,
      resolved: false,
      replies: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    commentsDb.set(comment.id, comment)
    return NextResponse.json(comment, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, content, resolved } = body

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }

    const comment = commentsDb.get(id)
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    const updated: Comment = {
      ...comment,
      ...(content !== undefined && { content }),
      ...(resolved !== undefined && { resolved }),
      updatedAt: new Date().toISOString(),
    }

    commentsDb.set(id, updated)
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
  }

  if (!commentsDb.has(id)) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }

  commentsDb.delete(id)
  return NextResponse.json({ success: true })
}
