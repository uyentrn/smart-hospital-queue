import { useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { DEMO_SNAPSHOT, DEPARTMENTS, RANGES, SERVICES, type ClinicCfg, type Filters, type DeptId, type RangeId, type ServiceId } from './demo'
import { RefreshButton, Select, type ViewState } from './ui'

export function useFilters(withService = false) {
  const [f, setF] = useState<Filters>({ range: 'today', dept: 'all', clinic: 'all', ...(withService ? { service: 'all' as const } : {}) })
  const [demoView, setDemoView] = useState<ViewState>('ready')
  const [refreshing, setRefreshing] = useState(false)

  // Simulated partial reload whenever filters change or the user refreshes.
  const reload = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 650)
  }
  const update = (patch: Partial<Filters>) => {
    setF((x) => ({ ...x, ...patch }))
    reload()
  }
  const view: ViewState = refreshing ? 'loading' : demoView
  return { f, update, view, demoView, setDemoView, refreshing, reload, retry: () => (setDemoView('ready'), reload()) }
}

export function FilterBar({
  f,
  update,
  clinics,
  refreshing,
  onRefresh,
  withService,
}: {
  f: Filters
  update: (p: Partial<Filters>) => void
  clinics: ClinicCfg[]
  refreshing: boolean
  onRefresh: () => void
  withService?: boolean
}) {
  const inDept = clinics.filter((c) => f.dept === 'all' || c.dept === f.dept)
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="mr-1 inline-flex items-center gap-1.5 text-[12px] text-muted" title="Thời điểm chụp dữ liệu minh họa">
        <Clock size={13} /> Cập nhật lúc <b className="tabular font-semibold text-slate-700">{DEMO_SNAPSHOT}</b>
      </span>
      <Select<RangeId> label="Khoảng thời gian" value={f.range} onChange={(range) => update({ range })} options={RANGES.map((r) => ({ id: r.id, label: r.label }))} />
      <Select<DeptId | 'all'>
        label="Khoa"
        value={f.dept}
        onChange={(dept) => update({ dept, clinic: 'all' })}
        options={[{ id: 'all', label: 'Tất cả khoa' }, ...DEPARTMENTS.map((d) => ({ id: d.id, label: d.name }))]}
      />
      <Select<string>
        label="Phòng khám"
        className="max-w-[210px]"
        value={f.clinic}
        onChange={(clinic) => update({ clinic })}
        options={[{ id: 'all', label: 'Tất cả phòng khám' }, ...inDept.map((c) => ({ id: c.id, label: c.name }))]}
      />
      {withService && (
        <Select<ServiceId | 'all'>
          label="Dịch vụ"
          value={f.service ?? 'all'}
          onChange={(service) => update({ service })}
          options={[{ id: 'all', label: 'Tất cả dịch vụ' }, ...SERVICES.map((s) => ({ id: s.id, label: s.name }))]}
        />
      )}
      <RefreshButton loading={refreshing} onClick={onRefresh} />
    </div>
  )
}

export function StaleNotice({ view }: { view: ViewState }) {
  if (view !== 'stale') return null
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-[12.5px] text-amber-900">
      <AlertTriangle size={15} className="shrink-0 text-amber-600" />
      <span>
        <b>Dữ liệu có thể đã cũ.</b> Lần đồng bộ gần nhất cách đây hơn 15 phút. Nhấn <b>Làm mới</b> để cập nhật.
      </span>
    </div>
  )
}
