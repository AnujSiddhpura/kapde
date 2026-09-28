import fs from 'node:fs'
import path from 'node:path'

const empty = {
  students: {},
  staff: {},
  submissions: [],
  lostFound: [],
  issues: [],
  announcements: [],
  updatedAt: 0,
}

export function dbFile(root) {
  return path.join(root, 'data', 'store.json')
}

export function readDb(root) {
  try {
    return JSON.parse(fs.readFileSync(dbFile(root), 'utf8'))
  } catch {
    return structuredClone(empty)
  }
}

export function writeDb(root, data) {
  const dir = path.join(root, 'data')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(dbFile(root), JSON.stringify(data))
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export function handleState(root, req, res) {
  if (req.method === 'GET') {
    send(res, 200, readDb(root))
    return
  }
  if (req.method === 'PUT' || req.method === 'POST') {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      try {
        const incoming = JSON.parse(raw || '{}')
        incoming.updatedAt = Date.now()
        writeDb(root, incoming)
        send(res, 200, incoming)
      } catch (e) {
        send(res, 400, { error: String(e.message || e) })
      }
    })
    return
  }
  send(res, 405, { error: 'Method not allowed' })
}

function attach(server, root) {
  server.middlewares.use((req, res, next) => {
    const url = (req.url || '').split('?')[0]
    if (url === '/api/state' || url === '/api/state/') {
      handleState(root, req, res)
      return
    }
    next()
  })
}

export function kapdeDbPlugin() {
  return {
    name: 'kapde-db',
    configureServer(server) {
      attach(server, server.config.root)
    },
    configurePreviewServer(server) {
      attach(server, server.config.root)
    },
  }
}
