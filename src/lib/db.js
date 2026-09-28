const empty = () => ({
  students: {},
  staff: {},
  submissions: [],
  lostFound: [],
  issues: [],
  announcements: [],
  updatedAt: 0,
})

const firebaseUrl = (import.meta.env.VITE_FIREBASE_DB_URL || '').replace(/\/$/, '')
const firebaseKey = import.meta.env.VITE_FIREBASE_API_KEY || ''

function endpoint() {
  if (firebaseUrl) {
    const qs = firebaseKey ? `?auth=${encodeURIComponent(firebaseKey)}` : ''
    return `${firebaseUrl}/kapde.json${qs}`
  }
  return '/api/state'
}

export async function pullState() {
  const res = await fetch(endpoint(), { cache: 'no-store' })
  if (!res.ok) throw new Error('sync pull failed')
  const data = await res.json()
  if (!data || typeof data !== 'object') return empty()
  return {
    students: data.students || {},
    staff: data.staff || {},
    submissions: data.submissions || [],
    lostFound: data.lostFound || [],
    issues: data.issues || [],
    announcements: data.announcements || [],
    updatedAt: data.updatedAt || 0,
  }
}

export async function pushState(state) {
  const payload = { ...state, updatedAt: Date.now() }
  const res = await fetch(endpoint(), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('sync push failed')
  try {
    return await res.json()
  } catch {
    return payload
  }
}

export { empty }
