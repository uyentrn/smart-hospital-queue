import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen, BarChart3, Building2, Gauge, LayoutDashboard, LogOut, ScrollText, Settings2, ShieldCheck, Users } from 'lucide-react'
import { ROLE_LABEL, type User } from '../data'
import { Logo } from './ui'

export type Page = 'ops' | 'overview' | 'analytics' | 'resources' | 'accounts' | 'roles' | 'config' | 'audit'

type Props = { user: User; page: Page; onNavigate: (p: Page) => void; onLogout: () => void }

const SECTIONS: { title: string; admin: boolean; items: { key: Page; label: string; icon: typeof Users; hint?: string }[] }[] = [
  {
    title: 'Vận hành',
    admin: false,
    items: [{ key: 'ops', label: 'Bảng điều hành', icon: LayoutDashboard, hint: 'Bảng điều hành hàng đợi dùng chung với Điều dưỡng' }],
  },
  {
    title: 'Giám sát toàn viện',
    admin: true,
    items: [
      { key: 'overview', label: 'Tổng quan bệnh viện', icon: Gauge },
      { key: 'analytics', label: 'Phân tích & báo cáo', icon: BarChart3 },
      { key: 'resources', label: 'Nguồn lực & công suất', icon: Building2 },
    ],
  },
  {
    title: 'Quản trị',
    admin: true,
    items: [
      { key: 'accounts', label: 'Quản lý tài khoản', icon: Users },
      { key: 'roles', label: 'Vai trò & phân quyền', icon: ShieldCheck },
      { key: 'config', label: 'Cấu hình bệnh viện', icon: Settings2 },
      { key: 'audit', label: 'Nhật ký hệ thống', icon: ScrollText },
    ],
  },
]

export const pagesFor = (u: User): Page[] => SECTIONS.filter((s) => !s.admin || u.role === 'admin').flatMap((s) => s.items.map((i) => i.key))

export default function Sidebar({ user, page, onNavigate, onLogout }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const initials = user.fullName
    .split(' ')
    .slice(-2)
    .map((w) => w[0])
    .join('')

  return (
    <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-white transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[248px]'}`}>
      <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-line px-4">
        {!collapsed && (
          <div className="flex items-center gap-3 overflow-hidden">
            <Logo size={38} />
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-tight text-ink truncate">Hệ thống Xếp hàng</div>
              <div className="text-[12px] font-medium text-muted truncate">Bệnh viện Đa khoa</div>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-slate-500 hover:text-ink">
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <nav aria-label="Điều hướng chính" className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {SECTIONS.filter((s) => !s.admin || user.role === 'admin').map((s, si) => (
          <div key={s.title} className={si ? 'mt-4' : ''}>
            <div className="px-3 pb-1.5 text-[10.5px] font-semibold tracking-wider text-slate-400 uppercase">{s.title}</div>
            <div className="space-y-0.5">
              {s.items.map((i) => {
                const on = page === i.key
                return (
                  <button
                    key={i.key}
                    onClick={() => onNavigate(i.key)}
                    title={i.hint}
                    aria-current={on ? 'page' : undefined}
                    className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[13.5px] font-medium transition-colors ${
                      on ? 'bg-brand text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                    }`}
                  >
                    <i.icon size={17} strokeWidth={on ? 2.2 : 1.8} className="shrink-0" />
                    {!collapsed && <span className="truncate">{i.label}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white">{initials}</div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-[13.5px] font-semibold text-ink">{user.fullName}</div>
            <div className="truncate text-[12px] text-muted">{ROLE_LABEL[user.role]}</div>
          </div>
          <button onClick={onLogout} aria-label="Đăng xuất" title="Đăng xuất" className="grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  )
}
