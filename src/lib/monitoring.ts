interface Metric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: Record<string, { status: string; latency?: number; error?: string }>
  timestamp: string
  uptime: number
}

class MonitoringService {
  private metrics: Metric[] = []
  private counters: Map<string, number> = new Map()
  private histograms: Map<string, number[]> = new Map()
  private startTime: number = Date.now()

  incrementCounter(name: string, tags?: Record<string, string>): void {
    const key = `${name}:${JSON.stringify(tags ?? {})}`
    this.counters.set(key, (this.counters.get(key) ?? 0) + 1)
    this.recordMetric(name, this.counters.get(key)!, tags)
  }

  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = `${name}:${JSON.stringify(tags ?? {})}`
    const values = this.histograms.get(key) ?? []
    values.push(value)
    this.histograms.set(key, values)
    this.recordMetric(name, value, tags)
  }

  recordGauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(name, value, tags)
  }

  private recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
    })
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000)
    }
  }

  getCounter(name: string, tags?: Record<string, string>): number {
    const key = `${name}:${JSON.stringify(tags ?? {})}`
    return this.counters.get(key) ?? 0
  }

  getHistogramStats(name: string, tags?: Record<string, string>): {
    count: number
    min: number
    max: number
    avg: number
    p95: number
    p99: number
  } | null {
    const key = `${name}:${JSON.stringify(tags ?? {})}`
    const values = this.histograms.get(key)
    if (!values || values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const count = sorted.length
    const min = sorted[0]!
    const max = sorted[count - 1]!;
    const avg = sorted.reduce((a, b) => a + b, 0) / count
    const p95Index = Math.floor(count * 0.95)
    const p99Index = Math.floor(count * 0.99)

    return {
      count,
      min,
      max,
      avg,
      p95: sorted[p95Index]!,
      p99: sorted[p99Index]!,
    }
  }

  getRecentMetrics(ms: number = 60000): Metric[] {
    const cutoff = Date.now() - ms
    return this.metrics.filter((m) => m.timestamp > cutoff)
  }

  async healthCheck(checks?: Record<string, () => Promise<boolean>>): Promise<HealthCheckResult> {
    const checkResults: HealthCheckResult['checks'] = {}
    let overallStatus: HealthCheckResult['status'] = 'healthy'

    if (checks) {
      for (const [name, check] of Object.entries(checks)) {
        const start = Date.now()
        try {
          const result = await check()
          checkResults[name] = {
            status: result ? 'healthy' : 'unhealthy',
            latency: Date.now() - start,
          }
          if (!result) overallStatus = 'unhealthy'
        } catch (error) {
          checkResults[name] = {
            status: 'unhealthy',
            latency: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
          overallStatus = 'unhealthy'
        }
      }
    }

    return {
      status: overallStatus,
      checks: checkResults,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    }
  }

  trackRequest(method: string, path: string, statusCode: number, duration: number): void {
    this.incrementCounter('http_requests_total', { method, path, status: String(statusCode) })
    this.recordHistogram('http_request_duration_ms', duration, { method, path })
    if (statusCode >= 500) {
      this.incrementCounter('http_errors_total', { method, path, status: String(statusCode) })
    }
  }

  trackAIRequest(type: string, duration: number, success: boolean): void {
    this.incrementCounter('ai_requests_total', { type, success: String(success) })
    this.recordHistogram('ai_request_duration_ms', duration, { type })
  }

  getMetricsSummary(): Record<string, unknown> {
    return {
      totalMetrics: this.metrics.length,
      counters: Object.fromEntries(this.counters),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    }
  }

  clearMetrics(): void {
    this.metrics = []
    this.counters.clear()
    this.histograms.clear()
  }
}

export const monitoring = new MonitoringService()
export { MonitoringService }
