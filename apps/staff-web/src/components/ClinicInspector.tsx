import { useState } from 'react'
import { AlertTriangle, DoorOpen, Megaphone, Pause, Play, Settings2, Stethoscope } from 'lucide-react'
import { roomStats, type Patient, type Room, type User } from '../data'
import { BAND, Bar } from './ClinicDirectory'
import InspectorQueue from './InspectorQueue'
import { Modal, btn, field, fieldLabel } from './ui'

type Props = {
  room: Room
  nurses: User[]
  initialSelection?: string[]
  onPrioritize: (p: Patient) => void
  onMove: (ps: Patient[]) => void
  onTogglePause: () => void
  onSaveQuota: (maxWaiting: number, dailyQuota: number) => void
}

const ADVICE = {
  red: 'Cảnh báo ùn ứ hành lang - Nên chuyển bớt BN',
  orange: 'Hàng chờ đang tăng - Theo dõi sát',
  green: 'Hàng chờ ổn định',
}

export default function ClinicInspector({ room, nurses, initialSelection, onPrioritize, onMove, onTogglePause, onSaveQuota }: Props) {
  const s = roomStats(room)
  const b = BAND[s.band]
  const [editing, setEditing] = useState(false)
  const serving = room.patients.find((p) => p.status === 'inroom')
  const called = room.patients.find((p) => p.status === 'called')

  const badge = room.closed
    ? { label: 'Đã đóng hàng đợi', cls: 'bg-red-50 text-red-700', dot: 'bg-red-500' }
    : room.paused
      ? { label: 'Tạm ngưng nhận', cls: 'bg-orange-50 text-orange-800', dot: 'bg-orange-500' }
      : { label: 'Đang tiếp nhận', cls: 'bg-emerald-50 text-emerald-700', dot: 'pulse-dot bg-emerald-500' }

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-line bg-white p-4">
        <div className="text-[11px] font-bold tracking-wider text-muted uppercase">Chi tiết phòng đang chọn</div>
        <div className="mt-1.5 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[18px] leading-tight font-bold text-ink">
                PHÒNG {room.id} · {room.title}
              </h2>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${badge.cls}`}>
                <span className={`size-1.5 rounded-full ${badge.dot}`} /> {badge.label}
              </span>
            </div>
            <div className="mt-1 text-[13px] text-muted">
              {room.doctor} · Điều dưỡng:{' '}
              {nurses.length ? (
                <span className="font-medium text-slate-700">{nurses.map((n) => n.fullName).join(', ')}</span>
              ) : (
                <span className="font-medium text-red-600">Chưa có người trực</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button onClick={onTogglePause} disabled={room.closed} className={`${btn.base} ${btn.secondary} h-9 px-3 text-[13px] disabled:opacity-50`}>
              {room.paused ? <Play size={15} /> : <Pause size={15} />}
              {room.paused ? 'Tiếp tục nhận' : 'Tạm ngưng nhận'}
            </button>
            <button onClick={() => setEditing(true)} className={`${btn.base} ${btn.secondary} h-9 px-3 text-[13px]`}>
              <Settings2 size={15} /> Sửa định mức
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-3.5 ring-1 ring-inset ${b.soft} ${b.ring}`}>
            <div className="text-[12px] font-semibold text-slate-700">Bệnh nhân đang chờ / Tối đa chờ</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className={`tabular text-[28px] leading-none font-bold ${b.text}`}>
                {s.waiting} <span className="text-[17px] font-semibold opacity-60">/ {room.maxWaiting}</span>
              </span>
              <span className={`tabular text-[13px] font-bold ${b.text}`}>{s.waitPct}%</span>
            </div>
            <div className="mt-2.5">
              <Bar pct={s.waitPct} cls={b.bar} />
            </div>
            <div className={`mt-2 flex items-center gap-1.5 text-[12px] font-semibold ${b.text}`}>
              {s.band === 'red' && <AlertTriangle size={14} />} {ADVICE[s.band]}
            </div>
          </div>
          <div className={`rounded-xl p-3.5 ring-1 ring-inset ${s.nearFull ? 'bg-orange-50 ring-orange-200' : 'bg-teal-50 ring-teal-200'}`}>
            <div className="text-[12px] font-semibold text-slate-700">Đã tiếp nhận / Tối đa khám trong ngày</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className={`tabular text-[28px] leading-none font-bold ${s.nearFull ? 'text-orange-700' : 'text-teal-700'}`}>
                {s.received} <span className="text-[17px] font-semibold opacity-60">/ {room.dailyQuota}</span>
              </span>
              <span className={`tabular text-[13px] font-bold ${s.nearFull ? 'text-orange-700' : 'text-teal-700'}`}>{s.quotaPct}%</span>
            </div>
            <div className="mt-2.5">
              <Bar pct={s.quotaPct} cls={s.nearFull ? 'bg-orange-500' : 'bg-teal-500'} />
            </div>
            <div className="tabular mt-2 text-[12px] font-medium text-slate-600">
              Đã hoàn tất: {s.done} · Đang khám: {s.inroom} · Đã gọi: {s.called}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-[12.5px] ring-1 ring-line ring-inset">
          <span className="flex items-center gap-1.5">
            <Stethoscope size={14} className="text-emerald-600" />
            <span className="text-muted">Đang khám:</span>
            {serving ? (
              <b className="font-semibold text-ink">
                STT {serving.order} - {serving.name}
                {(serving.priority || serving.urgent) && <span className="font-semibold text-red-600"> (Ưu tiên)</span>}
              </b>
            ) : (
              <span className="text-slate-400">Trống</span>
            )}
          </span>
          <span className="h-3.5 w-px bg-slate-300" />
          <span className="flex items-center gap-1.5">
            <Megaphone size={14} className="text-orange-600" />
            <span className="text-muted">Đã gọi:</span>
            {called ? (
              <b className="font-semibold text-ink">
                STT {called.order} - {called.name}
              </b>
            ) : (
              <span className="text-slate-400">Chưa gọi</span>
            )}
          </span>
          {room.closed && (
            <span className="ml-auto flex items-center gap-1 font-semibold text-red-600">
              <DoorOpen size={14} /> Hàng đợi đã đóng
            </span>
          )}
        </div>
      </section>

      <InspectorQueue patients={room.patients} initialSelection={initialSelection} onPrioritize={onPrioritize} onMove={onMove} />

      {editing && <QuotaModal room={room} onClose={() => setEditing(false)} onSave={(a, b) => (onSaveQuota(a, b), setEditing(false))} />}
    </div>
  )
}

function QuotaModal({ room, onClose, onSave }: { room: Room; onClose: () => void; onSave: (maxWaiting: number, dailyQuota: number) => void }) {
  const s = roomStats(room)
  const [wait, setWait] = useState(String(room.maxWaiting))
  const [quota, setQuota] = useState(String(room.dailyQuota))
  const w = Number(wait)
  const q = Number(quota)
  const valid = Number.isInteger(w) && Number.isInteger(q) && w >= 1 && q >= 1
  const qBelow = valid && q < s.received
  return (
    <Modal
      title="Sửa định mức phòng"
      subtitle={`P.${room.id} · ${room.title}`}
      icon={<Settings2 size={19} />}
      width={460}
      onClose={onClose}
      footer={
        <>
          <button className={`${btn.base} ${btn.ghost}`} onClick={onClose}>
            Hủy
          </button>
          <button disabled={!valid || qBelow} onClick={() => onSave(w, q)} className={`${btn.base} ${btn.primary}`}>
            Lưu định mức
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <label className="block">
          <span className={fieldLabel}>Tối đa chờ (BN)</span>
          <input type="number" min={1} value={wait} onChange={(e) => setWait(e.target.value)} className={`${field} tabular`} />
          <span className="mt-1 block text-[12px] text-muted">Hiện đang chờ: {s.waiting}</span>
        </label>
        <label className="block">
          <span className={fieldLabel}>Tối đa khám trong ngày</span>
          <input type="number" min={1} value={quota} onChange={(e) => setQuota(e.target.value)} className={`${field} tabular`} />
          <span className={`mt-1 block text-[12px] ${qBelow ? 'font-medium text-red-600' : 'text-muted'}`}>
            {qBelow ? `Không thấp hơn số đã nhận (${s.received})` : `Đã tiếp nhận: ${s.received}`}
          </span>
        </label>
      </div>
    </Modal>
  )
}
