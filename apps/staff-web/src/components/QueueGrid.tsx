import { STATUS_META, type QStatus } from '../data'

export function StatusBadge({ status }: { status: QStatus }) {
  const m = STATUS_META[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ring-1 ring-inset ${m.badge}`}
    >
      <span className={`size-1.5 rounded-full ${m.dot} ${status === 'inroom' ? 'pulse-dot' : ''}`} />
      {m.label}
    </span>
  )
}

export default StatusBadge
