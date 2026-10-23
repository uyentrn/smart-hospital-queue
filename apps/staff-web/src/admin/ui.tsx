import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, ChevronDown, FlaskConical, Inbox, KeyRound, LogOut, RefreshCw, TrendingDown, TrendingUp, UserRound } from 'lucide-react'
import { ROLE_LABEL, type User } from '../data'
import type { ClinicState } from './demo'

export function useOutside<T extends HTMLElement>(open: boolean, close: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', k)
    }
  }, [open, close])
  return ref
}

export const initials = (name: string) =>
  name
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')

function UserMenu({ user, onLogout, notify }: { user: User; onLogout: () => void; notify: (m: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useOutside<HTMLDivElement>(open, () => setOpen(false))
  const item = 'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13.5px] font-medium text-slate-700 hover:bg-slate-50'
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Tài khoản" className="flex items-center gap-2.5 rounded-lg py-1.5 pr-2 pl-1.5 hover:bg-slate-50">
        <span className="grid size-9 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white">{initials(user.fullName)}</span>
        <span className="text-left leading-tight">
          <span className="block text-[13.5px] font-semibold text-ink">{ROLE_LABEL[user.role]}</span>
          <span className="block text-[12px] text-muted">{user.fullName}</span>
        </span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="menu" className="animate-fade-in absolute right-0 z-40 mt-1.5 w-60 rounded-xl border border-line bg-white p-1.5 shadow-lg">
          <div className="px-3 py-2 text-[12px] text-muted">
            Đăng nhập: <b className="font-mono text-ink">{user.username}</b>
          </div>
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" className={item} onClick={() => (setOpen(false), notify('Hồ sơ cá nhân (mô phỏng)'))}>
            <UserRound size={15} /> Hồ sơ cá nhân
          </button>
          <button role="menuitem" className={item} onClick={() => (setOpen(false), notify('Đổi mật khẩu (mô phỏng)'))}>
            <KeyRound size={15} /> Đổi mật khẩu
          </button>
          <div className="my-1 h-px bg-line" />
          <button role="menuitem" className={`${item} text-red-600 hover:bg-red-50`} onClick={onLogout}>
            <LogOut size={15} /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}

export function AdminHeader({
  crumb,
  title,
  subtitle,
  user,
  onLogout,
  notify,
  actions,
}: {
  crumb: string
  title: string
  subtitle?: string
  user: User
  onLogout: () => void
  notify: (m: string) => void
  actions?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white">
      <div className="flex h-[72px] items-center gap-6 px-7">
        <div className="min-w-0">
          <div className="text-[12px] text-muted">{crumb}</div>
          <h1 className="text-[19px] leading-tight font-bold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="truncate text-[12.5px] text-muted">{subtitle}</p>}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {actions}
          {actions && <span className="h-8 w-px bg-line" />}
          <UserMenu user={user} onLogout={onLogout} notify={notify} />
        </div>
      </div>
    </header>
  )
}

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClass = 'p-5',
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClass?: string
}) {
  return (
    <section className={`rounded-xl border border-line bg-white ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[12.5px] text-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      <div className={bodyClass}>{children}</div>
    </section>
  )
}

export const ACCENT = {
  blue: { bar: 'bg-brand', icon: 'bg-brand-soft text-brand' },
  orange: { bar: 'bg-orange-500', icon: 'bg-orange-50 text-orange-600' },
  teal: { bar: 'bg-teal-500', icon: 'bg-teal-50 text-teal-700' },
  green: { bar: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-700' },
}

export function Delta({ now, prev, label }: { now: number; prev: number | null; label: string }) {
  if (prev === null || prev === 0) return null
  const pct = Math.round(((now - prev) / prev) * 100)
  const up = pct >= 0
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-slate-600" title={`Kỳ trước: ${prev}`}>
      {up ? <TrendingUp size={13} className="text-slate-500" /> : <TrendingDown size={13} className="text-slate-500" />}
      <b className="tabular font-semibold">
        {up ? '+' : ''}
        {pct}%
      </b>{' '}
      {label}
    </span>
  )
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
  extra,
  emphasize,
}: {
  label: string
  value: ReactNode
  sub: string
  icon: ReactNode
  accent: keyof typeof ACCENT
  extra?: ReactNode
  emphasize?: boolean
}) {
  const a = ACCENT[accent]
  return (
    <div className="relative flex min-h-[124px] flex-col overflow-hidden rounded-xl border border-line bg-white px-4 pt-4 pb-3.5">
      <span className={`absolute inset-y-0 left-0 w-[3px] ${a.bar}`} />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold text-slate-600">{label}</span>
        <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${a.icon}`}>{icon}</span>
      </div>
      <div className={`tabular mt-1 text-[30px] leading-none font-bold tracking-tight ${emphasize ? 'text-orange-600' : 'text-ink'}`}>{value}</div>
      <div className="mt-auto pt-2 text-[12px] text-muted">{sub}</div>
      {extra && <div className="mt-1">{extra}</div>}
    </div>
  )
}

const STATE_BADGE: Record<ClinicState, { label: string; cls: string; dot: string }> = {
  ok: { label: 'Hoạt động bình thường', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  watch: { label: 'Cần theo dõi', cls: 'bg-orange-50 text-orange-700 ring-orange-500/25', dot: 'bg-orange-500' },
  over: { label: 'Quá ngưỡng', cls: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
  paused: { label: 'Tạm dừng', cls: 'bg-slate-100 text-slate-600 ring-slate-400/25', dot: 'bg-slate-400' },
}

export function ClinicBadge({ state }: { state: ClinicState }) {
  const b = STATE_BADGE[state]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap ring-1 ring-inset ${b.cls}`}>
      <span className={`size-1.5 rounded-full ${b.dot}`} /> {b.label}
    </span>
  )
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
}: {
  value: T
  options: { id: T; label: string }[]
  onChange: (v: T) => void
  label: string
  className?: string
}) {
  return (
    <label className={`relative inline-flex ${className}`}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        title={label}
        className="h-9 w-full appearance-none truncate rounded-lg border border-line bg-white pr-8 pl-3 text-[13px] font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-brand focus:ring-3 focus:ring-brand/15"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-500" />
    </label>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { id: T; label: string; disabled?: boolean; hint?: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" className="inline-flex rounded-lg bg-slate-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          disabled={o.disabled}
          title={o.hint}
          onClick={() => onChange(o.id)}
          className={`h-7 rounded-md px-3 text-[12.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            value === o.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export type ViewState = 'ready' | 'loading' | 'empty' | 'error' | 'stale'

export function DemoBar({ view, onView }: { view: ViewState; onView: (v: ViewState) => void }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset">
        <FlaskConical size={13} /> Dữ liệu minh họa · Không phải số liệu thực
      </span>
      <Select
        label="Trạng thái hiển thị (demo)"
        value={view}
        onChange={onView}
        options={[
          { id: 'ready', label: 'Demo: Bình thường' },
          { id: 'loading', label: 'Demo: Đang tải' },
          { id: 'empty', label: 'Demo: Không có dữ liệu' },
          { id: 'error', label: 'Demo: Lỗi tải dữ liệu' },
          { id: 'stale', label: 'Demo: Dữ liệu cũ' },
        ]}
      />
    </div>
  )
}

export function RefreshButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
    >
      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Làm mới
    </button>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className}`} />
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2.5" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" />
      ))}
    </div>
  )
}

export function EmptyState({ title, text, icon }: { title: string; text?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500">{icon ?? <Inbox size={19} />}</span>
      <div className="mt-2.5 text-[14px] font-semibold text-ink">{title}</div>
      {text && <p className="mt-1 max-w-sm text-[12.5px] text-muted">{text}</p>}
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <span className="grid size-10 place-items-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle size={19} />
      </span>
      <div className="mt-2.5 text-[14px] font-semibold text-ink">Không tải được dữ liệu</div>
      <p className="mt-1 text-[12.5px] text-muted">Kết nối tới máy chủ báo cáo bị gián đoạn. Dữ liệu chưa được cập nhật.</p>
      <button onClick={onRetry} className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-3 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50">
        <RefreshCw size={13} /> Thử lại
      </button>
    </div>
  )
}

/** Renders loading / empty / error for a panel body, otherwise the children. */
export function StateGate({ view, onRetry, children, emptyTitle = 'Không có dữ liệu trong phạm vi đã chọn', rows }: { view: ViewState; onRetry: () => void; children: ReactNode; emptyTitle?: string; rows?: number }) {
  if (view === 'loading') return <LoadingRows rows={rows} />
  if (view === 'error') return <ErrorState onRetry={onRetry} />
  if (view === 'empty') return <EmptyState title={emptyTitle} text="Thử thay đổi khoảng thời gian hoặc bộ lọc." />
  return <>{children}</>
}

const niceMax = (v: number) => {
  if (v <= 5) return 5
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const m = [1, 2, 2.5, 5, 10].find((x) => x * p >= v)!
  return m * p
}

export type BarDatum = { label: string; value: number | null; tip: string; muted?: boolean }

export function BarChart({ data, height = 200, yLabel, xLabel, color = 'bg-brand' }: { data: BarDatum[]; height?: number; yLabel: string; xLabel: string; color?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = niceMax(Math.max(1, ...data.map((d) => d.value ?? 0)))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(max * t))
  const dense = data.length > 14
  return (
    <div className="flex gap-2">
      <div className="flex w-9 shrink-0 flex-col items-end">
        <div className="relative w-full" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="tabular absolute right-0 -translate-y-1/2 text-[11px] text-slate-400" style={{ top: `${100 - (t / max) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
        <span className="mt-6 -mr-1 text-[10.5px] whitespace-nowrap text-slate-400">{yLabel}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative border-b border-slate-300" style={{ height }}>
          {ticks.slice(1).map((t) => (
            <div key={t} className="absolute inset-x-0 border-t border-dashed border-slate-200" style={{ top: `${100 - (t / max) * 100}%` }} />
          ))}
          <div className={`absolute inset-0 flex items-end ${dense ? 'gap-[3px]' : 'gap-2.5'} px-1`}>
            {data.map((d, i) => {
              const h = d.value === null ? 0 : (d.value / max) * 100
              return (
                <div
                  key={i}
                  className="relative flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  tabIndex={0}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  aria-label={d.tip}
                >
                  {d.value === null ? (
                    <div className="h-full w-full max-w-11 rounded-t border border-dashed border-slate-200 bg-slate-50/50" />
                  ) : (
                    <div
                      className={`w-full max-w-11 rounded-t transition-opacity ${d.muted ? 'bg-brand/45' : color} ${hover !== null && hover !== i ? 'opacity-55' : ''}`}
                      style={{ height: `${Math.max(h, d.value ? 1.5 : 0)}%` }}
                    />
                  )}
                  {hover === i && (
                    <div className="pointer-events-none absolute bottom-full z-10 mb-1.5 rounded-md bg-ink px-2.5 py-1.5 text-[12px] font-medium whitespace-nowrap text-white shadow-lg" style={{ bottom: `${Math.min(h, 88)}%` }}>
                      {d.tip}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <div className={`mt-1.5 flex ${dense ? 'gap-[3px]' : 'gap-2.5'} px-1`}>
          {data.map((d, i) => (
            <span key={i} className={`tabular flex-1 text-center text-[11px] text-slate-500 ${dense && i % 3 ? 'invisible' : ''}`}>
              {d.label}
            </span>
          ))}
        </div>
        <div className="mt-1 text-center text-[10.5px] text-slate-400">{xLabel}</div>
      </div>
    </div>
  )
}
