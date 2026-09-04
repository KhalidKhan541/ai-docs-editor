import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/comments/route'

function makeRequest(url: string, method: string, body?: unknown): NextRequest {
  const init: RequestInit = { method }
  if (body) {
    init.body = JSON.stringify(body)
  }
  return new NextRequest(new Request(url, init))
}

describe('/api/comments', () => {
  describe('POST', () => {
    it('creates a new comment', async () => {
      const req = makeRequest('http://localhost/api/comments', 'POST', {
        documentId: 'doc-1',
        blockId: 'block-1',
        userId: 'user-1',
        content: 'Great point!',
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(201)
      expect(data.content).toBe('Great point!')
      expect(data.resolved).toBe(false)
    })

    it('returns 400 for missing fields', async () => {
      const req = makeRequest('http://localhost/api/comments', 'POST', {
        documentId: 'doc-1',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 for invalid JSON', async () => {
      const req = new NextRequest(new Request('http://localhost/api/comments', {
        method: 'POST',
        body: 'invalid',
      }))
      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })

  describe('GET', () => {
    it('gets comments for document', async () => {
      const createReq = makeRequest('http://localhost/api/comments', 'POST', {
        documentId: 'doc-filter',
        blockId: 'b1',
        userId: 'u1',
        content: 'Comment 1',
      })
      await POST(createReq)

      const getReq = makeRequest('http://localhost/api/comments?documentId=doc-filter', 'GET')
      const res = await GET(getReq)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it('filters by resolved status', async () => {
      const createReq = makeRequest('http://localhost/api/comments', 'POST', {
        documentId: 'doc-resolve',
        blockId: 'b1',
        userId: 'u1',
        content: 'Open comment',
      })
      await POST(createReq)

      const getReq = makeRequest('http://localhost/api/comments?documentId=doc-resolve&resolved=false', 'GET')
      const res = await GET(getReq)
      const data = await res.json()
      expect(data.every((c: { resolved: boolean }) => c.resolved === false)).toBe(true)
    })
  })

  describe('PUT', () => {
    it('updates a comment', async () => {
      const createReq = makeRequest('http://localhost/api/comments', 'POST', {
        documentId: 'doc-update',
        blockId: 'b1',
        userId: 'u1',
        content: 'Original',
      })
      const createRes = await POST(createReq)
      const created = await createRes.json()

      const updateReq = makeRequest('http://localhost/api/comments', 'PUT', {
        id: created.id,
        content: 'Updated',
      })
      const res = await PUT(updateReq)
      const data = await res.json()
      expect(data.content).toBe('Updated')
    })

    it('resolves a comment', async () => {
      const createReq = makeRequest('http://localhost/api/comments', 'POST', {
        documentId: 'doc-resolve',
        blockId: 'b1',
        userId: 'u1',
        content: 'Resolve me',
      })
      const createRes = await POST(createReq)
      const created = await createRes.json()

      const updateReq = makeRequest('http://localhost/api/comments', 'PUT', {
        id: created.id,
        resolved: true,
      })
      const res = await PUT(updateReq)
      const data = await res.json()
      expect(data.resolved).toBe(true)
    })

    it('returns 400 for missing id', async () => {
      const req = makeRequest('http://localhost/api/comments', 'PUT', {
        content: 'Updated',
      })
      const res = await PUT(req)
      expect(res.status).toBe(400)
    })

    it('returns 404 for non-existent comment', async () => {
      const req = makeRequest('http://localhost/api/comments', 'PUT', {
        id: 'nonexistent',
        content: 'Updated',
      })
      const res = await PUT(req)
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE', () => {
    it('deletes a comment', async () => {
      const createReq = makeRequest('http://localhost/api/comments', 'POST', {
        documentId: 'doc-delete',
        blockId: 'b1',
        userId: 'u1',
        content: 'Delete me',
      })
      const createRes = await POST(createReq)
      const created = await createRes.json()

      const deleteReq = makeRequest(`http://localhost/api/comments?id=${created.id}`, 'DELETE')
      const res = await DELETE(deleteReq)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    it('returns 400 for missing id', async () => {
      const req = makeRequest('http://localhost/api/comments', 'DELETE')
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })

    it('returns 404 for non-existent comment', async () => {
      const req = makeRequest('http://localhost/api/comments?id=nonexistent', 'DELETE')
      const res = await DELETE(req)
      expect(res.status).toBe(404)
    })
  })
})
