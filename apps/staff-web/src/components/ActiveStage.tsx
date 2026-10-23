import { useEffect, useState, type ReactNode } from 'react'
import { CheckCheck, Check, Clock3, DoorOpen, Megaphone, SkipForward, Timer, Volume2, UserRound } from 'lucide-react'
import type { Patient } from '../data'

type Props = {
  inService: Patient[]
  called: Patient[]
  next?: Patient
  exceptionPatient?: Patient | null
  maxCapacity: number
  canCall: boolean
  blockedReason?: string
  onComplete: (p: Patient) => void
  onEnter: (p: Patient) => void
  onRecall: (p: Patient) => void
  onSkip: (p: Patient) => void
  onCallNext: (p: Patient) => void
  onShowCalledList?: () => void;
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

const ago = (ms: number) => {
  const m = Math.floor(ms / 60000)
  return m < 1 ? 'Vừa gọi' : `Đã gọi ${m} phút trước`
}

// CÔNG THỨC VÀ BIẾN ĐẾM NGƯỢC
export const getCooldownTime = (callCount: number, isPriority: boolean) => {
  const BASE_TIME = 5000 * 60; // Thời gian chờ mặc định (5ph)
  const PENALTY_PER_CALL = 5000 * 60; // Mỗi lần gọi lại sẽ bị cộng thêm (5ph)
  const PRIORITY_MULTIPLIER = 0.5; // Hệ số ưu tiên (Giảm 50% thời gian phạt)
  
  const penalty = (callCount - 1) * (callCount - 1) * PENALTY_PER_CALL * (isPriority ? PRIORITY_MULTIPLIER : 1);
  return BASE_TIME + Math.max(0, penalty);
};

export function PriorityBadge({ p }: { p: Patient }) {
  if (!p.priority && !p.urgent) return null
  return (
    <span className="inline-flex items-center rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
      ƯU TIÊN
    </span>
  )
}

function StageLabel({ dot, children, extra, onClick }: { dot: string; children: ReactNode; extra?: number; onClick?: () => void }) {
  return (
    <div className="flex items-center gap-2 text-[12px] font-bold tracking-wider uppercase">
      <span className={`size-2 rounded-full ${dot}`} />
      {children}
      {extra && extra > 0? (
        // <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold tracking-normal normal-case ring-1 ring-current/20">
        <button 
          onClick={onClick} 
          className="text-brand hover:underline font-medium text-sm cursor-pointer"
        >
          {extra} bệnh nhân đã gọi
        </button>
        /* </span> */
      ) : null}
    </div>
  )
}

function Identity({ p, tone, lockTimeLeft }: { p: Patient; tone: 'green' | 'orange'; lockTimeLeft?: number }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className={`grid h-[72px] min-w-[96px] place-items-center rounded-xl bg-white px-3 ring-1 ${
          tone === 'green' ? 'text-emerald-700 ring-emerald-200' : 'text-orange-700 ring-orange-200'
        }`}
      >
        <div className="text-center leading-none">
          <div className="text-[10.5px] font-semibold tracking-wider text-muted uppercase">STT</div>
          <div className="tabular mt-1 text-[32px] font-bold">{p.order}</div>
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[21px] leading-tight font-bold text-ink">{p.name}</span>
          <PriorityBadge p={p} />
        </div>
        <div className="tabular mt-1 text-[14px] font-medium text-muted flex items-center gap-2">
          <span>{p.id} · {p.birthYear}</span>
          {lockTimeLeft !== undefined && lockTimeLeft > 0 && (
            <span className=" rounded bg-blue-100 px-2 py-0.5 text-[12px] font-bold text-blue-700 ring-1 ring-blue-200">
              Tự động chuyển sau {Math.ceil(lockTimeLeft / 1000)}s
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function Empty({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <div className="flex flex-1 items-center gap-4 py-2">
      <span className="grid size-[72px] place-items-center rounded-xl border border-dashed border-current/30 bg-white/60">
        {icon}
      </span>
      <div>
        <div className="text-[17px] font-semibold text-ink">{title}</div>
        <div className="mt-0.5 text-[13.5px] text-muted">{hint}</div>
      </div>
    </div>
  )
}

export default function ActiveStage(props: Props) {
  const { inService, called, next, canCall, blockedReason, onShowCalledList, maxCapacity, exceptionPatient } = props
  const [now, setNow] = useState(Date.now())
  const [pinnedTargetId, setPinnedTargetId] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  // --- LOGIC XÁC ĐỊNH "BỆNH NHÂN TIẾP THEO" ---
  const getTargetCall = (): Patient | undefined => {
    if (exceptionPatient) return exceptionPatient;

    // 1. Khóa hiển thị (Lock duration): Vừa gọi ai đó, giữ thẻ trên màn hình 7s (hoặc 10s nếu ưu tiên)
    const recentCalled = [...called].sort((a,b) => (b.calledAt || 0) - (a.calledAt || 0))[0];
    if (recentCalled && recentCalled.calledAt) {
      const isPriority = recentCalled.priority || recentCalled.urgent;
      const LOCK_DURATION = isPriority ? 10000 : 7000;
      if (now - recentCalled.calledAt < LOCK_DURATION) {
        return recentCalled;
      }
    }

    // 2. Kiểm tra thẻ đang ghim: Chỉ giữ ghim nếu bệnh nhân ĐÃ SẴN SÀNG ĐỂ GỌI 
    // (Thời gian chờ gọi lại Cooldown <= 0, hoặc là người mới hoàn toàn trong hàng đợi)
    if (pinnedTargetId) {
      const pinnedInCalled = called.find(p => p.id === pinnedTargetId);
      if (pinnedInCalled) {
        const cdTime = getCooldownTime(pinnedInCalled.callCount || 1, !!(pinnedInCalled.priority || pinnedInCalled.urgent));
        // Đang là người đã gọi: Chỉ giữ lại trên thẻ nếu Cooldown đã đếm ngược xong
        if (pinnedInCalled.calledAt && (now - pinnedInCalled.calledAt) >= cdTime) {
          return pinnedInCalled; 
        }
      } else if (next && next.id === pinnedTargetId) {
        // Đang là người trong hàng chờ: Luôn giữ nguyên không đổi cho đến khi bị bấm gọi
        return next; 
      }
    }

    // 3. Nếu người đang ghim không hợp lệ    
    // Ưu tiên 1: Tìm người đầu tiên trong danh sách đã gọi mà Cooldown đã về 0
    const eligibleRecall = called.find(p => {
      if (!p.calledAt) return false;
      const cdTime = getCooldownTime(p.callCount || 1, !!(p.priority || p.urgent));
      return (now - p.calledAt) >= cdTime;
    });

    if (eligibleRecall) return eligibleRecall;

    // Ưu tiên 2: Không có ai trong danh sách đã gọi cần gọi lại -> Lấy người đầu tiên trong hàng chờ
    return next;
  };

  const targetCall = getTargetCall();

  // Tự động ghim người đang hiển thị
  useEffect(() => {
    if (targetCall && targetCall.id !== pinnedTargetId) {
      setPinnedTargetId(targetCall.id);
    } else if (!targetCall && pinnedTargetId) {
      setPinnedTargetId(null);
    }
  }, [targetCall, pinnedTargetId]);

  const isTargetAlreadyCalled = targetCall && called.some(p => p.id === targetCall.id);
  const targetIsPriority = !!(targetCall?.priority || targetCall?.urgent);
  
  // Tính toán đếm ngược thẻ (7s cho BN thường, 10s cho BN ưu tiên)
  let lockTimeLeft = 0;
  if (targetCall && targetCall.calledAt && isTargetAlreadyCalled && targetCall.id !== exceptionPatient?.id) {
    const LOCK_DURATION = targetIsPriority ? 10000 : 7000;
    const timeSinceCalled = now - targetCall.calledAt;
    if (timeSinceCalled < LOCK_DURATION) {
      lockTimeLeft = LOCK_DURATION - timeSinceCalled;
    }
  }
  // Tính toán thời gian cho UI
  const cdTime = targetCall ? getCooldownTime(targetCall.callCount || 0, targetIsPriority) : 10000;
  const elapsed = targetCall?.calledAt ? now - targetCall.calledAt : 0;
  const canRecallOrCall = !isTargetAlreadyCalled || elapsed >= cdTime;
  const remainingSeconds = Math.ceil((cdTime - elapsed) / 1000);
  const remainingText = `${Math.floor(Math.max(0, remainingSeconds) / 60)}:${String(Math.max(0, remainingSeconds) % 60).padStart(2, '0')}`;

  return (
    <section aria-label="Khu vực điều phối trực tiếp" className="rounded-2xl border border-line bg-white p-4 shadow-[0_6px_24px_-12px_rgba(15,29,43,0.18)]">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-[13px] font-bold tracking-wider text-ink uppercase">Khu vực điều phối trực tiếp</h2>
        <span className="text-[12.5px] text-muted">Mọi thao tác gọi số và chuyển trạng thái chỉ thực hiện tại đây</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        
        {/* IN_SERVICE: Hiển thị dạng bảng */}
        <div className="flex min-h-[236px] flex-col rounded-xl border-2 border-emerald-500 bg-emerald-50/70 p-4 text-emerald-800">
          <div className="flex items-center justify-between mb-3">
            <StageLabel dot="pulse-dot bg-emerald-500">
              Đang trong phòng khám ({inService.length} / {maxCapacity})
            </StageLabel>
          </div>
          <div className="flex-1 overflow-auto rounded-lg bg-white ring-1 ring-emerald-200">
            {inService.length > 0 ? (
              <table className="w-full text-left text-[14px]">
                <thead className="border-b border-emerald-200 bg-emerald-50 text-[12px] text-emerald-700 uppercase">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">STT</th>
                    <th className="px-3 py-2.5 font-semibold">Bệnh nhân</th>
                    <th className="px-3 py-2.5 font-semibold">Thời gian khám</th>
                    <th className="px-3 py-2.5 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody>
                  {inService.map(p => (
                    <tr key={p.id} className="border-b border-emerald-100 last:border-0 hover:bg-emerald-50 transition-colors">
                      <td className="px-3 py-3 font-bold text-emerald-900">{p.order}</td>
                      <td className="px-3 py-3 font-semibold text-emerald-900">
                        {p.name}
                        {p.priority && <span className="ml-1.5 rounded bg-red-600 px-1 py-0.5 text-[9px] text-white">ƯU TIÊN</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded bg-emerald-100/50 px-2 py-0.5 text-[13px] font-bold text-emerald-700">
                          <Timer size={14} /> {p.startedAt ? mmss(now - p.startedAt) : '00:00'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => props.onComplete(p)}
                          className="inline-flex h-8 items-center justify-center gap-1.5 rounded bg-emerald-600 px-3 text-[13px] font-bold text-white transition-colors hover:bg-emerald-700 active:scale-[0.98]"
                        >
                          <CheckCheck size={15} /> Hoàn tất
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty icon={<UserRound size={26} />} title="Phòng khám đang trống" hint="Mời bệnh nhân đã gọi vào phòng khám" />
            )}
          </div>
        </div>

        {/* NEXT PATIENT / CALLED */}
        <div className={`flex min-h-[236px] flex-col rounded-xl border-2 p-5 transition-colors ${targetCall?.id === exceptionPatient?.id ? 'border-purple-400 bg-purple-50/70 text-purple-800' : 'border-orange-400 bg-orange-50/70 text-orange-800'}`}>
          <div className="flex items-center justify-between">
            <StageLabel dot={targetCall?.id === exceptionPatient?.id ? "pulse-dot bg-purple-500" : "bg-orange-500"} extra={called.length > 0 ? called.length : undefined} onClick={onShowCalledList}>
              Bệnh nhân tiếp theo
            </StageLabel>
            {targetCall?.calledAt && isTargetAlreadyCalled && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
                <Clock3 size={15} /> {ago(now - targetCall.calledAt)}
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-1 items-center">
            {targetCall ? (
              <Identity p={targetCall} tone="orange" lockTimeLeft={lockTimeLeft} />
            ) : (
              <Empty icon={<Megaphone size={24} />} title="Không có bệnh nhân tiếp theo" hint="Hàng chờ đang trống" />
            )}
          </div>
          
          {/* Vùng hiển thị cảnh báo chặn gọi */}
          {blockedReason && <div className="mt-2 text-[12.5px] font-medium text-amber-700">{blockedReason}</div>}

          <div className="mt-5 flex gap-3">
            <button
              disabled={!targetCall || !isTargetAlreadyCalled || inService.length >= maxCapacity}
              onClick={() => targetCall && props.onEnter(targetCall)}
              className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-[16px] font-bold text-white shadow-md shadow-orange-700/20 transition-all hover:bg-orange-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              <DoorOpen size={20} /> Vào phòng khám
            </button>

            <button
              disabled={!targetCall || !canCall || !canRecallOrCall}
              onClick={() => {
                if (targetCall) {
                  isTargetAlreadyCalled ? props.onRecall(targetCall) : props.onCallNext(targetCall)
                }
              }}
              title={!canRecallOrCall ? `Vui lòng đợi ${remainingText} nữa để gọi lại` : undefined}
              className={`inline-flex h-14 min-w-[130px] flex-col items-center justify-center rounded-xl border px-4 transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:border-line disabled:bg-slate-100 disabled:text-slate-400 ${targetCall?.id === exceptionPatient?.id ? 'border-purple-300 bg-purple-100 text-purple-800 hover:bg-purple-200' : 'border-orange-300 bg-white text-orange-800 hover:bg-orange-50'}`}
            >
              <div className="flex items-center gap-1.5 text-[14px] font-semibold leading-tight">
                <Volume2 size={16} /> 
                {!canRecallOrCall ? `Chờ ${remainingText}` : isTargetAlreadyCalled ? 'Gọi lại' : targetCall?.id === exceptionPatient?.id ? 'Gọi ưu tiên' : 'Gọi số mới'}
              </div>
              {isTargetAlreadyCalled && targetCall && (
                <span className="text-[11.5px] font-bold text-orange-600 leading-tight mt-0.5">
                  (Đã gọi {targetCall.callCount || 1} lần)
                </span>
              )}
            </button>

            {isTargetAlreadyCalled && (
              <button
                disabled={!targetCall}
                onClick={() => targetCall && props.onSkip(targetCall)}
                className="ml-1 inline-flex h-14 items-center justify-center gap-1.5 rounded-xl px-3 text-[14px] font-semibold text-red-600 transition-all hover:bg-red-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
              >
                <SkipForward size={17} /> Qua lượt
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
