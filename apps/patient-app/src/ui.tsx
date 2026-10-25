import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react'
import { BellRing, CircleCheck, Clock3, PauseCircle, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import type { QueueStatus, Theme } from './data'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

/* ------------------------------------------------------------------ Logo */

export function HospitalMark({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="18" fill="#063f42" />
      <path
        d="M26 14h12v12h12v12H38v12H26V38H14V26h12z"
        fill="#eaf5f4"
        stroke="#eaf5f4"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M18 32h8l3-6 6 12 3-6h8" fill="none" stroke="#0b5d61" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------------------------------------------------------------- Avatar */

export function Avatar({
  name,
  photo,
  theme,
  size = 48,
  className,
}: {
  name: string
  photo?: string
  /** Pastel profile tone; falls back to the brand tint. */
  theme?: Theme
  size?: number
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const words = name.replace(/^BS\.\s*/, '').split(' ').filter(Boolean)
  const last = words[words.length - 1] ?? ''
  // "Nguyễn Văn A" reads best as "A"; full names use two initials.
  const initials = (last.length === 1 ? last : words.slice(-2).map((w) => w[0]).join('')).toUpperCase()
  const style = { width: size, height: size, fontSize: Math.max(16, size * (initials.length === 1 ? 0.44 : 0.36)) }
  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt=""
        onError={() => setFailed(true)}
        style={style}
        className={cx('shrink-0 rounded-full object-cover', className)}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      style={theme ? { ...style, background: theme.c200, color: theme.ink } : style}
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-extrabold',
        !theme && 'bg-brand-100 text-brand-900',
        className,
      )}
    >
      {initials}
    </span>
  )
}

/* ---------------------------------------------------------- Status pill */

export const STATUS_META: Record<
  QueueStatus,
  { label: string; cls: string; Icon: typeof Clock3 }
> = {
  called: { label: 'Đến lượt bạn', cls: 'bg-ok-bg text-ok-ink', Icon: BellRing },
  soon: { label: 'Sắp tới lượt', cls: 'bg-warn-bg text-warn', Icon: Clock3 },
  waiting: { label: 'Đang chờ', cls: 'bg-brand-50 text-brand-800', Icon: Clock3 },
  paused: { label: 'Tạm dừng', cls: 'bg-warn-bg text-warn', Icon: PauseCircle },
  missed: { label: 'Lỡ lượt', cls: 'bg-bad-bg text-bad', Icon: TriangleAlert },
  cancelled: { label: 'Đã hủy', cls: 'bg-bad-bg text-bad', Icon: X },
}

export function StatusPill({ status, className }: { status: QueueStatus; className?: string }) {
  const m = STATUS_META[status]
  return (
    <span
      className={cx(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 border-current/40 px-3 text-base font-semibold',
        m.cls,
        className,
      )}
    >
      <m.Icon size={18} strokeWidth={2.4} aria-hidden="true" />
      {m.label}
    </span>
  )
}

/* ------------------------------------------------------------ Buttons */

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ref?: Ref<HTMLButtonElement>
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'lg', className, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cx(
        'inline-flex w-full items-center justify-center gap-2.5 rounded-2xl px-5 font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-100',
        size === 'lg' ? 'min-h-14 text-lg' : 'min-h-12 text-base',
        variant === 'primary' &&
          'bg-brand-700 text-white shadow-[0_6px_16px_-6px_rgba(6,63,66,0.6)] hover:bg-brand-800 disabled:bg-[#5f6b70] disabled:shadow-none',
        variant === 'secondary' &&
          'border-2 border-brand-700 bg-white text-brand-800 hover:bg-brand-50 disabled:border-line disabled:text-ink-2',
        variant === 'ghost' && 'text-brand-800 hover:bg-brand-50',
        variant === 'danger' && 'bg-bad text-white hover:bg-[#7f1616]',
        className,
      )}
    />
  )
}

/* --------------------------------------------------------- Bottom sheet */

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  // Runs only on open/close so inline onClose handlers don't steal focus on re-render.
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [open])

  if (!open) return null
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Đóng"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-[rgba(4,30,32,0.55)]"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex max-h-[88%] animate-sheet-up flex-col rounded-t-[28px] bg-white shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.35)] outline-none"
      >
        <div className="flex justify-center pt-3" aria-hidden="true">
          <span className="h-1.5 w-12 rounded-full bg-line" />
        </div>
        <div className="flex items-start gap-3 px-5 pt-3 pb-3">
          <div className="min-w-0 flex-1 pt-1.5">
            <h2 className="text-xl font-bold text-ink">{title}</h2>
            {description && <p className="mt-1 text-base text-ink-2">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-ink hover:bg-brand-50"
          >
            <X size={24} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="border-t border-line/70 px-5 pt-4 pb-6">{footer}</div>}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- Toast */

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [message, onDone])
  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-4 bottom-28 z-[60] flex justify-center">
      {message && (
        <div className="flex animate-rise items-center gap-3 rounded-2xl bg-ink px-5 py-4 text-base font-medium text-white shadow-xl">
          <CircleCheck size={22} className="shrink-0 text-brand-200" aria-hidden="true" />
          {message}
        </div>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- QR code */

/** Deterministic, decorative QR-style matrix seeded from the patient code. */
export function QrCode({ value, size = 120, className }: { value: string; size?: number; className?: string }) {
  const N = 25
  const cells = useMemo(() => {
    let seed = 0
    for (const ch of value) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0
    const rand = () => {
      seed ^= seed << 13
      seed >>>= 0
      seed ^= seed >> 17
      seed ^= seed << 5
      seed >>>= 0
      return seed / 4294967296
    }
    const inFinder = (x: number, y: number) =>
      (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8)
    const out: [number, number][] = []
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) if (!inFinder(x, y) && rand() > 0.52) out.push([x, y])
    return out
  }, [value])
  const finder = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" rx="1.4" fill="#0f1e26" />
      <rect x={x + 1} y={y + 1} width="5" height="5" rx="0.9" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" rx="0.6" fill="#0f1e26" />
    </g>
  )
  return (
    <svg
      width={size}
      height={size}
      viewBox={`-1 -1 ${N + 2} ${N + 2}`}
      role="img"
      aria-label={`Mã QR bệnh nhân ${value}`}
      className={className}
      shapeRendering="crispEdges"
    >
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}.${y}`} x={x} y={y} width="1" height="1" fill="#0f1e26" />
      ))}
      {finder(0, 0)}
      {finder(N - 7, 0)}
      {finder(0, N - 7)}
    </svg>
  )
}

/* ---------------------------------------------------------- Page header */

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="px-5 pt-5 pb-2">
      <h1 className="text-[28px] leading-tight font-bold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-base text-ink-2">{subtitle}</p>}
    </header>
  )
}

/* -------------------------------------------------------- Confirm dialog */

/** Centered confirmation: "Xác nhận <thao tác> cho người dùng <tên>?" */
export function ConfirmDialog({
  open,
  action,
  userName,
  icon: Icon,
  tone = 'primary',
  confirmLabel,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean
  action: string
  userName: string
  icon: LucideIcon
  tone?: 'primary' | 'danger'
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  children?: ReactNode
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    // Default focus on the safe choice.
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.({ preventScroll: true })
    }
  }, [open])

  if (!open) return null
  const danger = tone === 'danger'
  return (
    <div className="absolute inset-0 z-[55] flex items-center justify-center p-5">
      <div className="absolute inset-0 animate-fade-in bg-[rgba(4,30,32,0.6)]" aria-hidden="true" onClick={onClose} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="relative w-full max-w-[360px] animate-rise rounded-[28px] bg-white p-6 shadow-2xl"
      >
        <span
          className={cx(
            'flex size-14 items-center justify-center rounded-full',
            danger ? 'bg-bad-bg text-bad' : 'bg-brand-50 text-brand-800',
          )}
          aria-hidden="true"
        >
          <Icon size={28} strokeWidth={2.2} />
        </span>
        <h2 id="confirm-title" className="mt-4 text-[22px] leading-snug font-bold text-ink">
          Xác nhận <span className={danger ? 'text-bad' : 'text-brand-800'}>{action}</span> cho người dùng{' '}
          <span className="whitespace-nowrap">{userName}</span>?
        </h2>
        <div id="confirm-body" className="mt-3 text-base leading-relaxed text-ink-2">
          {children}
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button ref={cancelRef} variant="secondary" onClick={onClose}>
            Quay lại
          </Button>
        </div>
      </div>
    </div>
  )
}
