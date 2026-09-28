import { useEffect, useRef, useState } from 'react'
import { RULES } from './lib/rules'
import { studentCopy as S, tStaff } from './lib/i18n'

export function Logo({ color = '#1C75BC' }) {
  return (
    <svg className="logo" viewBox="0 0 84 84" aria-hidden="true">
      <path d="M42 6 74 24v36L42 78 10 60V24Z" fill="none" stroke={color} strokeWidth="2.4" />
      <path d="M20 29h44" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M42 29v5" stroke={color} strokeWidth="1.6" />
      <path d="M32 36c0-3.5 3.6-5.2 10-5.2s10 1.7 10 5.2v16.2c0 1.8-1.6 3.3-3.5 3.3H35.5c-1.9 0-3.5-1.5-3.5-3.3V36Z" fill={color} />
      <path d="M32 40c-3.8 1.8-6.8 1-8-2M52 40c3.8 1.8 6.8 1 8-2" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function LineArt() {
  return (
    <svg className="line-art" viewBox="0 0 220 18" fill="none" aria-hidden="true">
      <path d="M4 9h212" stroke="#1C75BC" strokeOpacity=".28" strokeWidth="1" />
    </svg>
  )
}

export function Chip({ children, on, onClick, className = '' }) {
  return (
    <button type="button" className={`chip ${className} ${on ? 'on' : ''}`} onClick={onClick}>{children}</button>
  )
}

export function PhoneShell({ children, time }) {
  return (
    <div className="stage">
      <div className="device">
        <div className="device-screen">
          <div className="device-notch" />
          <div className="status-bar"><span>{time}</span><span>▮▮▮</span></div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function Top({ title, onBack, right }) {
  return (
    <div className="topbar">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 18 9 12l6-6" /></svg>
        </button>
      ) : <span style={{ width: 36 }} />}
      <h2>{title}</h2>
      {right || <span style={{ width: 36 }} />}
    </div>
  )
}

export function Btn({ children, onClick, disabled, kind, className = '' }) {
  const k = kind === 'ghost' || kind === 'danger' || kind === 'small' || kind === 'staff-entry' ? kind : ''
  return (
    <button className={`btn ${k} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>
  )
}

export function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}

export function ListBtn({ children, onClick, meta, icon, className = '' }) {
  return (
    <button className={`list-btn ${className}`} onClick={onClick}>
      <span className="row">{icon}{children}</span>
      {meta ? <span className="meta">{meta}</span> : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
      )}
    </button>
  )
}

export function RulesFooter({ lang }) {
  const [open, setOpen] = useState(false)
  const label = lang ? tStaff(lang, 'rules') : S.rules
  const title = lang ? tStaff(lang, 'rulesTitle') : S.rulesTitle
  return (
    <div className="footer-rules">
      <button className="rules-btn" onClick={() => setOpen(true)}>{label}</button>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)} ok={() => setOpen(false)} okLabel={lang ? tStaff(lang, 'ok') : S.ok} hideCancel>
          <ol>{RULES.map((r) => <li key={r}>{r}</li>)}</ol>
        </Modal>
      )}
    </div>
  )
}

export function Modal({ title, children, onClose, ok, cancel, okLabel, cancelLabel, hideCancel }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && <h3>{title}</h3>}
        {children}
        <div className="modal-actions">
          {!hideCancel && <Btn kind="ghost" onClick={cancel || onClose}>{cancelLabel || 'Cancel'}</Btn>}
          <Btn onClick={ok || onClose}>{okLabel || 'Ok'}</Btn>
        </div>
      </div>
    </div>
  )
}

export function Toast({ text, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone, text])
  if (!text) return null
  return <div className="toast">{text}</div>
}

export function Thumbs({ photos, onRemove }) {
  if (!photos?.length) return null
  return (
    <div className="thumbs">
      {photos.map((p, i) => (
        <div className="thumb" key={i}>
          <img src={p} alt="" />
          {onRemove && <button className="x" onClick={() => onRemove(i)} aria-label="Remove">×</button>}
        </div>
      ))}
    </div>
  )
}

export function CameraCapture({ max = 1, photos, setPhotos, label, compact }) {
  const [open, setOpen] = useState(false)
  const [shot, setShot] = useState(null)
  const video = useRef(null)
  const fileRef = useRef(null)
  const stream = useRef(null)

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }

  const start = async () => {
    setShot(null)
    setOpen(true)
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      if (video.current) video.current.srcObject = stream.current
    } catch {
      fileRef.current?.click()
      setOpen(false)
    }
  }

  const capture = () => {
    const v = video.current
    if (!v || !v.videoWidth) return
    const c = document.createElement('canvas')
    const w = 480
    const h = Math.round((v.videoHeight / v.videoWidth) * w)
    c.width = w
    c.height = h
    c.getContext('2d').drawImage(v, 0, 0, w, h)
    setShot(c.toDataURL('image/jpeg', 0.62))
    stop()
  }

  const pickFile = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const r = new FileReader()
    r.onload = () => { setShot(r.result); setOpen(true) }
    r.readAsDataURL(f)
  }

  const confirm = () => {
    if (shot) setPhotos((p) => [...p, shot].slice(0, max))
    setShot(null)
    setOpen(false)
    stop()
  }

  useEffect(() => () => stop(), [])

  return (
    <>
      {photos.length < max && (
        compact ? (
          <button className={`cam-mini ${photos.length ? 'has' : ''}`} onClick={start} type="button" aria-label={label || 'Camera'}>
            <CamIcon />
          </button>
        ) : (
          <button className="list-btn" onClick={start} type="button">
            <span className="row"><CamIcon />{label || 'Camera'}</span>
          </button>
        )
      )}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={pickFile} />
      {!compact && <Thumbs photos={photos} onRemove={(i) => setPhotos((p) => p.filter((_, n) => n !== i))} />}
      {open && (
        <div className="cam">
          {shot ? <img src={shot} alt="" /> : <video ref={video} autoPlay playsInline />}
          <div className="cam-bar">
            {shot ? (
              <>
                <Btn kind="ghost" onClick={() => { setShot(null); start() }}>Retake</Btn>
                <Btn onClick={confirm}>Ok</Btn>
              </>
            ) : (
              <Btn onClick={capture}>Ok</Btn>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export function Qty({ value, onMinus, onPlus }) {
  const [pop, setPop] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setPop(true)
    const t = setTimeout(() => setPop(false), 240)
    return () => clearTimeout(t)
  }, [value])
  const tap = (fn) => () => {
    if (navigator.vibrate) navigator.vibrate(8)
    fn()
  }
  return (
    <div className="qty">
      <button className="round" onClick={tap(onMinus)} type="button" aria-label="Less">−</button>
      <b className={pop ? 'pop' : ''}>{value}</b>
      <button className="round" onClick={tap(onPlus)} type="button" aria-label="More">+</button>
    </div>
  )
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      {title && <b>{title}</b>}
      {children && <p>{children}</p>}
    </div>
  )
}

export function Square({ label, onClick, icon, color, badge }) {
  return (
    <button className={`square ${color || ''}`} onClick={onClick} style={color ? undefined : { background: 'var(--accent)' }}>
      {badge > 0 && <span className="badge">{badge}</span>}
      {icon}
      {label}
    </button>
  )
}

export function CamIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 8h3l2-3h6l2 3h3v12H4z" />
      <circle cx="12" cy="14" r="3" />
    </svg>
  )
}

export const Ico = {
  laundry: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="13" r="4" /><path d="M8 7h8" /></svg>
  ),
  bell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="9" r="2" /></svg>
  ),
  issue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><circle cx="12" cy="16" r=".8" fill="currentColor" /></svg>
  ),
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 11 12 4l8 7v9H4z" /></svg>
  ),
  extra: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16v12H4z" /><path d="M8 7V5h8v2" /></svg>
  ),
}
