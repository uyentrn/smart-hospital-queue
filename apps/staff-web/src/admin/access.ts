import type { Role } from '../data'

export type Action = 'view' | 'create' | 'edit' | 'admin'
export const ACTIONS: { id: Action; label: string; hint: string }[] = [
  { id: 'view', label: 'Xem', hint: 'Xem dữ liệu' },
  { id: 'create', label: 'Tạo', hint: 'Tạo bản ghi mới' },
  { id: 'edit', label: 'Sửa', hint: 'Chỉnh sửa bản ghi' },
  { id: 'admin', label: 'Quản trị', hint: 'Thao tác quản trị: khóa, cấu hình, điều phối' },
]

export type FeatureId =
  | 'queue_board'
  | 'queue_coord'
  | 'emr'
  | 'cls'
  | 'overview'
  | 'analytics'
  | 'resources'
  | 'accounts'
  | 'roles'
  | 'config'
  | 'audit'

export const FEATURES: { id: FeatureId; group: string; label: string; actions: Action[] }[] = [
  { id: 'queue_board', group: 'Vận hành hàng đợi', label: 'Bảng điều hành', actions: ['view', 'edit', 'admin'] },
  { id: 'queue_coord', group: 'Vận hành hàng đợi', label: 'Ưu tiên & chuyển hàng đợi', actions: ['view', 'edit', 'admin'] },
  { id: 'emr', group: 'Khám bệnh', label: 'Bệnh án điện tử', actions: ['view', 'create', 'edit'] },
  { id: 'cls', group: 'Khám bệnh', label: 'Chỉ định cận lâm sàng', actions: ['view', 'create', 'edit'] },
  { id: 'overview', group: 'Báo cáo', label: 'Tổng quan bệnh viện', actions: ['view'] },
  { id: 'analytics', group: 'Báo cáo', label: 'Phân tích & báo cáo', actions: ['view', 'create'] },
  { id: 'resources', group: 'Báo cáo', label: 'Nguồn lực & công suất', actions: ['view', 'edit'] },
  { id: 'accounts', group: 'Quản trị', label: 'Quản lý tài khoản', actions: ['view', 'create', 'edit', 'admin'] },
  { id: 'roles', group: 'Quản trị', label: 'Vai trò & phân quyền', actions: ['view', 'edit', 'admin'] },
  { id: 'config', group: 'Quản trị', label: 'Cấu hình bệnh viện', actions: ['view', 'create', 'edit', 'admin'] },
  { id: 'audit', group: 'Quản trị', label: 'Nhật ký hệ thống', actions: ['view'] },
]

export type Matrix = Record<FeatureId, Action[]>
export type Permissions = Record<Role, Matrix>

export const ROLE_META: Record<Role, { userType: 'Nhân viên' | 'Bệnh nhân'; scope: string; description: string; system?: boolean }> = {
  admin: { userType: 'Nhân viên', scope: 'Toàn viện', description: 'Quản trị hệ thống, tài khoản, cấu hình và báo cáo toàn viện.', system: true },
  headnurse: { userType: 'Nhân viên', scope: 'Toàn khoa (Khoa Nội)', description: 'Điều phối hàng đợi giữa các phòng khám trong khoa.' },
  nurse: { userType: 'Nhân viên', scope: 'Phòng được phân công', description: 'Gọi số, tiếp nhận và cập nhật trạng thái hàng đợi tại phòng.' },
  doctor: { userType: 'Nhân viên', scope: 'Phòng được phân công', description: 'Khám bệnh, ghi bệnh án và chỉ định cận lâm sàng.' },
  patient: { userType: 'Bệnh nhân', scope: 'Hồ sơ cá nhân', description: 'Lấy số và theo dõi lượt khám qua ứng dụng di động. Không truy cập cổng nhân viên.' },
}

const all = (): Matrix => Object.fromEntries(FEATURES.map((f) => [f.id, [...f.actions]])) as Matrix
const none = (): Matrix => Object.fromEntries(FEATURES.map((f) => [f.id, [] as Action[]])) as Matrix

export const INITIAL_PERMISSIONS: Permissions = {
  admin: all(),
  headnurse: {
    ...none(),
    queue_board: ['view', 'edit', 'admin'],
    queue_coord: ['view', 'edit', 'admin'],
    overview: ['view'],
    analytics: ['view'],
    resources: ['view'],
    config: ['view'],
  },
  nurse: { ...none(), queue_board: ['view', 'edit'], queue_coord: ['view'] },
  doctor: { ...none(), queue_board: ['view'], emr: ['view', 'create', 'edit'], cls: ['view', 'create', 'edit'] },
  patient: none(),
}
