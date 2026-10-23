import { useEffect } from 'react'
import { Activity, ArrowRight, Clock, EyeOff, LayoutDashboard, ShieldCheck, X } from 'lucide-react'
import { deptName, recentActivity, snapshotOf, waitingEntries, DEMO_SNAPSHOT, type ClinicCfg, clinicState } from './demo'
import { ClinicBadge } from './ui'

type Props = { clinic: ClinicCfg; canOpenBoard: boolean; onOpenBoard: () => void; onClose: () => void }

export default function ClinicDrawer({ clinic: c, canOpenBoard, onOpenBoard, onClose }: Props) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])

  const t = snapshotOf(c.id)
  const state = clinicState(c, t.waiting, t.avgWait)
  const queue = waitingEntries(c)
  const activity = recentActivity(c)
  const stat = (label: string, value: string, sub?: string, warn?: boolean) => (
    <div className="rounded-lg border border-line px-3 py-2.5">
      <div className="text-[11.5px] font-medium text-muted">{label}</div>
      <div className={`tabular mt-0.5 text-[20px] leading-tight font-bold ${warn ? 'text-red-600' : 'text-ink'}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  )

  return (
    <div className="animate-fade-in fixed inset-0 z-[60] bg-slate-900/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết ${c.name}`}
        onClick={(e) => e.stopPropagation()}
        className="animate-slide-in absolute inset-y-0 right-0 flex w-[min(560px,92vw)] flex-col bg-white shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-muted">
              {deptName(c.dept)} · {c.doctor} · Giờ hoạt động {c.hours}
            </div>
            <h2 className="mt-0.5 text-[17px] font-bold text-ink">{c.name}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <ClinicBadge state={state} />
              <span className="text-[11.5px] text-muted">
                Ngưỡng: tối đa {c.maxQueue} lượt chờ · TG chờ TB {c.maxWaitMin} phút
              </span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Đóng" title="Đóng" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[12px] text-slate-600 ring-1 ring-line ring-inset">
            <ShieldCheck size={14} className="shrink-0 text-brand" />
            Quyền hiện tại: <b>Quản trị viên · chỉ xem</b>. Điều phối bệnh nhân thực hiện tại Bảng điều hành.
          </div>

          <section>
            <h3 className="mb-2 text-[13px] font-bold text-ink">Trạng thái hàng đợi · tính đến {DEMO_SNAPSHOT}</h3>
            <div className="grid grid-cols-3 gap-2">
              {stat('Đang chờ', `${t.waiting}`, `Ngưỡng ${c.maxQueue}`, t.waiting > c.maxQueue)}
              {stat('Đang phục vụ', `${t.serving}`)}
              {stat('Đã hoàn thành', `${t.completed}`, `/ ${t.arrivals} tiếp nhận`)}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-[13px] font-bold text-ink">Thống kê thời gian chờ (thực tế, lượt đã hoàn thành)</h3>
            {t.avgWait === null ? (
              <p className="text-[12.5px] text-muted">Chưa có lượt hoàn thành trong ngày.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {stat('Trung bình', `${t.avgWait} ph`, `Ngưỡng ${c.maxWaitMin} ph`, t.avgWait > c.maxWaitMin)}
                {stat('Trung vị', `${t.medianWait} ph`)}
                {stat('Dài nhất', `${t.maxWait} ph`)}
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-ink">Hàng đợi hiện tại</h3>
              <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
                <EyeOff size={12} /> Đã ẩn thông tin định danh bệnh nhân
              </span>
            </div>
            {queue.length ? (
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-line text-left text-[10.5px] font-semibold tracking-wider text-muted uppercase">
                    <th className="py-1.5">STT</th>
                    <th className="py-1.5">Giờ check-in</th>
                    <th className="py-1.5">Đã chờ (thực tế)</th>
                    <th className="py-1.5">Ưu tiên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {queue.map((q) => (
                    <tr key={q.stt}>
                      <td className="tabular py-1.5 font-bold text-ink">{q.stt}</td>
                      <td className="tabular py-1.5 text-slate-600">{q.checkIn}</td>
                      <td className={`tabular py-1.5 ${q.waitedMin > c.maxWaitMin ? 'font-semibold text-red-600' : 'text-slate-700'}`}>{q.waitedMin} phút</td>
                      <td className="py-1.5 text-slate-600">{q.priority ? 'Có' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-[12.5px] text-muted">Không có lượt đang chờ</p>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-[13px] font-bold text-ink">Hoạt động gần đây</h3>
            <ol className="space-y-2">
              {activity.map((a, i) => (
                <li key={i} className="flex gap-2.5 text-[12.5px]">
                  <span className="tabular w-10 shrink-0 text-muted">{a.at}</span>
                  <Activity size={13} className="mt-0.5 shrink-0 text-slate-400" />
                  <span className="text-slate-700">{a.text}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
          <span className="inline-flex items-center gap-1 text-[11.5px] text-muted">
            <Clock size={12} /> Dữ liệu minh họa
          </span>
          {canOpenBoard ? (
            <button onClick={onOpenBoard} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
              <LayoutDashboard size={15} /> Mở Bảng điều hành <ArrowRight size={14} />
            </button>
          ) : (
            <span className="text-[11.5px] text-muted">Phòng chưa được kết nối với Bảng điều hành</span>
          )}
        </div>
      </aside>
    </div>
  )
}
