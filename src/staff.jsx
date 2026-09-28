import { useState } from 'react'
import { HOSTELS, SH1_FLOORS, SH1_WINGS, SH2_FLOORS, dayName, hostelsForToday, parseRoom } from './lib/rules'
import { floorLabel, tStaff } from './lib/i18n'
import { useStore } from './store'
import { Btn, CameraCapture, Chip, Empty, Field, Ico, ListBtn, RulesFooter, Thumbs, Top } from './ui'

const LAST_STAFF = 'kapde.lastStaff'

function T(lang, key, vars) { return tStaff(lang, key, vars) }

export function StaffLang({ onPick, lang }) {
  return (
    <div className="screen">
      <Top title={T(lang || 'en', 'staff')} />
      <p className="step-mark">{T(lang || 'en', 'chooseLang')}</p>
      <div className="chips" style={{ marginBottom: 16 }}>
        {[{ id: 'en', l: 'English' }, { id: 'hi', l: 'हिन्दी' }, { id: 'gu', l: 'ગુજરાતી' }].map((x) => (
          <Chip key={x.id} on={lang === x.id} onClick={() => onPick(x.id)}>{x.l}</Chip>
        ))}
      </div>
    </div>
  )
}

export function StaffSignup({ lang, onDone, onLogin, onLang }) {
  const store = useStore()
  const [name, setName] = useState('')
  const [staffId, setId] = useState('')
  const [err, setErr] = useState('')
  const go = () => {
    if (!name.trim() || !staffId.trim()) { setErr(T(lang, 'required')); return }
    store.signupStaff({ name, staffId, language: lang })
    localStorage.setItem(LAST_STAFF, JSON.stringify({ name, staffId }))
    onDone()
  }
  return (
    <div className="screen">
      <Top title={T(lang, 'staff')} />
      <div className="screen-body">
        <Field label={T(lang, 'chooseLang')}>
          <div className="chips">
            {[{ id: 'en', l: 'English' }, { id: 'hi', l: 'हिन्दी' }, { id: 'gu', l: 'ગુજરાતી' }].map((x) => (
              <Chip key={x.id} on={lang === x.id} onClick={() => onLang(x.id)}>{x.l}</Chip>
            ))}
          </div>
        </Field>
        <Field label={T(lang, 'name')}><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={T(lang, 'id')}><input value={staffId} onChange={(e) => setId(e.target.value)} /></Field>
        {err && <p className="err">{err}</p>}
        <Btn onClick={go}>{T(lang, 'submit')}</Btn>
        <div style={{ marginTop: 10 }}><Btn kind="ghost" onClick={onLogin}>{T(lang, 'already')}</Btn></div>
      </div>
    </div>
  )
}

export function StaffLogin({ lang, onDone, onSignup }) {
  const store = useStore()
  const remembered = (() => {
    try { return JSON.parse(localStorage.getItem(LAST_STAFF) || 'null') } catch { return null }
  })()
  const [name, setName] = useState(remembered?.name || '')
  const [staffId, setId] = useState(remembered?.staffId || '')
  const [err, setErr] = useState('')
  return (
    <div className="screen">
      <Top title={T(lang, 'login')} />
      <div className="screen-body">
        <Field label={T(lang, 'name')}><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label={T(lang, 'id')}><input value={staffId} onChange={(e) => setId(e.target.value)} /></Field>
        {err && <p className="err">{err}</p>}
        <Btn onClick={() => {
          if (!store.loginStaff(staffId, name)) setErr(T(lang, 'required'))
          else {
            localStorage.setItem(LAST_STAFF, JSON.stringify({ name, staffId }))
            onDone()
          }
        }}>{T(lang, 'login')}</Btn>
        <div style={{ marginTop: 12 }}><Btn kind="ghost" onClick={onSignup}>{T(lang, 'newHere')}</Btn></div>
      </div>
    </div>
  )
}

function SummaryCard({ lang, go }) {
  const store = useStore()
  const active = hostelsForToday()
  const pending = store.pendingBagsToday().filter((s) => active.includes(s.hostel))
  const byFloor = {}
  let regular = 0
  let extra = 0
  pending.forEach((s) => {
    const { floor } = parseRoom(s.room)
    const key = `${s.hostel} · ${floor}`
    byFloor[key] = (byFloor[key] || 0) + 1
    if (s.type === 'extra') extra += 1
    else regular += 1
  })
  const jump = active[0]
  return (
    <div className="summary">
      <h3>{dayName()}</h3>
      <div className="grid">
        <div className="full">{active.length ? active.join(' · ') : T(lang, 'noHostel')}</div>
        <div>{T(lang, 'regular')} {regular}</div>
        <div>{T(lang, 'extraShort')} {extra}</div>
        {Object.keys(byFloor).length === 0 && <div className="full">{T(lang, 'noBags')}</div>}
        {Object.entries(byFloor).map(([k, n]) => <div className="full" key={k}>{k}: {n}</div>)}
      </div>
      {jump && <button className="go" onClick={() => go('hostel', { hostel: jump, from: 'home' })}>{jump}</button>}
    </div>
  )
}

export function StaffHome({ lang, go, openProfile }) {
  const store = useStore()
  const staff = store.staff
  return (
    <div className="screen staff-home">
      <Top
        title="Kapde?"
        right={<button className="avatar" onClick={openProfile}>{store.initial(staff.name)}</button>}
      />
      <SummaryCard lang={lang} go={go} />
      <div className="staff-dock">
        <button className="tile" onClick={() => go('hostels')}>{Ico.home}{T(lang, 'hostel')}</button>
        <button className="tile" onClick={() => go('lostfound')}>{Ico.pin}{T(lang, 'lostFound')}</button>
        <button className="tile" onClick={() => go('complaints')}>{Ico.issue}{T(lang, 'complaints')}</button>
        <button className="tile" onClick={() => go('announcements')}>{Ico.bell}{T(lang, 'announcements')}</button>
        <button className="tile" onClick={() => go('extra')}>{Ico.extra}{T(lang, 'extra')}</button>
      </div>
      <RulesFooter lang={lang} />
    </div>
  )
}

export function StaffProfile({ lang }) {
  const st = useStore().staff
  return (
    <div className="card">
      <div className="pay-row"><span>{T(lang, 'name')}</span><b>{st.name}</b></div>
      <div className="pay-row"><span>{T(lang, 'id')}</span><b>{st.staffId}</b></div>
    </div>
  )
}

export function HostelsScreen({ lang, go }) {
  const today = hostelsForToday()
  const rest = HOSTELS.filter((h) => !today.includes(h))
  return (
    <div className="screen">
      <Top title={T(lang, 'hostel')} onBack={() => go('home')} />
      <div className="screen-body">
        {today.map((h) => <ListBtn key={h} onClick={() => go('hostel', { hostel: h })} className="today">{h} · today</ListBtn>)}
        {rest.map((h) => <ListBtn key={h} onClick={() => go('hostel', { hostel: h })}>{h}</ListBtn>)}
      </div>
      <RulesFooter lang={lang} />
    </div>
  )
}

export function HostelDrill({ lang, go, ctx }) {
  const hostel = ctx.hostel
  if (hostel === 'SH-1' && !ctx.wing) {
    return (
      <div className="screen">
        <Top title="SH-1" onBack={() => go('hostels')} />
        <div className="screen-body">
          <div className="floor-grid">
            {SH1_WINGS.map((w) => <ListBtn key={w} onClick={() => go('hostel', { hostel, wing: w })}>{w}</ListBtn>)}
          </div>
        </div>
        <RulesFooter lang={lang} />
      </div>
    )
  }
  if (hostel === 'SH-1' && ctx.wing && !ctx.floor) {
    return (
      <div className="screen">
        <Top title="SH-1" onBack={() => go('hostel', { hostel })} />
        <p className="step-mark">{ctx.wing}</p>
        <div className="screen-body">
          <div className="floor-grid">
            {SH1_FLOORS.map((f) => (
              <ListBtn key={f} onClick={() => go('rooms', { hostel, wing: ctx.wing, floor: f })}>{floorLabel(lang, f)}</ListBtn>
            ))}
          </div>
        </div>
        <RulesFooter lang={lang} />
      </div>
    )
  }
  if (hostel === 'SH-2' && !ctx.floor) {
    return (
      <div className="screen">
        <Top title="SH-2" onBack={() => go('hostels')} />
        <div className="screen-body">
          <div className="floor-grid">
            {SH2_FLOORS.map((f) => (
              <ListBtn key={f} onClick={() => go('rooms', { hostel, floor: f })}>{floorLabel(lang, f)}</ListBtn>
            ))}
          </div>
        </div>
        <RulesFooter lang={lang} />
      </div>
    )
  }
  return (
    <div className="screen">
      <Top title={hostel} onBack={() => go(ctx.from === 'home' ? 'home' : 'hostels')} />
      <div className="screen-body">
        <RoomSplit lang={lang} go={go} ctx={ctx} />
      </div>
      <RulesFooter lang={lang} />
    </div>
  )
}

function RoomSplit({ lang, go, ctx }) {
  const store = useStore()
  const bags = store.db.submissions.filter((s) => {
    if (s.hostel !== ctx.hostel || s.status !== 'pending' || s.type !== 'regular') return false
    if (!ctx.floor) return true
    return parseRoom(s.room).floor === ctx.floor
  })
  const x = bags.filter((s) => parseRoom(s.room).side === 'X')
  const y = bags.filter((s) => parseRoom(s.room).side === 'Y')
  if (!bags.length) {
    return <Empty>{ctx.floor ? T(lang, 'noSubmissions') : T(lang, 'noBags')}</Empty>
  }
  return (
    <div className="split">
      <div className="col">
        <h4>X</h4>
        {x.map((s) => <button className="room-chip" key={s.id} onClick={() => go('bag', { ...ctx, bagId: s.id })}>{s.room}</button>)}
        {!x.length && <p className="sub">—</p>}
      </div>
      <div className="col">
        <h4>Y</h4>
        {y.map((s) => <button className="room-chip" key={s.id} onClick={() => go('bag', { ...ctx, bagId: s.id })}>{s.room}</button>)}
        {!y.length && <p className="sub">—</p>}
      </div>
    </div>
  )
}

export function RoomsScreen({ lang, go, ctx }) {
  const title = floorLabel(lang, ctx.floor)
  return (
    <div className="screen">
      <Top title={title} onBack={() => go('hostel', { hostel: ctx.hostel, wing: ctx.wing })} />
      <div className="screen-body">
        <RoomSplit lang={lang} go={go} ctx={ctx} />
      </div>
      <RulesFooter lang={lang} />
    </div>
  )
}

export function BagScreen({ lang, go, ctx }) {
  const store = useStore()
  const bag = store.db.submissions.find((s) => s.id === ctx.bagId)
  if (!bag) return null
  return (
    <div className="screen">
      <Top title={bag.room} onBack={() => (ctx.floor ? go('rooms', ctx) : go('hostel', { hostel: ctx.hostel }))} />
      <div className="screen-body">
        {Object.entries(bag.items).filter(([, it]) => it.qty).map(([name, it]) => (
          <div className="card" key={name}>
            <div className="spread"><b>{name}</b><span>{it.qty}</span></div>
            <Thumbs photos={it.photos} />
          </div>
        ))}
      </div>
      <Btn onClick={() => { store.markBagDone(bag.id); go('rooms', ctx) }}>{T(lang, 'markDone')}</Btn>
      <RulesFooter lang={lang} />
    </div>
  )
}

export function StaffLostFound({ lang, go }) {
  const store = useStore()
  const [photos, setPhotos] = useState([])
  const [details, setDetails] = useState('')
  return (
    <div className="screen">
      <Top title={T(lang, 'lostFound')} onBack={() => go('home')} />
      <div className="screen-body">
        <CameraCapture max={3} photos={photos} setPhotos={setPhotos} label={T(lang, 'camera')} />
        <Field label={T(lang, 'writeDetails')}><textarea value={details} onChange={(e) => setDetails(e.target.value)} /></Field>
        <Btn onClick={() => { store.submitLostFound({ photos, details }); store.notify(T(lang, 'lfPosted')); go('home') }}>{T(lang, 'submit')}</Btn>
        {store.db.lostFound.map((lf) => (
          <div className="card" key={lf.id}>
            <p>{lf.details}</p>
            <p className="sub">{lf.byName}</p>
            <Thumbs photos={lf.photos} />
            {!lf.found && <div style={{ marginTop: 8 }}><Btn kind="small" onClick={() => store.markFound(lf.id)}>{T(lang, 'found')}</Btn></div>}
          </div>
        ))}
      </div>
      <RulesFooter lang={lang} />
    </div>
  )
}

export function ComplaintsScreen({ lang, go }) {
  const store = useStore()
  const [tab, setTab] = useState('received')
  const rows = store.db.issues.filter((i) => i.status === tab)
  return (
    <div className="screen">
      <Top title={T(lang, 'complaints')} onBack={() => go('home')} />
      <div className="tabs">
        {['received', 'unresolved', 'resolved'].map((k) => (
          <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{T(lang, k)}</button>
        ))}
      </div>
      <div className="screen-body">
        {rows.map((i) => (
          <div className="card" key={i.id}>
            <h3>{i.studentName} · {i.room}</h3>
            <p className="sub">{(i.types || []).join(', ')} {i.others}</p>
            <Thumbs photos={i.photos} />
            {tab === 'received' && (
              <div className="row" style={{ marginTop: 8, gap: 8 }}>
                <Btn kind="small" onClick={() => store.markIssue(i.id, 'resolved')}>{T(lang, 'resolved')}</Btn>
                <Btn kind="ghost" onClick={() => store.markIssue(i.id, 'unresolved')}>{T(lang, 'unresolved')}</Btn>
              </div>
            )}
            {tab === 'unresolved' && (
              <div style={{ marginTop: 8 }}>
                <Btn kind="small" onClick={() => store.markIssue(i.id, 'resolved')}>{T(lang, 'resolved')}</Btn>
              </div>
            )}
          </div>
        ))}
        {!rows.length && <Empty>—</Empty>}
      </div>
      <RulesFooter lang={lang} />
    </div>
  )
}

export function StaffAnnouncements({ lang, go }) {
  const store = useStore()
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  return (
    <div className="screen">
      <Top
        title={T(lang, 'announcements')}
        onBack={() => go('home')}
        right={<button className="icon-btn" onClick={() => setOpen(true)} aria-label="plus">+</button>}
      />
      <div className="screen-body">
        {open && (
          <div className="card">
            <Field label={T(lang, 'from')}><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label={T(lang, 'to')}><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
            <Btn disabled={!from || !to} onClick={() => { store.postClosure(from, to, lang); setOpen(false); go('home') }}>{T(lang, 'post')}</Btn>
          </div>
        )}
        {store.db.announcements.filter((a) => a.type === 'closure').map((a) => (
          <div className="card" key={a.id}><p>{a.text}</p></div>
        ))}
      </div>
      <RulesFooter lang={lang} />
    </div>
  )
}

export function StaffExtra({ lang, go }) {
  const store = useStore()
  const extra = store.db.submissions.filter((s) => s.type === 'extra')
  const pending = extra.filter((s) => s.status === 'pending')
  const done = extra.filter((s) => s.status === 'done')
  const Card = ({ s, doneBtn }) => (
    <div className="card">
      <h3>{s.studentName} · {s.room}</h3>
      {Object.entries(s.items).filter(([, it]) => it.qty).map(([n, it]) => (
        <div className="pay-row" key={n}><span>{n} × {it.qty}</span><span>₹{it.qty * it.price}</span></div>
      ))}
      <p className="sub">{s.paid ? T(lang, 'paidOnline') : T(lang, 'cash')}</p>
      {doneBtn && (
        <div style={{ marginTop: 8 }}>
          <Btn kind="small" onClick={() => store.markBagDone(s.id)}>{T(lang, 'done')}</Btn>
        </div>
      )}
    </div>
  )
  return (
    <div className="screen">
      <Top title={T(lang, 'extra')} onBack={() => go('home')} />
      <div className="screen-body">
        <h3 className="section-title">{T(lang, 'pending')}</h3>
        {pending.map((s) => <Card key={s.id} s={s} doneBtn />)}
        {!pending.length && <Empty>—</Empty>}
        <h3 className="section-title">{T(lang, 'completed')}</h3>
        {done.map((s) => <Card key={s.id} s={s} />)}
      </div>
      <RulesFooter lang={lang} />
    </div>
  )
}

export function StaffProfileMenu({ lang, onClose, go }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="menu" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => { onClose(); go('profile') }}>{T(lang, 'profile')}</button>
        <button onClick={() => { onClose(); go('logout') }}>{T(lang, 'logout')}</button>
      </div>
    </div>
  )
}
