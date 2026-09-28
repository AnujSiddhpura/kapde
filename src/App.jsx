import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from './store'
import { Logo, LineArt, Modal, PhoneShell, RulesFooter, Toast, Top } from './ui'
import {
  AnnouncementsScreen, CardScreen, IssuesScreen, LaundryHome,
  LostFoundScreen, PayScreen, StudentHistory, StudentHome, StudentLogin,
  StudentProfile, StudentProfileMenu, StudentSignup, UpiScreen,
} from './student'
import {
  BagScreen, ComplaintsScreen, HostelDrill, HostelsScreen, RoomsScreen, StaffAnnouncements,
  StaffExtra, StaffHome, StaffLogin, StaffLostFound, StaffProfile, StaffProfileMenu,
  StaffSignup,
} from './staff'
import { studentCopy as S, tStaff } from './lib/i18n'

function clock() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function AppInner() {
  const store = useStore()
  const [screen, setScreen] = useState('role')
  const [ctx, setCtx] = useState({})
  const [cart, setCart] = useState({})
  const [menu, setMenu] = useState(false)
  const [lang, setLang] = useState('en')
  const [time, setTime] = useState(clock)

  useEffect(() => {
    const t = setInterval(() => setTime(clock()), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (store.session?.role === 'student') setScreen((s) => (s === 'role' || s === 'studentSignup' || s === 'studentLogin' ? 'home' : s))
    if (store.session?.role === 'staff') {
      setLang(store.session.language || store.staff?.language || lang)
      setScreen((s) => (['role', 'staffLang', 'staffSignup', 'staffLogin'].includes(s) ? 'home' : s))
    }
    if (!store.session) setScreen((s) => (['role', 'studentSignup', 'studentLogin', 'staffLang', 'staffSignup', 'staffLogin'].includes(s) ? s : 'role'))
  }, [store.session])

  const go = (name, nextCtx) => {
    setScreen(name)
    if (nextCtx) setCtx(nextCtx)
    setMenu(false)
  }

  const theme = store.session?.role === 'staff' || ['staffLang', 'staffSignup', 'staffLogin'].includes(screen)
    ? 'staff'
    : store.session?.role === 'student' || ['studentSignup', 'studentLogin'].includes(screen)
      ? 'student'
      : 'entry'

  let body = null
  if (screen === 'role') {
    body = (
      <div className="screen">
        <div className="brand">
          <Logo />
          <h1>Kapde?</h1>
          <LineArt />
          <p>Drop. Collect. Done.</p>
        </div>
        <div className="role-stack">
          <button className="btn" onClick={() => go(localStorage.getItem('kapde.lastStudent') ? 'studentLogin' : 'studentSignup')}>Student</button>
          <button className="btn staff-entry" onClick={() => go(localStorage.getItem('kapde.lastStaff') ? 'staffLogin' : 'staffLang')}>Staff</button>
        </div>
      </div>
    )
  } else if (screen === 'studentSignup') body = <StudentSignup onDone={() => go('home')} onLogin={() => go('studentLogin')} />
  else if (screen === 'studentLogin') body = <StudentLogin onDone={() => go('home')} onSignup={() => go('studentSignup')} />
  else if (screen === 'staffLang') body = <StaffSignup lang={lang} onDone={() => go('home')} onLogin={() => go('staffLogin')} onLang={(l) => { setLang(l); store.setStaffLanguage(l) }} />
  else if (screen === 'staffSignup') body = <StaffSignup lang={lang} onDone={() => go('home')} onLogin={() => go('staffLogin')} onLang={(l) => { setLang(l); store.setStaffLanguage(l) }} />
  else if (screen === 'staffLogin') body = <StaffLogin lang={lang} onDone={() => go('home')} onSignup={() => go('staffSignup')} />
  else if (store.session?.role === 'student' && store.student) {
    if (screen === 'home') body = <StudentHome go={go} openProfile={() => setMenu(true)} />
    else if (screen === 'laundry') body = <LaundryHome go={go} setCart={setCart} />
    else if (screen === 'pay') body = <PayScreen go={go} cart={cart} />
    else if (screen === 'upi') body = <UpiScreen go={go} cart={cart} />
    else if (screen === 'card') body = <CardScreen go={go} cart={cart} />
    else if (screen === 'announcements') body = <AnnouncementsScreen go={go} />
    else if (screen === 'lostfound') body = <LostFoundScreen go={go} />
    else if (screen === 'issues') body = <IssuesScreen go={go} />
    else if (screen === 'profile') {
      body = (
        <div className="screen">
          <Top title={S.profile} onBack={() => go('home')} />
          <StudentProfile />
          <RulesFooter />
        </div>
      )
    } else if (screen === 'history') {
      body = (
        <div className="screen">
          <Top title={S.view} onBack={() => go('home')} />
          <div className="screen-body"><StudentHistory /></div>
          <RulesFooter />
        </div>
      )
    } else if (screen === 'logout') {
      body = <StudentHome go={go} openProfile={() => setMenu(true)} />
    } else body = <StudentHome go={go} openProfile={() => setMenu(true)} />
  } else if (store.session?.role === 'staff' && store.staff) {
    if (screen === 'home') body = <StaffHome lang={lang} go={go} openProfile={() => setMenu(true)} />
    else if (screen === 'hostels') body = <HostelsScreen lang={lang} go={go} />
    else if (screen === 'hostel') body = <HostelDrill lang={lang} go={go} ctx={ctx} />
    else if (screen === 'rooms') body = <RoomsScreen lang={lang} go={go} ctx={ctx} />
    else if (screen === 'bag') body = <BagScreen lang={lang} go={go} ctx={ctx} />
    else if (screen === 'lostfound') body = <StaffLostFound lang={lang} go={go} />
    else if (screen === 'complaints') body = <ComplaintsScreen lang={lang} go={go} />
    else if (screen === 'announcements') body = <StaffAnnouncements lang={lang} go={go} />
    else if (screen === 'extra') body = <StaffExtra lang={lang} go={go} />
    else if (screen === 'profile') {
      body = (
        <div className="screen">
          <Top title={tStaff(lang, 'profile')} onBack={() => go('home')} />
          <StaffProfile lang={lang} />
          <RulesFooter lang={lang} />
        </div>
      )
    } else body = <StaffHome lang={lang} go={go} openProfile={() => setMenu(true)} />
  }

  return (
    <PhoneShell time={time}>
      <div className={`app theme-${theme}`}>
        <div className="view" key={screen}>{body}</div>
        {menu && store.session?.role === 'student' && <StudentProfileMenu onClose={() => setMenu(false)} go={go} />}
        {menu && store.session?.role === 'staff' && <StaffProfileMenu lang={lang} onClose={() => setMenu(false)} go={go} />}
        {screen === 'logout' && (
          <Modal
            title={store.session?.role === 'staff' ? tStaff(lang, 'logout') : S.logout}
            onClose={() => go('home')}
            cancel={() => go('home')}
            cancelLabel={store.session?.role === 'staff' ? tStaff(lang, 'cancel') : S.cancel}
            okLabel={store.session?.role === 'staff' ? tStaff(lang, 'ok') : S.ok}
            ok={() => { store.logout(); setMenu(false); go('role') }}
          />
        )}
        {store.toast && <Toast text={store.toast.text} onDone={store.clearToast} />}
      </div>
    </PhoneShell>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  )
}
