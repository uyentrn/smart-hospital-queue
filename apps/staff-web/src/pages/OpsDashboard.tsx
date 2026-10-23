import { useCallback, useState } from 'react'
import { MoreVertical, ArrowRightLeft, ClipboardCheck, Siren, Users } from 'lucide-react'
import { roomStats, type Patient, type Room, type User } from '../data'
import ClinicDirectory from '../components/ClinicDirectory'
import ClinicInspector from '../components/ClinicInspector'
import MovePatientsModal from '../components/MovePatientsModal'
import BulkTransferModal from '../components/BulkTransferModal'
import { btn } from '../components/ui'

type Props = {
  rooms: Room[]
  users: User[]
  onPrioritize: (roomId: string, patientId: string) => void
  onUpdateRoom: (roomId: string, fn: (r: Room) => Room) => void
  onMovePatients: (sourceId: string, ids: string[], destId: string) => void
  onOpenTransfer: () => void
  notify: (msg: string) => void
}

// Demo: show the bulk-transfer state with two patients pre-selected on first visit.
let demoSelectionShown = false

export default function OpsDashboard({ rooms, users, onPrioritize, onUpdateRoom, onMovePatients, onOpenTransfer, notify }: Props) {
  const [selectedId, setSelectedId] = useState(rooms[0].id)
  const [moving, setMoving] = useState<Patient[] | null>(null)
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false)
  const [initialSelection] = useState(() => {
    if (demoSelectionShown) return []
    demoSelectionShown = true
    return rooms[0].patients.filter((p) => p.status === 'waiting').slice(2, 4).map((p) => p.id)
  })
  const room = rooms.find((r) => r.id === selectedId) ?? rooms[0]

  const nursesOf = useCallback(
    (roomId: string) => users.filter((u) => u.role === 'nurse' && u.room === roomId && u.status === 'active'),
    [users],
  )

  const stats = rooms.map((r) => ({ r, s: roomStats(r) }))
  const totalWaiting = stats.reduce((n, x) => n + x.s.waiting, 0)
  const maxWaiting = rooms.reduce((n, r) => n + r.maxWaiting, 0)
  const received = stats.reduce((n, x) => n + x.s.received, 0)
  const quota = rooms.reduce((n, r) => n + r.dailyQuota, 0)
  const overloaded = stats.filter((x) => x.s.triage === 'overload').map((x) => x.r)

  const chip = 'inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] whitespace-nowrap ring-1 ring-inset'

  return (
    <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-line bg-white">
        <div className="flex min-h-[72px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <div className="mr-auto">
            <div className="text-[12.5px] text-muted">Điều hành / Khoa Nội</div>
            <h1 className="text-[20px] leading-tight font-bold tracking-tight text-ink">Bảng điều hành đa phòng</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span title="Tải chờ toàn khoa" className={`${chip} bg-brand-soft text-brand ring-brand/15`}>
              <Users size={16} /> Tổng đang chờ:
              <b className="tabular text-[14px]">
                {totalWaiting} / {maxWaiting}
              </b>
            </span>
            <span title="Định mức ngày toàn khoa" className={`${chip} bg-teal-50 text-teal-800 ring-teal-200`}>
              <ClipboardCheck size={16} /> Đã tiếp nhận hôm nay:
              <b className="tabular text-[14px]">
                {received} / {quota} ({Math.round((received / quota) * 100)}%)
              </b>
            </span>
            {overloaded.length ? (
              <button
                onClick={() => setSelectedId(overloaded[0].id)}
                title="Xem phòng quá tải"
                className={`${chip} bg-red-50 font-medium text-red-700 ring-red-200 hover:bg-red-100`}
              >
                <span className="pulse-dot size-2 rounded-full bg-red-500" />
                Phòng quá tải chờ:
                <b className="tabular text-[14px]">
                  {overloaded.length} ({overloaded.map((r) => `P.${r.id}`).join(', ')})
                </b>
              </button>
            ) : (
              <span className={`${chip} bg-emerald-50 text-emerald-700 ring-emerald-200`}>
                <Siren size={15} /> Không có phòng quá tải
              </span>
            )}
            <button onClick={() => setBulkTransferOpen(true)} className={`${btn.base} ${btn.primary} ml-1 h-10 px-4`}>
              <ArrowRightLeft size={17} /> Chuyển hàng đợi
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 gap-4 p-4 overflow-hidden">
        <div className="flex flex-col min-w-[300px] w-[45%] max-w-[70%] resize-x overflow-hidden pr-2">
          <ClinicDirectory rooms={rooms} nursesOf={nursesOf} selectedId={room.id} onSelect={setSelectedId} />
        </div>
        
        <div className="flex-1 min-w-0 overflow-y-auto">
          <ClinicInspector
            key={room.id}
            room={room}
            nurses={nursesOf(room.id)}
            initialSelection={room.id === rooms[0].id ? initialSelection : []}
            onPrioritize={(p) => onPrioritize(room.id, p.id)}
            onMove={setMoving}
            onTogglePause={() => {
              onUpdateRoom(room.id, (r) => ({ ...r, paused: !r.paused }))
              notify(room.paused ? `Đã tiếp tục nhận bệnh nhân tại ${room.short}` : `Đã tạm ngưng nhận bệnh nhân tại ${room.short}`)
            }}
            onSaveQuota={(maxWaiting, dailyQuota) => {
              onUpdateRoom(room.id, (r) => ({ ...r, maxWaiting, dailyQuota }))
              notify(`Đã cập nhật định mức ${room.short}: chờ tối đa ${maxWaiting} · ${dailyQuota} BN/ngày`)
            }}
          />
        </div>
      </div>

      {moving && (
        <MovePatientsModal
          source={room}
          rooms={rooms}
          patients={moving}
          onClose={() => setMoving(null)}
          onConfirm={(moves) => {
            moves.forEach(m => onMovePatients(room.id, m.patientIds, m.destId))
            setMoving(null)
          }}
        />
      )}

      {bulkTransferOpen && (
        <BulkTransferModal
          rooms={rooms}
          onClose={() => setBulkTransferOpen(false)}
          onConfirm={(sourceId, moves) => {
            moves.forEach(m => onMovePatients(sourceId, m.patientIds, m.destId))
            setBulkTransferOpen(false)
            notify(`Đã chuyển bệnh nhân từ phòng ${sourceId} thành công`)
          }}
        />
      )}
      
    </div>
  )
}
