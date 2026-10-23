import { useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { roomStats, type LoadBand, type Room, type Specialty, type Triage, type User } from '../data'

type Props = {
  rooms: Room[]
  nursesOf: (roomId: string) => User[]
  selectedId: string
  onSelect: (id: string) => void
}

export const BAND: Record<LoadBand, { text: string; bar: string; soft: string; ring: string }> = {
  red: { text: 'text-red-700', bar: 'bg-red-500', soft: 'bg-red-50', ring: 'ring-red-200' },
  orange: { text: 'text-orange-700', bar: 'bg-orange-500', soft: 'bg-orange-50', ring: 'ring-orange-200' },
  green: { text: 'text-emerald-700', bar: 'bg-emerald-500', soft: 'bg-emerald-50', ring: 'ring-emerald-200' },
}

export function RoomState({ room }: { room: Room }) {
  const s = room.closed
    ? { label: 'Đã đóng', dot: 'bg-red-500', text: 'text-red-700' }
    : room.paused
      ? { label: 'Tạm ngưng', dot: 'bg-orange-500', text: 'text-orange-700' }
      : { label: 'Hoạt động', dot: 'bg-emerald-500', text: 'text-emerald-700' }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold ${s.text}`}>
      <span className={`size-2 rounded-full ${s.dot}`} /> {s.label}
    </span>
  )
}

export function Bar({ pct, cls }: { pct: number; cls: string }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${cls}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}

const CHIPS: { id: Triage | 'all'; label: string; dot?: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'overload', label: 'Quá tải chờ', dot: 'bg-red-500' },
  { id: 'nearfull', label: 'Sắp đầy định mức', dot: 'bg-orange-500' },
  { id: 'available', label: 'Còn trống nhiều', dot: 'bg-emerald-500' },
]

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase()

export default function ClinicDirectory({ rooms, nursesOf, selectedId, onSelect }: Props) {
  const [q, setQ] = useState('')
  const [spec, setSpec] = useState<Specialty | 'all'>('all')
  const [chip, setChip] = useState<Triage | 'all'>('all')

  const scoped = useMemo(() => {
    const k = norm(q.trim())
    return rooms
      .filter((r) => spec === 'all' || r.specialty === spec)
      .filter((r) => {
        if (!k) return true
        const hay = [r.id, r.title, r.doctor, ...nursesOf(r.id).map((n) => n.fullName)].join(' ')
        return norm(hay).includes(k)
      })
      .map((r) => ({ r, s: roomStats(r) }))
  }, [rooms, q, spec, nursesOf])

  const count = (id: Triage | 'all') => (id === 'all' ? scoped.length : scoped.filter((x) => x.s.triage === id).length)
  const list = chip === 'all' ? scoped : scoped.filter((x) => x.s.triage === chip)
  const specCount = (s: Specialty) => rooms.filter((r) => r.specialty === s).length

  return (
    <section aria-label="Danh sách tổng quan phòng khám" className="flex min-h-0 flex-col rounded-2xl border border-line bg-white">
      <div className="space-y-3 border-b border-line p-4">
        <section className="shrink-0 rounded-2xl border border-line bg-white p-4 space-y-3">
        <h2 className="text-[12px] font-bold tracking-wider text-ink uppercase">Bộ lọc & Tìm kiếm</h2>
          <div className="flex items-center justify-between">
            <h2 className="text-[12px] font-bold tracking-wider text-ink uppercase">Danh sách tổng quan phòng khám</h2>
            <span className="tabular text-[12px] text-muted">{list.length} phòng</span>
          </div>
          <div className="flex gap-2">
            <label className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm phòng, bác sĩ..."
                className="h-10 w-full rounded-lg border border-line bg-white pr-3 pl-9 text-[13.5px] outline-none placeholder:text-slate-400 focus:border-brand focus:ring-3 focus:ring-brand/15"
              />
            </label>
            <label className="relative">
              <span className="sr-only">Chuyên khoa</span>
              <select
                value={spec}
                onChange={(e) => setSpec(e.target.value as Specialty | 'all')}
                className="h-10 appearance-none rounded-lg border border-line bg-white pr-9 pl-3 text-[13.5px] font-medium text-slate-700 outline-none focus:border-brand focus:ring-3 focus:ring-brand/15"
              >
                <option value="all">Chuyên khoa: Tất cả ({rooms.length})</option>
                <option value="Tim mạch">Tim mạch ({specCount('Tim mạch')})</option>
                <option value="Tổng quát">Tổng quát ({specCount('Tổng quát')})</option>
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-500" />
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CHIPS.map((c) => {
              const on = chip === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setChip(c.id)}
                  aria-pressed={on}
                  className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition-colors ${
                    on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {c.dot && <span className={`size-2 rounded-full ${c.dot}`} />}
                  {c.label} <span className={`tabular ${on ? 'text-white/70' : 'text-muted'}`}>({count(c.id)})</span>
                </button>
              )
            })}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.1fr)] gap-3 border-b border-line bg-slate-50/70 px-4 py-2 text-[11px] font-semibold tracking-wider text-muted uppercase">
        <span>Phòng khám</span>
        <span>Tải chờ</span>
        <span>Định mức ngày</span>
      </div>

      <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {list.map(({ r, s }) => {
          const sel = r.id === selectedId
          const b = BAND[s.band]
          const nurses = nursesOf(r.id)
          return (
            <li key={r.id}>
              <button
                onClick={() => onSelect(r.id)}
                aria-current={sel}
                className={`grid w-full grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  sel ? 'border-brand bg-brand-soft ring-1 ring-brand' : 'border-transparent hover:border-line hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0">
                  <RoomState room={r} />
                  <div className="mt-0.5 text-[13.5px] leading-snug font-bold text-ink">
                    P.{r.id} · {r.title}
                  </div>
                  <div className="mt-0.5 text-[12px] leading-snug text-muted">
                    {r.doctor} ·{' '}
                    {nurses.length ? (
                      `ĐD. ${nurses.map((n) => n.fullName).join(', ')}`
                    ) : (
                      <span className="font-medium text-red-600">Chưa có ĐD trực</span>
                    )}
                  </div>
                </div>

                <div className="min-w-0 space-y-1.5">
                  <span className={`tabular inline-flex rounded-md px-1.5 py-0.5 text-[12px] font-semibold ring-1 ring-inset ${b.soft} ${b.text} ${b.ring}`}>
                    Đang chờ: {s.waiting} / {r.maxWaiting}
                  </span>
                  <Bar pct={s.waitPct} cls={b.bar} />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className={`tabular text-[12.5px] font-semibold ${s.nearFull ? 'text-orange-700' : 'text-ink'}`}>
                    Đã nhận: {s.received} / {r.dailyQuota}
                    {s.nearFull && <span className="ml-1 font-bold">(Sắp đầy ca)</span>}
                  </div>
                  <Bar pct={s.quotaPct} cls={s.nearFull ? 'bg-orange-500' : 'bg-teal-500'} />
                  <div className="tabular text-[11.5px] text-muted">
                    Đã khám: {s.done} · Còn nhận: {s.remaining}
                  </div>
                </div>
              </button>
            </li>
          )
        })}
        {!list.length && <li className="px-4 py-10 text-center text-[13.5px] text-muted">Không tìm thấy phòng khám phù hợp</li>}
      </ul>
    </section>
  )
}
