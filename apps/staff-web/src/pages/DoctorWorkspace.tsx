import { useEffect, useRef, useState } from 'react'
import { BarChart3, ChevronDown, Hourglass, Info, LogOut, Pause, Play } from 'lucide-react'
import { nowHHMM, orderStatus, type MedicalRecord, type Patient, type Room, type User } from '../data'
import QueueSidebar from '../components/doctor/QueueSidebar'
import PatientChart, { type CatalogItem } from '../components/doctor/PatientChart'
import UndoToast, { type UndoState } from '../components/UndoToast'
import { Logo, btn } from '../components/ui'

type Props = {
  user: User
  room: Room
  nurses: User[]
  onUpdateRoom: (roomId: string, fn: (r: Room) => Room) => void
  notify: (msg: string) => void
  onLogout: () => void
}

const EMPTY: MedicalRecord = { chiefComplaint: '', examinationNote: '', vitals: { pulse: '', bp: '', temp: '', spo2: '' }, diagnosisText: '' }

// Demo: surface the undo toast for the last completion once per session.
let introShown = false

function PauseMenu({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${btn.base} ${btn.secondary} h-10 px-3 text-[13px]`}>
        {paused ? <Play size={15} /> : <Pause size={15} />} {paused ? 'Đang tạm ngưng' : 'Tạm ngưng nhận'}
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="animate-fade-in absolute right-0 z-30 mt-1.5 w-[290px] rounded-xl border border-line bg-white p-1.5 shadow-xl">
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onToggle()
            }}
            className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
          >
            {paused ? <Play size={17} className="mt-0.5 text-emerald-600" /> : <Pause size={17} className="mt-0.5 text-amber-600" />}
            <span>
              <span className="block text-[14px] font-semibold text-ink">{paused ? 'Tiếp tục nhận bệnh nhân' : 'Tạm ngưng nhận bệnh nhân mới'}</span>
              <span className="block text-[12.5px] text-muted">{paused ? 'Điều dưỡng có thể gọi số trở lại' : 'Giữ nguyên hàng đợi, dừng gọi số mới'}</span>
            </span>
          </button>
          <div className="my-1 h-px bg-line" />
          <div className="flex items-start gap-3 px-3 py-2 text-[12.5px] text-muted">
            <Info size={15} className="mt-0.5 shrink-0" /> Đóng hàng đợi do Điều dưỡng phụ trách phòng thực hiện.
          </div>
        </div>
      )}
    </div>
  )
}

export default function DoctorWorkspace({ user, room, nurses, onUpdateRoom, notify, onLogout }: Props) {
  const [now, setNow] = useState(Date.now())
  const [viewId, setViewId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, MedicalRecord>>({})
  const [synced, setSynced] = useState<Record<string, boolean>>({})
  const [undo, setUndo] = useState<(UndoState & { snapshot: Patient[] }) | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const ps = room.patients
  const by = (s: Patient['status']) => ps.filter((p) => p.status === s)
  const active = by('inroom')[0] ?? by('called')[0]
  const viewed = viewId ? ps.find((p) => p.id === viewId) : undefined
  const shown = viewed ?? active
  const readOnly = !!shown && shown.id !== active?.id
  const next = active ? (by('called').find((p) => p.id !== active.id) ?? by('waiting')[0]) : undefined
  const draftOf = (p: Patient) => drafts[p.id] ?? p.record ?? EMPTY
  const dirty = !!active && !!drafts[active.id]

  const waiting = by('waiting').length
  const done = by('done').length

  const setPatients = (fn: (ps: Patient[]) => Patient[]) => onUpdateRoom(room.id, (r) => ({ ...r, patients: fn(r.patients) }))
  const update = (ids: Record<string, Partial<Patient>>) => setPatients((list) => list.map((x) => (ids[x.id] ? { ...x, ...ids[x.id] } : x)))
  const withUndo = (message: string, change: () => void) => {
    setUndo({ key: Date.now(), message, snapshot: ps })
    change()
  }

  useEffect(() => {
    if (introShown) return
    introShown = true
    const last = ps.find((p) => p.order === 1008 && p.status === 'done')
    if (!last) return
    const snapshot = ps.map((p) =>
      p.id === last.id
        ? { ...p, status: 'inroom' as const, startedAt: Date.now() - 7 * 60_000 }
        : p.status === 'inroom'
          ? { ...p, status: 'called' as const, startedAt: undefined, calledAt: Date.now() - 60_000 }
          : p,
    )
    setUndo({ key: Date.now(), message: `Đã hoàn tất khám STT ${last.order} - ${last.name}`, snapshot })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Principle 3: typing into the record of a called patient moves them to IN_SERVICE automatically.
  const onDraft = (rec: MedicalRecord) => {
    if (!active) return
    setDrafts((d) => ({ ...d, [active.id]: rec }))
    if (active.status === 'called') {
      update({ [active.id]: { status: 'inroom', startedAt: Date.now() } })
      setSynced((s) => ({ ...s, [active.id]: true }))
      notify(`STT ${active.order} đã tự động chuyển sang Đang khám`)
    }
  }

  const persist = (extra: Partial<Patient> = {}) => {
    if (!active) return {}
    return { [active.id]: { record: { ...draftOf(active), savedAt: nowHHMM() }, ...extra } }
  }
  const callNextPatch = () => (next && next.status === 'waiting' ? { [next.id]: { status: 'called' as const, calledAt: Date.now() } } : {})
  const clearDraft = (id: string) =>
    setDrafts((d) => {
      const { [id]: _, ...rest } = d
      return rest
    })

  const finish = (status: 'done' | 'lab', label: string) => {
    if (!active) return
    const a = active
    withUndo(`${label} STT ${a.order} - ${a.name}${next ? ` · Gọi ${next.order}` : ''}`, () =>
      update({ ...persist({ status, updatedAt: nowHHMM(), startedAt: undefined }) }),
    )
    clearDraft(a.id)
    setViewId(null)
  }

  const handleCallNext = () => {
    if (next && next.status === 'waiting') {
      update({ [next.id]: { status: 'called', calledAt: Date.now() } })
      notify(`Đã gọi STT ${next.order} – ${next.name} vào phòng`)
    } else {
      notify('Không có bệnh nhân nào đang chờ')
    }
  }

  const nursesLabel = nurses.length ? nurses.map((n) => n.fullName).join(', ') : 'điều dưỡng'
  const badge = room.closed
    ? { label: 'Đã đóng hàng đợi', cls: 'bg-red-50 text-red-700', dot: 'bg-red-500' }
    : room.paused
      ? { label: 'Tạm ngưng nhận', cls: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' }
      : { label: 'Đang tiếp nhận', cls: 'bg-emerald-50 text-emerald-700', dot: 'pulse-dot bg-emerald-500' }

  return (
    <div className="flex h-screen min-w-[1200px] flex-col overflow-hidden">
      <header className="shrink-0 border-b border-line bg-white">
        <div className="flex h-16 items-center gap-4 px-5">
          <Logo size={38} />
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold text-ink">{room.name}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${badge.cls}`}>
                <span className={`size-1.5 rounded-full ${badge.dot}`} /> {badge.label}
              </span>
            </div>
            <div className="text-[12px] text-muted">Đồng bộ trực tiếp với ĐD. {nursesLabel}</div>
          </div>

          <div className="mx-auto flex items-center gap-2">
            <span title="Đang chờ ngoài cửa" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-soft px-3 text-[12.5px] whitespace-nowrap text-brand ring-1 ring-brand/15 ring-inset">
              <Hourglass size={14} /> <span className="hidden min-[1440px]:inline">Đang chờ ngoài cửa:</span>
              <b className="tabular">
                {waiting} / {room.maxWaiting} BN
              </b>
            </span>
            <span title="Tiến độ định mức ngày" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-teal-50 px-3 text-[12.5px] whitespace-nowrap text-teal-800 ring-1 ring-teal-200 ring-inset">
              <BarChart3 size={14} /> <span className="hidden min-[1440px]:inline">Tiến độ định mức ngày:</span>
              <b className="tabular">
                Đã khám {done} · Đã nhận {ps.length} / {room.dailyQuota}
              </b>
            </span>
            <span title="Thời gian khám trung bình" className="inline-flex h-9 items-center gap-1.5 rounded-full bg-indigo-50 px-3 text-[12.5px] whitespace-nowrap text-indigo-800 ring-1 ring-indigo-200 ring-inset">
              <Hourglass size={14} /> <span className="hidden min-[1440px]:inline">TG khám trung bình:</span>
              <b className="tabular">8 phút</b> {/* THAY */}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <PauseMenu
              paused={!!room.paused}
              onToggle={() => {
                onUpdateRoom(room.id, (r) => ({ ...r, paused: !r.paused }))
                notify(room.paused ? 'Đã tiếp tục nhận bệnh nhân' : 'Đã tạm ngưng nhận bệnh nhân mới')
              }}
            />
            <div className="h-8 w-px bg-line" />
            <div className="text-right leading-tight">
              <div className="text-[13.5px] font-semibold whitespace-nowrap text-ink">
                {room.doctor} <span className="font-normal text-muted">({user.username})</span>
              </div>
              <div className="text-[12px] text-muted">Bác sĩ {room.specialty}</div>
            </div>
            <button
              onClick={onLogout}
              aria-label="Đăng xuất"
              title="Đăng xuất"
              className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(300px,28fr)_72fr]">
        <QueueSidebar patients={ps} shownId={shown?.id} now={now} onView={(p) => setViewId(p.id === active?.id ? null : p.id)} />

        {shown ? (
          <PatientChart
            key={shown.id}
            patient={shown}
            draft={draftOf(shown)}
            now={now}
            readOnly={readOnly}
            autoSynced={!!synced[shown.id]}
            dirty={!readOnly && dirty}
            next={next}
            onDraft={onDraft}
            onBack={() => setViewId(null)}
            onSaveDraft={() => {
              update(persist())
              if (active) clearDraft(active.id)
              notify(`Đã lưu nháp bệnh án STT ${active?.order}`)
            }}
            onComplete={() => finish('done', 'Đã hoàn tất khám')}
            onToLab={() => finish('lab', 'Đã chuyển chờ KQ CLS')}
            
            onAddOrder={(item: CatalogItem) => {
              if (!active) return
              const t = Date.now()
              const order = { ...item, id: `SR-${active.order}-${t}`, startAt: t + 15_000, readyAt: t + (item.type === 'LAB' ? 150_000 : 100_000) }
              update({ [active.id]: { orders: [...(active.orders ?? []), order] } })
              notify(`Đã chỉ định ${item.name} · ${item.room}`)
            }}
            onCancelOrder={(id) => {
              if (!active) return
              const o = active.orders?.find((x) => x.id === id)
              if (!o || orderStatus(o, Date.now()) !== 'ORDERED') return
              update({ [active.id]: { orders: active.orders!.filter((x) => x.id !== id) } })
              notify(`Đã hủy chỉ định ${o.name}`)
            }}
            onInviteBack={() => {
              if (!viewed) return
              update({ [viewed.id]: { status: 'called', calledAt: Date.now() } })
              notify(`Đã mời STT ${viewed.order} – ${viewed.name} vào phòng đọc kết quả`)
              setViewId(null)
            }}
          />
        ) : (
          <div className="grid place-items-center bg-canvas text-center">
            <div>
              <div className="text-[16px] font-semibold text-ink">Chưa có bệnh nhân trong phòng khám</div>
              
            </div>
          </div>
        )}
      </div>

      <UndoToast
        side="left"
        toast={undo}
        onDismiss={() => setUndo(null)}
        onUndo={() => {
          if (!undo) return
          setPatients(() => undo.snapshot)
          setUndo(null)
          notify('Đã hoàn tác thao tác vừa thực hiện')
        }}
      />
    </div>
  )
}
