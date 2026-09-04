import { NextRequest } from 'next/server'
import { GET, POST, DELETE } from '@/app/api/templates/route'

function makeRequest(url: string, method: string, body?: unknown): NextRequest {
  const init: RequestInit = { method }
  if (body) {
    init.body = JSON.stringify(body)
  }
  return new NextRequest(new Request(url, init))
}

describe('/api/templates', () => {
  describe('GET', () => {
    it('returns default templates', async () => {
      const req = makeRequest('http://localhost/api/templates', 'GET')
      const res = await GET(req)
      const data = await res.json()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it('includes blank template', async () => {
      const req = makeRequest('http://localhost/api/templates', 'GET')
      const res = await GET(req)
      const data = await res.json()
      expect(data.some((t: { id: string }) => t.id === 'blank')).toBe(true)
    })

    it('gets template by id', async () => {
      const req = makeRequest('http://localhost/api/templates?id=blank', 'GET')
      const res = await GET(req)
      const data = await res.json()
      expect(data.id).toBe('blank')
      expect(data.name).toBe('Blank Document')
    })

    it('returns 404 for non-existent template', async () => {
      const req = makeRequest('http://localhost/api/templates?id=nonexistent', 'GET')
      const res = await GET(req)
      expect(res.status).toBe(404)
    })

    it('filters by category', async () => {
      const req = makeRequest('http://localhost/api/templates?category=business', 'GET')
      const res = await GET(req)
      const data = await res.json()
      expect(data.every((t: { category: string }) => t.category === 'business')).toBe(true)
    })
  })

  describe('POST', () => {
    it('creates a new template', async () => {
      const req = makeRequest('http://localhost/api/templates', 'POST', {
        name: 'Custom Template',
        createdBy: 'user-1',
        description: 'My template',
        category: 'custom',
      })
      const res = await POST(req)
      const data = await res.json()
      expect(res.status).toBe(201)
      expect(data.name).toBe('Custom Template')
      expect(data.createdBy).toBe('user-1')
      expect(data.isPublic).toBe(false)
    })

    it('returns 400 for missing name', async () => {
      const req = makeRequest('http://localhost/api/templates', 'POST', {
        createdBy: 'user-1',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('returns 400 for missing createdBy', async () => {
      const req = makeRequest('http://localhost/api/templates', 'POST', {
        name: 'Test',
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('creates template with blocks', async () => {
      const req = makeRequest('http://localhost/api/templates', 'POST', {
        name: 'With Blocks',
        createdBy: 'user-1',
        blocks: [{ type: 'paragraph', content: [{ text: '' }] }],
      })
      const res = await POST(req)
      const data = await res.json()
      expect(data.blocks).toHaveLength(1)
    })
  })

  describe('DELETE', () => {
    it('deletes a custom template', async () => {
      const createReq = makeRequest('http://localhost/api/templates', 'POST', {
        name: 'To Delete',
        createdBy: 'user-1',
      })
      const createRes = await POST(createReq)
      const created = await createRes.json()

      const deleteReq = makeRequest(`http://localhost/api/templates?id=${created.id}`, 'DELETE')
      const res = await DELETE(deleteReq)
      const data = await res.json()
      expect(data.success).toBe(true)
    })

    it('returns 400 for missing id', async () => {
      const req = makeRequest('http://localhost/api/templates', 'DELETE')
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })

    it('returns 404 for non-existent template', async () => {
      const req = makeRequest('http://localhost/api/templates?id=nonexistent', 'DELETE')
      const res = await DELETE(req)
      expect(res.status).toBe(404)
    })

    it('returns 403 for default templates', async () => {
      const req = makeRequest('http://localhost/api/templates?id=blank', 'DELETE')
      const res = await DELETE(req)
      expect(res.status).toBe(403)
    })
  })
})
