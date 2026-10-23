import { useState, useMemo } from 'react'
import { AlertTriangle, ArrowRight, ArrowRightLeft, Check, CheckSquare } from 'lucide-react'
import { roomStats, type Room } from '../data'
import { Modal, btn } from './ui'

type Props = {
  rooms: Room[]
  onClose: () => void
  onConfirm: (sourceId: string, moves: { destId: string; patientIds: string[] }[]) => void
}

export default function BulkTransferModal({ rooms, onClose, onConfirm }: Props) {
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [dests, setDests] = useState<string[]>([])

  const sourceRoom = rooms.find(r => r.id === sourceId)
  // Chỉ lấy những bệnh nhân đang ở trạng thái chờ của phòng nguồn
  const patients = sourceRoom ? sourceRoom.patients.filter(p => p.status === 'waiting') : []
  const n = patients.length

  // Lọc phòng đích: Khác phòng nguồn, cùng chuyên khoa, đang mở cửa
  const targets = useMemo(() => {
    if (!sourceRoom) return []
    return rooms
      .filter((r) => r.id !== sourceRoom.id && r.specialty === sourceRoom.specialty && !r.closed)
      .map((r) => ({ r, s: roomStats(r) }))
      .sort((a, b) => a.s.waitPct - b.s.waitPct)
  }, [rooms, sourceRoom])

  // Xử lý nút Chọn tất cả / Bỏ chọn tất cả
  const handleSelectAll = () => {
    if (dests.length === targets.length) {
      setDests([])
    } else {
      setDests(targets.map(t => t.r.id))
    }
  }

  // Thuật toán chia bài (giống hệt MovePatientsModal)
  const allocations: Record<string, number> = {}
  dests.forEach(id => allocations[id] = 0)

  if (dests.length > 0 && n > 0) {
    const tempWaiting: Record<string, number> = {}
    const maxW: Record<string, number> = {}
    
    dests.forEach(id => {
      const room = targets.find(t => t.r.id === id)
      if (room) {
        tempWaiting[id] = room.s.waiting
        maxW[id] = room.r.maxWaiting
      }
    })

    for (let i = 0; i < n; i++) {
      let bestId = dests[0]
      let minRatio = tempWaiting[bestId] / maxW[bestId]
      
      for (let j = 1; j < dests.length; j++) {
        const id = dests[j]
        const ratio = tempWaiting[id] / maxW[id]
        if (ratio < minRatio || (ratio === minRatio && maxW[id] > maxW[bestId])) {
          minRatio = ratio
          bestId = id
        }
      }
      allocations[bestId]++
      tempWaiting[bestId]++
    }
  }

  const handleConfirm = () => {
    if (!dests.length || !sourceId) return
    const moves: { destId: string; patientIds: string[] }[] = []
    let pIdx = 0
    dests.forEach(id => {
      const count = allocations[id]
      if (count > 0) {
        const chunk = patients.slice(pIdx, pIdx + count)
        moves.push({ destId: id, patientIds: chunk.map(p => p.id) })
        pIdx += count
      }
    })
    onConfirm(sourceId, moves)
  }

  return (
    <Modal
      title="Điều phối hàng đợi đa phòng"
      subtitle="Chuyển toàn bộ bệnh nhân đang chờ sang các phòng khác"
      icon={<ArrowRightLeft size={19} />}
      width={760}
      onClose={onClose}
      footer={
        <>
           <button className={`${btn.base} ${btn.ghost}`} onClick={onClose}>Hủy</button>
           <button disabled={!dests.length || !sourceId || n === 0} onClick={handleConfirm} className={`${btn.base} ${btn.primary}`}>
             <Check size={17} /> Xác nhận chuyển ({dests.length} phòng)
           </button>
         </>
      }
    >
      <div className="grid grid-cols-2 gap-6">
        {/* CỘT TRÁI: CHỌN PHÒNG NGUỒN */}
        <div className="flex flex-col">
          <div className="text-[13px] font-semibold text-slate-700 mb-2">1. Chọn phòng nguồn</div>
          <div className="max-h-[400px] space-y-1.5 overflow-y-auto pr-1">
            {rooms.map(r => {
              const on = sourceId === r.id
              const s = roomStats(r)
              // Nổi bật phòng INACTIVE (Đã đóng hoặc Tạm ngưng)
              const isInactive = r.closed || r.paused
              
              return (
                <label
                  key={r.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                    on ? 'border-brand bg-brand-soft/60 ring-1 ring-brand' : 
                    isInactive ? 'border-red-200 bg-red-50/60 hover:bg-red-50' : 'border-line hover:bg-slate-50'
                  }`}
                >
                  <input type="radio" name="source" className="sr-only" checked={on} onChange={() => { setSourceId(r.id); setDests([]); }} />
                  <span className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? 'border-brand' : isInactive ? 'border-red-300' : 'border-slate-300'}`}>
                    {on && <span className="size-2.5 rounded-full bg-brand" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[14px] font-semibold ${isInactive && !on ? 'text-red-700' : 'text-ink'}`}>
                      P.{r.id} · {r.title}
                    </span>
                    <span className="block text-[12.5px] text-muted">
                      Đang chờ: {s.waiting} BN
                      {isInactive && <span className="font-medium text-red-600"> · {r.closed ? 'Đã đóng' : 'Tạm ngưng'}</span>}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        {/* CỘT PHẢI: CHỌN PHÒNG ĐÍCH */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-semibold text-slate-700">
              2. Chọn phòng đích {sourceRoom && `(${sourceRoom.specialty})`}
            </div>
            {targets.length > 0 && (
              <button onClick={handleSelectAll} className="flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
                <CheckSquare size={14} /> {dests.length === targets.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            )}
          </div>
          <div className="max-h-[400px] space-y-1.5 overflow-y-auto pr-1">
            {!sourceId ? (
              <div className="py-8 text-center text-[13px] text-muted border border-dashed border-line rounded-xl">Vui lòng chọn phòng nguồn trước</div>
            ) : !targets.length ? (
              <div className="py-8 text-center text-[13px] text-muted border border-dashed border-line rounded-xl">Không có phòng nào cùng chuyên khoa đang mở cửa.</div>
            ) : (
              targets.map(({ r, s }) => {
                const on = dests.includes(r.id)
                const added = on ? allocations[r.id] : 0
                const after = s.waiting + added
                const over = after > r.maxWaiting
                
                return (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                      on ? 'border-brand bg-brand-soft/60 ring-1 ring-brand' : 'border-line hover:bg-slate-50'
                    }`}
                  >
                    <input type="checkbox" name="dest" className="sr-only" checked={on} onChange={() => setDests(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id])} />
                    <span className={`grid size-5 shrink-0 place-items-center rounded-md border-2 ${on ? 'border-brand bg-brand text-white' : 'border-slate-300'}`}>
                      {on && <Check size={14} strokeWidth={3.5} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold text-ink">P.{r.id}</span>
                    </span>
                    <span className={`tabular inline-flex items-center gap-1 text-[12.5px] ${over ? 'text-red-600' : 'text-slate-700'}`}>
                      {on && added > 0 ? (
                        <><b className="inline-flex items-center gap-1 font-bold text-ink">{s.waiting} <ArrowRight size={12} /> {after}</b> / {r.maxWaiting}</>
                      ) : (
                        <>{s.waiting} / {r.maxWaiting}</>
                      )}
                      {over && on && <AlertTriangle size={14} className="ml-0.5" />}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      </div>
      
      {sourceId && n > 0 && dests.length > 0 && (
        <p className="mt-4 text-[12.5px] text-muted text-center">
          Sẽ chuyển <b className="text-ink">{n}</b> bệnh nhân sang <b className="text-ink">{dests.length}</b> phòng đích theo tỷ lệ tải hiện tại.
        </p>
      )}
    </Modal>
  )
}