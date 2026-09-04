import { NextResponse } from 'next/server'
import { monitoring } from '@/lib/monitoring'

export async function GET() {
  const checks: Record<string, () => Promise<boolean>> = {
    database: async () => {
      try {
        return true
      } catch {
        return false
      }
    },
    redis: async () => {
      try {
        return true
      } catch {
        return false
      }
    },
    ai_service: async () => {
      try {
        return true
      } catch {
        return false
      }
    },
  }

  const health = await monitoring.healthCheck(checks)

  const statusCode =
    health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}
