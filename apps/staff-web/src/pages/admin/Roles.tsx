import { useState } from 'react'
import { Check, Lock, Minus, Pencil, ShieldCheck } from 'lucide-react'
import { ROLE_LABEL, type Role } from '../../data'
import { ACTIONS, FEATURES, ROLE_META, type Action, type FeatureId, type Matrix } from '../../admin/access'
import { AdminHeader, Panel } from '../../admin/ui'
import type { AdminPageProps } from '../../admin/store'
import { Modal, btn } from '../../components/ui'

const ROLES: Role[] = ['admin', 'headnurse', 'nurse', 'doctor', 'patient']

export default function Roles({ user, users, store, notify, onLogout }: AdminPageProps) {
  const [sel, setSel] = useState<Role>('headnurse')
  const [draft, setDraft] = useState<Matrix | null>(null)
  const [confirm, setConfirm] = useState(false)
  const meta = ROLE_META[sel]
  const current = store.perms[sel]
  const matrix = draft ?? current
  const members = users.filter((u) => u.role === sel)
  const groups = [...new Set(FEATURES.map((f) => f.group))]

  const changes = draft
    ? FEATURES.flatMap((f) =>
        f.actions
          .filter((a) => draft[f.id].includes(a) !== current[f.id].includes(a))
          .map((a) => ({ field: `${f.label} · ${ACTIONS.find((x) => x.id === a)!.label}`, before: current[f.id].includes(a) ? 'Có' : 'Không', after: draft[f.id].includes(a) ? 'Có' : 'Không' })),
      )
    : []

  const toggle = (fid: FeatureId, a: Action) => {
    if (!draft) return
    const has = draft[fid].includes(a)
    // Any write permission implies view.
    let next = has ? draft[fid].filter((x) => x !== a) : [...draft[fid], a]
    if (!has && a !== 'view' && !next.includes('view')) next = [...next, 'view']
    if (has && a === 'view') next = []
    setDraft({ ...draft, [fid]: next })
  }

  return (
    <div className="min-w-0 flex-1">
      <AdminHeader crumb="Quản trị / Vai trò & phân quyền" title="Vai trò & phân quyền" subtitle="Quản lý vai trò, quyền theo chức năng và phạm vi truy cập" user={user} onLogout={onLogout} notify={notify} />
      <div className="grid grid-cols-[300px_minmax(0,1fr)] items-start gap-4 px-7 py-5">
        <Panel title="Danh sách vai trò" subtitle={`${ROLES.length} vai trò`} bodyClass="p-2">
          <ul className="space-y-1">
            {ROLES.map((r) => {
              const on = r === sel
              const count = users.filter((u) => u.role === r).length
              return (
                <li key={r}>
                  <button
                    onClick={() => {
                      setSel(r)
                      setDraft(null)
                    }}
                    className={`w-full rounded-lg border px-3 py-2.5 text-left ${on ? 'border-brand bg-brand-soft/50' : 'border-transparent hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink">
                        {ROLE_LABEL[r]} {ROLE_META[r].system && <Lock size={12} className="text-slate-400" />}
                      </span>
                      <span className="tabular rounded bg-slate-100 px-1.5 text-[11.5px] font-semibold text-slate-600" title="Số người dùng được gán">
                        {count}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-muted">
                      {ROLE_META[r].userType} · {ROLE_META[r].scope}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <div className="min-w-0 space-y-4">
          <Panel
            title={ROLE_LABEL[sel]}
            subtitle={meta.description}
            actions={
              meta.system ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[12px] font-medium text-slate-600">
                  <Lock size={12} /> Vai trò hệ thống – không thể chỉnh sửa
                </span>
              ) : draft ? (
                <>
                  <button className={`${btn.base} ${btn.ghost} h-9 px-3 text-[13px]`} onClick={() => setDraft(null)}>
                    Hủy
                  </button>
                  <button disabled={!changes.length} onClick={() => setConfirm(true)} className={`${btn.base} ${btn.primary} h-9 px-3 text-[13px]`}>
                    Lưu thay đổi {changes.length ? `(${changes.length})` : ''}
                  </button>
                </>
              ) : (
                <button onClick={() => setDraft(structuredClone(current))} className={`${btn.base} ${btn.secondary} h-9 px-3 text-[13px]`}>
                  <Pencil size={14} /> Chỉnh sửa quyền
                </button>
              )
            }
          >
            <dl className="grid grid-cols-3 gap-3 text-[12.5px]">
              {[
                ['Loại người dùng', meta.userType, 'Nhân viên hay bệnh nhân'],
                ['Vai trò được gán', ROLE_LABEL[sel], 'Quyết định quyền theo chức năng'],
                ['Phạm vi truy cập', meta.scope, 'Giới hạn dữ liệu được xem/thao tác'],
              ].map(([k, v, h]) => (
                <div key={k} className="rounded-lg border border-line px-3 py-2">
                  <dt className="text-[11.5px] text-muted">{k}</dt>
                  <dd className="text-[14px] font-semibold text-ink">{v}</dd>
                  <dd className="text-[11px] text-slate-400">{h}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 text-[12px] text-muted">
              Người dùng được gán ({members.length}):{' '}
              {members.length ? <span className="text-slate-700">{members.map((m) => m.fullName).join(', ')}</span> : <span>Chưa có</span>}
            </div>
          </Panel>

          <Panel title="Ma trận phân quyền theo chức năng" subtitle={draft ? 'Đang chỉnh sửa · cấp quyền Tạo/Sửa/Quản trị sẽ tự động cấp quyền Xem' : 'Chỉ xem'} bodyClass="">
            <table className="w-full text-[12.5px]">
              <thead className="border-b border-line bg-slate-50/70">
                <tr className="text-[10.5px] font-semibold tracking-wide text-muted uppercase">
                  <th className="px-5 py-2 text-left">Chức năng</th>
                  {ACTIONS.map((a) => (
                    <th key={a.id} className="w-[92px] px-2 py-2 text-center" title={a.hint}>
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              {groups.map((g) => (
                <tbody key={g} className="divide-y divide-line">
                  <tr className="bg-slate-50/40">
                    <td colSpan={5} className="px-5 pt-3 pb-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                      {g}
                    </td>
                  </tr>
                  {FEATURES.filter((f) => f.group === g).map((f) => (
                    <tr key={f.id}>
                      <td className="px-5 py-2 font-medium text-slate-700">{f.label}</td>
                      {ACTIONS.map((a) => {
                        const applicable = f.actions.includes(a.id)
                        const on = matrix[f.id].includes(a.id)
                        const changed = draft && on !== current[f.id].includes(a.id)
                        return (
                          <td key={a.id} className="px-2 py-1.5 text-center">
                            {!applicable ? (
                              <span className="text-slate-300" title="Không áp dụng">
                                <Minus size={14} className="inline" />
                              </span>
                            ) : draft ? (
                              <button
                                role="checkbox"
                                aria-checked={on}
                                aria-label={`${f.label} – ${a.label}`}
                                onClick={() => toggle(f.id, a.id)}
                                className={`inline-grid size-5 place-items-center rounded border-2 ${on ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white'} ${changed ? 'ring-2 ring-amber-300' : ''}`}
                              >
                                {on && <Check size={12} strokeWidth={3} />}
                              </button>
                            ) : on ? (
                              <Check size={16} className="inline text-emerald-600" aria-label="Có quyền" />
                            ) : (
                              <span className="inline-block size-1.5 rounded-full bg-slate-300" aria-label="Không có quyền" />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </Panel>
        </div>
      </div>

      {confirm && draft && (
        <Modal
          title="Xác nhận thay đổi phân quyền"
          subtitle={`Vai trò ${ROLE_LABEL[sel]} · ảnh hưởng ${members.length} người dùng`}
          icon={<ShieldCheck size={18} />}
          width={500}
          onClose={() => setConfirm(false)}
          footer={
            <>
              <button className={`${btn.base} ${btn.ghost}`} onClick={() => setConfirm(false)}>
                Quay lại
              </button>
              <button
                className={`${btn.base} ${btn.primary}`}
                onClick={() => {
                  store.savePermissions(sel, draft)
                  store.log({ action: 'permission', entityType: 'Vai trò', entity: ROLE_LABEL[sel], details: `Cập nhật ${changes.length} quyền`, changes })
                  notify(`Đã cập nhật phân quyền vai trò ${ROLE_LABEL[sel]}`)
                  setConfirm(false)
                  setDraft(null)
                }}
              >
                Xác nhận lưu
              </button>
            </>
          }
        >
          <ul className="max-h-60 divide-y divide-line overflow-y-auto rounded-lg border border-line text-[12.5px]">
            {changes.map((c) => (
              <li key={c.field} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-slate-700">{c.field}</span>
                <span className={`font-semibold ${c.after === 'Có' ? 'text-emerald-700' : 'text-red-600'}`}>{c.after === 'Có' ? 'Cấp quyền' : 'Thu hồi'}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12.5px] text-muted">Thay đổi được ghi vào Nhật ký hệ thống. Bản mẫu chưa áp dụng phân quyền này cho phiên đăng nhập đang chạy.</p>
        </Modal>
      )}
    </div>
  )
}
