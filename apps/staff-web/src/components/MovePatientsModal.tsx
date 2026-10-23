import { useState } from 'react'
import { CheckSquare, AlertTriangle, ArrowRight, ArrowRightLeft, Check } from 'lucide-react'
import { roomStats, type Patient, type Room } from '../data'
import { Modal, btn } from './ui'

type Props = {
  source: Room
  rooms: Room[]
  patients: Patient[]
  onClose: () => void
  onConfirm: (moves: { destId: string; patientIds: string[] }[]) => void
}

export default function MovePatientsModal({ source, rooms, patients, onClose, onConfirm }: Props) {
  // Lọc cùng chuyên khoa, loại bỏ phòng đóng cửa, sắp xếp theo độ trống (waitPct tăng dần)
  const targets = rooms
    .filter((r) => r.id !== source.id && r.specialty === source.specialty && !r.closed)
    .map((r) => ({ r, s: roomStats(r) }))
    .sort((a, b) => a.s.waitPct - b.s.waitPct)
  
  const [dests, setDests] = useState<string[]>(
    targets.length > 0 ? [targets[0].r.id] : []
  )
  const n = patients.length

  // Thuật toán chia bài: Phân bổ từng bệnh nhân một vào phòng đang có tỷ lệ (waiting / maxWaiting) thấp nhất
  const allocations: Record<string, number> = {}
  dests.forEach(id => allocations[id] = 0)

  const handleSelectAll = () => {
    if (dests.length === targets.length) {
      setDests([])
    } else {
      setDests(targets.map(t => t.r.id))
    }
  }
  
  if (dests.length > 0) {
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
        
        // Ưu tiên phòng có tỷ lệ thấp hơn. Nếu tỷ lệ bằng nhau, ưu tiên phòng có maxWaiting lớn hơn
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
    if (!dests.length) return
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
    
    onConfirm(moves)
  }

  const toggleDest = (id: string) => {
    setDests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <Modal
      title={n === 1 ? 'Đổi phòng cho bệnh nhân' : `Chuyển ${n} bệnh nhân sang phòng khác`}
      subtitle={
        n === 1 ? `STT ${patients[0].order} · ${patients[0].name} · từ P.${source.id}` : `Từ P.${source.id} · ${patients.map((p) => p.order).join(', ')}`
      }
      icon={<ArrowRightLeft size={19} />}
      width={540}
      onClose={onClose}
      footer={
        <>
           <button className={`${btn.base} ${btn.ghost}`} onClick={onClose}>Hủy</button>
           <button disabled={!dests.length} onClick={handleConfirm} className={`${btn.base} ${btn.primary}`}>
             <Check size={17} /> Xác nhận chuyển ({dests.length} phòng)
           </button>
         </>
      }
    >
      <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-semibold text-slate-700">
              Chọn phòng đích {source && `(${source.specialty})`}
            </div>
            {targets.length > 0 && (
              <button onClick={handleSelectAll} className="flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
                <CheckSquare size={14} /> {dests.length === targets.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            )}
          </div>
      <div className="mt-2 max-h-[400px] space-y-1.5 overflow-y-auto pr-1">
        {targets.map(({ r, s }) => {
          const on = dests.includes(r.id)
          const added = on ? allocations[r.id] : 0
          const after = s.waiting + added
          const over = after > r.maxWaiting
          
          return (
            <label
              key={r.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${
                r.closed ? 'cursor-not-allowed border-line bg-slate-50 opacity-55' : on ? 'border-brand bg-brand-soft/60 ring-1 ring-brand' : 'border-line hover:bg-slate-50'
              }`}
            >
              <input type="checkbox" name="dest" className="sr-only" checked={on} disabled={r.closed} onChange={() => toggleDest(r.id)} />
              <span className={`grid size-5 shrink-0 place-items-center rounded-md border-2 ${on ? 'border-brand bg-brand text-white' : 'border-slate-300'}`}>
                {on && <Check size={14} strokeWidth={3.5} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-ink">
                  P.{r.id} · {r.title}
                </span>
                <span className="block text-[12.5px] text-muted">
                  {r.doctor}
                  {r.paused && <span className="font-medium text-orange-700"> · Đang tạm ngưng</span>}
                  {r.closed && <span className="font-medium text-red-600"> · Đã đóng</span>}
                </span>
              </span>
              <span className={`tabular inline-flex items-center gap-1 text-[12.5px] ${over ? 'text-red-600' : 'text-slate-700'}`}>
                {on && added > 0 ? (
                  <>
                    <b className="inline-flex items-center gap-1 font-bold text-ink">
                      {s.waiting} <ArrowRight size={12} /> {after}
                    </b>{' '}
                    / {r.maxWaiting}
                  </>
                ) : (
                  <>{s.waiting} / {r.maxWaiting}</>
                )}
                {over && on && <AlertTriangle size={14} className="ml-0.5" />}
              </span>
            </label>
          )
        })}
        {!targets.length && (
            <div className="py-4 text-center text-[13px] text-muted">Không có phòng nào cùng chuyên khoa đang mở cửa.</div>
        )}
      </div>
      <p className="mt-3 text-[12.5px] text-muted">
        Hệ thống tự động phân bổ bệnh nhân ưu tiên dồn vào các phòng có tỷ lệ hàng chờ thấp nhất để cân bằng tải.
      </p>
    </Modal>
  )
}