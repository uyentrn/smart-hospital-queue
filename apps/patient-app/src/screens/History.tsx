import { useMemo, useState } from 'react'
import { CalendarDays, CalendarCheck, Check, ChevronDown, ChevronRight, Hospital, RotateCcw, SearchX, Stethoscope } from 'lucide-react'
import { DOCTORS, SLOTS, VISITS, formatVnd, type Person, type Visit } from '../data'
import { Avatar, BottomSheet, Button, ConfirmDialog, PageTitle, cx } from '../ui'

type FilterKey = 'time' | 'dept' | 'doctor'

const TIME_OPTIONS = [
  { id: 'all', label: 'Tất cả thời gian' },
  { id: '3m', label: '3 tháng gần đây' },
  { id: '6m', label: '6 tháng gần đây' },
  { id: 'y2026', label: 'Năm 2026' },
  { id: 'y2025', label: 'Năm 2025' },
]

// Demo "today" so the relative filters are stable.
const TODAY = new Date('2026-10-20')

function matchTime(v: Visit, t: string) {
  const d = new Date(v.iso)
  const months = (TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.4)
  if (t === '3m') return months <= 3
  if (t === '6m') return months <= 6
  if (t === 'y2026') return v.iso.startsWith('2026')
  if (t === 'y2025') return v.iso.startsWith('2025')
  return true
}

export default function History({
  person,
  onOpen,
  onBook,
}: {
  person: Person
  onOpen: (id: string) => void
  onBook: (visit: Visit, slot: string) => void
}) {
  const [time, setTime] = useState('all')
  const [dept, setDept] = useState('all')
  const [doctor, setDoctor] = useState('all')
  const [sheet, setSheet] = useState<FilterKey | null>(null)
  const [rebook, setRebook] = useState<Visit | null>(null)
  const [slot, setSlot] = useState(SLOTS[0])
  const [confirmBook, setConfirmBook] = useState<Visit | null>(null)

  const depts = useMemo(() => Array.from(new Set(VISITS.map((v) => v.department))), [])
  const doctorIds = useMemo(() => Array.from(new Set(VISITS.map((v) => v.doctorId))), [])

  const list = VISITS.filter(
    (v) => matchTime(v, time) && (dept === 'all' || v.department === dept) && (doctor === 'all' || v.doctorId === doctor),
  )
  const anyFilter = time !== 'all' || dept !== 'all' || doctor !== 'all'

  const chips: { key: FilterKey; label: string; Icon: typeof CalendarDays; value: string | null }[] = [
    {
      key: 'time',
      label: 'Thời gian',
      Icon: CalendarDays,
      value: time === 'all' ? null : TIME_OPTIONS.find((o) => o.id === time)!.label,
    },
    { key: 'dept', label: 'Khoa khám', Icon: Hospital, value: dept === 'all' ? null : dept },
    { key: 'doctor', label: 'Bác sĩ', Icon: Stethoscope, value: doctor === 'all' ? null : DOCTORS[doctor].name },
  ]

  const sheetOptions: { id: string; label: string }[] =
    sheet === 'time'
      ? TIME_OPTIONS
      : sheet === 'dept'
        ? [{ id: 'all', label: 'Tất cả khoa' }, ...depts.map((d) => ({ id: d, label: d }))]
        : sheet === 'doctor'
          ? [{ id: 'all', label: 'Tất cả bác sĩ' }, ...doctorIds.map((id) => ({ id, label: DOCTORS[id].name }))]
          : []
  const sheetValue = sheet === 'time' ? time : sheet === 'dept' ? dept : doctor
  const setSheetValue = sheet === 'time' ? setTime : sheet === 'dept' ? setDept : setDoctor

  return (
    <div className="pb-8">
      <PageTitle title="Lịch sử khám" subtitle="Các lần khám đã hoàn thành" />

      <div className="sticky top-0 z-20 border-b border-line/60 bg-white/95 px-5 py-3 backdrop-blur">
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5" role="toolbar" aria-label="Bộ lọc">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setSheet(c.key)}
              aria-haspopup="dialog"
              className={cx(
                'inline-flex min-h-12 shrink-0 items-center gap-1.5 rounded-full border-2 px-3.5 text-base font-semibold whitespace-nowrap transition',
                c.value
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-line bg-white text-ink hover:border-brand-700',
              )}
            >
              <c.Icon size={20} aria-hidden="true" />
              <span className="max-w-[9.5rem] truncate">{c.value ?? c.label}</span>
              <ChevronDown size={18} strokeWidth={2.6} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="mt-2 flex min-h-8 items-center justify-between">
          <p className="text-base text-ink-2" aria-live="polite">
            <strong className="font-bold text-ink">{list.length}</strong> lần khám
          </p>
          {anyFilter && (
            <button
              type="button"
              onClick={() => {
                setTime('all')
                setDept('all')
                setDoctor('all')
              }}
              className="inline-flex min-h-12 items-center gap-1.5 px-1 text-base font-semibold text-brand-800"
            >
              <RotateCcw size={18} aria-hidden="true" /> Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      <ul className="flex flex-col gap-4 px-5 pt-4">
        {list.map((v) => {
          const doc = DOCTORS[v.doctorId]
          return (
            <li key={v.id}>
              <article className="overflow-hidden rounded-3xl border border-line/80 bg-white shadow-[0_8px_24px_-16px_rgba(15,30,38,0.35)]">
                <button
                  type="button"
                  onClick={() => onOpen(v.id)}
                  aria-label={`${v.diagnosis}, ngày ${v.date}. Xem chi tiết`}
                  className="block w-full p-4 pb-3 text-left hover:bg-surface/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="tabular flex items-center gap-2 text-base font-semibold text-ink-2">
                      <CalendarCheck size={20} aria-hidden="true" />
                      {v.date} - {v.time}
                    </span>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-base font-semibold text-brand-800">
                      {v.department}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[22px] leading-snug font-bold text-ink">{v.diagnosis}</h2>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar name={doc.name} photo={doc.photo} size={44} />
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-ink">{doc.name}</p>
                      <p className="text-base text-ink-2">{doc.title}</p>
                    </div>
                  </div>
                </button>
                <div className="mx-4 border-t border-dashed border-line" />
                <div className="flex items-center justify-between gap-2 px-4 pt-3">
                  <div>
                    <p className="text-base text-ink-2">Viện phí</p>
                    <p className="tabular text-xl font-bold text-ink">{formatVnd(v.fee)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpen(v.id)}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="inline-flex min-h-12 items-center gap-1 rounded-xl px-2 text-base font-semibold text-brand-800 hover:bg-brand-50"
                  >
                    Xem chi tiết <ChevronRight size={20} strokeWidth={2.6} />
                  </button>
                </div>
                <div className="p-4 pt-3">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setSlot(SLOTS[0])
                      setRebook(v)
                    }}
                  >
                    <RotateCcw size={20} aria-hidden="true" /> Đặt lại bác sĩ này
                  </Button>
                </div>
              </article>
            </li>
          )
        })}
        {list.length === 0 && (
          <li className="rounded-3xl bg-surface px-6 py-10 text-center">
            <SearchX size={36} className="mx-auto text-ink-2" aria-hidden="true" />
            <p className="mt-3 text-lg font-bold">Không tìm thấy lần khám phù hợp</p>
            <p className="mt-1 text-base text-ink-2">Hãy thử chọn khoảng thời gian khác hoặc xóa bộ lọc.</p>
          </li>
        )}
      </ul>

      <BottomSheet
        open={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet === 'time' ? 'Lọc theo thời gian' : sheet === 'dept' ? 'Lọc theo khoa khám' : 'Lọc theo bác sĩ'}
      >
        <ul className="flex flex-col gap-2" role="radiogroup">
          {sheetOptions.map((o) => {
            const selected = o.id === sheetValue
            const doc = sheet === 'doctor' && o.id !== 'all' ? DOCTORS[o.id] : null
            return (
              <li key={o.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setSheetValue(o.id)
                    setSheet(null)
                  }}
                  className={cx(
                    'flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left text-lg font-semibold',
                    selected ? 'border-brand-700 bg-brand-50 text-brand-900' : 'border-transparent bg-surface text-ink',
                  )}
                >
                  {doc && <Avatar name={doc.name} photo={doc.photo} size={40} />}
                  <span className="flex-1">{o.label}</span>
                  {selected && <Check size={24} strokeWidth={2.8} className="text-brand-800" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      </BottomSheet>

      <BottomSheet
        open={!!rebook}
        onClose={() => setRebook(null)}
        title="Đặt lại bác sĩ này"
        description={rebook ? `${DOCTORS[rebook.doctorId].name} · ${rebook.department}` : undefined}
        footer={
          <Button
            onClick={() => {
              setConfirmBook(rebook)
              setRebook(null)
            }}
          >
            Tiếp tục
          </Button>
        }
      >
        <p className="mb-3 text-base font-semibold text-ink-2">Chọn giờ khám còn trống</p>
        <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Giờ khám">
          {SLOTS.map((s) => (
            <li key={s}>
              <button
                type="button"
                role="radio"
                aria-checked={slot === s}
                onClick={() => setSlot(s)}
                className={cx(
                  'flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left text-lg font-semibold',
                  slot === s ? 'border-brand-700 bg-brand-50 text-brand-900' : 'border-line text-ink',
                )}
              >
                <CalendarDays size={22} aria-hidden="true" />
                <span className="tabular flex-1">{s}</span>
                {slot === s && <Check size={24} strokeWidth={2.8} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>

      <ConfirmDialog
        open={!!confirmBook}
        action="đặt lịch khám"
        userName={person.name}
        icon={CalendarCheck}
        confirmLabel="Xác nhận đặt lịch"
        onConfirm={() => {
          if (confirmBook) onBook(confirmBook, slot)
          setConfirmBook(null)
        }}
        onClose={() => setConfirmBook(null)}
      >
        {confirmBook && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <dt>Bác sĩ:</dt>
            <dd className="font-bold text-ink">{DOCTORS[confirmBook.doctorId].name}</dd>
            <dt>Khoa:</dt>
            <dd>{confirmBook.department}</dd>
            <dt>Thời gian:</dt>
            <dd className="tabular font-bold text-ink">{slot}</dd>
          </dl>
        )}
      </ConfirmDialog>
    </div>
  )
}
