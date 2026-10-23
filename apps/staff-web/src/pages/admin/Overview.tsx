import { useMemo, useState } from 'react'
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Database,
  Info,
  Lightbulb,
  PauseCircle,
  ScrollText,
  Stethoscope,
  Users,
} from 'lucide-react'
import { aggregate, buildAlerts, deptName, DEMO_SNAPSHOT, HOURS, RANGES, type ClinicCfg, type ClinicRow, type ClinicState } from '../../admin/demo'
import { FilterBar, StaleNotice, useFilters } from '../../admin/filters'
import ClinicDrawer from '../../admin/ClinicDrawer'
import { AdminHeader, BarChart, ClinicBadge, DemoBar, Delta, EmptyState, KpiCard, Panel, Segmented, Skeleton, StateGate, type BarDatum } from '../../admin/ui'
import type { AdminPageProps } from '../../admin/store'

const ORDER: Record<ClinicState, number> = { over: 0, watch: 1, ok: 2, paused: 3 }
const DOW = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const ddmm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
const nextHour = (h: string) => `${String(Number(h.slice(0, 2)) + 1).padStart(2, '0')}:00`

export default function Overview({ user, store, roomIds, notify, onLogout, onNavigate }: AdminPageProps) {
  const { f, update, view, demoView, setDemoView, refreshing, reload, retry } = useFilters()
  const [mode, setMode] = useState<'hour' | 'day'>('hour')
  const [showAll, setShowAll] = useState(false)
  const [drawer, setDrawer] = useState<ClinicCfg | null>(null)

  const data = useMemo(() => aggregate(store.clinics, f), [store.clinics, f])
  const alerts = useMemo(() => buildAlerts(store.clinics, f), [store.clinics, f])
  const multiDay = f.range === '7d' || f.range === '30d'
  const chartMode = multiDay ? mode : 'hour'
  const rangeLabel = RANGES.find((r) => r.id === f.range)!.label
  const isToday = f.range === 'today'
  const prevLabel = { today: 'so với cùng giờ hôm qua', yesterday: 'so với hôm kia', '7d': 'so với 7 ngày trước đó', '30d': 'so với 30 ngày trước đó' }[f.range]
  const ready = view === 'ready' || view === 'stale'

  const sorted = [...data.rows].sort((a, b) => ORDER[a.state] - ORDER[b.state] || b.waiting - a.waiting)
  const shownRows = showAll ? sorted : sorted.slice(0, 6)
  const attention = data.rows.some((r) => r.state === 'over' || r.state === 'watch')
  const scopedClinics = data.rows.map((r) => r.cfg)

  const chart: BarDatum[] =
    chartMode === 'hour'
      ? HOURS.map((h, i) => {
          const v = data.hourly[i]
          const partial = isToday && i === 2
          return {
            label: h,
            value: v,
            muted: partial,
            tip:
              v === null
                ? `${h}–${nextHour(h)} · Chưa đến khung giờ`
                : `${h}–${nextHour(h)} · ${v} lượt${multiDay ? ' / ngày (TB)' : ''}${partial ? ` · tính đến ${DEMO_SNAPSHOT}` : ''}`,
          }
        })
      : data.daily.map((d) => ({ label: ddmm(d.date), value: d.arrivals, tip: `${DOW[d.date.getDay()]} ${ddmm(d.date)} · ${d.arrivals} lượt` }))

  // Insights only from the selected data; skip any we cannot support.
  const insights: string[] = []
  const valid = data.hourly.map((v, i) => [v ?? -1, i] as const).filter(([v]) => v > 0)
  if (ready && valid.length) {
    const [v, i] = valid.reduce((a, b) => (b[0] > a[0] ? b : a))
    insights.push(
      `Lưu lượng tiếp nhận cao nhất trong khoảng ${HOURS[i]}–${nextHour(HOURS[i])} (${v} lượt${multiDay ? '/ngày' : ''}${isToday && i === 2 ? `, tính đến ${DEMO_SNAPSHOT}` : ''}).`,
    )
  }
  const withWait = data.rows.filter((r) => r.avgWait !== null)
  if (ready && withWait.length) {
    const top = withWait.reduce((a, b) => ((b.avgWait ?? 0) > (a.avgWait ?? 0) ? b : a))
    const over = (top.avgWait ?? 0) >= top.cfg.maxWaitMin * 0.8
    insights.push(
      `${top.cfg.name} có thời gian chờ TB cao nhất (${top.avgWait} phút; ngưỡng ${top.cfg.maxWaitMin} phút)${over ? ' – cần được kiểm tra.' : ', vẫn trong ngưỡng.'}`,
    )
  }
  if (ready && data.arrivals > 0)
    insights.push(`Tỷ lệ qua lượt ${((data.skipped / data.arrivals) * 100).toFixed(1)}% (${data.skipped} / ${data.arrivals} lượt tiếp nhận, ${rangeLabel.toLowerCase()}).`)

  const active = scopedClinics.filter((c) => c.status === 'active').length
  const paused = scopedClinics.length - active
  const scheduled = scopedClinics.filter((c) => c.id !== '203').length

  const kpiValue = (v: number) => (view === 'loading' ? <Skeleton className="h-8 w-16" /> : view === 'error' || view === 'empty' ? '—' : v)

  return (
    <div className="min-w-0 flex-1">
      <AdminHeader
        crumb="Quản trị / Tổng quan bệnh viện"
        title="Tổng quan bệnh viện"
        subtitle="Theo dõi tình hình tiếp nhận, hàng đợi và hiệu suất vận hành toàn viện"
        user={user}
        onLogout={onLogout}
        notify={notify}
      />

      <div className="space-y-4 px-7 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DemoBar view={demoView} onView={setDemoView} />
          <FilterBar f={f} update={update} clinics={store.clinics} refreshing={refreshing} onRefresh={reload} />
        </div>
        <StaleNotice view={view} />

        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            label={isToday ? "Lượt tiếp nhận hôm nay" : "Lượt tiếp nhận"}
            value={kpiValue(data.arrivals)}
            sub={isToday ? 'Tổng lượt tiếp nhận trong ngày' : `Tổng lượt tiếp nhận · ${rangeLabel.toLowerCase()}`}
            icon={<ClipboardList size={16} />}
            accent="blue"
            extra={ready && <Delta now={data.arrivals} prev={data.prevArrivals} label={prevLabel} />}
          />
          <KpiCard
            label="Đang chờ"
            value={kpiValue(data.waiting)}
            sub={isToday ? 'Lượt đang chờ tại các phòng khám' : `Hiện tại (${DEMO_SNAPSHOT}) · không theo khoảng thời gian`}
            icon={<Clock size={16} />}
            accent="orange"
            emphasize={ready && attention}
          />
          <KpiCard
            label="Đang phục vụ"
            value={kpiValue(data.serving)}
            sub={isToday ? 'Lượt đã bắt đầu phục vụ' : `Hiện tại (${DEMO_SNAPSHOT}) · không theo khoảng thời gian`}
            icon={<Activity size={16} />}
            accent="teal"
          />
          <KpiCard
            label="Đã hoàn thành"
            value={kpiValue(data.completed)}
            sub={isToday ? 'Lượt hoàn thành trong ngày' : `Lượt hoàn thành · ${rangeLabel.toLowerCase()}`}
            icon={<CheckCircle2 size={16} />}
            accent="green"
            extra={ready && <Delta now={data.completed} prev={data.prevCompleted} label={prevLabel} />}
          />
        </div>

        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-4">
          <div className="min-w-0 space-y-4">
            <Panel
              title="Lưu lượng tiếp nhận theo thời gian"
              subtitle="Theo dõi số lượt tiếp nhận để nhận diện giờ cao điểm"
              actions={
                <Segmented
                  value={chartMode}
                  onChange={setMode}
                  options={[
                    { id: 'hour', label: 'Theo giờ' },
                    { id: 'day', label: 'Theo ngày', disabled: !multiDay, hint: multiDay ? undefined : 'Chọn 7 hoặc 30 ngày để xem theo ngày' },
                  ]}
                />
              }
            >
              <StateGate view={view} onRetry={retry} rows={6}>
                <BarChart data={chart} yLabel="Lượt" xLabel={chartMode === 'hour' ? (multiDay ? 'Khung giờ · trung bình mỗi ngày' : 'Khung giờ') : 'Ngày'} />
                <p className="mt-2 flex flex-wrap items-center gap-x-3 text-[11.5px] text-muted">
                  <span>Minh họa · {rangeLabel}</span>
                  {isToday && chartMode === 'hour' && (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <span className="size-2.5 rounded-sm bg-brand/45" /> Khung giờ đang diễn ra
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="size-2.5 rounded-sm border border-dashed border-slate-300" /> Chưa đến
                      </span>
                    </>
                  )}
                </p>
              </StateGate>
            </Panel>

            <Panel title="Hiệu suất phòng khám" subtitle="So sánh khối lượng tiếp nhận và tình trạng hàng đợi" bodyClass="">
              <div className="p-0">
                {view === 'ready' || view === 'stale' ? (
                  <PerformanceTable rows={shownRows} isToday={isToday} onOpen={(c) => setDrawer(c)} />
                ) : (
                  <div className="p-5">
                    <StateGate view={view} onRetry={retry} rows={6}>
                      {null}
                    </StateGate>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-line px-5 py-2.5 text-[11.5px] text-muted">
                <span>TG chờ: trung bình thực tế của các lượt đã hoàn thành. Trạng thái theo ngưỡng cấu hình, tại {DEMO_SNAPSHOT}.</span>
                {sorted.length > 6 && ready && (
                  <button onClick={() => setShowAll((s) => !s)} className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand hover:underline">
                    {showAll ? 'Thu gọn' : `Xem tất cả phòng khám (${sorted.length})`} <ArrowRight size={13} />
                  </button>
                )}
              </div>
            </Panel>
          </div>

          <div className="min-w-0 space-y-4">
            <Panel
              title="Cảnh báo vận hành"
              subtitle="Các vấn đề cần ưu tiên theo dõi"
              bodyClass="p-2"
              actions={
                ready && alerts.length ? (
                  <span className="tabular rounded-full bg-slate-100 px-2 py-0.5 text-[11.5px] font-semibold text-slate-600">{alerts.length}</span>
                ) : null
              }
            >
              <div className="p-1">
                <StateGate view={view} onRetry={retry} emptyTitle="Không có cảnh báo cần xử lý">
                  {alerts.length ? (
                    <ul className="divide-y divide-line">
                      {alerts.map((a) => {
                        const meta = {
                          critical: { Icon: AlertOctagon, cls: 'text-red-600 bg-red-50', bar: 'bg-red-500' },
                          warning: { Icon: AlertTriangle, cls: 'text-orange-600 bg-orange-50', bar: 'bg-orange-500' },
                          info: { Icon: Info, cls: 'text-brand bg-brand-soft', bar: 'bg-brand' },
                          muted: { Icon: PauseCircle, cls: 'text-slate-500 bg-slate-100', bar: 'bg-slate-300' },
                        }[a.severity]
                        return (
                          <li key={a.id} className="relative flex gap-3 py-2.5 pr-2 pl-3">
                            <span className={`absolute inset-y-2.5 left-0 w-[3px] rounded ${meta.bar}`} />
                            <span className={`grid size-7 shrink-0 place-items-center rounded-md ${meta.cls}`}>
                              <meta.Icon size={15} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[13px] font-semibold text-ink">{a.title}</span>
                                <span className="tabular shrink-0 text-[11.5px] text-muted">{a.at}</span>
                              </div>
                              <p className="text-[12.5px] text-slate-600">{a.text}</p>
                              <button onClick={() => setDrawer(a.clinic)} className="mt-0.5 inline-flex items-center gap-0.5 text-[12px] font-semibold text-brand hover:underline">
                                {a.severity === 'critical' || a.severity === 'warning' ? 'Xem phòng khám' : 'Xem chi tiết'} <ChevronRight size={13} />
                              </button>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <EmptyState title="Không có cảnh báo cần xử lý" icon={<CheckCircle2 size={19} />} />
                  )}
                </StateGate>
              </div>
            </Panel>

            <Panel title="Nguồn lực & công suất" subtitle="Theo dõi khả năng tiếp nhận của bệnh viện">
              <StateGate view={view} onRetry={retry}>
                <div className="space-y-4">
                  <section>
                    <h3 className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">Phòng khám</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span className="flex-1 text-[12.5px] text-slate-600">Phòng khám đang hoạt động</span>
                        <b className="tabular text-[16px] text-ink">{active}</b>
                      </div>
                      <div className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2">
                        <span className="size-2 rounded-full bg-slate-400" />
                        <span className="flex-1 text-[12.5px] text-slate-600">Phòng khám tạm dừng</span>
                        <b className="tabular text-[16px] text-ink">{paused}</b>
                      </div>
                    </div>
                  </section>
                  <section>
                    <h3 className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">Nhân sự</h3>
                    <dl className="divide-y divide-line rounded-lg border border-line text-[12.5px]">
                      <div className="flex items-center gap-2.5 px-3 py-2">
                        <Stethoscope size={14} className="text-slate-400" />
                        <dt className="flex-1 text-slate-600">Bác sĩ theo lịch làm việc</dt>
                        <dd className="tabular text-[15px] font-bold text-ink">{scheduled}</dd>
                      </div>
                      <div className="flex items-center gap-2.5 px-3 py-2">
                        <Users size={14} className="text-slate-400" />
                        <dt className="flex-1 text-slate-600">Nhân sự đã xác nhận có mặt</dt>
                        <dd className="text-[12px] font-medium text-slate-400">Chưa có dữ liệu chấm công</dd>
                      </div>
                    </dl>
                  </section>
                  <section>
                    <h3 className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">Mức sử dụng công suất</h3>
                    <div className="flex items-start gap-2.5 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-3 py-2.5">
                      <Database size={15} className="mt-0.5 shrink-0 text-slate-400" />
                      <div>
                        <div className="text-[13px] font-semibold text-slate-700">Chưa đủ dữ liệu để tính công suất</div>
                        <p className="text-[12px] text-muted">Cần bổ sung lịch làm việc và thời gian sử dụng thực tế</p>
                      </div>
                    </div>
                  </section>
                  <button
                    onClick={() => onNavigate('resources')}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-line text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Xem chi tiết nguồn lực <ArrowRight size={14} />
                  </button>
                </div>
              </StateGate>
            </Panel>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-4">
          <section>
            <h2 className="mb-2 text-[13px] font-bold text-ink">Truy cập nhanh</h2>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['accounts', 'Quản lý tài khoản', 'Nhân viên và bệnh nhân', Users],
                  ['analytics', 'Phân tích & báo cáo', 'Xu hướng và so sánh phòng khám', BarChart3],
                  ['resources', 'Nguồn lực & công suất', 'Lịch làm việc, tình trạng phòng', Building2],
                  ['audit', 'Nhật ký hệ thống', 'Lịch sử thao tác quản trị', ScrollText],
                ] as const
              ).map(([k, label, desc, Icon]) => (
                <button key={k} onClick={() => onNavigate(k)} className="group flex items-center gap-3 rounded-lg border border-line bg-white px-3.5 py-2.5 text-left hover:border-brand/30 hover:bg-brand-soft/30">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-ink">{label}</span>
                    <span className="block truncate text-[12px] text-muted">{desc}</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-brand" />
                </button>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-ink">
              <Lightbulb size={14} className="text-slate-500" /> Nhận định vận hành
            </h2>
            <div className="rounded-lg border border-line bg-white px-4 py-3">
              {insights.length ? (
                <ul className="space-y-1.5 text-[12.5px] text-slate-700">
                  {insights.map((s) => (
                    <li key={s} className="flex gap-2">
                      <span className="mt-[7px] size-1 shrink-0 rounded-full bg-slate-400" /> {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12.5px] text-muted">Chưa đủ dữ liệu để đưa ra nhận định cho phạm vi đã chọn.</p>
              )}
              <p className="mt-2 text-[11px] text-slate-400">Tính từ dữ liệu minh họa theo bộ lọc hiện tại.</p>
            </div>
          </section>
        </div>
      </div>

      {drawer && (
        <ClinicDrawer
          clinic={store.clinics.find((c) => c.id === drawer.id) ?? drawer}
          canOpenBoard={roomIds.includes(drawer.id)}
          onOpenBoard={() => onNavigate('ops')}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}

function PerformanceTable({ rows, isToday, onOpen }: { rows: ClinicRow[]; isToday: boolean; onOpen: (c: ClinicCfg) => void }) {
  if (!rows.length) return <EmptyState title="Không có phòng khám trong phạm vi đã chọn" />
  const th = 'px-3 py-2 text-left align-bottom text-[10.5px] leading-tight font-semibold tracking-wide text-muted uppercase'
  return (
    <table className="w-full table-fixed text-[12.5px]">
      <colgroup>
        <col />
        <col className="w-[76px]" />
        <col className="w-[62px]" />
        <col className="w-[64px]" />
        <col className="w-[80px]" />
        <col className="w-[148px]" />
        <col className="w-[44px] min-[1536px]:w-[112px]" />
      </colgroup>
      <thead className="border-b border-line bg-slate-50/70">
        <tr>
          <th className={`${th} pl-5`}>Phòng khám</th>
          <th className={th}>Khoa</th>
          <th className={`${th} text-right`} title={isToday ? undefined : `Hiện tại (${DEMO_SNAPSHOT})`}>
            Đang chờ
          </th>
          <th className={`${th} text-right`} title="Trung bình thực tế của lượt đã hoàn thành">
            TG chờ
          </th>
          <th className={`${th} text-right`}>Đã hoàn thành</th>
          <th className={th}>Trạng thái</th>
          <th className={`${th} pr-5 text-right`}>
            <span className="sr-only">Chi tiết</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {rows.map((r) => (
          <tr key={r.cfg.id} onClick={() => onOpen(r.cfg)} className="cursor-pointer hover:bg-slate-50">
            <td className="py-2.5 pr-3 pl-5 leading-snug font-semibold text-ink">{r.cfg.name}</td>
            <td className="px-3 text-slate-600">{deptName(r.cfg.dept)}</td>
            <td className={`tabular px-3 text-right font-semibold ${r.waiting > r.cfg.maxQueue ? 'text-red-600' : 'text-ink'}`}>{r.waiting}</td>
            <td className={`tabular px-3 text-right ${(r.avgWait ?? 0) > r.cfg.maxWaitMin ? 'font-semibold text-red-600' : 'text-slate-700'}`}>
              {r.avgWait === null ? '—' : `${r.avgWait} ph`}
            </td>
            <td className="tabular px-3 text-right text-slate-700">{r.completed}</td>
            <td className="px-3">
              <ClinicBadge state={r.state} />
            </td>
            <td className="pr-5 text-right">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen(r.cfg)
                }}
                title="Xem chi tiết"
                className="inline-flex items-center gap-1 text-[12px] font-semibold whitespace-nowrap text-brand hover:underline"
              >
                <span className="hidden min-[1536px]:inline">Xem chi tiết</span> <ArrowRight size={13} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
