import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreVertical, Activity, ChevronDown, DoorClosed, DoorOpen, Hourglass, LogOut, Lock, Megaphone, Pause, Play, Stethoscope, Users, XCircle, Zap } from 'lucide-react'
import { nowHHMM, type Patient, type Room, type User } from '../data'
import ActiveStage from '../components/ActiveStage'
import WaitingTable from '../components/WaitingTable'
import UndoToast, { type UndoState } from '../components/UndoToast'
import { Logo, Modal, btn } from '../components/ui'

type Props = {
  user: User
  room: Room
  onUpdateRoom: (roomId: string, fn: (r: Room) => Room) => void
  onToggleClosed: (roomId: string) => void
  notify: (msg: string) => void
  onLogout: () => void
}

type Confirm = { kind: 'close' } | { kind: 'exception' | 'cancel'; p: Patient }

// Demo: surface the undo toast for the most recent completion once per session.
let introShown = false

function Kpi({
  label,
  value,
  sub,
  icon,
  accent,
  children,
  onClick,
}: {
  label: string
  value: ReactNode
  sub: string
  icon: ReactNode
  accent: { bar: string; soft: string; text: string }
  children?: ReactNode
  onClick?: () => void
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper 
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl border border-line bg-white px-5 pt-4 pb-4 text-left ${onClick ? 'cursor-pointer hover:border-orange-300 hover:shadow-md transition-all' : ''}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} />
      <div className="flex items-start justify-between">
        <div className="text-[13px] font-semibold text-muted">{label}</div>
        <span className={`grid size-8 place-items-center rounded-lg ${accent.soft} ${accent.text}`}>{icon}</span>
      </div>
      <div className={`tabular mt-1 text-[30px] leading-none font-bold ${accent.text}`}>{value}</div>
      {children}
      <div className="mt-2 truncate text-[12.5px] font-medium text-muted">{sub}</div>
    </Wrapper>
  )
}

function QueueMenu({ paused, onPause, onClose }: { paused: boolean; onPause: () => void; onClose: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', k)
    }
  }, [open])
  const item = 'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50'
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className={`${btn.base} ${btn.secondary} h-11`}>
        <Pause size={16} /> Tạm ngưng / Đóng hàng đợi
        <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="animate-fade-in absolute right-0 z-30 mt-1.5 w-[300px] rounded-xl border border-line bg-white p-1.5 shadow-xl">
          <button
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false)
              onPause()
            }}
          >
            {paused ? <Play size={17} className="mt-0.5 text-emerald-600" /> : <Pause size={17} className="mt-0.5 text-amber-600" />}
            <span>
              <span className="block text-[14px] font-semibold text-ink">{paused ? 'Tiếp tục gọi số' : 'Tạm ngưng gọi số'}</span>
              <span className="block text-[12.5px] text-muted">
                {paused ? 'Cho phép gọi bệnh nhân tiếp theo' : 'Giữ nguyên hàng đợi, tạm dừng gọi số mới'}
              </span>
            </span>
          </button>
          <div className="my-1 h-px bg-line" />
          <button
            role="menuitem"
            className={`${item} hover:bg-red-50`}
            onClick={() => {
              setOpen(false)
              onClose()
            }}
          >
            <DoorClosed size={17} className="mt-0.5 text-red-600" />
            <span>
              <span className="block text-[14px] font-semibold text-red-700">Đóng hàng đợi…</span>
              <span className="block text-[12.5px] text-muted">Ngừng nhận bệnh nhân mới · cần xác nhận</span>
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

export default function NurseDashboard({ user, room, onUpdateRoom, onToggleClosed, notify, onLogout }: Props) {
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [undo, setUndo] = useState<(UndoState & { snapshot: Patient[] }) | null>(null)
  const [showCalledList, setShowCalledList] = useState(false)
  const [activeKebab, setActiveKebab] = useState<string | null>(null)
  const [searchCalled, setSearchCalled] = useState('')
  const [searchWaiting, setSearchWaiting] = useState('')
  const [now, setNow] = useState(Date.now())

  const [exceptionPatient, setExceptionPatient] = useState<Patient | null>(null)
  const MAX_ROOM_CAPACITY = 3; // for CLS

  // Cập nhật thời gian thực mỗi giây để đếm ngược cho nút Gọi lại
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const ps = room.patients
  const by = (s: Patient['status']) => ps.filter((p) => p.status === s)
  const waiting = by('waiting')
  
  // Sắp xếp danh sách đã gọi để đồng bộ thẻ hiển thị và ưu tiên
  const called = by('called').sort((a, b) => {
    if (a.priority && !b.priority) return -1; // Ưu tiên xếp lên đầu
    if (!a.priority && b.priority) return 1;
    const countA = a.callCount || 1;
    const countB = b.callCount || 1;
    if (countA !== countB) return countA - countB; // Số lượt gọi ít lên trên
    return (a.calledAt || 0) - (b.calledAt || 0);
  });
  
  const inService = by('inroom')
  const done = by('done')
  const next = waiting[0]
  const canCall = !room.closed && !room.paused
  const received = ps.length
  const QUOTA = room.dailyQuota
  const pct = Math.round((received / QUOTA) * 100)
  // const callCount = 0

  const setPatients = (fn: (ps: Patient[]) => Patient[]) => onUpdateRoom(room.id, (r) => ({ ...r, patients: fn(r.patients) }))
  const update = (ids: Record<string, Partial<Patient>>) =>
    setPatients((list) => list.map((x) => (ids[x.id] ? { ...x, ...ids[x.id] } : x)))
  const withUndo = (message: string, change: () => void) => {
    setUndo({ key: Date.now(), message, snapshot: ps })
    change()
  }

  useEffect(() => {
    if (introShown) return
    introShown = true
    const last = ps.find((p) => p.order === 1008 && p.status === 'done')
    if (!last) return
    // Undo restores the state just before STT 1008 finished: 1008 in room, 1009 still waiting at the door.
    const snapshot = ps.map((p) =>
      p.id === last.id
        ? { ...p, status: 'inroom' as const, startedAt: Date.now() - 6 * 60_000 }
        : p.status === 'inroom'
          ? { ...p, status: 'called' as const, startedAt: undefined, calledAt: Date.now() - 60_000 }
          : p,
    )
    setUndo({ key: Date.now(), message: `Đã hoàn tất khám cho STT ${last.order} - ${last.name}`, snapshot })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completePatient = (p: Patient) => {
    withUndo(
      `Đã hoàn tất khám cho STT ${p.order} - ${p.name}`,
      () => update({ [p.id]: { status: 'done', updatedAt: nowHHMM() } })
    )
  }

  const callPatient = (p: Patient, label = 'Đã gọi') => {
    update({ [p.id]: { status: 'called', calledAt: Date.now(), callCount: (p.callCount || 0) + 1 } })
    notify(`${label} STT ${p.order} – ${p.name}`)
  }

  const confirmBody: Record<Exclude<Confirm['kind'], 'close'>, { title: string; icon: ReactNode; text: string; cta: string }> = {
    exception: {
      title: 'Gọi ưu tiên ngoại lệ?',
      icon: <Zap size={19} />,
      text: 'Bệnh nhân này sẽ được gọi ngay, vượt qua thứ tự hàng đợi hiện tại. Chỉ dùng khi có chỉ định ưu tiên.',
      cta: 'Gọi ngay',
    },
    cancel: {
      title: 'Hủy lượt khám?',
      icon: <XCircle size={19} />,
      text: 'Lượt khám sẽ bị xóa khỏi hàng đợi của phòng. Bệnh nhân cần lấy số mới nếu muốn khám lại.',
      cta: 'Xác nhận hủy lượt',
    },
  }

  const statusBadge = room.closed
    ? { label: 'Đã đóng hàng đợi', cls: 'bg-red-50 text-red-700', dot: 'bg-red-600' }
    : room.paused
      ? { label: 'Tạm ngưng gọi số', cls: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' }
      : { label: 'Đang tiếp nhận', cls: 'bg-emerald-50 text-emerald-700', dot: 'pulse-dot bg-emerald-500' }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex h-[76px] max-w-[1240px] items-center gap-5 px-8">
          <Logo />
          <div className="h-9 w-px bg-line" />
          <div className="leading-tight">
            <div className="text-[12px] font-semibold tracking-wider text-muted uppercase">Phòng được phân công</div>
            <div className="flex items-center gap-2.5">
              <span className="text-[19px] font-bold text-ink">{room.name}</span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${statusBadge.cls}`}>
                <span className={`size-1.5 rounded-full ${statusBadge.dot}`} />
                {statusBadge.label}
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {room.closed ? (
              <button onClick={() => onToggleClosed(room.id)} className={`${btn.base} ${btn.secondary}`}>
                <DoorOpen size={18} /> Mở lại hàng đợi
              </button>
            ) : (
              <QueueMenu
                paused={!!room.paused}
                onPause={() => {
                  onUpdateRoom(room.id, (r) => ({ ...r, paused: !r.paused }))
                  notify(room.paused ? `Đã tiếp tục gọi số ${room.short}` : `Đã tạm ngưng gọi số ${room.short}`)
                }}
                onClose={() => setConfirm({ kind: 'close' })}
              />
            )}
            <div className="h-9 w-px bg-line" />
            <div className="text-right leading-tight">
              <div className="text-[12px] text-muted">Điều dưỡng trực</div>
              <div className="text-[14px] font-semibold text-ink">
                {user.fullName} <span className="font-normal text-muted">· {room.doctor}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              aria-label="Đăng xuất"
              title="Đăng xuất"
              className="grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut size={19} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] space-y-5 px-8 py-6">
        {room.closed && (
          <div className="animate-fade-in flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
            <Lock size={18} className="shrink-0 text-red-600" />
            <span>
              <b>Hàng đợi đã đóng.</b> Không nhận thêm bệnh nhân và không thể gọi số mới. Bạn vẫn có thể hoàn tất các lượt đang xử lý.
            </span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          <Kpi
            label="Đang chờ khám"
            value={waiting.length}
            sub={`${waiting.filter((p) => p.priority || p.urgent).length} ca ưu tiên`}
            icon={<Users size={17} />}
            accent={{ bar: 'bg-brand', soft: 'bg-brand-soft', text: 'text-brand' }}
          />
          <Kpi
            label="Đã gọi"
            value={called.length}
            sub={called[0] ? `STT ${called[0].order} · Đang vào` : 'Chưa gọi bệnh nhân'}
            icon={<Megaphone size={17} />}
            accent={{ bar: 'bg-orange-500', soft: 'bg-orange-50', text: 'text-orange-600' }}
            onClick={() => called.length > 0 && setShowCalledList(true)}
          />
          <Kpi
            label="Đang khám"
            value={inService.length}
            sub={inService[0] ? `STT ${inService[0].order} · ${room.doctor}` : 'Phòng khám đang trống'}
            icon={<Stethoscope size={17} />}
            accent={{ bar: 'bg-emerald-500', soft: 'bg-emerald-50', text: 'text-emerald-700' }}
          />
          <Kpi
            label="Tiến độ định mức"
            value={
              <>
                {received} <span className="text-[18px] font-semibold text-slate-400">/ {QUOTA}</span>
              </>
            }
            sub={`Đã khám xong: ${done.length} · Đã nhận: ${pct}%`}
            icon={<Activity size={17} />}
            accent={{ bar: 'bg-teal-500', soft: 'bg-teal-50', text: 'text-teal-700' }}
          >
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
          </Kpi>
        </div>

        <div className="top-[76px] z-10 -mx-2 bg-canvas px-2 py-1 [@media(min-height:960px)]:sticky">
          <ActiveStage
            inService={inService}
            called={called}
            next={next}
            maxCapacity={MAX_ROOM_CAPACITY}
            exceptionPatient={exceptionPatient}
            canCall={canCall}
            blockedReason={room.closed ? 'Hàng đợi đã đóng – không thể gọi số mới' : room.paused ? 'Đang tạm ngưng gọi số – mở lại từ menu phía trên' : undefined}
            onComplete={completePatient}
            onEnter={(p) => {
              update({ [p.id]: { status: 'inroom', startedAt: Date.now() } })
              notify(`STT ${p.order} – ${p.name} đã vào phòng khám`)
            }}
            onRecall={(p) => callPatient(p, 'Đã phát lại loa gọi')}
            onSkip={(p) =>
              withUndo(`Đã chuyển STT ${p.order} - ${p.name} sang Qua lượt`, () =>
                update({ [p.id]: { status: 'skipped', updatedAt: nowHHMM(), calledAt: undefined } }),
              )
            }
            onCallNext={(p) => {
              callPatient(p, p.id === exceptionPatient?.id ? 'Đã gọi ưu tiên ngoại lệ' : 'Đã gọi')
              if (p.id === exceptionPatient?.id) setExceptionPatient(null)
            }}
            onShowCalledList={() => setShowCalledList(true)}
          />
        </div>

        <div className="mb-2 flex items-center gap-3">
          <input
            type="text"
            placeholder="Tìm kiếm danh sách hàng đợi (Tên, Mã BN, STT)..."
            value={searchWaiting}
            onChange={(e) => setSearchWaiting(e.target.value)}
            className="w-full max-w-md rounded-lg border border-line px-4 py-2 text-[14px] focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        <WaitingTable
          patients={ps.filter((p) => 
            !searchWaiting || 
            p.name.toLowerCase().includes(searchWaiting.toLowerCase()) || 
            p.id.toLowerCase().includes(searchWaiting.toLowerCase()) || 
            p.order.toString().includes(searchWaiting)
          )}
          canCall={canCall}
          onExceptionCall={(p) => setConfirm({ kind: 'exception', p })}
          onCancel={(p) => setConfirm({ kind: 'cancel', p })}
          onRequeue={(p) => {
            update({ [p.id]: { status: 'waiting' } })
            notify(`Đã đưa STT ${p.order} trở lại hàng chờ`)
          }}
        />
      </main>

      <UndoToast
        toast={undo}
        onDismiss={() => setUndo(null)}
        onUndo={() => {
          if (!undo) return
          setPatients(() => undo.snapshot)
          setUndo(null)
          notify('Đã hoàn tác thao tác vừa thực hiện')
        }}
      />

      {confirm?.kind === 'close' && (
        <Modal
          title="Đóng hàng đợi?"
          subtitle={room.name}
          tone="red"
          icon={<DoorClosed size={19} />}
          width={460}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className={`${btn.base} ${btn.ghost}`} onClick={() => setConfirm(null)}>
                Hủy
              </button>
              <button
                className={`${btn.base} ${btn.danger}`}
                onClick={() => {
                  onToggleClosed(room.id)
                  setConfirm(null)
                }}
              >
                Xác nhận đóng
              </button>
            </>
          }
        >
          <p className="text-[14px] leading-relaxed text-slate-700">
            Phòng sẽ ngừng nhận bệnh nhân mới. <b className="tabular">{waiting.length}</b> bệnh nhân đang chờ cần được điều dưỡng trưởng điều phối sang
            phòng khác. Nếu chỉ cần nghỉ ngắn, hãy chọn <b>Tạm ngưng gọi số</b>.
          </p>
        </Modal>
      )}

      {confirm && confirm.kind !== 'close' && (
        <Modal
          title={confirmBody[confirm.kind].title}
          subtitle={`STT ${confirm.p.order} · ${confirm.p.name} · ${confirm.p.id}`}
          tone={confirm.kind === 'cancel' ? 'red' : 'brand'}
          icon={confirmBody[confirm.kind].icon}
          width={460}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className={`${btn.base} ${btn.ghost}`} onClick={() => setConfirm(null)}>
                Quay lại
              </button>
              <button
                className={`${btn.base} ${confirm.kind === 'cancel' ? btn.danger : btn.primary}`}
                onClick={() => {
                  const p = confirm.p
                  if (confirm.kind === 'exception') {
                    setExceptionPatient(p)
                  } else {
                    withUndo(`Đã hủy lượt STT ${p.order} - ${p.name}`, () => setPatients((list) => list.filter((x) => x.id !== p.id)))
                  }
                  setConfirm(null)
                }}
              >
                {confirmBody[confirm.kind].cta}
              </button>
            </>
          }
        >
          <p className="flex gap-3 text-[14px] leading-relaxed text-slate-700">
            <Hourglass size={18} className="mt-0.5 shrink-0 text-muted" />
            {confirmBody[confirm.kind].text}
          </p>
        </Modal>
      )}
      {showCalledList && (
        <Modal
          title="Danh sách bệnh nhân đã gọi"
          width={800}
          onClose={() => {
            setShowCalledList(false)
            setActiveKebab(null)
            setSearchCalled('')
          }}
          footer={
            <div className="flex justify-end w-full">
              <button 
                className={`${btn.base} ${btn.ghost}`} 
                onClick={() => {
                  setShowCalledList(false)
                  setActiveKebab(null)
                  setSearchCalled('')
                }}
              >
                Đóng
              </button>
            </div>
          }
        >
          <div className="mb-4">
            <input
              type="text"
              placeholder="Tìm bệnh nhân đã gọi (Tên, Mã BN, STT)..."
              value={searchCalled}
              onChange={(e) => setSearchCalled(e.target.value)}
              className="w-full rounded-lg border border-line px-4 py-2 text-[14px] focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="max-h-[60vh] overflow-auto pb-10">
            <table className="w-full text-left text-[14px]">
              <thead className="sticky top-0 z-10 border-b border-line bg-white text-[12px] text-muted uppercase">
                <tr>
                  <th className="px-2 py-3">STT</th>
                  <th className="px-2 py-3">Họ tên bệnh nhân</th>
                  <th className="px-2 py-3">Mã BN - Năm sinh</th>
                  <th className="px-2 py-3">Thời gian gọi</th>
                  <th className="px-2 py-3 text-center">Số lần gọi</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {called
                  .filter((p) => 
                    !searchCalled || 
                    p.name.toLowerCase().includes(searchCalled.toLowerCase()) || 
                    p.id.toLowerCase().includes(searchCalled.toLowerCase()) || 
                    p.order.toString().includes(searchCalled)
                  )
                  .map((p) => {
                    const minutesAgo = p.calledAt ? Math.floor((now - p.calledAt) / 60000) : 0;
                    const callCount = p.callCount || 1;
                    const isHighLighted = callCount > 3;

                    // Xử lý đếm ngược thời gian gọi lại
                    const COOLDOWN_MS = 10 * 1000;
                    const elapsed = p.calledAt ? now - p.calledAt : 0;
                    const canRecall = elapsed >= COOLDOWN_MS;
                    const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
                    const remainingText = `${Math.floor(remainingSeconds / 60)}:${String(remainingSeconds % 60).padStart(2, '0')}`;

                    return (
                      <tr key={p.id} className={`relative border-b border-line hover:bg-slate-50 ${isHighLighted ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                        <td className="px-2 py-3 font-bold text-ink">{p.order}</td>
                        <td className="px-2 py-3 font-semibold">
                          {p.name} {p.priority && <span className="ml-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] text-white">ƯU TIÊN</span>}
                        </td>
                        <td className="px-2 py-3 text-muted">{p.id} - {p.birthYear || '19XX'}</td> 
                        <td className="px-2 py-3">
                          <span className={`inline-block rounded px-2 py-1 text-[13px] font-medium ${isHighLighted ? 'bg-white/50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                            {minutesAgo === 0 ? 'Vừa gọi' : `${minutesAgo} phút trước`}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <span className={`inline-block rounded px-2 py-1 text-[13px] font-bold ${isHighLighted ? 'bg-red-200 text-red-800' : 'bg-brand-soft text-brand'}`}>
                            {callCount} lần
                          </span>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <button
                            onClick={() => setActiveKebab(activeKebab === p.id ? null : p.id)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-200"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {activeKebab === p.id && (
                            <div className="absolute right-8 top-10 z-20 flex w-44 flex-col overflow-hidden rounded-lg border border-line bg-white text-[13px] shadow-lg">
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-blue-600 hover:bg-blue-50"
                                onClick={() => {
                                  update({ [p.id]: { status: 'inroom', startedAt: Date.now() } });
                                  notify(`STT ${p.order} – ${p.name} đã vào phòng khám`);
                                  setActiveKebab(null);
                                  setShowCalledList(false);
                                }}
                              >
                                <DoorOpen size={14} /> Vào phòng khám
                              </button>
                              <button
                                disabled={!canRecall}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-amber-500 hover:bg-amber-50 disabled:bg-slate-50 disabled:text-slate-400"
                                onClick={() => {
                                  if (canRecall) {
                                    callPatient(p, 'Đã phát lại loa gọi');
                                    setActiveKebab(null);
                                  }
                                }}
                              >
                                <Megaphone size={14} /> {!canRecall ? `Chờ ${remainingText}` : 'Gọi lại'}
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium text-red-600 hover:bg-red-50"
                                onClick={() => {
                                  withUndo(`Đã chuyển STT ${p.order} - ${p.name} sang Qua lượt`, () =>
                                    update({ [p.id]: { status: 'skipped', updatedAt: nowHHMM(), calledAt: undefined } })
                                  );
                                  setActiveKebab(null);
                                }}
                              >
                                <DoorClosed size={14} /> Qua lượt
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  )
}
