import { useEffect, useRef, useState } from 'react'
import {
  BellRing,
  CalendarClock,
  CalendarPlus,
  CalendarX2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock3,
  History,
  Inbox,
  MapPin,
  PauseCircle,
  Users,
  X,
} from 'lucide-react'
import {
  DOCTORS,
  MINUTES_PER_PERSON,
  SLOTS,
  THEMES,
  queueStatus,
  themeVars,
  ticketLabel,
  type Appointment,
  type Person,
  type Queue,
} from '../data'
import { Avatar, BottomSheet, Button, ConfirmDialog, StatusPill, cx } from '../ui'

function greeting() {
  const h = new Date().getHours()
  if (h < 11) return 'Chào buổi sáng'
  if (h < 14) return 'Chào buổi trưa'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function QueueCard({
  q,
  total,
  onOpenAll,
  onPostpone,
  onCancel,
}: {
  q: Queue
  total: number
  onOpenAll: () => void
  onPostpone: () => void
  onCancel: () => void
}) {
  const status = queueStatus(q)
  const called = status === 'called'
  const paused = status === 'paused'
  const ewt = q.ahead * MINUTES_PER_PERSON
  const sub = called ? 'text-on-dark-2' : 'text-(--t-ink)'

  return (
    <article
      aria-label={`Hàng đợi ${q.service}, số ${ticketLabel(q.prefix, q.ticketNo)}`}
      className={cx(
        'relative overflow-hidden rounded-[28px] border-2 p-5 shadow-[0_20px_40px_-22px_rgba(15,30,38,0.55)] transition-colors duration-500',
        called
          ? 'border-ok-deep bg-ok-deep text-white'
          : 'border-(--t-200) bg-[linear-gradient(165deg,var(--t-100)_0%,var(--t-50)_100%)] text-(--t-ink)',
      )}
    >
      <div
        aria-hidden="true"
        className={cx(
          'pointer-events-none absolute -top-24 -right-20 size-64 rounded-full',
          called ? 'bg-white/[0.06]' : 'bg-white/45',
        )}
      />
      <div className="relative flex items-center justify-between gap-2">
        <StatusPill status={status} />
        <button
          type="button"
          onClick={onOpenAll}
          aria-haspopup="dialog"
          className="inline-flex min-h-12 items-center gap-1 rounded-full bg-white px-3.5 text-base font-semibold text-ink shadow-sm ring-1 ring-black/5 hover:bg-surface"
        >
          Đang chờ: {total} hàng đợi
          <ChevronDown size={20} strokeWidth={2.6} aria-hidden="true" />
        </button>
      </div>

      <div className="relative mt-6 text-center">
        <p className={cx('text-base font-medium', sub)}>Số thứ tự của bạn</p>
        <p className="tabular mt-1 text-[40px] leading-none font-extrabold tracking-[0.04em]">
          {ticketLabel(q.prefix, q.ticketNo)}
        </p>

        <div
          aria-live="polite"
          className={cx(
            'mx-auto mt-5 inline-flex min-h-11 items-center gap-2.5 rounded-full bg-white px-4 py-2 text-lg font-semibold',
            called ? 'text-ok-ink' : 'animate-live-ring text-ink',
          )}
        >
          <span className="relative flex size-3 shrink-0" aria-hidden="true">
            {!paused && <span className="absolute inset-0 animate-ring rounded-full bg-ok" />}
            <span className={cx('relative size-3 rounded-full', paused ? 'bg-warn' : 'bg-ok')} />
          </span>
          {called ? (
            <span>Mời bạn vào {q.room} ngay</span>
          ) : paused ? (
            <span>Phòng tạm dừng gọi số</span>
          ) : (
            <span>
              Đang gọi số {ticketLabel(q.prefix, q.currentNo)}{' '}
              <span className="whitespace-nowrap">(Còn {q.ahead} người nữa)</span>
            </span>
          )}
        </div>
      </div>

      <dl
        className={cx(
          'relative mt-6 divide-y rounded-2xl px-4',
          called ? 'divide-white/15 bg-white/[0.07]' : 'divide-(--t-200) bg-white/60',
        )}
      >
        <div className="flex items-center gap-3.5 py-3.5">
          <Clock3 size={26} className={cx('shrink-0', sub)} aria-hidden="true" />
          <div className="min-w-0">
            <dt className={cx('text-base', sub)}>Thời gian chờ dự kiến</dt>
            <dd className="text-xl font-bold">{called ? 'Đến lượt bạn' : paused ? 'Đang cập nhật…' : `~ ${ewt} phút nữa`}</dd>
          </div>
        </div>
        <div className="flex items-center gap-3.5 py-3.5">
          <MapPin size={26} className={cx('shrink-0', sub)} aria-hidden="true" />
          <div className="min-w-0">
            <dt className={cx('text-base', sub)}>{q.service}</dt>
            <dd className="text-xl font-bold">
              {q.room} · {q.floor}
            </dd>
          </div>
        </div>
      </dl>

      <div className="relative mt-4 flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onPostpone}
          disabled={q.postponed}
          className={cx(
            'flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 text-lg font-semibold transition active:scale-[0.98]',
            called
              ? 'border-white/70 text-white hover:bg-white/10 disabled:border-white/30'
              : 'border-(--t-ink) bg-white/50 text-(--t-ink) hover:bg-white disabled:border-(--t-200) disabled:bg-white/40',
          )}
        >
          {q.postponed ? (
            <>
              <Check size={22} aria-hidden="true" /> Đã lùi lượt 10 phút
            </>
          ) : (
            <>
              <History size={22} aria-hidden="true" /> Xin lùi lượt (10 phút)
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-base font-semibold text-bad transition hover:bg-bad-bg active:scale-[0.98]"
        >
          <X size={20} strokeWidth={2.6} aria-hidden="true" /> Hủy lượt khám
        </button>
      </div>
    </article>
  )
}

function AppointmentCard({
  a,
  onReschedule,
  onCancel,
}: {
  a: Appointment
  onReschedule: () => void
  onCancel: () => void
}) {
  const doc = DOCTORS[a.doctorId]
  const [day, time] = a.slot.split(' · ')
  const cancelled = a.status === 'cancelled'
  return (
    <article
      className={cx(
        'overflow-hidden rounded-3xl border bg-white',
        cancelled ? 'border-line/80 bg-surface' : 'border-(--t-200) shadow-[0_8px_24px_-16px_rgba(15,30,38,0.35)]',
      )}
    >
      <div className={cx('flex items-center justify-between gap-3 px-4 py-3', cancelled ? 'bg-surface' : 'bg-(--t-50)')}>
        <div className={cx('flex items-center gap-2.5', cancelled ? 'text-ink-2' : 'text-(--t-ink)')}>
          <CalendarClock size={24} aria-hidden="true" />
          <div className={cx('leading-tight', cancelled && 'line-through')}>
            <p className="text-base font-semibold">{day}</p>
            <p className="tabular text-[22px] font-extrabold">{time}</p>
          </div>
        </div>
        {cancelled ? (
          <StatusPill status="cancelled" />
        ) : (
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-current/40 bg-ok-bg px-3 text-base font-semibold text-ok-ink">
            <CircleCheck size={18} strokeWidth={2.4} aria-hidden="true" /> Đã xác nhận
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 px-4 pt-3">
        <Avatar name={doc.name} photo={doc.photo} size={44} />
        <div className="min-w-0">
          <p className="text-lg font-bold text-ink">{doc.name}</p>
          <p className="text-base text-ink-2">
            {a.department} · {a.room}
          </p>
        </div>
      </div>
      {cancelled ? (
        <p className="px-4 pt-2 pb-4 text-base text-ink-2">Lịch hẹn này đã được hủy.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 p-4">
          <Button variant="secondary" size="md" onClick={onReschedule}>
            <CalendarClock size={20} aria-hidden="true" /> Dời lịch
          </Button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-bad/50 bg-white text-base font-semibold text-bad hover:bg-bad-bg active:scale-[0.98]"
          >
            <CalendarX2 size={20} aria-hidden="true" /> Hủy lịch
          </button>
        </div>
      )}
    </article>
  )
}

type Confirm =
  | { kind: 'postpone'; queueId: string }
  | { kind: 'cancelQueue'; queueId: string }
  | { kind: 'cancelAppt'; apptId: string }
  | { kind: 'resched'; apptId: string; slot: string }

export default function Home({
  account,
  person,
  people,
  queues,
  appointments,
  onSwitchPerson,
  onPostpone,
  onCancelQueue,
  onCancelAppt,
  onReschedule,
  onToast,
}: {
  account: Person
  person: Person
  people: Person[]
  queues: Queue[]
  appointments: Appointment[]
  onSwitchPerson: (id: string) => void
  onPostpone: (queueId: string) => void
  onCancelQueue: (queueId: string) => void
  onCancelAppt: (apptId: string) => void
  onReschedule: (apptId: string, slot: string) => void
  onToast: (m: string) => void
}) {
  const [active, setActive] = useState(0)
  const [sheet, setSheet] = useState<null | 'queues' | 'people' | 'resched'>(null)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [reschedId, setReschedId] = useState<string | null>(null)
  const [newSlot, setNewSlot] = useState<string | null>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActive(0)
    track.current?.scrollTo({ left: 0 })
  }, [person.id])

  // Keep the active slide valid when a queue is cancelled.
  useEffect(() => {
    if (active > queues.length - 1) setActive(Math.max(0, queues.length - 1))
  }, [queues.length, active])

  const goTo = (i: number) => {
    const el = track.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
    setActive(i)
  }

  const reschedAppt = appointments.find((a) => a.id === reschedId)
  const confirmQueue = confirm && 'queueId' in confirm ? queues.find((q) => q.id === confirm.queueId) : undefined
  const confirmAppt = confirm && 'apptId' in confirm ? appointments.find((a) => a.id === confirm.apptId) : undefined

  const runConfirm = () => {
    if (!confirm) return
    if (confirm.kind === 'postpone') onPostpone(confirm.queueId)
    if (confirm.kind === 'cancelQueue') onCancelQueue(confirm.queueId)
    if (confirm.kind === 'cancelAppt') onCancelAppt(confirm.apptId)
    if (confirm.kind === 'resched') onReschedule(confirm.apptId, confirm.slot)
    setConfirm(null)
  }

  const upcoming = appointments.filter((a) => a.status === 'upcoming').length

  return (
    <div className="pb-6">
      <header className="bg-[linear-gradient(180deg,var(--t-50)_0%,#ffffff_100%)] px-5 pt-5 pb-1">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base text-ink-2">{greeting()},</p>
            <h1 className="truncate text-[28px] leading-tight font-bold text-ink">{account.shortName}</h1>
          </div>
          <button
            type="button"
            aria-label="Thông báo, 1 thông báo mới"
            onClick={() => onToast('Bạn sẽ được báo khi còn 2 người phía trước')}
            className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-ink ring-1 ring-line hover:bg-surface"
          >
            <BellRing size={24} aria-hidden="true" />
            <span className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-bad ring-2 ring-white" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSheet('people')}
          aria-haspopup="dialog"
          className="mt-4 flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-(--t-200) bg-(--t-100) px-3.5 py-2.5 text-left hover:border-(--t-ink)"
        >
          <Avatar name={person.name} theme={THEMES[person.theme]} size={44} className="ring-2 ring-white" />
          <span className="min-w-0 flex-1">
            <span className="block text-base text-(--t-ink)">Đang xem hồ sơ của:</span>
            <span className="block truncate text-lg font-bold text-(--t-ink)">{person.name}</span>
          </span>
          <ChevronDown size={26} strokeWidth={2.4} className="shrink-0 text-(--t-ink)" aria-hidden="true" />
        </button>
      </header>

      <section aria-label="Hàng đợi" className="mt-5">
        {queues.length === 0 ? (
          <div className="mx-5 rounded-[28px] border-2 border-dashed border-(--t-200) bg-(--t-50) px-6 py-9 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-white text-(--t-ink)">
              <Inbox size={32} aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-ink">Chưa có hàng đợi nào</h2>
            <p className="mt-2 text-base text-ink-2">
              {person.name} hiện không có lượt khám nào hôm nay. Lấy số tại ki-ốt hoặc đặt lịch trước.
            </p>
            <Button className="mt-6" onClick={() => onToast('Đã mở đặt lịch khám (bản demo)')}>
              <CalendarPlus size={22} aria-hidden="true" /> Đặt lịch khám
            </Button>
          </div>
        ) : (
          <>
            <div
              ref={track}
              onScroll={(e) => {
                const el = e.currentTarget
                const i = Math.round(el.scrollLeft / el.clientWidth)
                if (i !== active) setActive(i)
              }}
              className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
            >
              {queues.map((q, i) => (
                <div
                  key={q.id}
                  className="relative w-full shrink-0 snap-center px-5 pb-6"
                  aria-hidden={i !== active || undefined}
                  inert={i !== active || undefined}
                >
                  {queues.length > 1 && (
                    <>
                      <div aria-hidden="true" className="absolute inset-x-11 top-6 bottom-0 rounded-[28px] bg-(--t-200) opacity-60" />
                      <div aria-hidden="true" className="absolute inset-x-8 top-4 bottom-3 rounded-[28px] bg-(--t-200)" />
                    </>
                  )}
                  <QueueCard
                    q={q}
                    total={queues.length}
                    onOpenAll={() => setSheet('queues')}
                    onPostpone={() => setConfirm({ kind: 'postpone', queueId: q.id })}
                    onCancel={() => setConfirm({ kind: 'cancelQueue', queueId: q.id })}
                  />
                </div>
              ))}
            </div>

            {queues.length > 1 && (
              <div className="flex items-center justify-center" role="group" aria-label="Chọn hàng đợi">
                {queues.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Hàng đợi ${i + 1} trên ${queues.length}: ${q.service}`}
                    aria-current={i === active || undefined}
                    className="flex h-12 w-10 items-center justify-center"
                  >
                    <span
                      className={cx('h-2.5 rounded-full transition-all', i === active ? 'w-8 bg-(--t-solid)' : 'w-2.5 bg-[#7c8b91]')}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="mx-5 mt-3 flex gap-3.5 rounded-2xl bg-surface p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-brand-800">
                <BellRing size={22} aria-hidden="true" />
              </span>
              <p className="text-base text-ink-2">
                <strong className="font-semibold text-ink">Bạn không cần ngồi canh màn hình.</strong> Điện thoại sẽ rung
                và báo khi còn 2 người phía trước.
              </p>
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="appt-title" className="mt-7 px-5">
        <div className="flex items-end justify-between pb-2.5">
          <h2 id="appt-title" className="px-1 text-lg font-bold text-ink">
            Lịch hẹn sắp tới
          </h2>
          <p className="text-base text-ink-2">{upcoming} lịch hẹn</p>
        </div>
        {appointments.length === 0 ? (
          <p className="rounded-3xl bg-surface px-5 py-6 text-center text-base text-ink-2">
            Chưa có lịch hẹn nào. Bạn có thể đặt lại bác sĩ từ tab Lịch sử.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {appointments.map((a) => (
              <li key={a.id}>
                <AppointmentCard
                  a={a}
                  onReschedule={() => {
                    setReschedId(a.id)
                    setNewSlot(null)
                    setSheet('resched')
                  }}
                  onCancel={() => setConfirm({ kind: 'cancelAppt', apptId: a.id })}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* All queues */}
      <BottomSheet
        open={sheet === 'queues'}
        onClose={() => setSheet(null)}
        title={`Đang chờ: ${queues.length} hàng đợi`}
        description="Chạm vào một hàng đợi để xem chi tiết"
      >
        <ul className="flex flex-col gap-3">
          {queues.map((q, i) => {
            const s = queueStatus(q)
            return (
              <li key={q.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSheet(null)
                    goTo(i)
                  }}
                  className={cx(
                    'flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition hover:border-(--t-ink)',
                    i === active ? 'border-(--t-solid) bg-(--t-50)' : 'border-line bg-white',
                  )}
                >
                  <div className="w-[104px] shrink-0">
                    <p className="tabular text-[32px] leading-none font-extrabold text-(--t-ink)">
                      {ticketLabel(q.prefix, q.ticketNo)}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg leading-snug font-bold text-ink">{q.service}</p>
                    <p className="text-base text-ink-2">
                      {q.room} · {q.floor}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusPill status={s} />
                      <span className="text-base font-semibold text-ink">
                        {s === 'called'
                          ? 'Ngay bây giờ'
                          : s === 'paused'
                            ? 'Chưa xác định'
                            : `~ ${q.ahead * MINUTES_PER_PERSON} phút`}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={24} className="shrink-0 text-ink-2" aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 flex items-start gap-2 text-base text-ink-2">
          <PauseCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          Hàng đợi “Tạm dừng” sẽ tự tiếp tục, bạn vẫn giữ nguyên số thứ tự.
        </p>
      </BottomSheet>

      {/* Family profile switcher */}
      <BottomSheet
        open={sheet === 'people'}
        onClose={() => setSheet(null)}
        title="Chọn hồ sơ để theo dõi"
        description="Mỗi hồ sơ có một màu riêng để dễ nhận biết"
      >
        <ul className="flex flex-col gap-2.5" role="radiogroup" aria-label="Hồ sơ">
          {people.map((p) => {
            const selected = p.id === person.id
            const t = THEMES[p.theme]
            return (
              <li key={p.id} style={themeVars(t)}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    onSwitchPerson(p.id)
                    setSheet(null)
                  }}
                  className={cx(
                    'flex min-h-[72px] w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left',
                    selected ? 'border-(--t-solid) bg-(--t-100)' : 'border-(--t-200) bg-(--t-50) hover:border-(--t-solid)',
                  )}
                >
                  <Avatar name={p.name} theme={t} size={48} className="ring-2 ring-white" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg font-bold text-(--t-ink)">{p.name}</span>
                    <span className="block text-base text-(--t-ink)">
                      {p.relation} · {p.age ? `${p.age} tuổi` : 'Mới thêm'}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={cx(
                      'flex size-7 shrink-0 items-center justify-center rounded-full border-2',
                      selected ? 'border-(--t-solid) bg-(--t-solid) text-white' : 'border-(--t-ink) bg-white',
                    )}
                  >
                    {selected && <Check size={18} strokeWidth={3} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 flex items-center gap-2 text-base text-ink-2">
          <Users size={20} aria-hidden="true" /> Quản lý người thân trong tab Hồ sơ.
        </p>
      </BottomSheet>

      {/* Reschedule: pick a new slot, then confirm */}
      <BottomSheet
        open={sheet === 'resched' && !!reschedAppt}
        onClose={() => setSheet(null)}
        title="Dời lịch khám"
        description={reschedAppt ? `Lịch hiện tại: ${reschedAppt.slot}` : undefined}
        footer={
          <Button
            disabled={!newSlot}
            onClick={() => {
              if (!reschedAppt || !newSlot) return
              setSheet(null)
              setConfirm({ kind: 'resched', apptId: reschedAppt.id, slot: newSlot })
            }}
          >
            Tiếp tục
          </Button>
        }
      >
        <p className="mb-3 text-base font-semibold text-ink-2">Chọn giờ khám mới</p>
        <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Giờ khám mới">
          {SLOTS.filter((s) => s !== reschedAppt?.slot).map((s) => (
            <li key={s}>
              <button
                type="button"
                role="radio"
                aria-checked={newSlot === s}
                onClick={() => setNewSlot(s)}
                className={cx(
                  'flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left text-lg font-semibold',
                  newSlot === s ? 'border-brand-700 bg-brand-50 text-brand-900' : 'border-line text-ink',
                )}
              >
                <CalendarClock size={22} aria-hidden="true" />
                <span className="tabular flex-1">{s}</span>
                {newSlot === s && <Check size={24} strokeWidth={2.8} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>

      {/* Confirmations */}
      <ConfirmDialog
        open={confirm?.kind === 'postpone' && !!confirmQueue}
        action="lùi lượt 10 phút"
        userName={person.name}
        icon={History}
        confirmLabel="Xác nhận lùi lượt"
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      >
        {confirmQueue && (
          <ul className="flex flex-col gap-2">
            <li>
              • Giữ nguyên số <strong className="text-ink">{ticketLabel(confirmQueue.prefix, confirmQueue.ticketNo)}</strong> ·{' '}
              {confirmQueue.service}.
            </li>
            <li>• 3 người phía sau sẽ được khám trước (khoảng 10 phút).</li>
            <li>• Mỗi hàng đợi chỉ được lùi lượt 1 lần.</li>
          </ul>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === 'cancelQueue' && !!confirmQueue}
        action="hủy lượt khám"
        userName={person.name}
        icon={CalendarX2}
        tone="danger"
        confirmLabel="Hủy lượt khám"
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      >
        {confirmQueue && (
          <p>
            Số <strong className="text-ink">{ticketLabel(confirmQueue.prefix, confirmQueue.ticketNo)}</strong> ·{' '}
            {confirmQueue.service} · {confirmQueue.room}. Số thứ tự sẽ bị hủy và{' '}
            <strong className="text-bad">không thể khôi phục</strong>.
          </p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === 'cancelAppt' && !!confirmAppt}
        action="hủy lịch khám"
        userName={person.name}
        icon={CalendarX2}
        tone="danger"
        confirmLabel="Hủy lịch khám"
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      >
        {confirmAppt && (
          <p>
            <strong className="text-ink">{confirmAppt.slot}</strong> với {DOCTORS[confirmAppt.doctorId].name} ·{' '}
            {confirmAppt.department}. Bạn sẽ cần đặt lịch mới nếu muốn khám lại.
          </p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === 'resched' && !!confirmAppt}
        action="dời lịch khám"
        userName={person.name}
        icon={CalendarClock}
        confirmLabel="Xác nhận dời lịch"
        onConfirm={runConfirm}
        onClose={() => setConfirm(null)}
      >
        {confirmAppt && confirm?.kind === 'resched' && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <dt>Từ:</dt>
            <dd className="tabular text-ink-2 line-through">{confirmAppt.slot}</dd>
            <dt>Sang:</dt>
            <dd className="tabular font-bold text-ink">{confirm.slot}</dd>
            <dt>Bác sĩ:</dt>
            <dd>{DOCTORS[confirmAppt.doctorId].name}</dd>
          </dl>
        )}
      </ConfirmDialog>
    </div>
  )
}
