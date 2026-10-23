import { useEffect, useState } from 'react'
import { MoreVertical, ArrowRightLeft, ArrowUpCircle, Check, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import type { Patient, QStatus } from '../data'

const PAGE_SIZE = 10
type Tab = Extract<QStatus, 'waiting' | 'skipped' | 'done'>
const TABS: { id: Tab; label: string }[] = [
  { id: 'waiting', label: 'Đang chờ' },
  { id: 'skipped', label: 'Qua lượt' },
  { id: 'done', label: 'Đã khám' },
]

type Props = {
  patients: Patient[]
  initialSelection?: string[]
  onPrioritize: (p: Patient) => void
  onMove: (ps: Patient[]) => void
}

function Level({ p }: { p: Patient }) {
  if (p.urgent)
    return <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap text-red-700 ring-1 ring-red-200 ring-inset">Khẩn · đã đôn</span>
  if (p.priority)
    return <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap text-amber-800 ring-1 ring-amber-200 ring-inset">Cao tuổi</span>
  return <span className="text-[12.5px] text-muted">Thường</span>
}

function Checkbox({ checked, mixed, onChange, label }: { checked: boolean; mixed?: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={mixed ? 'mixed' : checked}
      aria-label={label}
      onClick={onChange}
      className={`grid size-[18px] place-items-center rounded-[5px] border-2 transition-colors ${
        checked || mixed ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white hover:border-slate-400'
      }`}
    >
      {checked ? <Check size={12} strokeWidth={3.5} /> : mixed ? <span className="h-0.5 w-2 rounded bg-white" /> : null}
    </button>
  )
}

export default function InspectorQueue({ patients, initialSelection = [], onPrioritize, onMove }: Props) {
  const [tab, setTab] = useState<Tab>('waiting')
  const [page, setPage] = useState(1)
  const [view, setView] = useState({ tab: 'waiting' as Tab, page: 1 })
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState<string[]>(initialSelection)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Partial reload: only this table shows a loading state while the next page "arrives".
  useEffect(() => {
    if (tab === view.tab && page === view.page) return
    setLoading(true)
    const t = setTimeout(() => {
      setView({ tab, page })
      setLoading(false)
    }, 450)
    return () => clearTimeout(t)
  }, [tab, page, view])

  const counts = Object.fromEntries(TABS.map((t) => [t.id, patients.filter((p) => p.status === t.id).length])) as Record<Tab, number>
  const all = patients.filter((p) => p.status === view.tab)
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const cur = Math.min(view.page, pages)
  const rows = all.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)
  const from = all.length ? (cur - 1) * PAGE_SIZE + 1 : 0
  const to = from ? from + rows.length - 1 : 0
  const isWaiting = view.tab === 'waiting'

  // Drop selections that are no longer waiting here (moved, called, …).
  const waitingIds = new Set(patients.filter((p) => p.status === 'waiting').map((p) => p.id))
  const selected = picked.filter((id) => waitingIds.has(id))
  const pageIds = isWaiting ? rows.map((p) => p.id) : []
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))
  const someOnPage = pageIds.some((id) => selected.includes(id))

  useEffect(() => {
    if (page > pages) setPage(pages)
  }, [page, pages])

  const toggle = (id: string) => setPicked((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const togglePage = () =>
    setPicked((s) => (allOnPage ? s.filter((id) => !pageIds.includes(id)) : [...new Set([...s, ...pageIds])]))

  const waitFor = (p: Patient) => {
    if (!p.checkInAt) return null
    const m = Math.max(0, Math.round((now - p.checkInAt) / 60000))
    return m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60} ph` : `${m} phút`
  }

  const th = 'px-3 py-2 text-left text-[10.5px] font-semibold tracking-wider text-muted uppercase whitespace-nowrap'
  const go = (n: number) => setPage(Math.min(Math.max(1, n), pages))
  const pageBtn = 'grid size-8 place-items-center rounded-lg text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <section aria-label="Hàng đợi bệnh nhân" className="rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div role="tablist" className="flex rounded-lg bg-slate-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id)
                setPage(1)
              }}
              className={`h-8 rounded-md px-3 text-[13px] font-semibold whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label} <span className="tabular">({counts[t.id]})</span>
            </button>
          ))}
        </div>
        <button
          disabled={!selected.length}
          onClick={() => onMove(patients.filter((p) => selected.includes(p.id)))}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand px-3.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
        >
          <ArrowRightLeft size={15} />
          {selected.length ? `Chuyển ${selected.length} BN đã chọn sang phòng khác` : 'Chọn BN để chuyển phòng'}
        </button>
      </div>

      <div className="relative h-0.5 overflow-hidden bg-line">
        {loading && <div className="loading-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand" />}
      </div>

      <table className={`w-full table-fixed transition-opacity duration-150 ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
        <colgroup>
          <col className="w-9" />
          <col className="w-[54px]" />
          <col />
          <col className="w-[94px]" />
          <col className="w-[86px]" />
          <col className="w-[188px]" />
        </colgroup>
        <thead className="border-b border-line bg-slate-50/70">
          <tr>
            <th className="py-2 pl-3">
              {isWaiting && <Checkbox checked={allOnPage} mixed={!allOnPage && someOnPage} onChange={togglePage} label="Chọn tất cả trên trang" />}
            </th>
            <th className={th}>STT</th>
            <th className={th}>Họ tên &amp; mã BN</th>
            <th className={th}>Check-in (đã chờ)</th>
            <th className={th}>Mức ưu tiên</th>
            <th className={`${th} pr-4 text-right`}>Thao tác điều phối</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((p) => {
            const on = selected.includes(p.id)
            return (
              <tr key={p.id} className={`h-[50px] ${on ? 'bg-brand-soft/60' : p.urgent ? 'bg-red-50/40' : 'hover:bg-slate-50/70'}`}>
                <td className="py-1.5 pl-3">{isWaiting && <Checkbox checked={on} onChange={() => toggle(p.id)} label={`Chọn STT ${p.order}`} />}</td>
                <td className="tabular px-3 text-[14px] font-bold text-ink">{p.order}</td>
                <td className="min-w-0 px-3">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{p.name}</div>
                  <div className="tabular truncate text-[11.5px] text-muted">
                    {p.id}
                    {p.transferredFrom && <span className="text-brand"> · từ {p.transferredFrom}</span>}
                  </div>
                </td>
                <td className="tabular px-3 text-[13px] text-slate-700">
                  {p.checkIn ?? '—'}
                  {isWaiting && <div className="text-[11.5px] text-muted">{waitFor(p)}</div>}
                </td>
                <td className="px-3">
                  <Level p={p} />
                </td>
                <td className="px-3 pr-4">
                  {isWaiting ? (
                    <div className="relative group flex justify-end">
                      <button className="grid size-8 place-items-center rounded hover:bg-slate-100 text-slate-500 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                      
                      <div className="absolute right-0 top-[100%] mt-1 w-40 hidden group-focus-within:block bg-white border border-line rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                        <button
                          disabled={p.urgent}
                          onClick={() => onPrioritize(p)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-slate-50 text-ink disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-left"
                        >
                          {p.urgent ? <Check size={15} className="text-red-600" /> : <ArrowUpCircle size={15} className="text-red-600" />} 
                          {p.urgent ? 'Đã đôn' : 'Đôn ưu tiên'}
                        </button>
                        <button
                          onClick={() => onMove([p])}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-slate-50 text-ink transition-colors text-left"
                        >
                          <ArrowRightLeft size={15} className="text-slate-500" /> Đổi phòng
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="tabular text-right text-[12px] text-muted">{p.updatedAt ? `Lúc ${p.updatedAt}` : '—'}</div>
                  )}
                </td>
              </tr>
            )
          })}
          {!rows.length && (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-[13.5px] text-muted">
                Không có bệnh nhân trong mục này
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-line bg-slate-50/60 px-4 py-2.5">
        <div>
          <p className="text-[12.5px] text-slate-700">
            Hiển thị{' '}
            <b className="tabular">
              {from}–{to}
            </b>{' '}
            / <b className="tabular">{all.length}</b> bệnh nhân (Tối đa {PAGE_SIZE} BN/trang)
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} /> Chỉ tải lại bảng này – không làm mới toàn bộ bảng điều hành
          </p>
        </div>
        <nav aria-label="Phân trang" className="flex items-center gap-1">
          <button aria-label="Trang trước" disabled={page <= 1} onClick={() => go(page - 1)} className={`${pageBtn} text-slate-700 hover:bg-white`}>
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => go(n)}
              aria-current={n === page ? 'page' : undefined}
              className={`${pageBtn} tabular ${n === page ? 'bg-brand text-white shadow-sm' : 'text-slate-700 hover:bg-white'}`}
            >
              {n}
            </button>
          ))}
          <button aria-label="Trang sau" disabled={page >= pages} onClick={() => go(page + 1)} className={`${pageBtn} text-slate-700 hover:bg-white`}>
            <ChevronRight size={16} />
          </button>
        </nav>
      </div>
    </section>
  )
}
