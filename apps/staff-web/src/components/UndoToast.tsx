import { useEffect, useState } from 'react'
import { CheckCircle2, Undo2, X } from 'lucide-react'

export type UndoState = { key: number; message: string }

const SECONDS = 5

export default function UndoToast({
  toast,
  onUndo,
  onDismiss,
  side = 'right',
}: {
  side?: 'left' | 'right'
  toast: UndoState | null
  onUndo: () => void
  onDismiss: () => void
}) {
  const [left, setLeft] = useState(SECONDS)

  useEffect(() => {
    if (!toast) return
    setLeft(SECONDS)
    const started = Date.now()
    const t = setInterval(() => {
      const remain = SECONDS - Math.floor((Date.now() - started) / 1000)
      if (remain <= 0) {
        clearInterval(t)
        onDismiss()
      } else setLeft(remain)
    }, 250)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast?.key])

  if (!toast) return null
  return (
    <div
      key={toast.key}
      role="status"
      className={`animate-fade-in fixed z-[70] ${side === 'left' ? 'bottom-14 left-4 w-[calc(28vw-32px)] max-w-[420px] min-w-[300px]' : 'right-6 bottom-6 w-[440px]'} overflow-hidden rounded-xl bg-ink text-white shadow-2xl shadow-slate-900/30`}
    >
      <div className="flex items-center gap-3 py-3 pr-2 pl-4">
        <CheckCircle2 size={19} className="shrink-0 text-emerald-400" />
        <span className="flex-1 text-[14px] leading-snug font-medium">{toast.message}</span>
        <button
          onClick={onUndo}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-[13.5px] font-semibold text-white hover:bg-white/20"
        >
          <Undo2 size={16} /> Hoàn tác <span className="tabular text-white/60">({left}s)</span>
        </button>
        <button
          onClick={onDismiss}
          aria-label="Đóng thông báo"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      <div className="h-1 bg-white/10">
        <div className="toast-timer h-full bg-emerald-400" style={{ animationDuration: `${SECONDS}s` }} />
      </div>
    </div>
  )
}
