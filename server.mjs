import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleState } from './vite-plugin-db.js'

const root = fileURLToPath(new URL('.', import.meta.url))
const dist = join(root, 'dist')
const port = Number(process.env.PORT || 4173)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

createServer((req, res) => {
  if ((req.url || '').split('?')[0].startsWith('/api/state')) {
    handleState(root, req, res)
    return
  }
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
  if (urlPath === '/') urlPath = '/index.html'
  const file = normalize(join(dist, urlPath))
  if (!file.startsWith(dist)) {
    res.statusCode = 403
    res.end()
    return
  }
  const target = existsSync(file) ? file : join(dist, 'index.html')
  try {
    const body = readFileSync(target)
    res.setHeader('Content-Type', types[extname(target)] || 'application/octet-stream')
    res.end(body)
  } catch {
    res.statusCode = 404
    res.end('Not found')
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`Kapde? running on http://0.0.0.0:${port}`)
})
