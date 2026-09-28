import { useEffect, useRef, useState } from 'react'
import { EXTRA_ITEMS, HOSTELS, ISSUE_TYPES, REGULAR_ITEMS, isBedsheetDay, isLaundryDay, nextLaundryLabel, qtyTotal } from './lib/rules'
import { studentCopy as S } from './lib/i18n'
import { useStore } from './store'
import { Btn, CameraCapture, Chip, Empty, Field, Ico, Qty, RulesFooter, Thumbs, Top } from './ui'

const LAST_STUDENT = 'kapde.lastStudent'

export function StudentSignup({ onDone, onLogin }) {
  const store = useStore()
  const [form, setForm] = useState({ name: '', studentId: '', hostel: '', room: '', side: 'X', batch: '', email: '' })
  const [err, setErr] = useState('')
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const go = () => {
    if (!form.name.trim() || !form.studentId.trim() || !form.hostel || !form.room.trim() || !form.batch.trim() || !form.email.trim()) {
      setErr(S.required)
      return
    }
    store.signupStudent(form)
    localStorage.setItem(LAST_STUDENT, JSON.stringify({ studentId: form.studentId, email: form.email }))
    onDone()
  }
  return (
    <div className="screen">
      <Top title="Join" />
      <div className="screen-body">
        <Field label={S.name}><input value={form.name} onChange={(e) => set('name', e.target.value)} autoFocus /></Field>
        <div className="twin">
          <Field label={S.studentId}><input value={form.studentId} onChange={(e) => set('studentId', e.target.value)} /></Field>
          <Field label={S.batch}><input value={form.batch} onChange={(e) => set('batch', e.target.value)} /></Field>
        </div>
        <Field label={S.hostel}>
          <div className="chips">
            {HOSTELS.map((h) => <Chip key={h} on={form.hostel === h} onClick={() => set('hostel', h)}>{h}</Chip>)}
          </div>
        </Field>
        <div className="twin">
          <Field label={S.room}><input value={form.room} onChange={(e) => set('room', e.target.value.replace(/\D/g, ''))} placeholder="201" /></Field>
          <Field label={S.side}>
            <div className="chips">
              {['X', 'Y'].map((s) => <Chip key={s} on={form.side === s} onClick={() => set('side', s)}>{s}</Chip>)}
            </div>
          </Field>
        </div>
        <Field label={S.email}><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        {err && <p className="err">{err}</p>}
        <Btn onClick={go}>{S.submit}</Btn>
        <div style={{ marginTop: 10 }}><Btn kind="ghost" onClick={onLogin}>{S.already}</Btn></div>
      </div>
    </div>
  )
}

export function StudentLogin({ onDone, onSignup }) {
  const store = useStore()
  const remembered = (() => {
    try { return JSON.parse(localStorage.getItem(LAST_STUDENT) || 'null') } catch { return null }
  })()
  const [studentId, setId] = useState(remembered?.studentId || '')
  const [email, setEmail] = useState(remembered?.email || '')
  const [err, setErr] = useState('')
  return (
    <div className="screen">
      <Top title={S.login} />
      <div className="screen-body">
        <Field label={S.studentId}><input value={studentId} onChange={(e) => setId(e.target.value)} autoFocus={!remembered?.studentId} /></Field>
        <Field label={S.email}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus={!!remembered?.studentId} /></Field>
        {err && <p className="err">{err}</p>}
        <Btn onClick={() => {
          if (!store.loginStudent(studentId, email)) setErr('No matching student.')
          else {
            localStorage.setItem(LAST_STUDENT, JSON.stringify({ studentId, email }))
            onDone()
          }
        }}>{S.login}</Btn>
        <div style={{ marginTop: 12 }}><Btn kind="ghost" onClick={onSignup}>{S.newHere}</Btn></div>
      </div>
    </div>
  )
}

export function StudentHome({ go, openProfile }) {
  const store = useStore()
  const st = store.student
  const unread = store.unreadCount(`student:${st.id}`, st.id)
  const next = nextLaundryLabel(st.hostel)
  const draftQty = qtyTotal(st.draftRegular)
  const cta = next.today
    ? (draftQty ? `Submit ${draftQty} ${draftQty === 1 ? 'piece' : 'pieces'}` : 'Submit bag')
    : (draftQty ? `Continue · ${draftQty} in bag` : 'Prepare bag')
  return (
    <div className="screen">
      <Top
        title="Kapde?"
        right={<button className="avatar" onClick={openProfile}>{store.initial(st.name)}</button>}
      />
      <div className="screen-body">
        <div className="hello">
          <div className="kicker">{st.hostel} · {st.room} {st.side}</div>
          <h3>Hi, {st.name.split(' ')[0]}</h3>
        </div>
        <div className={`hero ${next.today ? 'open' : ''}`}>
          <div className="kicker">{next.today ? 'Drop window' : 'Next drop'}</div>
          <h3>{next.today ? 'Open now' : next.text}</h3>
          <p>{next.today ? '8 pieces · 4–8pm. One bag today.' : 'Build the bag now. Submit on your day.'}</p>
          <Btn onClick={() => go('laundry')}>{cta}</Btn>
        </div>
        <div className="quick">
          <button onClick={() => go('announcements')}>
            {unread > 0 && <span className="badge">{unread}</span>}
            {Ico.bell} Notices
          </button>
          <button onClick={() => go('lostfound')}>{Ico.pin} Lost</button>
          <button onClick={() => go('issues')}>{Ico.issue} Issue</button>
        </div>
      </div>
      <RulesFooter />
    </div>
  )
}

export function StudentProfileMenu({ onClose, go }) {
  const store = useStore()
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="menu" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { onClose(); go('profile') }}>{S.profile}</button>
        <button onClick={() => { onClose(); go('history') }}>{S.view}</button>
        <button onClick={() => { onClose(); go('logout') }}>{S.logout}</button>
      </div>
    </div>
  )
}

export function StudentProfile() {
  const st = useStore().student
  const rows = [
    [S.name, st.name],
    [S.studentId, st.studentId],
    [S.hostel, st.hostel],
    [S.room, `${st.room} ${st.side}`],
    [S.batch, st.batch],
    [S.email, st.email],
  ]
  return (
    <div className="card">
      {rows.map(([k, v]) => (
        <div className="pay-row" key={k}><span>{k}</span><b>{v}</b></div>
      ))}
    </div>
  )
}

export function StudentHistory() {
  const store = useStore()
  const rows = store.historyFor(store.student.id)
  if (!rows.length) return <Empty title="Quiet month">Nothing submitted yet.</Empty>
  return rows.map((s) => (
    <div className="card" key={s.id}>
      <h3>{s.type === 'extra' ? S.extra : S.regular}</h3>
      <p className="sub">{new Date(s.createdAt).toLocaleString()} · {s.status}</p>
      {Object.entries(s.items).filter(([, it]) => it.qty).map(([name, it]) => (
        <div className="pay-row" key={name}><span>{name}</span><span>{it.qty}</span></div>
      ))}
    </div>
  ))
}

export function LaundryHome({ go, setCart }) {
  const store = useStore()
  const [tab, setTab] = useState('regular')
  const allowed = isLaundryDay(store.student.hostel)
  return (
    <div className="screen">
      <Top title={S.laundry} onBack={() => go('home')} />
      <div className="seg">
        <button className={tab === 'regular' ? 'on' : ''} onClick={() => setTab('regular')}>{S.regular}</button>
        <button className={tab === 'extra' ? 'on' : ''} onClick={() => setTab('extra')}>{S.extra}</button>
      </div>
      {tab === 'regular' ? (
        <ItemList
          key="regular"
          catalog={REGULAR_ITEMS}
          onSubmitLabel={S.submit}
          disabledSubmit={!allowed}
          lockMsg={allowed ? '' : `submit ${nextLaundryLabel(store.student.hostel).text}`}
          onSubmit={(items) => {
            if (!allowed) { store.notify(S.notLaundryDay); return }
            if (!isBedsheetDay() && (items.Bedsheets?.qty || 0) > 0) { store.notify(S.bedsheetLock); return }
            store.submitRegular(items)
            go('home')
          }}
        />
      ) : (
        <ItemList
          key="extra"
          catalog={EXTRA_ITEMS}
          extra
          onSubmitLabel={S.proceedPay}
          onSubmit={(items) => { setCart(items); go('pay') }}
        />
      )}
      <RulesFooter />
    </div>
  )
}

function blankItems(catalog, extra) {
  const o = {}
  catalog.forEach((c) => {
    const name = extra ? c.name : c
    o[name] = { qty: 0, photos: [], price: extra ? c.price : 0 }
  })
  return o
}

function ItemList({ catalog, extra, onSubmitLabel, onSubmit, disabledSubmit, lockMsg }) {
  const store = useStore()
  const saveDraft = useRef(store.saveDraft)
  saveDraft.current = store.saveDraft
  const [items, setItems] = useState(() => {
    const base = blankItems(catalog, extra)
    const draft = !extra ? store.student?.draftRegular : null
    if (!draft) return base
    Object.keys(base).forEach((name) => {
      if (draft[name]) base[name] = { ...base[name], ...draft[name] }
    })
    return base
  })
  const [tip, setTip] = useState('')
  const total = qtyTotal(items)

  useEffect(() => {
    if (!extra) saveDraft.current(items)
  }, [items, extra])

  const change = (name, delta, isBedsheet) => {
    if (isBedsheet && !isBedsheetDay()) { setTip(S.bedsheetLock); return }
    const nextQty = (items[name].qty || 0) + delta
    if (nextQty < 0) return
    const next = { ...items, [name]: { ...items[name], qty: nextQty } }
    if (qtyTotal(next) > 8) { setTip(S.maxItems); return }
    setItems(next)
    setTip('')
  }

  return (
    <>
      <div className="screen-body">
        {catalog.map((c) => {
          const name = extra ? c.name : c
          const it = items[name]
          if (!it) return null
          const isBedsheet = name === 'Bedsheets'
          const short = name.replace('Shirts/T-shirts/Sweatshirts', 'Shirts / sweatshirts')
          return (
            <div key={name}>
              <div className="item">
                <button className="item-hit" type="button" onClick={() => change(name, 1, isBedsheet)}>
                  <b>{short}</b>
                  {extra && <span className="price">₹{c.price}</span>}
                </button>
                <CameraCapture
                  compact
                  photos={it.photos}
                  setPhotos={(fn) => setItems((prev) => ({ ...prev, [name]: { ...prev[name], photos: typeof fn === 'function' ? fn(prev[name].photos) : fn } }))}
                  label={S.camera}
                />
                <Qty
                  value={it.qty}
                  onMinus={() => change(name, -1, isBedsheet)}
                  onPlus={() => change(name, 1, isBedsheet)}
                />
              </div>
              {it.photos?.length > 0 && <Thumbs photos={it.photos} onRemove={(i) => setItems((prev) => ({ ...prev, [name]: { ...prev[name], photos: prev[name].photos.filter((_, n) => n !== i) } }))} />}
            </div>
          )
        })}
        {tip && <p className="err">{tip}</p>}
      </div>
      <div className="dock">
        <div className="count-line">{total} of 8 · {lockMsg || `${8 - total} left`}</div>
        <Btn onClick={() => onSubmit(items)} disabled={disabledSubmit || total === 0}>{onSubmitLabel}</Btn>
      </div>
    </>
  )
}

export function PayScreen({ go, cart }) {
  const store = useStore()
  const [cash, setCash] = useState(false)
  const lines = Object.entries(cart || {}).filter(([, it]) => it.qty)
  const total = lines.reduce((s, [, it]) => s + it.qty * it.price, 0)
  return (
    <div className="screen">
      <Top title="Pay" onBack={() => go('laundry')} />
      <div className="screen-body">
        <div className="card">
          {lines.map(([name, it]) => (
            <div className="pay-row" key={name}><span>{name} × {it.qty}</span><b>₹{it.qty * it.price}</b></div>
          ))}
          <div className="pay-row"><span>{S.total}</span><b>₹{total}</b></div>
        </div>
        <p className="step-mark">Pay how?</p>
        <div className="pay-ways">
          <button className="pay-way on" type="button" onClick={() => setCash(true)}>
            <b>{S.cash}</b>
            <span>At drop</span>
          </button>
          <button className="pay-way" type="button" onClick={() => go('upi')}>
            <b>{S.upi}</b>
            <span>Instant</span>
          </button>
          <button className="pay-way" type="button" onClick={() => go('card')}>
            <b>{S.card}</b>
            <span>Instant</span>
          </button>
        </div>
      </div>
      {cash && (
        <div className="modal-back" onClick={() => setCash(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{S.cash}</h3>
            <p>{S.cashNote}</p>
            <div className="modal-actions">
              <Btn kind="ghost" onClick={() => setCash(false)}>{S.cancel}</Btn>
              <Btn onClick={() => { store.submitExtra(cart, 'cash'); store.notify(S.orderPlaced); go('home') }}>{S.ok}</Btn>
            </div>
          </div>
        </div>
      )}
      <RulesFooter />
    </div>
  )
}

export function CashModal({ go, cart }) {
  const store = useStore()
  return (
    <div className="screen">
      <Top title={S.cash} onBack={() => go('pay')} />
      <div className="card"><p>{S.cashNote}</p></div>
      <Btn onClick={() => { store.submitExtra(cart, 'cash'); store.notify(S.orderPlaced); go('home') }}>{S.ok}</Btn>
      <RulesFooter />
    </div>
  )
}

export function UpiScreen({ go, cart }) {
  const store = useStore()
  const [id, setId] = useState('')
  return (
    <div className="screen">
      <Top title={S.upi} onBack={() => go('pay')} />
      <Field label={S.upiId}><input value={id} onChange={(e) => setId(e.target.value)} /></Field>
      <Btn disabled={!id.trim()} onClick={() => { store.submitExtra(cart, 'upi'); store.notify(S.orderPlaced); go('home') }}>{S.pay}</Btn>
      <RulesFooter />
    </div>
  )
}

export function CardScreen({ go, cart }) {
  const store = useStore()
  const [form, setForm] = useState({ no: '', exp: '', cvv: '', name: '' })
  const ok = form.no && form.exp && form.cvv && form.name
  return (
    <div className="screen">
      <Top title={S.card} onBack={() => go('pay')} />
      <Field label={S.cardNo}><input value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value })} /></Field>
      <Field label={S.expiry}><input value={form.exp} onChange={(e) => setForm({ ...form, exp: e.target.value })} placeholder="MM/YY" /></Field>
      <Field label={S.cvv}><input value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} /></Field>
      <Field label={S.cardName}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
      <Btn disabled={!ok} onClick={() => { store.submitExtra(cart, 'card'); store.notify(S.orderPlaced); go('home') }}>{S.pay}</Btn>
      <RulesFooter />
    </div>
  )
}

export function AnnouncementsScreen({ go }) {
  const store = useStore()
  const st = store.student
  const rows = store.visibleAnnouncements(st.id)
  useEffect(() => { store.markAnnouncementsRead(`student:${st.id}`) }, [])
  return (
    <div className="screen">
      <Top title={S.announcements} onBack={() => go('home')} />
      <div className="screen-body">
        {rows.map((a) => (
          <div className="card" key={a.id}>
            <h3>{a.text}</h3>
            <p className="sub">{new Date(a.createdAt).toLocaleString()}</p>
            {a.lostFoundId && !a.found && (
              <div style={{ marginTop: 8 }}>
                <Btn kind="small" onClick={() => store.markFound(a.lostFoundId)}>{S.found}</Btn>
              </div>
            )}
            {a.lostFoundId && a.found && <p className="sub">{S.found}</p>}
            {a.lostFoundId && (() => {
              const lf = store.db.lostFound.find((x) => x.id === a.lostFoundId)
              return lf ? <Thumbs photos={lf.photos} /> : null
            })()}
          </div>
        ))}
        {!rows.length && <Empty title="Inbox clear">No notices right now.</Empty>}
      </div>
      <RulesFooter />
    </div>
  )
}

export function LostFoundScreen({ go }) {
  const store = useStore()
  const [photos, setPhotos] = useState([])
  const [details, setDetails] = useState('')
  return (
    <div className="screen">
      <Top title={S.lostFound} onBack={() => go('home')} />
      <div className="screen-body">
        <CameraCapture max={3} photos={photos} setPhotos={setPhotos} label={S.camera} />
        <Field label={S.details}><textarea value={details} onChange={(e) => setDetails(e.target.value)} /></Field>
        <Btn disabled={!photos.length && !details.trim()} onClick={() => { store.submitLostFound({ photos, details }); go('home') }}>{S.submit}</Btn>
        <h3 className="section-title">{S.lostFound}</h3>
        {store.db.lostFound.map((lf) => (
          <div className="card" key={lf.id}>
            <p>{lf.details}</p>
            <p className="sub">{lf.byName} · {new Date(lf.createdAt).toLocaleString()}</p>
            <Thumbs photos={lf.photos} />
            {!lf.found && <div style={{ marginTop: 8 }}><Btn kind="small" onClick={() => store.markFound(lf.id)}>{S.found}</Btn></div>}
            {lf.found && <p className="sub">{S.found}</p>}
          </div>
        ))}
      </div>
      <RulesFooter />
    </div>
  )
}

export function IssuesScreen({ go }) {
  const store = useStore()
  const [types, setTypes] = useState([])
  const [photos, setPhotos] = useState([])
  const [others, setOthers] = useState('')
  const toggle = (t) => setTypes((xs) => xs.includes(t) ? xs.filter((x) => x !== t) : [...xs, t])
  return (
    <div className="screen">
          <Top title="Issue" onBack={() => go('home')} />
      <div className="screen-body">
        {ISSUE_TYPES.map((t) => (
          <button className="issue-row" key={t} onClick={() => toggle(t)}>
            <span>{S[t]}</span>
            <span className={`check ${types.includes(t) ? 'on' : ''}`}>{types.includes(t) ? '✓' : ''}</span>
          </button>
        ))}
        <Field label={S.others}><textarea value={others} onChange={(e) => setOthers(e.target.value)} /></Field>
        <CameraCapture photos={photos} setPhotos={setPhotos} label={S.camera} />
        <Btn disabled={!types.length && !others.trim()} onClick={() => { store.submitIssue({ types, others, photos }); go('home') }}>{S.submit}</Btn>
      </div>
      <RulesFooter />
    </div>
  )
}
