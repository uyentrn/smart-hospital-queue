import { useCallback, useEffect, useRef, useState } from 'react'
import { BatteryFull, ClipboardList, House, Signal, UserRound, Wifi } from 'lucide-react'
import {
  INITIAL_APPOINTMENTS,
  INITIAL_QUEUES,
  PEOPLE,
  THEMES,
  THEME_ORDER,
  themeVars,
  ticketLabel,
  type Appointment,
  type Person,
  type Queue,
  type Visit,
} from './data'
import type { NewRelative } from './screens/AddRelativeSheet'
import { Toast, cx } from './ui'
import Login from './screens/Login'
import Home from './screens/Home'
import History from './screens/History'
import HistoryDetail from './screens/HistoryDetail'
import Profile from './screens/Profile'

type Tab = 'home' | 'history' | 'profile'

const TICK_MS = 10000
/** Paused queues resume after this many ticks in the demo. */
const RESUME_AFTER = 6

const DEPT_ROOM: Record<string, string> = {
  'Khoa Nội': 'Phòng 204 · Tầng 2',
  'Khoa Tim mạch': 'Phòng 305 · Tầng 3',
  'Khoa Nội tiết': 'Phòng 210 · Tầng 2',
  'Khoa Tai Mũi Họng': 'Phòng 115 · Tầng 1',
}

const TABS: { id: Tab; label: string; Icon: typeof House }[] = [
  { id: 'home', label: 'Trang chủ', Icon: House },
  { id: 'history', label: 'Lịch sử', Icon: ClipboardList },
  { id: 'profile', label: 'Hồ sơ', Icon: UserRound },
]

function StatusBar() {
  return (
    <div className="relative hidden h-11 shrink-0 items-center justify-between bg-transparent px-7 text-[15px] font-semibold text-ink sm:flex" aria-hidden="true">
      <span className="tabular">9:41</span>
      <span className="absolute top-2 left-1/2 h-7 w-28 -translate-x-1/2 rounded-full bg-ink" />
      <span className="flex items-center gap-1.5">
        <Signal size={16} strokeWidth={2.6} />
        <Wifi size={16} strokeWidth={2.6} />
        <BatteryFull size={22} strokeWidth={2} />
      </span>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('home')
  const [people, setPeople] = useState<Person[]>(PEOPLE)
  const [viewId, setViewId] = useState('self')
  const [queues, setQueues] = useState<Record<string, Queue[]>>(INITIAL_QUEUES)
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS)
  const [detail, setDetail] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const tick = useRef(0)
  const notified = useRef(new Set<string>())
  const scroller = useRef<HTMLElement>(null)

  const clearToast = useCallback(() => setToast(null), [])

  // Live queue simulation — stands in for a realtime socket feed.
  useEffect(() => {
    if (!authed) return
    const t = setInterval(() => {
      const n = ++tick.current
      setQueues((prev) => {
        const next: Record<string, Queue[]> = {}
        for (const [pid, list] of Object.entries(prev)) {
          next[pid] = list.map((q) => {
            if (q.paused) return n >= RESUME_AFTER ? { ...q, paused: false } : q
            if (q.ahead > 0 && n % q.pace === 0) return { ...q, currentNo: q.currentNo + 1, ahead: q.ahead - 1 }
            return q
          })
        }
        return next
      })
    }, TICK_MS)
    return () => clearInterval(t)
  }, [authed])

  // Announce when one of the viewed person's queues reaches their turn.
  useEffect(() => {
    for (const q of queues[viewId] ?? []) {
      if (q.ahead === 0 && !q.paused && !notified.current.has(q.id)) {
        notified.current.add(q.id)
        setToast(`Đến lượt ${ticketLabel(q.prefix, q.ticketNo)}! Mời vào ${q.room}`)
        navigator.vibrate?.([300, 120, 300])
      }
    }
  }, [queues, viewId])

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [tab, detail, authed])

  const person = people.find((p) => p.id === viewId) ?? people[0]

  const postpone = (queueId: string) => {
    notified.current.delete(queueId)
    setQueues((prev) => ({
      ...prev,
      [viewId]: prev[viewId].map((q) => (q.id === queueId ? { ...q, ahead: q.ahead + 3, postponed: true } : q)),
    }))
    setToast(`Đã lùi lượt 10 phút cho ${person.name}`)
  }

  const cancelQueue = (queueId: string) => {
    const q = queues[viewId]?.find((x) => x.id === queueId)
    setQueues((prev) => ({ ...prev, [viewId]: prev[viewId].filter((x) => x.id !== queueId) }))
    if (q) setToast(`Đã hủy lượt khám ${ticketLabel(q.prefix, q.ticketNo)} cho ${person.name}`)
  }

  const cancelAppt = (id: string) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a)))
    setToast(`Đã hủy lịch khám cho ${person.name}`)
  }

  const reschedule = (id: string, slot: string) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, slot } : a)))
    setToast(`Đã dời lịch sang ${slot}`)
  }

  const book = (v: Visit, slot: string) => {
    setAppointments((prev) => [
      {
        id: `ap${Date.now()}`,
        personId: viewId,
        doctorId: v.doctorId,
        department: v.department,
        slot,
        room: DEPT_ROOM[v.department] ?? 'Quầy tiếp đón · Tầng 1',
        status: 'upcoming',
      },
      ...prev,
    ])
    setToast(`Đã đặt lịch cho ${person.name} — xem ở Trang chủ`)
  }

  const addPerson = (r: NewRelative) => {
    const id = `p${Date.now()}`
    setPeople((prev) => {
      const used = new Set(prev.map((p) => p.theme))
      const theme = THEME_ORDER.find((k) => !used.has(k)) ?? THEME_ORDER[prev.length % THEME_ORDER.length]
      return [
        ...prev,
        {
          id,
          name: r.name,
          shortName: r.name,
          relation: r.relation,
          dob: 'Chưa cập nhật',
          age: 0,
          gender: '—',
          mrn: `BN-26-${String(Date.now()).slice(-6)}`,
          bhyt: r.bhyt,
          cccd: r.cccd,
          phone: r.phone,
          theme,
        },
      ]
    })
    setQueues((prev) => ({ ...prev, [id]: [] }))
  }

  const unlink = (id: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== id))
    setQueues((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setAppointments((prev) => prev.filter((a) => a.personId !== id))
    if (viewId === id) setViewId('self')
  }

  const logout = () => {
    setAuthed(false)
    setTab('home')
    setDetail(null)
    setViewId('self')
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(80%_60%_at_50%_0%,#d7eeec_0%,#e7eeee_60%,#dfe7e7_100%)] sm:flex sm:items-center sm:justify-center sm:p-6">
      <div
        style={themeVars(THEMES[person.theme])}
        className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white sm:h-[880px] sm:max-h-[calc(100dvh-48px)] sm:w-[402px] sm:rounded-[56px] sm:border-[11px] sm:border-ink sm:shadow-[0_40px_80px_-30px_rgba(4,47,49,0.55)]"
      >
        <StatusBar />

        <main ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {!authed ? (
            <Login onLogin={() => setAuthed(true)} />
          ) : tab === 'home' ? (
            <Home
              account={people[0]}
              person={person}
              people={people}
              queues={queues[viewId] ?? []}
              appointments={appointments.filter((a) => a.personId === viewId)}
              onSwitchPerson={setViewId}
              onPostpone={postpone}
              onCancelQueue={cancelQueue}
              onCancelAppt={cancelAppt}
              onReschedule={reschedule}
              onToast={setToast}
            />
          ) : tab === 'history' ? (
            detail ? (
              <HistoryDetail visitId={detail} onBack={() => setDetail(null)} />
            ) : (
              <History person={person} onOpen={setDetail} onBook={book} />
            )
          ) : (
            <Profile
              account={people[0]}
              person={person}
              people={people}
              onSwitch={setViewId}
              onAdd={addPerson}
              onUnlink={unlink}
              onLogout={logout}
              onToast={setToast}
            />
          )}
        </main>

        {authed && (
          <nav
            aria-label="Điều hướng chính"
            className="shrink-0 border-t border-line/70 bg-white px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom),10px)] sm:pb-5"
          >
            <ul className="grid grid-cols-3">
              {TABS.map(({ id, label, Icon }) => {
                const active = tab === id
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => {
                        setTab(id)
                        if (id === 'history') setDetail(null)
                      }}
                      aria-current={active ? 'page' : undefined}
                      className="flex min-h-16 w-full flex-col items-center justify-center gap-1"
                    >
                      <span
                        className={cx(
                          'flex h-8 w-16 items-center justify-center rounded-full transition-colors',
                          active ? 'bg-brand-100 text-brand-900' : 'text-ink-2',
                        )}
                      >
                        <Icon size={24} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                      </span>
                      <span className={cx('text-base', active ? 'font-bold text-brand-900' : 'font-medium text-ink-2')}>
                        {label}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}

        <Toast message={toast} onDone={clearToast} />
      </div>
    </div>
  )
}
