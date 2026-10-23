import { useEffect, type ReactNode } from 'react'
import { Activity, CheckCircle2, X } from 'lucide-react'

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="grid place-items-center rounded-xl bg-brand text-white" style={{ width: size, height: size }}>
      <Activity size={size * 0.55} strokeWidth={2.4} />
    </div>
  )
}

export function Modal({
  title,
  subtitle,
  icon,
  tone = 'brand',
  width = 520,
  onClose,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  tone?: 'brand' | 'red'
  width?: number
  onClose: () => void
  children: ReactNode
  footer: ReactNode
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="animate-fade-in fixed inset-0 z-[60] grid place-items-center bg-slate-900/40 p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="w-full rounded-2xl bg-white shadow-2xl"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-line px-6 py-4">
          {icon && (
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-brand-soft text-brand'}`}
            >
              {icon}
            </span>
          )}
          <div className="flex-1 pt-0.5">
            <h2 className="text-[17px] font-bold text-ink">{title}</h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        <div className="flex justify-end gap-2 rounded-b-2xl border-t border-line bg-slate-50/60 px-6 py-4">{footer}</div>
      </div>
    </div>
  )
}

export function Toast({ message, position = 'bottom' }: { message: string | null; position?: 'top' | 'bottom' }) {
  if (!message) return null
  return (
    <div
      className={`animate-fade-in fixed ${position === 'top' ? 'top-20' : 'bottom-6'} left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-[14px] font-medium text-white shadow-xl`}
    >
      <CheckCircle2 size={18} className="text-emerald-400" />
      {message}
    </div>
  )
}

export const btn = {
  base: 'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-[14px] font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed',
  primary: 'bg-brand text-white shadow-sm hover:bg-brand-dark disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none',
  danger: 'bg-red-600 text-white shadow-sm shadow-red-600/25 hover:bg-red-700 disabled:opacity-40',
  secondary: 'border border-line bg-white text-slate-700 shadow-sm hover:bg-slate-50',
  ghost: 'text-slate-700 hover:bg-slate-100',
}

export const field =
  'mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-[14px] text-ink outline-none placeholder:text-slate-400 focus:border-brand focus:ring-3 focus:ring-brand/15'
export const fieldLabel = 'text-[13px] font-semibold text-slate-700'
