import { createServer, request as proxyRequest } from 'node:http'
import { stat, readFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectDir = fileURLToPath(new URL('.', import.meta.url))
const distDir = resolve(projectDir, 'dist')
const port = Number(process.env.PORT || 4173)
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3030'

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

function safePath(pathname) {
  const decodedPath = decodeURIComponent(pathname || '/')
  const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^[/\\]+/, '')
  const candidate = resolve(distDir, normalize(relativePath))
  return candidate === distDir || candidate.startsWith(`${distDir}/`) || candidate.startsWith(`${distDir}\\`)
    ? candidate
    : null
}

async function readAsset(pathname) {
  const candidate = safePath(pathname)
  if (!candidate) return null

  try {
    const details = await stat(candidate)
    if (details.isFile()) return { path: candidate, contentType: contentTypes[extname(candidate)] || 'application/octet-stream' }
  } catch {
    // React Router routes fall back to index.html below.
  }

  const indexPath = join(distDir, 'index.html')
  return { path: indexPath, contentType: 'text/html; charset=utf-8' }
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url || '/', 'http://localhost')

    // The preview server is normally used alongside the legacy API server.
    // Forward API calls instead of treating them as static assets (which
    // would return index.html with a 200 status and make the client report an
    // invalid JSON response).
    if (requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')) {
      const target = new URL(`${requestUrl.pathname}${requestUrl.search}`, apiProxyTarget)
      const headers = { ...request.headers, host: target.host }
      const upstream = proxyRequest(target, {
        method: request.method,
        headers,
      }, (upstreamResponse) => {
        response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers)
        upstreamResponse.pipe(response)
      })

      upstream.on('error', (error) => {
        console.error('API proxy error:', error)
        if (!response.headersSent) {
          response.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
        }
        response.end(JSON.stringify({ error: 'No se pudo conectar al servidor API.' }))
      })

      request.pipe(upstream)
      return
    }

    const asset = await readAsset(requestUrl.pathname)

    if (!asset) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Forbidden')
      return
    }

    const body = await readFile(asset.path)
    response.writeHead(200, {
      'Cache-Control': asset.contentType.startsWith('text/html') ? 'no-cache' : 'public, max-age=31536000, immutable',
      'Content-Type': asset.contentType
    })
    response.end(body)
  } catch (error) {
    console.error('Static server error:', error)
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('Internal server error')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Frontend disponible en el puerto ${port}`)
})
