import { useMemo, useState } from 'react'
import { BadgeCheck, Eye, KeyRound, Lock, Mail, MessageSquareText, Pencil, Phone, Plus, Search, ShieldAlert, Unlock, UserPlus, UserRound, Users } from 'lucide-react'
import { ROLE_LABEL, type Role, type Room, type User } from '../data'
import { ROLE_META } from '../admin/access'
import { AdminHeader, EmptyState, Select } from '../admin/ui'
import type { AdminPageProps, GuardianRecord } from '../admin/store'
import { Modal, btn, field, fieldLabel } from '../components/ui'

type Props = AdminPageProps & {
  rooms: Room[]
  onSave: (u: User, original?: string) => void
  onSetStatus: (username: string, status: User['status'], reason: string) => void
  onCredentialReset: (username: string, channel: 'email' | 'sms', revoke: boolean) => void
}

const ROLE_BADGE: Record<Role, string> = {
  admin: 'bg-[#0056b3] text-white',
  headnurse: 'bg-brand-soft text-brand',
  nurse: 'bg-slate-100 text-slate-700',
  doctor: 'bg-emerald-50 text-emerald-700',
  patient: 'bg-violet-50 text-violet-700',
}

type Tab = 'staff' | 'patient'

const today = () => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const EMPTY_STAFF: User = { username: '', password: '123', fullName: '', role: 'nurse', room: '101', status: 'active', email: '', phone: '' }
const EMPTY_PATIENT: User = { ...EMPTY_STAFF, role: 'patient', room: null, patientCode: '' }

// Nurses and doctors are assigned to a single clinic room.
const hasRoom = (r: Role) => r === 'nurse' || r === 'doctor'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const maskEmail = (e: string) => e.replace(/^(.)[^@]*(@.*)$/, '$1•••$2')
const maskPhone = (p: string) => p.replace(/\s/g, '').replace(/^(\d{4})\d+(\d{3})$/, '$1 ••• $2')

type PatientRow = { kind: 'account'; user: User } | { kind: 'guardian'; rec: GuardianRecord }
type Confirm = { user: User; to: User['status'] } | { rec: GuardianRecord; to: GuardianRecord['status'] }

function StatusPill({ locked, label }: { locked: boolean; label?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap ring-1 ring-inset ${
        locked ? 'bg-red-50 text-red-700 ring-red-600/25' : 'bg-emerald-50 text-emerald-700 ring-emerald-600/25'
      }`}
    >
      {locked ? <Lock size={11} /> : <span className="size-1.5 rounded-full bg-emerald-600" />}
      {label ?? (locked ? 'Đã khóa' : 'Hoạt động')}
    </span>
  )
}

export default function Accounts({ user: currentUser, users, rooms, store, notify, onLogout, onSave, onSetStatus, onCredentialReset }: Props) {
  const [tab, setTab] = useState<Tab>('staff')
  const [q, setQ] = useState('')
  const [role, setRole] = useState<Role | 'all'>('all')
  const [dept, setDept] = useState<'all' | 'noi' | 'hospital'>('all')
  const [room, setRoom] = useState<string>('all')
  const [status, setStatus] = useState<User['status'] | 'all'>('all')
  const [kind, setKind] = useState<'all' | 'account' | 'guardian'>('all')

  const [editing, setEditing] = useState<{ user: User; original?: string } | null>(null)
  const [editingRec, setEditingRec] = useState<GuardianRecord | null>(null)
  const [viewing, setViewing] = useState<PatientRow | { kind: 'staff'; user: User } | null>(null)
  const [resetting, setResetting] = useState<User | null>(null)
  const [channel, setChannel] = useState<'email' | 'sms'>('email')
  const [revoke, setRevoke] = useState(true)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [reason, setReason] = useState('Nghỉ việc / chuyển công tác')

  const roomName = (id: string | null) => (id ? (rooms.find((r) => r.id === id)?.name ?? id) : null)
  const norm = (s: string) => s.toLowerCase()
  const k = norm(q.trim())

  const staff = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role !== 'patient' &&
          (role === 'all' || u.role === role) &&
          (dept === 'all' || (dept === 'noi' ? !!u.room : !u.room)) &&
          (room === 'all' || u.room === room) &&
          (status === 'all' || u.status === status) &&
          (!k || [u.username, u.fullName, u.email, u.phone].some((v) => norm(v).includes(k))),
      ),
    [users, role, dept, room, status, k],
  )

  const patients: PatientRow[] = useMemo(() => {
    const acc: PatientRow[] = users.filter((u) => u.role === 'patient').map((user) => ({ kind: 'account' as const, user }))
    const rec: PatientRow[] = store.records.map((r) => ({ kind: 'guardian' as const, rec: r }))
    return [...acc, ...rec].filter((r) => {
      if (kind !== 'all' && r.kind !== kind) return false
      const st = r.kind === 'account' ? r.user.status : r.rec.status
      if (status !== 'all' && st !== status) return false
      if (!k) return true
      const hay = r.kind === 'account' ? [r.user.fullName, r.user.patientCode ?? '', r.user.phone, r.user.email] : [r.rec.fullName, r.rec.code, r.rec.guardianName, r.rec.guardianPhone]
      return hay.some((v) => norm(v).includes(k))
    })
  }, [users, store.records, kind, status, k])

  const staffCount = users.filter((u) => u.role !== 'patient').length
  const patientCount = users.filter((u) => u.role === 'patient').length + store.records.length
  const filtersActive = q || role !== 'all' || dept !== 'all' || room !== 'all' || status !== 'all' || kind !== 'all'
  const clearFilters = () => {
    setQ('')
    setRole('all')
    setDept('all')
    setRoom('all')
    setStatus('all')
    setKind('all')
  }

  const iconBtn = 'grid size-9 place-items-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'
  const th = 'border-b border-line bg-slate-50/80 px-4 py-2.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase'
  const td = 'border-b border-line px-4 py-2.5'

  const form = editing?.user
  const setForm = (patch: Partial<User>) => editing && setEditing({ ...editing, user: { ...editing.user, ...patch } })
  const duplicate = !!form && users.some((u) => u.username === form.username.trim() && u.username !== editing?.original)
  const emailBad = !!form && form.email.trim() !== '' && !EMAIL_RE.test(form.email.trim())
  const valid =
    !!form &&
    form.username.trim() &&
    form.fullName.trim() &&
    EMAIL_RE.test(form.email.trim()) &&
    form.phone.trim() &&
    !duplicate &&
    (!hasRoom(form.role) || form.room) &&
    (form.role !== 'patient' || form.patientCode?.trim())

  const lockBtn = (locked: boolean, self: boolean, onClick: () => void, noun = 'tài khoản') => (
    <button
      title={self ? 'Không thể khóa tài khoản đang đăng nhập' : locked ? `Mở khóa ${noun}` : `Khóa ${noun}`}
      aria-label={locked ? `Mở khóa ${noun}` : `Khóa ${noun}`}
      disabled={self}
      onClick={onClick}
      className={`${iconBtn} ${locked ? 'text-emerald-700 hover:bg-emerald-50' : 'text-slate-600 hover:bg-red-50 hover:text-red-600'}`}
    >
      {locked ? <Unlock size={16} /> : <Lock size={16} />}
    </button>
  )

  return (
    <div className="min-w-0 flex-1">
      <AdminHeader
        crumb="Quản trị / Người dùng"
        title="Quản lý tài khoản"
        subtitle="Tài khoản nhân viên, tài khoản bệnh nhân và hồ sơ do người giám hộ quản lý"
        user={currentUser}
        onLogout={onLogout}
        notify={notify}
        actions={
          <button
            onClick={() => setEditing({ user: { ...(tab === 'patient' ? EMPTY_PATIENT : EMPTY_STAFF) } })}
            className={`${btn.base} ${btn.primary} h-10 px-4`}
          >
            <Plus size={17} strokeWidth={2.5} /> Thêm người dùng
          </button>
        }
      />

      <div className="px-7 py-5">
        <section className="rounded-xl border border-line bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-1 rounded-lg bg-canvas p-1">
              {(
                [
                  ['staff', 'Nhân viên', staffCount],
                  ['patient', 'Bệnh nhân', patientCount],
                ] as const
              ).map(([key, label, n]) => (
                <button
                  key={key}
                  onClick={() => {
                    setTab(key)
                    clearFilters()
                  }}
                  className={`flex h-9 items-center gap-2 rounded-md px-3.5 text-[13.5px] font-semibold transition-colors ${tab === key ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
                >
                  {label}
                  <span className={`tabular rounded px-1.5 text-[11.5px] ${tab === key ? 'bg-brand-soft text-brand' : 'bg-white/70 text-slate-500'}`}>{n}</span>
                </button>
              ))}
            </div>
            <label className="flex h-9 w-64 items-center gap-2 rounded-lg border border-line px-3 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
              <Search size={15} className="text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tab === 'staff' ? 'Tìm tên, email, số điện thoại…' : 'Tìm tên, mã BN, số điện thoại…'}
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-slate-400"
              />
            </label>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {tab === 'staff' ? (
                <>
                  <Select<Role | 'all'>
                    label="Vai trò"
                    value={role}
                    onChange={setRole}
                    options={[{ id: 'all', label: 'Tất cả vai trò' }, ...(['admin', 'headnurse', 'nurse', 'doctor'] as Role[]).map((r) => ({ id: r, label: ROLE_LABEL[r] }))]}
                  />
                  <Select
                    label="Khoa"
                    value={dept}
                    onChange={(v) => (setDept(v), setRoom('all'))}
                    options={[
                      { id: 'all', label: 'Tất cả khoa' },
                      { id: 'noi', label: 'Khoa Nội' },
                      { id: 'hospital', label: 'Toàn viện (không gán phòng)' },
                    ]}
                  />
                  <Select<string>
                    label="Phòng khám"
                    className="max-w-[200px]"
                    value={room}
                    onChange={setRoom}
                    options={[{ id: 'all', label: 'Tất cả phòng khám' }, ...rooms.map((r) => ({ id: r.id, label: r.name }))]}
                  />
                </>
              ) : (
                <Select
                  label="Loại hồ sơ"
                  value={kind}
                  onChange={setKind}
                  options={[
                    { id: 'all', label: 'Tất cả hồ sơ' },
                    { id: 'account', label: 'Có tài khoản đăng nhập' },
                    { id: 'guardian', label: 'Người giám hộ quản lý' },
                  ]}
                />
              )}
              <Select<User['status'] | 'all'>
                label="Trạng thái"
                value={status}
                onChange={setStatus}
                options={[
                  { id: 'all', label: 'Tất cả trạng thái' },
                  { id: 'active', label: 'Hoạt động' },
                  { id: 'locked', label: 'Đã khóa' },
                ]}
              />
              {filtersActive && (
                <button onClick={clearFilters} className="h-9 px-2 text-[12.5px] font-semibold text-brand hover:underline">
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {tab === 'staff' ? (
            staff.length ? (
              <table className="w-full border-separate border-spacing-0 text-left text-[13.5px]">
                <thead>
                  <tr>
                    {['Tên đăng nhập', 'Họ tên', 'Vai trò', 'Email / Số điện thoại', 'Khoa / Phòng phụ trách', 'Trạng thái'].map((h) => (
                      <th key={h} className={th}>
                        {h}
                      </th>
                    ))}
                    <th className={`${th} text-right`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((u) => {
                    const self = u.username === currentUser.username
                    const locked = u.status === 'locked'
                    return (
                      <tr key={u.username} className="hover:bg-slate-50">
                        <td className={td}>
                          <span className="font-mono text-[13px] font-semibold text-ink">{u.username}</span>
                          {self && <span className="ml-1.5 text-[11.5px] font-semibold text-brand">(bạn)</span>}
                        </td>
                        <td className={`${td} font-medium ${locked ? 'text-slate-400' : 'text-ink'}`}>{u.fullName}</td>
                        <td className={td}>
                          <span className={`rounded-md px-2 py-0.5 text-[12px] font-semibold whitespace-nowrap ${ROLE_BADGE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
                        </td>
                        <td className={td}>
                          <div className="flex items-center gap-1.5 text-[12.5px] text-slate-700">
                            <Mail size={12} className="shrink-0 text-slate-400" /> {u.email}
                          </div>
                          <div className="tabular mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate-700">
                            <Phone size={12} className="shrink-0 text-slate-400" /> {u.phone}
                          </div>
                        </td>
                        <td className={`${td} text-[13px]`}>
                          {u.room ? (
                            <>
                              <div className="text-slate-700">{roomName(u.room)}</div>
                              <div className="text-[11.5px] text-muted">Khoa Nội</div>
                            </>
                          ) : (
                            <span className="text-slate-400">Toàn viện</span>
                          )}
                        </td>
                        <td className={td}>
                          <StatusPill locked={locked} />
                        </td>
                        <td className={`${td} py-1.5`}>
                          <div className="flex justify-end gap-0.5">
                            <button title="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => setViewing({ kind: 'staff', user: u })} className={`${iconBtn} text-slate-600 hover:bg-slate-100`}>
                              <Eye size={16} />
                            </button>
                            <button title="Chỉnh sửa" aria-label="Chỉnh sửa" onClick={() => setEditing({ user: { ...u }, original: u.username })} className={`${iconBtn} text-slate-600 hover:bg-brand-soft hover:text-brand`}>
                              <Pencil size={16} />
                            </button>
                            <button title="Khôi phục quyền truy cập" aria-label="Khôi phục quyền truy cập" onClick={() => setResetting(u)} className={`${iconBtn} text-slate-600 hover:bg-amber-50 hover:text-amber-700`}>
                              <KeyRound size={16} />
                            </button>
                            {lockBtn(locked, self, () => setConfirm({ user: u, to: locked ? 'active' : 'locked' }))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <EmptyState title="Không có nhân viên phù hợp" text="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." icon={<Users size={18} />} />
            )
          ) : patients.length ? (
            <table className="w-full border-separate border-spacing-0 text-left text-[13.5px]">
              <thead>
                <tr>
                  {['Mã bệnh nhân', 'Họ tên', 'Thông tin liên hệ', 'Ngày tạo hồ sơ', 'Trạng thái hồ sơ / tài khoản'].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                  <th className={`${th} text-right`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((r) => {
                  if (r.kind === 'account') {
                    const u = r.user
                    const locked = u.status === 'locked'
                    return (
                      <tr key={u.username} className="hover:bg-slate-50">
                        <td className={td}>
                          <span className="tabular inline-flex items-center gap-1.5 font-medium text-slate-700">
                            <BadgeCheck size={14} className="text-violet-600" /> {u.patientCode}
                          </span>
                        </td>
                        <td className={td}>
                          <div className={`font-medium ${locked ? 'text-slate-400' : 'text-ink'}`}>{u.fullName}</div>
                          <div className="text-[11.5px] text-muted">
                            Đăng nhập: <span className="font-mono">{u.username}</span>
                          </div>
                        </td>
                        <td className={td}>
                          <div className="flex items-center gap-1.5 text-[12.5px] text-slate-700">
                            <Mail size={12} className="shrink-0 text-slate-400" /> {u.email}
                          </div>
                          <div className="tabular mt-0.5 flex items-center gap-1.5 text-[12.5px] text-slate-700">
                            <Phone size={12} className="shrink-0 text-slate-400" /> {u.phone}
                          </div>
                        </td>
                        <td className={`${td} tabular text-slate-600`}>{u.createdAt ?? '—'}</td>
                        <td className={td}>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="rounded-md bg-brand-soft px-1.5 py-0.5 text-[11.5px] font-semibold text-brand">Có tài khoản</span>
                            <StatusPill locked={locked} />
                          </div>
                        </td>
                        <td className={`${td} py-1.5`}>
                          <div className="flex justify-end gap-0.5">
                            <button title="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => setViewing(r)} className={`${iconBtn} text-slate-600 hover:bg-slate-100`}>
                              <Eye size={16} />
                            </button>
                            <button title="Chỉnh sửa" aria-label="Chỉnh sửa" onClick={() => setEditing({ user: { ...u }, original: u.username })} className={`${iconBtn} text-slate-600 hover:bg-brand-soft hover:text-brand`}>
                              <Pencil size={16} />
                            </button>
                            <button title="Khôi phục quyền truy cập" aria-label="Khôi phục quyền truy cập" onClick={() => setResetting(u)} className={`${iconBtn} text-slate-600 hover:bg-amber-50 hover:text-amber-700`}>
                              <KeyRound size={16} />
                            </button>
                            {lockBtn(locked, false, () => setConfirm({ user: u, to: locked ? 'active' : 'locked' }))}
                          </div>
                        </td>
                      </tr>
                    )
                  }
                  const g = r.rec
                  const locked = g.status === 'locked'
                  return (
                    <tr key={g.code} className="hover:bg-slate-50">
                      <td className={td}>
                        <span className="tabular inline-flex items-center gap-1.5 font-medium text-slate-700">
                          <UserRound size={14} className="text-slate-400" /> {g.code}
                        </span>
                      </td>
                      <td className={td}>
                        <div className={`font-medium ${locked ? 'text-slate-400' : 'text-ink'}`}>{g.fullName}</div>
                        <div className="text-[11.5px] text-muted">
                          Giám hộ: {g.guardianName} ({g.guardianRelation})
                        </div>
                      </td>
                      <td className={td}>
                        <div className="tabular flex items-center gap-1.5 text-[12.5px] text-slate-700">
                          <Phone size={12} className="shrink-0 text-slate-400" /> {g.guardianPhone}
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-muted">SĐT người giám hộ</div>
                      </td>
                      <td className={`${td} tabular text-slate-600`}>{g.createdAt}</td>
                      <td className={td}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[11.5px] font-semibold text-violet-700" title="Không có thông tin đăng nhập riêng">
                            Người giám hộ quản lý
                          </span>
                          <StatusPill locked={locked} label={locked ? 'Hồ sơ đã khóa' : 'Hồ sơ hoạt động'} />
                        </div>
                      </td>
                      <td className={`${td} py-1.5`}>
                        <div className="flex justify-end gap-0.5">
                          <button title="Xem chi tiết" aria-label="Xem chi tiết" onClick={() => setViewing(r)} className={`${iconBtn} text-slate-600 hover:bg-slate-100`}>
                            <Eye size={16} />
                          </button>
                          <button title="Chỉnh sửa người giám hộ" aria-label="Chỉnh sửa người giám hộ" onClick={() => setEditingRec({ ...g })} className={`${iconBtn} text-slate-600 hover:bg-brand-soft hover:text-brand`}>
                            <Pencil size={16} />
                          </button>
                          <button title="Hồ sơ không có thông tin đăng nhập" aria-label="Khôi phục quyền truy cập (không áp dụng)" disabled className={`${iconBtn} text-slate-600`}>
                            <KeyRound size={16} />
                          </button>
                          {lockBtn(locked, false, () => setConfirm({ rec: g, to: locked ? 'active' : 'locked' }), 'hồ sơ')}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Không có hồ sơ bệnh nhân phù hợp" text="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." />
          )}
          <div className="flex items-center justify-between px-4 py-2.5 text-[12px] text-muted">
            <span>Danh sách không hiển thị thông tin y tế. Ưu tiên khóa tài khoản thay vì xóa để giữ lịch sử.</span>
            <span className="tabular">{tab === 'staff' ? staff.length : patients.length} bản ghi</span>
          </div>
        </section>
      </div>

      {editing && form && (
        <Modal
          title={editing.original ? 'Chỉnh sửa người dùng' : 'Thêm người dùng'}
          subtitle={editing.original ? editing.original : 'Người dùng sẽ nhận liên kết kích hoạt để tự đặt mật khẩu'}
          icon={editing.original ? <Pencil size={18} /> : <UserPlus size={19} />}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className={`${btn.base} ${btn.ghost}`} onClick={() => setEditing(null)}>
                Hủy
              </button>
              <button
                disabled={!valid}
                onClick={() => {
                  onSave(
                    {
                      ...form,
                      username: form.username.trim(),
                      fullName: form.fullName.trim(),
                      email: form.email.trim(),
                      phone: form.phone.trim(),
                      createdAt: form.createdAt ?? (form.role === 'patient' ? today() : undefined),
                    },
                    editing.original,
                  )
                  setEditing(null)
                }}
                className={`${btn.base} ${btn.primary}`}
              >
                {editing.original ? 'Lưu thay đổi' : 'Tạo tài khoản'}
              </button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={fieldLabel}>Tên đăng nhập</span>
              <input
                autoFocus
                value={form.username}
                onChange={(e) => setForm({ username: e.target.value })}
                placeholder={form.role === 'patient' ? 'vd. 0903123456' : 'vd. dd.lan'}
                className={`${field} ${duplicate ? 'border-red-400' : ''}`}
              />
              {duplicate && <span className="mt-1 block text-[12px] text-red-600">Tên đăng nhập đã tồn tại</span>}
            </label>
            <label className="block">
              <span className={fieldLabel}>Họ tên</span>
              <input value={form.fullName} onChange={(e) => setForm({ fullName: e.target.value })} placeholder="Nhập họ tên" className={field} />
            </label>
            <label className="block">
              <span className={fieldLabel}>Email</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ email: e.target.value })} placeholder="ten@bvdktt.vn" className={`${field} ${emailBad ? 'border-red-400' : ''}`} />
              {emailBad && <span className="mt-1 block text-[12px] text-red-600">Email không hợp lệ</span>}
            </label>
            <label className="block">
              <span className={fieldLabel}>Số điện thoại</span>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ phone: e.target.value })} placeholder="09xx xxx xxx" className={field} />
            </label>
            <label className="block">
              <span className={fieldLabel}>Vai trò</span>
              <select
                value={form.role}
                disabled={editing.original === currentUser.username}
                onChange={(e) => {
                  const r = e.target.value as Role
                  setForm({ role: r, room: hasRoom(r) ? (form.room ?? rooms[0].id) : null, patientCode: r === 'patient' ? (form.patientCode ?? '') : undefined })
                }}
                className={`${field} disabled:bg-slate-50`}
              >
                {(['doctor', 'nurse', 'headnurse', 'admin', 'patient'] as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[12px] text-muted">Phạm vi: {ROLE_META[form.role].scope}</span>
            </label>
            {form.role === 'patient' ? (
              <label className="block">
                <span className={fieldLabel}>Mã bệnh nhân (HIS)</span>
                <input value={form.patientCode ?? ''} onChange={(e) => setForm({ patientCode: e.target.value })} placeholder="vd. BN-240512" className={field} />
              </label>
            ) : (
              <label className="block">
                <span className={fieldLabel}>Phòng phụ trách</span>
                <select value={form.room ?? ''} disabled={!hasRoom(form.role)} onChange={(e) => setForm({ room: e.target.value })} className={`${field} disabled:bg-slate-50 disabled:text-slate-400`}>
                  {!hasRoom(form.role) && <option value="">Toàn viện</option>}
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {editing.original && (
            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-[12.5px] text-muted">
              Khóa / mở khóa tài khoản và khôi phục truy cập được thực hiện bằng các nút thao tác trên danh sách, có bước xác nhận riêng.
            </p>
          )}
        </Modal>
      )}

      {editingRec && (
        <Modal
          title="Chỉnh sửa thông tin người giám hộ"
          subtitle={`${editingRec.code} · ${editingRec.fullName}`}
          icon={<Pencil size={18} />}
          width={480}
          onClose={() => setEditingRec(null)}
          footer={
            <>
              <button className={`${btn.base} ${btn.ghost}`} onClick={() => setEditingRec(null)}>
                Hủy
              </button>
              <button
                disabled={!editingRec.guardianName.trim() || !editingRec.guardianPhone.trim()}
                className={`${btn.base} ${btn.primary}`}
                onClick={() => {
                  const o = store.records.find((x) => x.code === editingRec.code)!
                  const changes = (
                    [
                      ['Người giám hộ', 'guardianName'],
                      ['Quan hệ', 'guardianRelation'],
                      ['SĐT người giám hộ', 'guardianPhone'],
                    ] as const
                  )
                    .filter(([, key]) => o[key] !== editingRec[key])
                    .map(([f, key]) => ({ field: f, before: o[key], after: editingRec[key] }))
                  store.saveRecord(editingRec)
                  if (changes.length) store.log({ action: 'update', entityType: 'Hồ sơ bệnh nhân', entity: editingRec.code, details: 'Cập nhật thông tin người giám hộ', changes })
                  notify(`Đã cập nhật hồ sơ ${editingRec.code}`)
                  setEditingRec(null)
                }}
              >
                Lưu thay đổi
              </button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2 block">
              <span className={fieldLabel}>Họ tên người giám hộ</span>
              <input value={editingRec.guardianName} onChange={(e) => setEditingRec({ ...editingRec, guardianName: e.target.value })} className={field} />
            </label>
            <label className="block">
              <span className={fieldLabel}>Quan hệ</span>
              <input value={editingRec.guardianRelation} onChange={(e) => setEditingRec({ ...editingRec, guardianRelation: e.target.value })} className={field} />
            </label>
            <label className="block">
              <span className={fieldLabel}>Số điện thoại</span>
              <input type="tel" value={editingRec.guardianPhone} onChange={(e) => setEditingRec({ ...editingRec, guardianPhone: e.target.value })} className={field} />
            </label>
          </div>
        </Modal>
      )}

      {viewing && (
        <Modal
          title="Chi tiết"
          subtitle={viewing.kind === 'guardian' ? viewing.rec.code : viewing.user.username}
          icon={<Eye size={18} />}
          width={500}
          onClose={() => setViewing(null)}
          footer={
            <button className={`${btn.base} ${btn.primary}`} onClick={() => setViewing(null)}>
              Đóng
            </button>
          }
        >
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
            {(viewing.kind === 'guardian'
              ? [
                  ['Mã bệnh nhân', viewing.rec.code],
                  ['Họ tên', viewing.rec.fullName],
                  ['Loại hồ sơ', 'Người giám hộ quản lý'],
                  ['Thông tin đăng nhập', 'Không có'],
                  ['Người giám hộ', `${viewing.rec.guardianName} (${viewing.rec.guardianRelation})`],
                  ['Liên hệ', viewing.rec.guardianPhone],
                  ['Ngày tạo hồ sơ', viewing.rec.createdAt],
                  ['Trạng thái', viewing.rec.status === 'locked' ? 'Hồ sơ đã khóa' : 'Hồ sơ hoạt động'],
                ]
              : [
                  ['Tên đăng nhập', viewing.user.username],
                  ['Họ tên', viewing.user.fullName],
                  ['Loại người dùng', ROLE_META[viewing.user.role].userType],
                  ['Vai trò', ROLE_LABEL[viewing.user.role]],
                  ['Phạm vi truy cập', ROLE_META[viewing.user.role].scope],
                  [viewing.user.role === 'patient' ? 'Mã bệnh nhân' : 'Phòng phụ trách', viewing.user.role === 'patient' ? (viewing.user.patientCode ?? '—') : (roomName(viewing.user.room) ?? 'Toàn viện')],
                  ['Email', viewing.user.email],
                  ['Số điện thoại', viewing.user.phone],
                  ['Trạng thái', viewing.user.status === 'locked' ? 'Đã khóa' : 'Hoạt động'],
                  ['Lần đăng nhập gần nhất', 'Chưa có dữ liệu'],
                ]
            ).map(([k2, v]) => (
              <div key={k2}>
                <dt className="text-[11.5px] text-muted">{k2}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {viewing.kind !== 'staff' && <p className="mt-4 text-[12px] text-muted">Thông tin y tế của bệnh nhân không hiển thị trong trang quản lý tài khoản.</p>}
        </Modal>
      )}

      {resetting && (
        <Modal
          title="Khôi phục quyền truy cập"
          subtitle={`${resetting.fullName} · ${resetting.username}`}
          icon={<KeyRound size={18} />}
          width={480}
          onClose={() => setResetting(null)}
          footer={
            <>
              <button className={`${btn.base} ${btn.ghost}`} onClick={() => setResetting(null)}>
                Hủy
              </button>
              <button
                className={`${btn.base} ${btn.primary}`}
                onClick={() => {
                  onCredentialReset(resetting.username, channel, revoke)
                  setResetting(null)
                }}
              >
                Gửi yêu cầu khôi phục
              </button>
            </>
          }
        >
          <p className="text-[13px] text-slate-700">Quản trị viên không xem hay đặt mật khẩu thay người dùng. Chọn kênh gửi liên kết/mã khôi phục:</p>
          <div className="mt-3 space-y-2">
            {(
              [
                ['email', Mail, 'Gửi liên kết đặt lại qua email', maskEmail(resetting.email)],
                ['sms', MessageSquareText, 'Gửi mã OTP qua SMS', maskPhone(resetting.phone)],
              ] as const
            ).map(([id, Icon, label, dest]) => (
              <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${channel === id ? 'border-brand bg-brand-soft/40 ring-1 ring-brand' : 'border-line hover:bg-slate-50'}`}>
                <input type="radio" name="channel" className="sr-only" checked={channel === id} onChange={() => setChannel(id)} />
                <Icon size={17} className="text-slate-500" />
                <span className="flex-1">
                  <span className="block text-[13.5px] font-semibold text-ink">{label}</span>
                  <span className="tabular block text-[12px] text-muted">{dest}</span>
                </span>
                <span className={`grid size-4 place-items-center rounded-full border-2 ${channel === id ? 'border-brand' : 'border-slate-300'}`}>{channel === id && <span className="size-2 rounded-full bg-brand" />}</span>
              </label>
            ))}
          </div>
          <label className="mt-3 flex items-center gap-2 text-[13px] text-slate-700">
            <input type="checkbox" checked={revoke} onChange={(e) => setRevoke(e.target.checked)} className="size-4 accent-[#0056b3]" />
            Đăng xuất tất cả phiên đang hoạt động
          </label>
        </Modal>
      )}

      {confirm && (
        <Modal
          title={confirm.to === 'locked' ? ('user' in confirm ? 'Khóa tài khoản?' : 'Khóa hồ sơ?') : 'user' in confirm ? 'Mở khóa tài khoản?' : 'Mở khóa hồ sơ?'}
          subtitle={'user' in confirm ? `${confirm.user.fullName} · ${confirm.user.username}` : `${confirm.rec.fullName} · ${confirm.rec.code}`}
          tone={confirm.to === 'locked' ? 'red' : 'brand'}
          icon={confirm.to === 'locked' ? <ShieldAlert size={18} /> : <Unlock size={18} />}
          width={460}
          onClose={() => setConfirm(null)}
          footer={
            <>
              <button className={`${btn.base} ${btn.ghost}`} onClick={() => setConfirm(null)}>
                Hủy
              </button>
              <button
                className={`${btn.base} ${confirm.to === 'locked' ? btn.danger : btn.primary}`}
                onClick={() => {
                  if ('user' in confirm) onSetStatus(confirm.user.username, confirm.to, confirm.to === 'locked' ? reason : 'Mở khóa')
                  else {
                    store.saveRecord({ ...confirm.rec, status: confirm.to })
                    store.log({
                      action: confirm.to === 'locked' ? 'lock' : 'unlock',
                      entityType: 'Hồ sơ bệnh nhân',
                      entity: confirm.rec.code,
                      details: confirm.to === 'locked' ? `Khóa hồ sơ · ${reason}` : 'Mở khóa hồ sơ',
                      changes: [{ field: 'Trạng thái', before: confirm.rec.status === 'locked' ? 'Đã khóa' : 'Hoạt động', after: confirm.to === 'locked' ? 'Đã khóa' : 'Hoạt động' }],
                    })
                    notify(`${confirm.to === 'locked' ? 'Đã khóa' : 'Đã mở khóa'} hồ sơ ${confirm.rec.code}`)
                  }
                  setConfirm(null)
                }}
              >
                {confirm.to === 'locked' ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
              </button>
            </>
          }
        >
          {confirm.to === 'locked' ? (
            <>
              <label className="block">
                <span className={fieldLabel}>Lý do</span>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className={field}>
                  {['Nghỉ việc / chuyển công tác', 'Nghỉ phép dài hạn', 'Nghi ngờ truy cập trái phép', 'Theo yêu cầu của người dùng', 'Khác'].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
              <p className="mt-3 text-[13px] leading-relaxed text-slate-700">
                {'user' in confirm ? 'Người dùng không thể đăng nhập cho đến khi được mở khóa.' : 'Hồ sơ không thể lấy số mới cho đến khi được mở khóa.'} Dữ liệu không bị xóa và thao tác được ghi vào Nhật ký hệ thống.
              </p>
            </>
          ) : (
            <p className="text-[13px] leading-relaxed text-slate-700">Quyền truy cập sẽ được khôi phục ngay. Thao tác được ghi vào Nhật ký hệ thống.</p>
          )}
        </Modal>
      )}
    </div>
  )
}
