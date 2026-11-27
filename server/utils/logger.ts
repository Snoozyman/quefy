const SECRET_PARAMS = [
  'hosttoken',
  'code',
  'state',
  'access_token',
  'refresh_token'
]

/** Replace secret query parameter values in a request path with `***`. */
export function redactPath(path: string): string {
  const q = path.indexOf('?')
  if (q === -1) return path
  const params = new URLSearchParams(path.slice(q + 1))
  for (const key of [...params.keys()]) {
    if (SECRET_PARAMS.includes(key.toLowerCase())) params.set(key, '***')
  }
  const query = params.toString().replace(/%2A/g, '*')
  return query ? `${path.slice(0, q)}?${query}` : path.slice(0, q)
}
