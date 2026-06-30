export default defineEventHandler((event) => {
  const path = event.path || event.node?.req?.url || '?'
  const method = event.method || '?'
  const start = Date.now()

  if (!path.startsWith('/api/')) return

  console.log(`[${new Date().toISOString()}] --> ${method} ${path}`)

  event.node.res.on('close', () => {
    const duration = Date.now() - start
    const status = event.node.res.statusCode
    const level = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'OK'
    console.log(`[${new Date().toISOString()}] ${level} ${method} ${path} ${status} ${duration}ms`)
  })
})
