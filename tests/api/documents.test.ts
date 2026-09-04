import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/documents/route'

function makeRequest(url: string, method: string, body?: unknown): NextRequest {
  const init: RequestInit = { method }
  if (body) {
    init.body = JSON.stringify(body)
  }
  return new NextRequest(new Request(url, init))
}

describe('/api/documents', () => {
  describe('POST', () => {
    it('creates a new document', async () => {
      const req = makeRequest('http://localhost/api/documents', 'POST', {
        title: 'Test Doc',
        ownerId: 'user-1',
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(201)
      expect(data.title).toBe('Test Doc')
      expect(data.ownerId).toBe('user-1')
      expect(data.id).toBeTruthy()
    })

    it('returns 400 for missing title', async () => {
      const req = makeRequest('http://localhost/api/documents', 'POST', {
        ownerId: 'user-1',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 for missing ownerId', async () => {
      const req = makeRequest('http://localhost/api/documents', 'POST', {
        title: 'Test',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 for invalid JSON', async () => {
      const req = new NextRequest(new Request('http://localhost/api/documents', {
        method: 'POST',
        body: 'not json',
      }))
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('creates document with blocks', async () => {
      const req = makeRequest('http://localhost/api/documents', 'POST', {
        title: 'With Blocks',
        ownerId: 'user-1',
        blocks: [{ type: 'paragraph', content: [{ text: 'Hello' }] }],
      })
      const res = await POST(req)
      const data = await res.json()
      expect(data.blocks).toHaveLength(1)
    })
  })

  describe('GET', () => {
    it('gets all documents', async () => {
      const req = makeRequest('http://localhost/api/documents', 'GET')
      const res = await GET(req)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
    })

    it('gets document by id', async () => {
      const createReq = makeRequest('http://localhost/api/documents', 'POST', {
        title: 'Find Me',
        ownerId: 'user-1',
      })
      const createRes = await POST(createReq)
      const created = await createRes.json()

      const getReq = makeRequest(`http://localhost/api/documents?id=${created.id}`, 'GET')
      const res = await GET(getReq)
      const data = await res.json()
      expect(data.id).toBe(created.id)
      expect(data.title).toBe('Find Me')
    })

    it('returns 404 for non-existent document', async () => {
      const req = makeRequest('http://localhost/api/documents?id=nonexistent', 'GET')
      const res = await GET(req)
      expect(res.status).toBe(404)
    })
  })

  describe('PUT', () => {
    it('updates a document', async () => {
      const createReq = makeRequest('http://localhost/api/documents', 'POST', {
        title: 'Original',
        ownerId: 'user-1',
      })
      const createRes = await POST(createReq)
      const created = await createRes.json()

      const updateReq = makeRequest('http://localhost/api/documents', 'PUT', {
        id: created.id,
        title: 'Updated',
      })
      const res = await PUT(updateReq)
      const data = await res.json()
      expect(data.title).toBe('Updated')
    })

    it('returns 400 for missing id', async () => {
      const req = makeRequest('http://localhost/api/documents', 'PUT', {
        title: 'Updated',
      })
      const res = await PUT(req)
      expect(res.status).toBe(400)
    })

    it('returns 404 for non-existent document', async () => {
      const req = makeRequest('http://localhost/api/documents', 'PUT', {
        id: 'nonexistent',
        title: 'Updated',
      })
      const res = await PUT(req)
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE', () => {
    it('deletes a document', async () => {
      const createReq = makeRequest('http://localhost/api/documents', 'POST', {
        title: 'To Delete',
        ownerId: 'user-1',
      })
      const createRes = await POST(createReq)
      const created = await createRes.json()

      const deleteReq = makeRequest(`http://localhost/api/documents?id=${created.id}`, 'DELETE')
      const res = await DELETE(deleteReq)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    it('returns 400 for missing id', async () => {
      const req = makeRequest('http://localhost/api/documents', 'DELETE')
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })

    it('returns 404 for non-existent document', async () => {
      const req = makeRequest('http://localhost/api/documents?id=nonexistent', 'DELETE')
      const res = await DELETE(req)
      expect(res.status).toBe(404)
    })
  })
})
