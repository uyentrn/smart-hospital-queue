import { useState } from 'react'
import { ArrowRight, ArrowRightLeft, Check } from 'lucide-react'
import type { Room } from '../data'
import { Modal, btn, field, fieldLabel } from './ui'

type Props = {
  rooms: Room[]
  onClose: () => void
  onConfirm: (source: string, destinations: string[]) => void
}

export default function TransferModal({ rooms, onClose, onConfirm }: Props) {
  const [source, setSource] = useState(rooms[0].id)
  const [dest, setDest] = useState<string[]>([])
  const src = rooms.find((r) => r.id === source)!
  const moving = src.patients.filter((p) => p.status === 'waiting').length
  const targets = rooms.filter((r) => r.id !== source)

  const toggle = (id: string) => setDest((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
  const waitingIn = (r: Room) => r.patients.filter((p) => p.status !== 'done' && p.status !== 'skipped').length

  // Preview of how waiting patients will be spread round-robin over the chosen rooms.
  const share = (i: number) => Math.floor(moving / dest.length) + (i < moving % dest.length ? 1 : 0)

  return (
    <Modal
      title="Điều phối bệnh nhân"
      subtitle="Chuyển bệnh nhân đang chờ sang một hoặc nhiều phòng khám khác"
      icon={<ArrowRightLeft size={19} />}
      width={560}
      onClose={onClose}
      footer={
        <>
          <button className={`${btn.base} ${btn.ghost}`} onClick={onClose}>
            Hủy
          </button>
          <button
            disabled={dest.length === 0 || moving === 0}
            onClick={() => onConfirm(source, dest)}
            className={`${btn.base} ${btn.primary}`}
          >
            <Check size={17} /> Xác nhận chuyển
          </button>
        </>
      }
    >
      <label className="block">
        <span className={fieldLabel}>Phòng nguồn</span>
        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value)
            setDest((d) => d.filter((x) => x !== e.target.value))
          }}
          className={field}
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
              {r.closed ? ' (đã đóng)' : ''}
            </option>
          ))}
        </select>
        <span className="mt-1.5 block text-[12.5px] text-muted">
          <b className="tabular text-ink">{moving}</b> bệnh nhân đang chờ sẽ được điều phối. Bệnh nhân đã gọi hoặc đang
          khám được giữ nguyên.
        </span>
      </label>

      <fieldset className="mt-5">
        <legend className={fieldLabel}>
          Phòng đích <span className="font-normal text-muted">(chọn một hoặc nhiều)</span>
        </legend>
        <div className="mt-2 space-y-2">
          {targets.map((r) => {
            const on = dest.includes(r.id)
            const idx = dest.indexOf(r.id)
            return (
              <label
                key={r.id}
                className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 transition-colors ${
                  r.closed
                    ? 'cursor-not-allowed border-line bg-slate-50 opacity-60'
                    : on
                      ? 'border-brand bg-brand-soft/60 ring-1 ring-brand'
                      : 'border-line hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  disabled={r.closed}
                  onChange={() => toggle(r.id)}
                />
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-md border-2 ${on ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white'}`}
                >
                  {on && <Check size={13} strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span className="block text-[14px] font-semibold text-ink">{r.name}</span>
                  <span className="block text-[12.5px] text-muted">
                    {r.doctor} · <span className="tabular">{waitingIn(r)}</span> trong hàng đợi
                  </span>
                </span>
                {r.closed ? (
                  <span className="text-[12px] font-semibold text-red-600">Đã đóng</span>
                ) : (
                  on &&
                  moving > 0 && (
                    <span className="tabular inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-[12.5px] font-semibold text-brand">
                      <ArrowRight size={13} /> +{share(idx)}
                    </span>
                  )
                )}
              </label>
            )
          })}
        </div>
      </fieldset>
    </Modal>
  )
}
