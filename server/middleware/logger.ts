import { redactPath } from '#server/utils/logger'

export default defineEventHandler((event) => {
  const path = redactPath(event.path || event.node?.req?.url || '?')
  const method = event.method || '?'
  const start = Date.now()

  // The Docker healthcheck polls /api/health every 30s; keep it out of the log.
  if (!path.startsWith('/api/') || path === '/api/health') return

  console.log(`[${new Date().toISOString()}] --> ${method} ${path}`)

  event.node.res.on('close', () => {
    const duration = Date.now() - start
    const status = event.node.res.statusCode
    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'OK'
    console.log(
      `[${new Date().toISOString()}] ${level} ${method} ${path} ${status} ${duration}ms`
    )
  })
})
