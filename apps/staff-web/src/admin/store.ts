import { useState } from 'react'
import { ROLE_LABEL, type Role, type User } from '../data'
import { INITIAL_CLINICS, type ClinicCfg } from './demo'
import { INITIAL_PERMISSIONS, type Matrix, type Permissions } from './access'

export type AuditAction = 'login' | 'create' | 'update' | 'lock' | 'unlock' | 'credential' | 'config' | 'permission' | 'queue'

export const AUDIT_ACTIONS: Record<AuditAction, { label: string; cls: string }> = {
  login: { label: 'Đăng nhập', cls: 'bg-slate-100 text-slate-700' },
  create: { label: 'Tạo mới', cls: 'bg-emerald-50 text-emerald-700' },
  update: { label: 'Cập nhật', cls: 'bg-brand-soft text-brand' },
  lock: { label: 'Khóa', cls: 'bg-red-50 text-red-700' },
  unlock: { label: 'Mở khóa', cls: 'bg-emerald-50 text-emerald-700' },
  credential: { label: 'Khôi phục truy cập', cls: 'bg-amber-50 text-amber-800' },
  config: { label: 'Cấu hình', cls: 'bg-violet-50 text-violet-700' },
  permission: { label: 'Phân quyền', cls: 'bg-violet-50 text-violet-700' },
  queue: { label: 'Điều phối hàng đợi', cls: 'bg-orange-50 text-orange-700' },
}

export type AuditEntry = {
  id: string
  ts: number
  actor: string
  actorRole: string
  action: AuditAction
  entityType: string
  entity: string
  details: string
  changes?: { field: string; before: string; after: string }[]
  ip: string
}

// Patient records managed by a guardian, without their own login credentials (demo).
export type GuardianRecord = {
  code: string
  fullName: string
  birthYear: number
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  createdAt: string
  status: 'active' | 'locked'
}

const INITIAL_RECORDS: GuardianRecord[] = [
  { code: 'BN-240533', fullName: 'Nguyễn Minh Khang', birthYear: 2019, guardianName: 'Nguyễn Thị Thu', guardianRelation: 'Mẹ', guardianPhone: '0909 448 120', createdAt: '02/05/2025', status: 'active' },
  { code: 'BN-240541', fullName: 'Trần Bảo An', birthYear: 2021, guardianName: 'Trần Văn Lực', guardianRelation: 'Cha', guardianPhone: '0913 220 557', createdAt: '14/06/2025', status: 'active' },
  { code: 'BN-240198', fullName: 'Lê Văn Tư', birthYear: 1938, guardianName: 'Lê Thị Mỹ', guardianRelation: 'Con gái', guardianPhone: '0937 610 284', createdAt: '21/11/2024', status: 'active' },
  { code: 'BN-240377', fullName: 'Phạm Thị Nhàn', birthYear: 1942, guardianName: 'Phạm Văn Nam', guardianRelation: 'Con trai', guardianPhone: '0988 503 917', createdAt: '08/01/2025', status: 'locked' },
]

const IPS = ['10.20.1.14', '10.20.1.27', '10.20.3.8', '10.20.2.41']

function seedAudit(): AuditEntry[] {
  const now = Date.now()
  const h = 3_600_000
  const raw: Omit<AuditEntry, 'id' | 'ip'>[] = [
    { ts: now - 0.3 * h, actor: 'Nguyễn Văn A', actorRole: 'Điều dưỡng trưởng', action: 'queue', entityType: 'Phòng khám', entity: 'Phòng Nội Tim mạch 101', details: 'Ưu tiên khám STT 1014' },
    { ts: now - 1.2 * h, actor: 'Lê Thị Bích', actorRole: 'Điều dưỡng', action: 'login', entityType: 'Phiên đăng nhập', entity: 'dieuDuong', details: 'Đăng nhập cổng nhân viên' },
    { ts: now - 2.5 * h, actor: 'Trần Quốc Khánh', actorRole: 'Quản trị viên', action: 'config', entityType: 'Ngưỡng hàng đợi', entity: 'Phòng Nội Tổng quát 104', details: 'Cập nhật ngưỡng hàng chờ tối đa', changes: [{ field: 'Tối đa hàng chờ', before: '15', after: '12' }] },
    { ts: now - 5 * h, actor: 'Trần Quốc Khánh', actorRole: 'Quản trị viên', action: 'lock', entityType: 'Tài khoản', entity: 'dd.thao', details: 'Khóa tài khoản do nghỉ phép dài hạn', changes: [{ field: 'Trạng thái', before: 'Hoạt động', after: 'Đã khóa' }] },
    { ts: now - 26 * h, actor: 'Nguyễn Văn A', actorRole: 'Điều dưỡng trưởng', action: 'queue', entityType: 'Phòng khám', entity: 'Phòng Nội Tim mạch 102', details: 'Chuyển 4 bệnh nhân sang Phòng 103' },
    { ts: now - 28 * h, actor: 'Trần Quốc Khánh', actorRole: 'Quản trị viên', action: 'create', entityType: 'Tài khoản', entity: 'dd.quyen', details: 'Tạo tài khoản Điều dưỡng · Phòng 104' },
    { ts: now - 30 * h, actor: 'Trần Quốc Khánh', actorRole: 'Quản trị viên', action: 'credential', entityType: 'Tài khoản', entity: 'dd.hoa', details: 'Gửi liên kết khôi phục mật khẩu qua email' },
    { ts: now - 50 * h, actor: 'Trần Quốc Khánh', actorRole: 'Quản trị viên', action: 'permission', entityType: 'Vai trò', entity: 'Điều dưỡng trưởng', details: 'Cấp quyền xem Phân tích & báo cáo', changes: [{ field: 'Phân tích & báo cáo · Xem', before: 'Không', after: 'Có' }] },
    { ts: now - 53 * h, actor: 'Trần Quốc Khánh', actorRole: 'Quản trị viên', action: 'config', entityType: 'Phòng khám', entity: 'Phòng Khám Ngoại tiết niệu 203', details: 'Tạm dừng tiếp nhận', changes: [{ field: 'Trạng thái', before: 'Hoạt động', after: 'Tạm dừng' }] },
    { ts: now - 74 * h, actor: 'Trần Quốc Khánh', actorRole: 'Quản trị viên', action: 'update', entityType: 'Tài khoản', entity: 'dd.minh', details: 'Cập nhật số điện thoại', changes: [{ field: 'Số điện thoại', before: '0977 901 000', after: '0977 901 103' }] },
    { ts: now - 98 * h, actor: 'Trần Quốc Khánh', actorRole: 'Quản trị viên', action: 'config', entityType: 'Dịch vụ – Phòng khám', entity: 'Phòng Nội Tổng quát 105', details: 'Gỡ dịch vụ Tái khám', changes: [{ field: 'Tái khám', before: 'Có', after: 'Không' }] },
    { ts: now - 170 * h, actor: 'Trần Quốc Khánh', actorRole: 'Quản trị viên', action: 'create', entityType: 'Tài khoản', entity: 'bacSi', details: 'Tạo tài khoản Bác sĩ · Phòng 101' },
    { ts: now - 340 * h, actor: 'Trần Quốc Khánh', actorRole: 'Quản trị viên', action: 'config', entityType: 'Khoa', entity: 'Khoa Nhi', details: 'Thêm Phòng Khám Nhi tổng quát 301' },
  ]
  return raw.map((e, i) => ({ ...e, id: `AU-${String(9000 - i)}`, ip: IPS[i % IPS.length] }))
}

export function useAdminStore(actor: User | null) {
  const [clinics, setClinics] = useState<ClinicCfg[]>(INITIAL_CLINICS)
  const [perms, setPerms] = useState<Permissions>(INITIAL_PERMISSIONS)
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit)
  const [records, setRecords] = useState<GuardianRecord[]>(INITIAL_RECORDS)

  const log = (e: Omit<AuditEntry, 'id' | 'ts' | 'actor' | 'actorRole' | 'ip'>) =>
    setAudit((a) => [
      {
        ...e,
        id: `AU-${Date.now().toString(36).toUpperCase()}`,
        ts: Date.now(),
        actor: actor?.fullName ?? 'Hệ thống',
        actorRole: actor ? ROLE_LABEL[actor.role] : '—',
        ip: '10.20.1.14',
      },
      ...a,
    ])

  return {
    clinics,
    perms,
    audit,
    records,
    log,
    saveClinics: (next: ClinicCfg[]) => setClinics(next),
    savePermissions: (role: Role, m: Matrix) => setPerms((p) => ({ ...p, [role]: m })),
    saveRecord: (r: GuardianRecord) => setRecords((rs) => rs.map((x) => (x.code === r.code ? r : x))),
  }
}

export type AdminStore = ReturnType<typeof useAdminStore>

import type { Page } from '../components/Sidebar'

export type AdminPageProps = {
  user: User
  users: User[]
  store: AdminStore
  roomIds: string[]
  notify: (m: string) => void
  onLogout: () => void
  onNavigate: (p: Page) => void
}
