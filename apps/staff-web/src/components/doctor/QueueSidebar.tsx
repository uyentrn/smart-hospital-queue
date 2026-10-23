import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { orderStatus, type Patient, type QStatus } from '../../data'
import { PriorityBadge } from '../ActiveStage'

const PAGE_SIZE = 10
type Tab = Extract<QStatus, 'waiting' | 'lab' | 'done'>

type Props = {
  patients: Patient[]
  shownId?: string
  now: number
  onView: (p: Patient) => void
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export const labReady = (p: Patient, now: number) => !!p.orders?.length && p.orders.every((o) => orderStatus(o, now) === 'COMPLETED')

export default function QueueSidebar({ patients, shownId, now, onView }: Props) {
  const [tab, setTab] = useState<Tab>('waiting')
  const [page, setPage] = useState(1)
  const [view, setView] = useState({ tab: 'waiting' as Tab, page: 1 })
  const [loading, setLoading] = useState(false)

  // Scoped refresh: only the list below reloads when switching tab/page.
  useEffect(() => {
    if (tab === view.tab && page === view.page) return
    setLoading(true)
    const t = setTimeout(() => {
      setView({ tab, page })
      setLoading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [tab, page, view])

  const by = (s: QStatus) => patients.filter((p) => p.status === s)
  const serving = [...by('inroom'), ...by('called')]
  const all = by(view.tab)
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const cur = Math.min(view.page, pages)
  const rows = all.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)
  const anyReady = by('lab').some((p) => labReady(p, now))

  useEffect(() => {
    if (page > pages) setPage(pages)
  }, [page, pages])

  const tabs: { id: Tab; label: string; dot?: boolean }[] = [
    { id: 'waiting', label: 'Chờ khám' },
    { id: 'lab', label: 'Chờ KQ CLS', dot: anyReady },
    { id: 'done', label: 'Đã khám' },
  ]
  const listTitle = { waiting: 'Danh sách chờ tiếp theo', lab: 'Bệnh nhân chờ kết quả CLS', done: 'Đã khám hôm nay' }[view.tab]

  const meta = (p: Patient) => {
    if (view.tab === 'waiting') {
      const m = p.checkInAt ? Math.max(0, Math.round((now - p.checkInAt) / 60000)) : 0
      return <span className={`tabular text-[11.5px] font-medium ${m >= 45 ? 'text-amber-700' : 'text-muted'}`}>Chờ {m}p</span>
    }
    if (view.tab === 'lab')
      return labReady(p, now) ? (
        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Đã có KQ
        </span>
      ) : (
        <span className="text-[11.5px] font-medium text-violet-700">Đang chờ KQ</span>
      )
    return <span className="tabular text-[11.5px] text-muted">Xong {p.updatedAt}</span>
  }

  return (
    <aside aria-label="Hàng đợi phòng khám" className="flex min-h-0 flex-col border-r border-line bg-white">
      <div role="tablist" className="grid shrink-0 grid-cols-3 gap-1 border-b border-line p-2">
        {tabs.map((t) => {
          const on = tab === t.id
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => {
                setTab(t.id)
                setPage(1)
              }}
              className={`relative h-9 rounded-lg px-1 text-[12.5px] font-semibold whitespace-nowrap transition-colors ${
                on ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label} <span className="tabular">({by(t.id).length})</span>
              {t.dot && <span className="pulse-dot absolute top-1 right-1 size-2 rounded-full bg-emerald-500 ring-2 ring-white" title="Có kết quả mới" />}
            </button>
          )
        })}
      </div>

      <div className="shrink-0 border-b border-line p-3">
        <div className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">Đang phục vụ tại phòng</div>
        <div className="space-y-2">
          {serving.map((p) => {
            const inroom = p.status === 'inroom'
            const on = p.id === shownId
            return (
              <button
                key={p.id}
                onClick={() => onView(p)}
                className={`w-full rounded-xl border-2 px-3 py-2.5 text-left transition-shadow ${
                  inroom ? 'border-emerald-500 bg-emerald-50/70' : 'border-orange-400 bg-orange-50/70'
                } ${on ? 'shadow-md ring-2 ring-offset-1 ' + (inroom ? 'ring-emerald-500/40' : 'ring-orange-400/40') : 'hover:shadow-sm'}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`tabular text-[17px] font-bold ${inroom ? 'text-emerald-700' : 'text-orange-700'}`}>{p.order}</span>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">{p.name}</span>
                  <PriorityBadge p={p} />
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="tabular text-[12px] text-muted">
                    {p.id} · {p.birthYear}
                  </span>
                  {inroom ? (
                    <span className="tabular inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
                      <span className="pulse-dot size-2 rounded-full bg-emerald-500" /> Đang khám · {p.startedAt ? mmss(now - p.startedAt) : '00:00'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-orange-700">
                      <span className="size-2 rounded-full bg-orange-500" /> Đã gọi vào phòng
                    </span>
                  )}
                </div>
              </button>
            )
          })}
          {!serving.length && (
            <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-[12.5px] text-muted">Chưa có bệnh nhân trong phòng</div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between px-3 pt-3 pb-1.5">
        <span className="text-[11px] font-bold tracking-wider text-muted uppercase">{listTitle}</span>
        <span className="text-[10.5px] text-slate-400">Chỉ xem</span>
      </div>
      <div className="relative mx-3 h-0.5 shrink-0 overflow-hidden rounded bg-line">
        {loading && <div className="loading-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand" />}
      </div>

      <ul className={`min-h-0 flex-1 divide-y divide-line overflow-y-auto px-1.5 py-1 transition-opacity ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
        {rows.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => onView(p)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left ${p.id === shownId ? 'bg-brand-soft' : 'hover:bg-slate-50'}`}
            >
              <span className="tabular w-10 shrink-0 text-[13.5px] font-bold text-ink">{p.order}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-semibold text-ink">{p.name}</span>
                  {(p.priority || p.urgent) && <span className="shrink-0 rounded bg-red-50 px-1 text-[10px] font-bold text-red-700">ƯT</span>}
                </span>
                <span className="tabular block truncate text-[11.5px] text-muted">
                  {p.id} · {p.birthYear}
                </span>
              </span>
              {meta(p)}
            </button>
          </li>
        ))}
        {!rows.length && <li className="px-3 py-8 text-center text-[12.5px] text-muted">Không có bệnh nhân</li>}
      </ul>

      <div className="flex shrink-0 items-center justify-between border-t border-line bg-slate-50/70 px-3 py-2">
        <span className="tabular text-[11.5px] text-muted">
          Trang {cur}/{pages} (Tối đa {PAGE_SIZE} BN/trang)
        </span>
        <nav aria-label="Phân trang" className="flex items-center gap-0.5">
          <button aria-label="Trang trước" disabled={page <= 1} onClick={() => setPage(page - 1)} className="grid size-7 place-items-center rounded-md text-slate-600 hover:bg-white disabled:opacity-35">
            <ChevronLeft size={15} />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`tabular grid size-7 place-items-center rounded-md text-[12px] font-semibold ${n === page ? 'bg-brand text-white' : 'text-slate-600 hover:bg-white'}`}
            >
              {n}
            </button>
          ))}
          <button aria-label="Trang sau" disabled={page >= pages} onClick={() => setPage(page + 1)} className="grid size-7 place-items-center rounded-md text-slate-600 hover:bg-white disabled:opacity-35">
            <ChevronRight size={15} />
          </button>
        </nav>
      </div>
    </aside>
  )
}
