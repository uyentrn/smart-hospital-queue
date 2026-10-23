import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MoreVertical, RotateCcw, XCircle, Zap } from 'lucide-react'
import type { Patient, QStatus } from '../data'
import { StatusBadge } from './QueueGrid'

const PAGE_SIZE = 10
type Tab = Extract<QStatus, 'waiting' | 'skipped' | 'done'>

const TABS: { id: Tab; label: string; noun: string }[] = [
  { id: 'waiting', label: 'Đang chờ', noun: 'bệnh nhân đang chờ' },
  { id: 'skipped', label: 'Qua lượt', noun: 'bệnh nhân qua lượt' },
  { id: 'done', label: 'Đã hoàn tất', noun: 'bệnh nhân đã hoàn tất' },
]

type Props = {
  patients: Patient[]
  canCall: boolean
  onExceptionCall: (p: Patient) => void
  onCancel: (p: Patient) => void
  onRequeue: (p: Patient) => void
}

function PriorityType({ p }: { p: Patient }) {
  if (p.urgent)
    return <span className="rounded-md bg-red-50 px-2 py-0.5 text-[12px] font-semibold text-red-700 ring-1 ring-red-200 ring-inset">Ưu tiên khẩn</span>
  if (p.priority)
    return <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[12px] font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset">Người cao tuổi</span>
  return <span className="text-[13px] text-muted">Thường</span>
}

function RowMenu({
  p,
  tab,
  up,
  canCall,
  ...a
}: { p: Patient; tab: Tab; up: boolean; canCall: boolean } & Omit<Props, 'patients' | 'canCall'>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (tab === 'done') return <span className="block size-9" />
  const item = 'flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-[13.5px] font-medium disabled:cursor-not-allowed disabled:opacity-40'
  const run = (fn: (p: Patient) => void) => () => {
    setOpen(false)
    fn(p)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Thao tác ngoại lệ cho STT ${p.order}`}
        aria-expanded={open}
        className={`grid size-9 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 ${open ? 'bg-slate-100 text-slate-700' : ''}`}
      >
        <MoreVertical size={17} />
      </button>
      {open && (
        <div
          role="menu"
          className={`animate-fade-in absolute right-0 z-30 w-[230px] rounded-xl border border-line bg-white p-1.5 shadow-xl ${up ? 'bottom-full mb-1' : 'top-full mt-1'}`}
        >
          <div className="px-3 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-muted uppercase">Thao tác ngoại lệ</div>
          {tab === 'waiting' ? (
            <button role="menuitem" disabled={!canCall} onClick={run(a.onExceptionCall)} className={`${item} text-slate-700 hover:bg-slate-50`}>
              <Zap size={16} className="text-orange-600" /> Gọi ưu tiên ngoại lệ
            </button>
          ) : (
            <button role="menuitem" onClick={run(a.onRequeue)} className={`${item} text-slate-700 hover:bg-slate-50`}>
              <RotateCcw size={16} className="text-brand" /> Đưa lại vào hàng chờ
            </button>
          )}
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" onClick={run(a.onCancel)} className={`${item} text-red-600 hover:bg-red-50`}>
            <XCircle size={16} /> Hủy lượt
          </button>
        </div>
      )}
    </div>
  )
}

export default function WaitingTable({ patients, canCall, ...actions }: Props) {
  const [tab, setTab] = useState<Tab>('waiting')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  // The table refreshes on its own: the target view is applied after a short fetch delay.
  const [view, setView] = useState<{ tab: Tab; page: number }>({ tab: 'waiting', page: 1 })

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
  const to = (cur - 1) * PAGE_SIZE + rows.length
  const firstWaitingId = patients.find((p) => p.status === 'waiting')?.id

  useEffect(() => {
    if (page > pages) setPage(pages)
  }, [page, pages])

  const go = (n: number) => setPage(Math.min(Math.max(1, n), pages))
  const pageBtn = 'grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'
  const th = 'px-4 py-2.5 text-left text-[11.5px] font-semibold tracking-wider text-muted uppercase'

  return (
    <section aria-label="Danh sách hàng đợi" className="rounded-2xl border border-line bg-white">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <h2 className="text-[16px] font-bold text-ink">Danh sách hàng đợi</h2>
        <div role="tablist" className="flex rounded-xl bg-slate-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id)
                setPage(1)
              }}
              className={`h-9 rounded-lg px-4 text-[13.5px] font-semibold transition-all ${
                tab === t.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`}
            >
              {t.label} <span className="tabular">({counts[t.id]})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-0.5 overflow-hidden bg-line">
        {loading && <div className="loading-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand" />}
      </div>

      <table className={`w-full transition-opacity duration-150 ${loading ? 'opacity-50' : ''}`} aria-busy={loading}>
        <thead className="border-b border-line bg-slate-50/70">
          <tr>
            <th className={`${th} w-[110px] pl-6`}>STT</th>
            <th className={th}>Họ tên bệnh nhân</th>
            <th className={th}>Mã BN &amp; năm sinh</th>
            <th className={th}>Loại ưu tiên</th>
            <th className={th}>Giờ check-in</th>
            <th className={th}>Trạng thái</th>
            <th className={`${th} w-[64px] pr-5`}>
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((p, i) => (
            <tr key={p.id} className="h-[52px] hover:bg-slate-50/70">
              <td className="px-4 pl-6">
                <div className="flex items-center gap-2">
                  <span className="tabular text-[15px] font-bold text-ink">{p.order}</span>
                  {p.id === firstWaitingId && (
                    <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10.5px] font-bold text-brand uppercase">Kế tiếp</span>
                  )}
                </div>
              </td>
              <td className="px-4 text-[14px] font-semibold text-ink">{p.name}</td>
              <td className="tabular px-4 text-[13.5px] text-slate-600">
                {p.id} · {p.birthYear}
              </td>
              <td className="px-4">
                <PriorityType p={p} />
              </td>
              <td className="tabular px-4 text-[13.5px] text-slate-600">{p.checkIn ?? '—'}</td>
              <td className="px-4">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-4 pr-5 text-right">
                <RowMenu p={p} tab={view.tab} up={i >= 6} canCall={canCall} {...actions} />
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={7} className="px-6 py-14 text-center text-[14px] text-muted">
                Không có bệnh nhân trong mục này
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between gap-4 rounded-b-2xl border-t border-line bg-slate-50/60 px-6 py-3">
        <p className="text-[13px] text-muted">
          Hiển thị{' '}
          <b className="tabular text-ink">
            {from}–{to}
          </b>{' '}
          trong tổng số <b className="tabular text-ink">{all.length}</b> {TABS.find((t) => t.id === view.tab)!.noun} (Tối đa{' '}
          {PAGE_SIZE} BN/trang)
        </p>
        <nav aria-label="Phân trang" className="flex items-center gap-1">
          <button disabled={page <= 1} onClick={() => go(page - 1)} className={`${pageBtn} gap-1 text-slate-700 hover:bg-white`}>
            <span className="flex items-center gap-1">
              <ChevronLeft size={16} /> Trước
            </span>
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
          <button disabled={page >= pages} onClick={() => go(page + 1)} className={`${pageBtn} text-slate-700 hover:bg-white`}>
            <span className="flex items-center gap-1">
              Sau <ChevronRight size={16} />
            </span>
          </button>
        </nav>
      </div>
    </section>
  )
}
