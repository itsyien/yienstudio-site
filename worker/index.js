const KV_KEY = 'catalog'
const ALLOWED_ORIGINS = new Set([
  'https://yienstudio.net',
  'https://www.yienstudio.net',
  'https://games.yienstudio.workers.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

function corsHeaders(request) {
  const origin = request.headers.get('Origin')
  const headers = {
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(request),
    },
  })
}

function passwordsMatch(given, expected) {
  if (!given || !expected || given.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < given.length; i += 1) {
    diff |= given.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return diff === 0
}

function bearer(request) {
  const header = request.headers.get('Authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : ''
}

function isEntry(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  if (value.downloadUrl != null && typeof value.downloadUrl !== 'string') return false
  if (value.downloadLabel != null && typeof value.downloadLabel !== 'string') return false
  if (value.githubRepo != null && typeof value.githubRepo !== 'string') return false
  return true
}

function readMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const out = {}
  for (const [id, entry] of Object.entries(value)) {
    if (isEntry(entry)) out[id] = entry
  }
  return out
}

function parseCatalog(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const version = value.version
  const parsedVersion =
    version &&
    typeof version.version === 'string' &&
    typeof version.date === 'string' &&
    typeof version.note === 'string'
      ? { version: version.version, date: version.date, note: version.note }
      : undefined
  return {
    games: readMap(value.games),
    apps: readMap(value.apps),
    experimental: readMap(value.experimental),
    version: parsedVersion,
  }
}

async function readCatalog(env, request) {
  const stored = await env.RELEASES.get(KV_KEY, 'json')
  if (stored) return stored
  const assetUrl = new URL('/releases.json', request.url)
  const asset = await env.ASSETS.fetch(new Request(assetUrl))
  if (!asset.ok) return null
  const seeded = parseCatalog(await asset.json())
  if (!seeded) return null
  await env.RELEASES.put(KV_KEY, JSON.stringify(seeded))
  return seeded
}

async function handleReleases(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) })
  }

  if (request.method === 'GET') {
    const catalog = await readCatalog(env, request)
    if (!catalog) return json(request, { error: 'No release catalog stored yet.' }, 404)
    return json(request, catalog)
  }

  if (request.method === 'PUT') {
    if (!env.ADMIN_PASSWORD) {
      return json(request, { error: 'Set the ADMIN_PASSWORD secret before saving.' }, 503)
    }
    if (!passwordsMatch(bearer(request), env.ADMIN_PASSWORD)) {
      return json(request, { error: 'Wrong password.' }, 401)
    }
    const text = await request.text()
    if (text.length > 100_000) return json(request, { error: 'Catalog is too large.' }, 413)
    let parsed
    try {
      parsed = parseCatalog(JSON.parse(text))
    } catch {
      parsed = null
    }
    if (!parsed) return json(request, { error: 'Catalog JSON is not valid.' }, 400)
    await env.RELEASES.put(KV_KEY, JSON.stringify(parsed))
    return json(request, parsed)
  }

  return json(request, { error: 'Method not allowed.' }, 405)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname === '/api/releases') return handleReleases(request, env)
    return env.ASSETS.fetch(request)
  },
}
