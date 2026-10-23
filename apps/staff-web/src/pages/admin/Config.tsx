import { useState } from 'react'
import { Check, Plus, Settings2 } from 'lucide-react'
import { DEPARTMENTS, deptName, SERVICES, WATCH_RATIO, type ClinicCfg } from '../../admin/demo'
import { AdminHeader, Panel } from '../../admin/ui'
import type { AdminPageProps } from '../../admin/store'
import { Modal, btn } from '../../components/ui'

type Tab = 'dept' | 'clinic' | 'service' | 'relation' | 'queue'
const TABS: { id: Tab; label: string }[] = [
  { id: 'dept', label: 'Khoa' },
  { id: 'clinic', label: 'Phòng khám' },
  { id: 'service', label: 'Loại dịch vụ' },
  { id: 'relation', label: 'Dịch vụ – Phòng khám' },
  { id: 'queue', label: 'Hàng đợi & ngưỡng cảnh báo' },
]

export default function Config({ user, store, notify, onLogout }: AdminPageProps) {
  const [tab, setTab] = useState<Tab>('clinic')
  const [draft, setDraft] = useState<ClinicCfg[] | null>(null)
  const [confirm, setConfirm] = useState(false)
  const list = draft ?? store.clinics
  const edit = (id: string, patch: Partial<ClinicCfg>) => setDraft((d) => (d ?? store.clinics).map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const changes = draft
    ? draft.flatMap((c) => {
        const o = store.clinics.find((x) => x.id === c.id)!
        const out: { clinic: string; field: string; before: string; after: string }[] = []
        if (o.status !== c.status) out.push({ clinic: c.name, field: 'Trạng thái', before: o.status === 'active' ? 'Hoạt động' : 'Tạm dừng', after: c.status === 'active' ? 'Hoạt động' : 'Tạm dừng' })
        if (o.maxQueue !== c.maxQueue) out.push({ clinic: c.name, field: 'Tối đa hàng chờ', before: `${o.maxQueue}`, after: `${c.maxQueue}` })
        if (o.maxWaitMin !== c.maxWaitMin) out.push({ clinic: c.name, field: 'Ngưỡng TG chờ (phút)', before: `${o.maxWaitMin}`, after: `${c.maxWaitMin}` })
        SERVICES.forEach((s) => {
          if (o.services.includes(s.id) !== c.services.includes(s.id))
            out.push({ clinic: c.name, field: s.name, before: o.services.includes(s.id) ? 'Có' : 'Không', after: c.services.includes(s.id) ? 'Có' : 'Không' })
        })
        return out
      })
    : []
  const invalid = list.some((c) => !(c.maxQueue >= 1 && c.maxWaitMin >= 1) || c.services.length === 0)

  const th = 'px-3 py-2 text-left text-[10.5px] font-semibold tracking-wide text-muted uppercase'
  const numInput = (value: number, onChange: (n: number) => void, label: string) => (
    <input
      type="number"
      min={1}
      aria-label={label}
      value={Number.isNaN(value) ? '' : value}
      onChange={(e) => onChange(e.target.valueAsNumber)}
      className={`tabular h-8 w-20 rounded-md border px-2 text-right text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 ${value >= 1 ? 'border-line' : 'border-red-400'}`}
    />
  )

  return (
    <div className="min-w-0 flex-1">
      <AdminHeader crumb="Quản trị / Cấu hình bệnh viện" title="Cấu hình bệnh viện" subtitle="Khoa, phòng khám, dịch vụ và quy tắc hàng đợi" user={user} onLogout={onLogout} notify={notify} />
      <div className="space-y-4 px-7 py-5">
        <div className="flex items-center justify-between gap-3">
          <div role="tablist" className="flex rounded-lg bg-white p-1 ring-1 ring-line">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`h-8 rounded-md px-3 text-[13px] font-semibold whitespace-nowrap ${tab === t.id ? 'bg-brand-soft text-brand' : 'text-slate-600 hover:text-ink'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {draft && (
            <div className="flex items-center gap-2">
              <span className="text-[12.5px] text-amber-700">{changes.length} thay đổi chưa lưu</span>
              <button className={`${btn.base} ${btn.ghost} h-9 px-3 text-[13px]`} onClick={() => setDraft(null)}>
                Hủy
              </button>
              <button disabled={!changes.length || invalid} onClick={() => setConfirm(true)} className={`${btn.base} ${btn.primary} h-9 px-3 text-[13px]`}>
                Lưu thay đổi
              </button>
            </div>
          )}
        </div>

        {tab === 'dept' && (
          <Panel
            title="Danh sách khoa"
            subtitle={`${DEPARTMENTS.length} khoa`}
            bodyClass=""
            actions={
              <button onClick={() => notify('Thêm khoa (mô phỏng)')} className={`${btn.base} ${btn.secondary} h-9 px-3 text-[13px]`}>
                <Plus size={15} /> Thêm khoa
              </button>
            }
          >
            <table className="w-full text-[13px]">
              <thead className="border-b border-line bg-slate-50/70">
                <tr>
                  <th className={`${th} pl-5`}>Mã khoa</th>
                  <th className={th}>Tên khoa</th>
                  <th className={th}>Trưởng khoa</th>
                  <th className={th}>Vị trí</th>
                  <th className={`${th} pr-5 text-right`}>Số phòng khám</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {DEPARTMENTS.map((d) => (
                  <tr key={d.id}>
                    <td className="py-2.5 pr-3 pl-5 font-mono text-[12.5px] text-slate-600">{d.code}</td>
                    <td className="px-3 font-semibold text-ink">{d.name}</td>
                    <td className="px-3 text-slate-700">{d.head}</td>
                    <td className="px-3 text-slate-600">{d.location}</td>
                    <td className="tabular px-3 pr-5 text-right">{store.clinics.filter((c) => c.dept === d.id).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {tab === 'clinic' && (
          <Panel
            title="Phòng khám"
            subtitle="Tạm dừng thay vì xóa để giữ lịch sử hàng đợi"
            bodyClass=""
            actions={
              <button onClick={() => notify('Thêm phòng khám (mô phỏng)')} className={`${btn.base} ${btn.secondary} h-9 px-3 text-[13px]`}>
                <Plus size={15} /> Thêm phòng khám
              </button>
            }
          >
            <table className="w-full text-[13px]">
              <thead className="border-b border-line bg-slate-50/70">
                <tr>
                  <th className={`${th} pl-5`}>Mã</th>
                  <th className={th}>Tên phòng khám</th>
                  <th className={th}>Khoa</th>
                  <th className={th}>Giờ hoạt động</th>
                  <th className={th}>Bác sĩ phụ trách</th>
                  <th className={`${th} pr-5`}>Trạng thái tiếp nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((c) => (
                  <tr key={c.id}>
                    <td className="tabular py-2 pr-3 pl-5 text-slate-600">{c.id}</td>
                    <td className="px-3 font-semibold text-ink">{c.name}</td>
                    <td className="px-3 text-slate-600">{deptName(c.dept)}</td>
                    <td className="tabular px-3 text-slate-600">{c.hours}</td>
                    <td className="px-3 text-slate-700">{c.doctor}</td>
                    <td className="px-3 pr-5">
                      <div className="inline-flex rounded-md bg-slate-100 p-0.5">
                        {(['active', 'paused'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => edit(c.id, { status: s })}
                            className={`h-7 rounded px-2.5 text-[12px] font-semibold ${c.status === s ? (s === 'active' ? 'bg-white text-emerald-700 shadow-sm' : 'bg-white text-slate-700 shadow-sm') : 'text-muted'}`}
                          >
                            {s === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {tab === 'service' && (
          <Panel
            title="Loại dịch vụ"
            subtitle={`${SERVICES.length} loại dịch vụ khám`}
            bodyClass=""
            actions={
              <button onClick={() => notify('Thêm loại dịch vụ (mô phỏng)')} className={`${btn.base} ${btn.secondary} h-9 px-3 text-[13px]`}>
                <Plus size={15} /> Thêm dịch vụ
              </button>
            }
          >
            <table className="w-full text-[13px]">
              <thead className="border-b border-line bg-slate-50/70">
                <tr>
                  <th className={`${th} pl-5`}>Mã</th>
                  <th className={th}>Tên dịch vụ</th>
                  <th className={th}>Thời lượng định mức</th>
                  <th className={th}>Thanh toán BHYT</th>
                  <th className={`${th} pr-5 text-right`}>Số phòng áp dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {SERVICES.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 pr-3 pl-5 font-mono text-[12.5px] text-slate-600">{s.code}</td>
                    <td className="px-3 font-semibold text-ink">{s.name}</td>
                    <td className="tabular px-3 text-slate-700">{s.normMin} phút / lượt</td>
                    <td className="px-3 text-slate-700">{s.insured ? 'Có' : 'Không'}</td>
                    <td className="tabular px-3 pr-5 text-right">{store.clinics.filter((c) => c.services.includes(s.id)).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {tab === 'relation' && (
          <Panel title="Dịch vụ – Phòng khám" subtitle="Dịch vụ mà mỗi phòng khám được phép tiếp nhận · mỗi phòng cần ít nhất 1 dịch vụ" bodyClass="">
            <table className="w-full text-[13px]">
              <thead className="border-b border-line bg-slate-50/70">
                <tr>
                  <th className={`${th} pl-5`}>Phòng khám</th>
                  {SERVICES.map((s) => (
                    <th key={s.id} className={`${th} w-[150px] text-center`}>
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((c) => (
                  <tr key={c.id} className={c.services.length ? '' : 'bg-red-50/50'}>
                    <td className="py-2 pr-3 pl-5 font-semibold text-ink">{c.name}</td>
                    {SERVICES.map((s) => {
                      const on = c.services.includes(s.id)
                      return (
                        <td key={s.id} className="px-3 text-center">
                          <button
                            role="checkbox"
                            aria-checked={on}
                            aria-label={`${c.name} – ${s.name}`}
                            onClick={() => edit(c.id, { services: on ? c.services.filter((x) => x !== s.id) : [...c.services, s.id] })}
                            className={`inline-grid size-5 place-items-center rounded border-2 ${on ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white hover:border-slate-400'}`}
                          >
                            {on && <Check size={12} strokeWidth={3} />}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {tab === 'queue' && (
          <Panel
            title="Hàng đợi & ngưỡng cảnh báo"
            subtitle={`Quá ngưỡng khi vượt một trong hai ngưỡng · "Cần theo dõi" từ ${Math.round(WATCH_RATIO * 100)}% ngưỡng · Không đánh giá quá tải chỉ dựa trên số lượt tiếp nhận`}
            bodyClass=""
          >
            <table className="w-full text-[13px]">
              <thead className="border-b border-line bg-slate-50/70">
                <tr>
                  <th className={`${th} pl-5`}>Phòng khám</th>
                  <th className={th}>Khoa</th>
                  <th className={`${th} text-right`}>Tối đa hàng chờ (lượt)</th>
                  <th className={`${th} text-right`}>Ngưỡng TG chờ TB (phút)</th>
                  <th className={`${th} pr-5 text-right`}>Bắt đầu “Cần theo dõi”</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {list.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 pr-3 pl-5 font-semibold text-ink">{c.name}</td>
                    <td className="px-3 text-slate-600">{deptName(c.dept)}</td>
                    <td className="px-3 text-right">{numInput(c.maxQueue, (n) => edit(c.id, { maxQueue: n }), `Tối đa hàng chờ ${c.name}`)}</td>
                    <td className="px-3 text-right">{numInput(c.maxWaitMin, (n) => edit(c.id, { maxWaitMin: n }), `Ngưỡng thời gian chờ ${c.name}`)}</td>
                    <td className="tabular px-3 pr-5 text-right text-[12px] text-muted">
                      {c.maxQueue >= 1 ? Math.ceil(c.maxQueue * WATCH_RATIO) : '—'} lượt · {c.maxWaitMin >= 1 ? Math.ceil(c.maxWaitMin * WATCH_RATIO) : '—'} phút
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>

      {confirm && draft && (
        <Modal
          title="Xác nhận thay đổi cấu hình"
          subtitle={`${changes.length} thay đổi · áp dụng ngay cho cảnh báo và trạng thái phòng khám`}
          icon={<Settings2 size={18} />}
          width={540}
          onClose={() => setConfirm(false)}
          footer={
            <>
              <button className={`${btn.base} ${btn.ghost}`} onClick={() => setConfirm(false)}>
                Quay lại
              </button>
              <button
                className={`${btn.base} ${btn.primary}`}
                onClick={() => {
                  store.saveClinics(draft)
                  const byClinic = [...new Set(changes.map((c) => c.clinic))]
                  byClinic.forEach((name) =>
                    store.log({
                      action: 'config',
                      entityType: 'Phòng khám',
                      entity: name,
                      details: 'Cập nhật cấu hình phòng khám',
                      changes: changes.filter((c) => c.clinic === name).map(({ field, before, after }) => ({ field, before, after })),
                    }),
                  )
                  notify(`Đã lưu ${changes.length} thay đổi cấu hình`)
                  setConfirm(false)
                  setDraft(null)
                }}
              >
                Xác nhận lưu
              </button>
            </>
          }
        >
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-left text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                <th className="py-1.5">Phòng khám</th>
                <th className="py-1.5">Thuộc tính</th>
                <th className="py-1.5 text-right">Trước → Sau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {changes.map((c, i) => (
                <tr key={i}>
                  <td className="py-1.5 pr-2 text-slate-700">{c.clinic}</td>
                  <td className="py-1.5 pr-2 text-slate-600">{c.field}</td>
                  <td className="tabular py-1.5 text-right">
                    <span className="text-slate-400 line-through">{c.before}</span> → <b className="text-ink">{c.after}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Modal>
      )}
    </div>
  )
}

