import { useMemo, useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { aggregate, DEMO_SNAPSHOT, deptName, HOURS, RANGES, SERVICES } from '../../admin/demo'
import { FilterBar, StaleNotice, useFilters } from '../../admin/filters'
import { AdminHeader, BarChart, DemoBar, EmptyState, Panel, Segmented, StateGate, type BarDatum } from '../../admin/ui'
import type { AdminPageProps } from '../../admin/store'
import { Modal, btn } from '../../components/ui'

const ddmm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—')

export default function Analytics({ user, store, notify, onLogout }: AdminPageProps) {
  const { f, update, view, demoView, setDemoView, refreshing, reload, retry } = useFilters(true)
  const [series, setSeries] = useState<'arrivals' | 'completed'>('arrivals')
  const [exporting, setExporting] = useState(false)
  const [format, setFormat] = useState<'xlsx' | 'pdf'>('xlsx')
  const d = useMemo(() => aggregate(store.clinics, f), [store.clinics, f])

  const range = RANGES.find((r) => r.id === f.range)!
  const period = f.range === 'today' ? `Hôm nay, tính đến ${DEMO_SNAPSHOT}` : range.label
  const multi = d.daily.length > 0
  const serviceName = f.service && f.service !== 'all' ? SERVICES.find((s) => s.id === f.service)!.name : 'Tất cả dịch vụ'

  const trend: BarDatum[] = multi
    ? d.daily.map((x) => ({ label: ddmm(x.date), value: x[series], tip: `${ddmm(x.date)} · ${x[series]} lượt ${series === 'arrivals' ? 'tiếp nhận' : 'hoàn thành'}` }))
    : HOURS.map((h, i) => ({ label: h, value: d.hourly[i], tip: d.hourly[i] === null ? `${h} · Chưa đến khung giờ` : `${h} · ${d.hourly[i]} lượt tiếp nhận` }))

  const rows = d.rows.filter((r) => r.arrivals > 0)
  const maxWait = Math.max(1, ...rows.map((r) => Math.max(r.avgWait ?? 0, r.cfg.maxWaitMin)))

  const stat = (label: string, value: string, def: string, sub?: string) => (
    <div className="rounded-xl border border-line bg-white px-4 py-3.5">
      <div className="text-[12.5px] font-semibold text-slate-600">{label}</div>
      <div className="tabular mt-1 text-[24px] leading-none font-bold text-ink">{view === 'ready' || view === 'stale' ? value : '—'}</div>
      {sub && <div className="mt-1 text-[12px] text-slate-600">{sub}</div>}
      <div className="mt-2 border-t border-line pt-1.5 text-[11px] leading-snug text-muted">{def}</div>
    </div>
  )

  return (
    <div className="min-w-0 flex-1">
      <AdminHeader
        crumb="Quản trị / Phân tích & báo cáo"
        title="Phân tích & báo cáo"
        subtitle="Xu hướng lưu lượng, thời gian chờ và hiệu suất phục vụ theo thời gian"
        user={user}
        onLogout={onLogout}
        notify={notify}
        actions={
          <button onClick={() => setExporting(true)} className={`${btn.base} ${btn.secondary} h-9 px-3 text-[13px]`}>
            <Download size={15} /> Xuất báo cáo
          </button>
        }
      />
      <div className="space-y-4 px-7 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DemoBar view={demoView} onView={setDemoView} />
          <FilterBar f={f} update={update} clinics={store.clinics} refreshing={refreshing} onRefresh={reload} withService />
        </div>
        <StaleNotice view={view} />

        <div className="grid grid-cols-4 gap-4">
          {stat('Lượt tiếp nhận', `${d.arrivals}`, `Kỳ đo: ${period} · ${serviceName}`)}
          {stat('Lượt hoàn thành', `${d.completed}`, 'Tỷ lệ = hoàn thành / tổng lượt tiếp nhận trong kỳ', `Tỷ lệ hoàn thành ${pct(d.completed, d.arrivals)}`)}
          <div className="rounded-xl border border-line bg-white px-4 py-3.5">
            <div className="text-[12.5px] font-semibold text-slate-600">Thời gian chờ</div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div>
                <div className="text-[11px] font-medium text-muted">Trung bình</div>
                <div className="tabular text-[22px] leading-tight font-bold text-ink">{view === 'ready' || view === 'stale' ? (d.avgWait ?? '—') : '—'}<span className="text-[13px] font-semibold text-muted"> ph</span></div>
              </div>
              <div className="border-l border-line pl-2">
                <div className="text-[11px] font-medium text-muted">Trung vị</div>
                <div className="tabular text-[22px] leading-tight font-bold text-ink">{view === 'ready' || view === 'stale' ? (d.medianWait ?? '—') : '—'}<span className="text-[13px] font-semibold text-muted"> ph</span></div>
              </div>
            </div>
            <div className="mt-2 border-t border-line pt-1.5 text-[11px] leading-snug text-muted">Từ check-in đến khi được gọi vào phòng · chỉ lượt đã hoàn thành (thực tế, không ước tính)</div>
          </div>
          {stat(
            'Qua lượt / Hủy lượt',
            `${pct(d.skipped, d.arrivals)} · ${pct(d.cancelled, d.arrivals)}`,
            'Mẫu số: tổng lượt tiếp nhận trong kỳ',
            `${d.skipped} qua lượt · ${d.cancelled} hủy / ${d.arrivals}`,
          )}
        </div>

        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-4">
          <Panel
            title={multi ? 'Xu hướng khối lượng theo ngày' : 'Lưu lượng tiếp nhận theo giờ'}
            subtitle={multi ? `${range.label} · ${serviceName}` : `${period} · ${serviceName}`}
            actions={
              multi && (
                <Segmented
                  value={series}
                  onChange={setSeries}
                  options={[
                    { id: 'arrivals', label: 'Tiếp nhận' },
                    { id: 'completed', label: 'Hoàn thành' },
                  ]}
                />
              )
            }
          >
            <StateGate view={view} onRetry={retry} rows={6}>
              <BarChart data={trend} yLabel="Lượt" xLabel={multi ? 'Ngày' : 'Khung giờ'} color={series === 'completed' && multi ? 'bg-emerald-500' : 'bg-brand'} />
              {!multi && <p className="mt-2 text-[11.5px] text-muted">Chọn 7 hoặc 30 ngày để xem xu hướng theo ngày.</p>}
            </StateGate>
          </Panel>

          <Panel title="So sánh thời gian chờ" subtitle="Trung bình và trung vị theo phòng khám · vạch đỏ: ngưỡng cấu hình">
            <StateGate view={view} onRetry={retry} rows={6}>
              {rows.length ? (
                <>
                  <ul className="space-y-2.5">
                    {rows.map((r) => (
                      <li key={r.cfg.id}>
                        <div className="flex items-baseline justify-between gap-2 text-[12px]">
                          <span className="truncate font-medium text-slate-700">{r.cfg.name}</span>
                          <span className="tabular shrink-0 text-muted">
                            TB <b className="text-ink">{r.avgWait}</b> · TV <b className="text-ink">{r.medianWait}</b> ph
                          </span>
                        </div>
                        <div className="relative mt-1 space-y-0.5">
                          <div className="h-2 rounded-sm bg-brand" style={{ width: `${((r.avgWait ?? 0) / maxWait) * 100}%` }} />
                          <div className="h-2 rounded-sm bg-brand/40" style={{ width: `${((r.medianWait ?? 0) / maxWait) * 100}%` }} />
                          <span className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-red-500" style={{ left: `${(r.cfg.maxWaitMin / maxWait) * 100}%` }} title={`Ngưỡng ${r.cfg.maxWaitMin} phút`} />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-4 text-[11.5px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-3 rounded-sm bg-brand" /> Trung bình
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-3 rounded-sm bg-brand/40" /> Trung vị
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3 w-0.5 bg-red-500" /> Ngưỡng
                    </span>
                  </div>
                </>
              ) : (
                <EmptyState title="Không có lượt hoàn thành trong kỳ" />
              )}
            </StateGate>
          </Panel>
        </div>

        <Panel title="So sánh phòng khám" subtitle={`Kỳ đo: ${period} · ${serviceName}`} bodyClass="">
          {view === 'ready' || view === 'stale' ? (
            rows.length ? (
              <table className="w-full text-[12.5px]">
                <thead className="border-b border-line bg-slate-50/70">
                  <tr className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                    {['Phòng khám', 'Khoa', 'Tiếp nhận', 'Hoàn thành', 'Tỷ lệ HT', 'TG chờ TB', 'TG chờ trung vị', 'Qua lượt', 'Hủy lượt'].map((h, i) => (
                      <th key={h} className={`px-3 py-2 ${i < 2 ? 'text-left' : 'text-right'} ${i === 0 ? 'pl-5' : ''} ${i === 8 ? 'pr-5' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.cfg.id} className="hover:bg-slate-50">
                      <td className="py-2 pr-3 pl-5 font-semibold text-ink">{r.cfg.name}</td>
                      <td className="px-3 text-slate-600">{deptName(r.cfg.dept)}</td>
                      <td className="tabular px-3 text-right">{r.arrivals}</td>
                      <td className="tabular px-3 text-right">{r.completed}</td>
                      <td className="tabular px-3 text-right">{pct(r.completed, r.arrivals)}</td>
                      <td className={`tabular px-3 text-right ${(r.avgWait ?? 0) > r.cfg.maxWaitMin ? 'font-semibold text-red-600' : ''}`}>{r.avgWait} ph</td>
                      <td className="tabular px-3 text-right">{r.medianWait} ph</td>
                      <td className="tabular px-3 text-right">{pct(r.skipped, r.arrivals)}</td>
                      <td className="tabular px-3 pr-5 text-right">{pct(r.cancelled, r.arrivals)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="Không có dữ liệu trong phạm vi đã chọn" />
            )
          ) : (
            <div className="p-5">
              <StateGate view={view} onRetry={retry}>
                {null}
              </StateGate>
            </div>
          )}
        </Panel>

        <Panel title="Định nghĩa chỉ số" bodyClass="px-5 py-3">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[12.5px]">
            {[
              ['Lượt tiếp nhận', 'Số lượt check-in thành công trong kỳ đo.'],
              ['Tỷ lệ hoàn thành', 'Lượt hoàn thành khám ÷ tổng lượt tiếp nhận trong kỳ.'],
              ['TG chờ trung bình / trung vị', 'Thời gian thực tế từ check-in đến lúc được gọi vào phòng, chỉ tính lượt đã hoàn thành.'],
              ['Tỷ lệ qua lượt / hủy lượt', 'Số lượt qua lượt (vắng mặt) hoặc bị hủy ÷ tổng lượt tiếp nhận trong kỳ.'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="w-44 shrink-0 font-semibold text-slate-700">{k}</dt>
                <dd className="text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      {exporting && (
        <Modal
          title="Xuất báo cáo"
          subtitle={`${period} · ${f.dept === 'all' ? 'Tất cả khoa' : deptName(f.dept)} · ${serviceName}`}
          icon={<Download size={18} />}
          width={460}
          onClose={() => setExporting(false)}
          footer={
            <>
              <button className={`${btn.base} ${btn.ghost}`} onClick={() => setExporting(false)}>
                Hủy
              </button>
              <button
                className={`${btn.base} ${btn.primary}`}
                onClick={() => {
                  setExporting(false)
                  store.log({ action: 'create', entityType: 'Báo cáo', entity: `Báo cáo vận hành (${format.toUpperCase()})`, details: `Xuất báo cáo · ${period}` })
                  notify(`Đã tạo tệp báo cáo .${format} (mô phỏng – chưa tải xuống)`)
                }}
              >
                Tạo báo cáo
              </button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['xlsx', 'Bảng tính Excel', FileSpreadsheet],
                ['pdf', 'Tài liệu PDF', FileText],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                onClick={() => setFormat(id)}
                className={`flex items-center gap-2.5 rounded-lg border px-3 py-3 text-left text-[13.5px] font-semibold ${format === id ? 'border-brand bg-brand-soft/50 text-brand ring-1 ring-brand' : 'border-line text-slate-700 hover:bg-slate-50'}`}
              >
                <Icon size={18} /> {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-muted">Báo cáo gồm các chỉ số trên trang theo bộ lọc hiện tại, kèm định nghĩa chỉ số và kỳ đo. Dữ liệu minh họa.</p>
        </Modal>
      )}
    </div>
  )
}
