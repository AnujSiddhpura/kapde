import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { empty, pullState, pushState } from './lib/db'
import { initial, isToday, qtyTotal, sameMonth, uid } from './lib/rules'

const Store = createContext(null)
const SESSION_KEY = 'kapde.session'
const DB_KEY = 'kapde.db'

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

function loadCache() {
  try {
    const raw = JSON.parse(localStorage.getItem(DB_KEY) || 'null')
    if (raw && typeof raw === 'object') {
      return {
        students: raw.students || {},
        staff: raw.staff || {},
        submissions: raw.submissions || [],
        lostFound: raw.lostFound || [],
        issues: raw.issues || [],
        announcements: raw.announcements || [],
        updatedAt: raw.updatedAt || 0,
      }
    }
  } catch { /* ignore */ }
  return empty()
}

function writeCache(next) {
  localStorage.setItem(DB_KEY, JSON.stringify(next))
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(loadCache)
  const [session, setSession] = useState(loadSession)
  const [toast, setToast] = useState(null)
  const dbRef = useRef(db)
  const pushing = useRef(false)
  dbRef.current = db

  const persist = useCallback(async (next) => {
    const payload = { ...next, updatedAt: Date.now() }
    setDb(payload)
    dbRef.current = payload
    writeCache(payload)
    if (pushing.current) return
    pushing.current = true
    try {
      await pushState(dbRef.current)
    } catch {
      /* keep local */
    } finally {
      pushing.current = false
    }
  }, [])

  useEffect(() => {
    let on = true
    let remoteOk = true
    const tick = async () => {
      if (!remoteOk) return
      try {
        const remote = await pullState()
        if (!on) return
        if ((remote.updatedAt || 0) > (dbRef.current.updatedAt || 0)) {
          setDb(remote)
          dbRef.current = remote
          writeCache(remote)
        } else if ((dbRef.current.updatedAt || 0) > (remote.updatedAt || 0)) {
          await pushState(dbRef.current)
        }
      } catch {
        remoteOk = false
      }
    }
    tick()
    const id = setInterval(tick, 1200)
    return () => { on = false; clearInterval(id) }
  }, [])

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  }, [session])

  const notify = useCallback((text) => {
    setToast({ text, id: uid('t') })
  }, [])

  const addAnnouncement = (state, a) => {
    state.announcements = [{ ...a, id: a.id || uid('an'), createdAt: a.createdAt || Date.now(), readBy: a.readBy || [] }, ...state.announcements]
  }

  const api = useMemo(() => {
    const student = session?.role === 'student' ? db.students[session.id] : null
    const staff = session?.role === 'staff' ? db.staff[session.id] : null

    return {
      db,
      session,
      student,
      staff,
      toast,
      clearToast: () => setToast(null),
      notify,

      signupStudent: (profile) => {
        const id = profile.studentId.trim()
        const rec = { ...profile, id, createdAt: Date.now() }
        const next = { ...dbRef.current, students: { ...dbRef.current.students, [id]: rec }, updatedAt: Date.now() }
        persist(next)
        setSession({ role: 'student', id })
        return rec
      },
      loginStudent: (studentId, email) => {
        const rec = Object.values(dbRef.current.students).find(
          (s) => s.studentId.trim().toLowerCase() === studentId.trim().toLowerCase()
            && s.email.trim().toLowerCase() === email.trim().toLowerCase(),
        )
        if (!rec) return false
        setSession({ role: 'student', id: rec.id })
        return true
      },
      signupStaff: (profile) => {
        const id = profile.staffId.trim()
        const rec = { ...profile, id, createdAt: Date.now() }
        const next = { ...dbRef.current, staff: { ...dbRef.current.staff, [id]: rec }, updatedAt: Date.now() }
        persist(next)
        setSession({ role: 'staff', id, language: rec.language })
        return rec
      },
      loginStaff: (staffId, name) => {
        const rec = Object.values(dbRef.current.staff).find(
          (s) => s.staffId.trim().toLowerCase() === staffId.trim().toLowerCase()
            && s.name.trim().toLowerCase() === name.trim().toLowerCase(),
        )
        if (!rec) return false
        setSession({ role: 'staff', id: rec.id, language: rec.language })
        return true
      },
      setStaffLanguage: (language) => {
        setSession((s) => (s ? { ...s, language } : s))
      },
      logout: () => setSession(null),

      saveDraft: (items) => {
        const st = dbRef.current.students[session.id]
        if (!st) return
        persist({
          ...dbRef.current,
          students: { ...dbRef.current.students, [st.id]: { ...st, draftRegular: items } },
        })
      },
      clearDraft: () => {
        const st = dbRef.current.students[session.id]
        if (!st) return
        const { draftRegular: _drop, ...rest } = st
        persist({
          ...dbRef.current,
          students: { ...dbRef.current.students, [st.id]: rest },
        })
      },

      submitRegular: (items) => {
        const st = dbRef.current.students[session.id]
        const sub = {
          id: uid('bag'),
          studentId: st.id,
          studentName: st.name,
          hostel: st.hostel,
          room: `${st.room} ${st.side}`,
          type: 'regular',
          items,
          status: 'pending',
          createdAt: Date.now(),
        }
        const next = { ...dbRef.current, submissions: [sub, ...dbRef.current.submissions], updatedAt: Date.now() }
        addAnnouncement(next, {
          type: 'laundry',
          text: 'Laundry submitted.',
          toStudentId: st.id,
        })
        const { draftRegular: _drop, ...rest } = st
        next.students = { ...next.students, [st.id]: rest }
        persist(next)
        notify('Laundry submitted.')
        if (navigator.vibrate) navigator.vibrate(40)
        return sub
      },

      submitExtra: (items, paymentMethod) => {
        const st = dbRef.current.students[session.id]
        const total = Object.values(items).reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0)
        const sub = {
          id: uid('xtra'),
          studentId: st.id,
          studentName: st.name,
          hostel: st.hostel,
          room: `${st.room} ${st.side}`,
          type: 'extra',
          items,
          status: 'pending',
          paymentMethod,
          paid: paymentMethod !== 'cash',
          total,
          createdAt: Date.now(),
        }
        const next = { ...dbRef.current, submissions: [sub, ...dbRef.current.submissions], updatedAt: Date.now() }
        addAnnouncement(next, {
          type: 'extra',
          text: 'Extra services order placed.',
          toStudentId: st.id,
        })
        persist(next)
        return sub
      },

      submitLostFound: ({ photos, details, byRole }) => {
        const who = session.role === 'student' ? dbRef.current.students[session.id] : dbRef.current.staff[session.id]
        const rec = {
          id: uid('lf'),
          byRole: session.role,
          byId: session.id,
          byName: who?.name,
          photos,
          details,
          found: false,
          createdAt: Date.now(),
        }
        const next = { ...dbRef.current, lostFound: [rec, ...dbRef.current.lostFound], updatedAt: Date.now() }
        addAnnouncement(next, {
          type: 'lostfound',
          text: details || 'Lost and Found item posted.',
          lostFoundId: rec.id,
          toStudentId: null,
        })
        persist(next)
        notify('Lost and Found submitted.')
        return rec
      },

      markFound: (lostFoundId) => {
        const next = {
          ...dbRef.current,
          lostFound: dbRef.current.lostFound.map((x) => (x.id === lostFoundId ? { ...x, found: true } : x)),
          announcements: dbRef.current.announcements.map((a) => (a.lostFoundId === lostFoundId ? { ...a, found: true } : a)),
          updatedAt: Date.now(),
        }
        persist(next)
      },

      submitIssue: ({ types, others, photos }) => {
        const st = dbRef.current.students[session.id]
        const rec = {
          id: uid('iss'),
          studentId: st.id,
          studentName: st.name,
          hostel: st.hostel,
          room: `${st.room} ${st.side}`,
          types,
          others,
          photos,
          status: 'received',
          createdAt: Date.now(),
        }
        const next = { ...dbRef.current, issues: [rec, ...dbRef.current.issues], updatedAt: Date.now() }
        addAnnouncement(next, {
          type: 'issue',
          text: 'Issue submitted to laundry.',
          issueId: rec.id,
          toStudentId: st.id,
        })
        persist(next)
        notify('Your issue has been submitted.')
        return rec
      },

      markIssue: (issueId, status) => {
        const issue = dbRef.current.issues.find((i) => i.id === issueId)
        const next = {
          ...dbRef.current,
          issues: dbRef.current.issues.map((i) => (i.id === issueId ? { ...i, status } : i)),
          updatedAt: Date.now(),
        }
        if (issue) {
          const text = status === 'resolved'
            ? 'Your issue has been resolved.'
            : 'Your issue could not be resolved.'
          addAnnouncement(next, { type: 'issue-status', text, issueId, toStudentId: issue.studentId })
          notify(text)
        }
        persist(next)
      },

      markBagDone: (subId) => {
        const bag = dbRef.current.submissions.find((s) => s.id === subId)
        const next = {
          ...dbRef.current,
          submissions: dbRef.current.submissions.map((s) => (s.id === subId ? { ...s, status: 'done' } : s)),
          updatedAt: Date.now(),
        }
        if (bag) {
          addAnnouncement(next, {
            type: bag.type === 'extra' ? 'extra-done' : 'ready',
            text: bag.type === 'extra' ? 'Your extra service is done.' : 'Kapde ho gaye!',
            toStudentId: bag.studentId,
          })
        }
        persist(next)
      },

      postClosure: (from, to, lang) => {
        const textEn = `The laundry will be closed from ${from} to ${to}`
        const next = { ...dbRef.current, updatedAt: Date.now() }
        addAnnouncement(next, { type: 'closure', text: textEn, from, to, toStudentId: null })
        persist(next)
        notify(textEn)
      },

      markAnnouncementsRead: (userKey) => {
        const next = {
          ...dbRef.current,
          announcements: dbRef.current.announcements.map((a) => (
            a.readBy?.includes(userKey) ? a : { ...a, readBy: [...(a.readBy || []), userKey] }
          )),
          updatedAt: Date.now(),
        }
        persist(next)
      },

      unreadCount: (userKey, studentId) => db.announcements.filter((a) => {
        if (a.readBy?.includes(userKey)) return false
        if (a.toStudentId && studentId && a.toStudentId !== studentId) return false
        return true
      }).length,

      visibleAnnouncements: (studentId) => db.announcements.filter((a) => !a.toStudentId || a.toStudentId === studentId),

      historyFor: (studentId) => db.submissions.filter((s) => s.studentId === studentId && sameMonth(s.createdAt)),

      pendingBagsToday: () => db.submissions.filter((s) => s.status === 'pending' && isToday(s.createdAt)),

      qtyTotal,
      initial,
    }
  }, [db, session, notify, persist, toast])

  return <Store.Provider value={api}>{children}</Store.Provider>
}

export function useStore() {
  return useContext(Store)
}
