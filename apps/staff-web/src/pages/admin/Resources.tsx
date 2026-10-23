import { useMemo, useState } from 'react'
import { CheckCircle2, CircleDashed, Database, MinusCircle } from 'lucide-react'
import { DEPARTMENTS, deptName, type DeptId } from '../../admin/demo'
import { AdminHeader, DemoBar, EmptyState, Panel, Select, StateGate, type ViewState } from '../../admin/ui'
import type { AdminPageProps } from '../../admin/store'

const shiftOf = (hours: string) => (hours.startsWith('13') ? 'Chiều · 13:00–16:30' : hours.endsWith('11:30') ? 'Sáng · 07:00–11:30' : 'Cả ngày · 07:00–16:30')

export default function Resources({ user, users, store, notify, onLogout }: AdminPageProps) {
  const [dept, setDept] = useState<DeptId | 'all'>('all')
  const [view, setView] = useState<ViewState>('ready')
  const clinics = store.clinics.filter((c) => dept === 'all' || c.dept === dept)

  const nurses = users.filter((u) => u.role === 'nurse')
  const schedule = useMemo(() => {
    const rows: { name: string; role: string; clinic: string; shift: string; status: 'scheduled' | 'off' | 'locked' }[] = []
    clinics.forEach((c) => {
      const off = c.id === '203'
      rows.push({ name: c.doctor, role: 'Bác sĩ', clinic: c.name, shift: off ? '—' : shiftOf(c.hours), status: off ? 'off' : 'scheduled' })
      nurses
        .filter((n) => n.room === c.id)
        .forEach((n) => rows.push({ name: n.fullName, role: 'Điều dưỡng', clinic: c.name, shift: n.status === 'locked' ? '—' : shiftOf(c.hours), status: n.status === 'locked' ? 'locked' : 'scheduled' }))
    })
    return rows
  }, [clinics, nurses])

  const active = clinics.filter((c) => c.status === 'active').length
  const docs = schedule.filter((s) => s.role === 'Bác sĩ' && s.status === 'scheduled').length
  const nurseCount = schedule.filter((s) => s.role === 'Điều dưỡng' && s.status === 'scheduled').length
  const th = 'px-3 py-2 text-left text-[10.5px] font-semibold tracking-wide text-muted uppercase'
  const show = view === 'ready' || view === 'stale'

  const summary = (label: string, value: string | number, sub: string, muted?: boolean) => (
    <div className="rounded-xl border border-line bg-white px-4 py-3.5">
      <div className="text-[12.5px] font-semibold text-slate-600">{label}</div>
      <div className={`tabular mt-1 leading-none font-bold ${muted ? 'text-[14px] text-slate-400' : 'text-[26px] text-ink'}`}>{show ? value : '—'}</div>
      <div className="mt-2 text-[11.5px] text-muted">{sub}</div>
    </div>
  )

  return (
    <div className="min-w-0 flex-1">
      <AdminHeader
        crumb="Quản trị / Nguồn lực & công suất"
        title="Nguồn lực & công suất"
        subtitle="Lịch làm việc, tình trạng hoạt động phòng khám và khả năng tiếp nhận"
        user={user}
        onLogout={onLogout}
        notify={notify}
      />
      <div className="space-y-4 px-7 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DemoBar view={view} onView={setView} />
          <Select<DeptId | 'all'> label="Khoa" value={dept} onChange={setDept} options={[{ id: 'all', label: 'Tất cả khoa' }, ...DEPARTMENTS.map((d) => ({ id: d.id, label: d.name }))]} />
        </div>

        <div className="grid grid-cols-4 gap-4">
          {summary('Phòng khám đang hoạt động', `${active} / ${clinics.length}`, `${clinics.length - active} phòng tạm dừng`)}
          {summary('Bác sĩ theo lịch làm việc', docs, 'Theo lịch hôm nay (minh họa)')}
          {summary('Điều dưỡng theo lịch', nurseCount, 'Theo phân công phòng trong tài khoản')}
          {summary('Nhân sự đã xác nhận có mặt', 'Chưa có dữ liệu chấm công', 'Cần tích hợp hệ thống chấm công', true)}
        </div>

        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-4">
          <Panel title="Tình trạng hoạt động phòng khám" subtitle="Theo cấu hình phòng khám" bodyClass="">
            {show ? (
              <table className="w-full text-[12.5px]">
                <thead className="border-b border-line bg-slate-50/70">
                  <tr>
                    <th className={`${th} pl-5`}>Phòng khám</th>
                    <th className={th}>Khoa</th>
                    <th className={th}>Giờ hoạt động</th>
                    <th className={th}>Bác sĩ phụ trách</th>
                    <th className={`${th} pr-5`}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {clinics.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 pr-3 pl-5 font-semibold text-ink">{c.name}</td>
                      <td className="px-3 text-slate-600">{deptName(c.dept)}</td>
                      <td className="tabular px-3 text-slate-600">{c.hours}</td>
                      <td className="px-3 text-slate-700">{c.doctor}</td>
                      <td className="px-3 pr-5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-semibold ring-1 ring-inset ${
                            c.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-600 ring-slate-400/25'
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {c.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-5">
                <StateGate view={view} onRetry={() => setView('ready')}>
                  {null}
                </StateGate>
              </div>
            )}
          </Panel>

          <Panel title="Mức sử dụng công suất" subtitle="Thời gian sử dụng thực tế ÷ thời gian khả dụng theo lịch">
            <div className="flex items-start gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/60 px-4 py-3.5">
              <Database size={18} className="mt-0.5 shrink-0 text-slate-400" />
              <div>
                <div className="text-[14px] font-semibold text-slate-700">Chưa đủ dữ liệu để tính công suất</div>
                <p className="mt-0.5 text-[12.5px] text-muted">Cần bổ sung lịch làm việc và thời gian sử dụng thực tế. Hệ thống không suy ra công suất từ số lượt bệnh nhân.</p>
              </div>
            </div>
            <h3 className="mt-4 mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">Mức độ sẵn sàng dữ liệu</h3>
            <ul className="divide-y divide-line rounded-lg border border-line text-[12.5px]">
              {(
                [
                  ['Giờ hoạt động của phòng khám', 'Đã cấu hình', 'ok'],
                  ['Lịch làm việc theo ca', 'Minh họa · chưa đồng bộ hệ thống nhân sự', 'partial'],
                  ['Chấm công / xác nhận có mặt', 'Chưa có', 'none'],
                  ['Thời gian sử dụng phòng thực tế', 'Chưa có', 'none'],
                ] as const
              ).map(([k, v, s]) => (
                <li key={k} className="flex items-center gap-2.5 px-3 py-2">
                  {s === 'ok' ? <CheckCircle2 size={15} className="text-emerald-600" /> : s === 'partial' ? <CircleDashed size={15} className="text-amber-600" /> : <MinusCircle size={15} className="text-slate-400" />}
                  <span className="flex-1 text-slate-700">{k}</span>
                  <span className={`text-[12px] ${s === 'ok' ? 'text-emerald-700' : s === 'partial' ? 'text-amber-700' : 'text-slate-400'}`}>{v}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel title="Lịch làm việc hôm nay" subtitle="Phân biệt nhân sự theo lịch với nhân sự đã xác nhận có mặt · Dữ liệu minh họa" bodyClass="">
          {show ? (
            schedule.length ? (
              <table className="w-full text-[12.5px]">
                <thead className="border-b border-line bg-slate-50/70">
                  <tr>
                    <th className={`${th} pl-5`}>Nhân sự</th>
                    <th className={th}>Vai trò</th>
                    <th className={th}>Phòng khám</th>
                    <th className={th}>Ca làm việc</th>
                    <th className={th}>Lịch</th>
                    <th className={`${th} pr-5`}>Xác nhận có mặt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {schedule.map((s, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 pl-5 font-semibold text-ink">{s.name}</td>
                      <td className="px-3 text-slate-600">{s.role}</td>
                      <td className="px-3 text-slate-600">{s.clinic}</td>
                      <td className="tabular px-3 text-slate-700">{s.shift}</td>
                      <td className="px-3">
                        {s.status === 'scheduled' ? (
                          <span className="text-[12px] font-semibold text-emerald-700">Theo lịch</span>
                        ) : s.status === 'off' ? (
                          <span className="text-[12px] font-medium text-slate-500">Không xếp lịch (phòng tạm dừng)</span>
                        ) : (
                          <span className="text-[12px] font-medium text-red-600">Tài khoản đã khóa</span>
                        )}
                      </td>
                      <td className="px-3 pr-5 text-[12px] text-slate-400">Chưa có dữ liệu</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState title="Không có lịch làm việc trong phạm vi đã chọn" />
            )
          ) : (
            <div className="p-5">
              <StateGate view={view} onRetry={() => setView('ready')}>
                {null}
              </StateGate>
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}
