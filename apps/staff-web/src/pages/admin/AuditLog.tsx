import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, ScrollText, Search } from 'lucide-react'
import { AUDIT_ACTIONS, type AuditAction, type AuditEntry } from '../../admin/store'
import { AdminHeader, DemoBar, EmptyState, Panel, Select, StateGate, type ViewState } from '../../admin/ui'
import type { AdminPageProps } from '../../admin/store'
import { Modal, btn } from '../../components/ui'

type Range = '1d' | '7d' | '30d' | 'all'
const PAGE = 12

const fmt = (ts: number) => {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export default function AuditLog({ user, store, notify, onLogout }: AdminPageProps) {
  const [q, setQ] = useState('')
  const [range, setRange] = useState<Range>('7d')
  const [action, setAction] = useState<AuditAction | 'all'>('all')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<AuditEntry | null>(null)
  const [view, setView] = useState<ViewState>('ready')

  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    const since = range === 'all' ? 0 : Date.now() - { '1d': 1, '7d': 7, '30d': 30 }[range] * 86_400_000
    return store.audit.filter(
      (e) => e.ts >= since && (action === 'all' || e.action === action) && (!k || [e.actor, e.entity, e.details, e.entityType, e.id].some((v) => v.toLowerCase().includes(k))),
    )
  }, [store.audit, q, range, action])

  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const cur = Math.min(page, pages)
  const rows = list.slice((cur - 1) * PAGE, cur * PAGE)
  const th = 'px-3 py-2 text-left text-[10.5px] font-semibold tracking-wide text-muted uppercase'
  const show = view === 'ready' || view === 'stale'

  return (
    <div className="min-w-0 flex-1">
      <AdminHeader crumb="Quản trị / Nhật ký hệ thống" title="Nhật ký hệ thống" subtitle="Lịch sử thao tác quản trị và điều phối · chỉ ghi thêm, không thể sửa hoặc xóa" user={user} onLogout={onLogout} notify={notify} />
      <div className="space-y-4 px-7 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DemoBar view={view} onView={setView} />
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-9 w-72 items-center gap-2 rounded-lg border border-line bg-white px-3 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
              <Search size={15} className="text-slate-400" />
              <input
                value={q}
                onChange={(e) => (setQ(e.target.value), setPage(1))}
                placeholder="Tìm người thực hiện, đối tượng, mã sự kiện…"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400"
              />
            </label>
            <Select<Range>
              label="Khoảng thời gian"
              value={range}
              onChange={(v) => (setRange(v), setPage(1))}
              options={[
                { id: '1d', label: '24 giờ qua' },
                { id: '7d', label: '7 ngày qua' },
                { id: '30d', label: '30 ngày qua' },
                { id: 'all', label: 'Toàn bộ' },
              ]}
            />
            <Select<AuditAction | 'all'>
              label="Loại hành động"
              value={action}
              onChange={(v) => (setAction(v), setPage(1))}
              options={[{ id: 'all', label: 'Tất cả hành động' }, ...(Object.keys(AUDIT_ACTIONS) as AuditAction[]).map((a) => ({ id: a, label: AUDIT_ACTIONS[a].label }))]}
            />
          </div>
        </div>

        <Panel
          title="Sự kiện"
          subtitle={`${list.length} sự kiện phù hợp`}
          bodyClass=""
          actions={
            <span className="inline-flex items-center gap-1 text-[12px] text-muted">
              <Lock size={12} /> Nhật ký được bảo toàn
            </span>
          }
        >
          {show ? (
            rows.length ? (
              <table className="w-full table-fixed text-[12.5px]">
                <colgroup>
                  <col className="w-[140px]" />
                  <col className="w-[200px]" />
                  <col className="w-[150px]" />
                  <col className="w-[230px]" />
                  <col />
                </colgroup>
                <thead className="border-b border-line bg-slate-50/70">
                  <tr>
                    <th className={`${th} pl-5`}>Thời gian</th>
                    <th className={th}>Người thực hiện</th>
                    <th className={th}>Hành động</th>
                    <th className={th}>Đối tượng</th>
                    <th className={`${th} pr-5`}>Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((e) => (
                    <tr key={e.id} onClick={() => setOpen(e)} className="cursor-pointer hover:bg-slate-50">
                      <td className="tabular py-2 pr-3 pl-5 text-slate-600">{fmt(e.ts)}</td>
                      <td className="px-3">
                        <div className="truncate font-semibold text-ink">{e.actor}</div>
                        <div className="truncate text-[11.5px] text-muted">{e.actorRole}</div>
                      </td>
                      <td className="px-3">
                        <span className={`rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap ${AUDIT_ACTIONS[e.action].cls}`}>{AUDIT_ACTIONS[e.action].label}</span>
                      </td>
                      <td className="px-3">
                        <div className="truncate font-medium text-slate-700">{e.entity}</div>
                        <div className="truncate text-[11.5px] text-muted">{e.entityType}</div>
                      </td>
                      <td className="truncate px-3 pr-5 text-slate-600">
                        {e.details}
                        {e.changes?.length ? <span className="text-muted"> · {e.changes.length} trường</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="Không có sự kiện phù hợp" text="Thử mở rộng khoảng thời gian hoặc xóa bộ lọc." icon={<ScrollText size={18} />} />
            )
          ) : (
            <div className="p-5">
              <StateGate view={view} onRetry={() => setView('ready')} rows={8}>
                {null}
              </StateGate>
            </div>
          )}
          {show && list.length > 0 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-2.5 text-[12px] text-muted">
              <span>
                Hiển thị {(cur - 1) * PAGE + 1}–{(cur - 1) * PAGE + rows.length} / {list.length}
              </span>
              <div className="flex items-center gap-1">
                <button aria-label="Trang trước" title="Trang trước" disabled={cur <= 1} onClick={() => setPage(cur - 1)} className="grid size-8 place-items-center rounded-md hover:bg-slate-100 disabled:opacity-35">
                  <ChevronLeft size={15} />
                </button>
                <span className="tabular px-1 font-semibold text-slate-700">
                  {cur} / {pages}
                </span>
                <button aria-label="Trang sau" title="Trang sau" disabled={cur >= pages} onClick={() => setPage(cur + 1)} className="grid size-8 place-items-center rounded-md hover:bg-slate-100 disabled:opacity-35">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </Panel>
      </div>

      {open && (
        <Modal
          title="Chi tiết sự kiện"
          subtitle={`${open.id} · ${fmt(open.ts)}`}
          icon={<ScrollText size={18} />}
          width={560}
          onClose={() => setOpen(null)}
          footer={
            <button className={`${btn.base} ${btn.primary}`} onClick={() => setOpen(null)}>
              Đóng
            </button>
          }
        >
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-[13px]">
            {[
              ['Người thực hiện', `${open.actor} · ${open.actorRole}`],
              ['Hành động', AUDIT_ACTIONS[open.action].label],
              ['Loại đối tượng', open.entityType],
              ['Đối tượng', open.entity],
              ['Địa chỉ IP', open.ip],
              ['Mã sự kiện', open.id],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11.5px] text-muted">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <div className="text-[11.5px] text-muted">Mô tả</div>
            <p className="text-[13px] text-slate-700">{open.details}</p>
          </div>
          {open.changes?.length ? (
            <table className="mt-3 w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-line text-left text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                  <th className="py-1.5">Trường</th>
                  <th className="py-1.5">Trước</th>
                  <th className="py-1.5">Sau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {open.changes.map((c) => (
                  <tr key={c.field}>
                    <td className="py-1.5 pr-2 text-slate-700">{c.field}</td>
                    <td className="py-1.5 pr-2 text-slate-500">{c.before}</td>
                    <td className="py-1.5 font-semibold text-ink">{c.after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </Modal>
      )}
    </div>
  )
}
