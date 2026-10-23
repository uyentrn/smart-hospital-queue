import { useState, type FormEvent } from 'react'
import { AlertCircle, Check, Eye, EyeOff, Lock, LogIn, Stethoscope, UserRound } from 'lucide-react'
import { ROLE_LABEL, type User } from '../data'
import { Logo } from '../components/ui'

type Props = { users: User[]; onLogin: (u: User) => void }

const DEMO = ['bacSi', 'dieuDuong', 'dieuDuongTruong', 'admin']

// Doctor / nurse cards also show the person's name.
const demoSub = (u: User) =>
  u.role === 'doctor' ? `${ROLE_LABEL[u.role]} · BS. ${u.fullName}` : u.role === 'nurse' ? `${ROLE_LABEL[u.role]} · ${u.fullName}` : ROLE_LABEL[u.role]

export default function Login({ users, onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const u = users.find((x) => x.username === username.trim())
    if (!u || u.password !== password) return setError('Tên đăng nhập hoặc mật khẩu không đúng.')
    if (u.role === 'patient')
      return setError('Tài khoản bệnh nhân vui lòng đăng nhập qua ứng dụng di động của bệnh viện.')
    if (u.status === 'locked') return setError('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.')
    setError(null)
    onLogin(u)
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#e6f0fa] px-6">
      {/* Soft medical-cross pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(0,86,179,0.12), transparent 40%), radial-gradient(circle at 85% 80%, rgba(0,86,179,0.10), transparent 45%)',
        }}
      />
      <div className="relative w-full max-w-[420px]">
        <div className="mb-7 flex flex-col items-center text-center">
          <Logo size={56} />
          <h1 className="mt-4 text-[22px] font-bold tracking-tight text-ink">Hệ thống Xếp hàng Thông minh</h1>
          <p className="mt-1 text-[14px] text-muted">Bệnh viện Đa khoa Trung tâm · Cổng nhân viên</p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white bg-white p-7 shadow-xl shadow-[#0056b3]/10">
          <h2 className="text-[17px] font-bold text-ink">Đăng nhập</h2>
          <p className="mt-1 text-[13px] text-muted">Sử dụng tài khoản được cấp bởi phòng Công nghệ thông tin.</p>

          {error && (
            <div className="animate-fade-in mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <label className="mt-5 block">
            <span className="text-[13px] font-semibold text-slate-700">Tên đăng nhập</span>
            <span className="mt-1.5 flex h-12 items-center gap-2 rounded-lg border border-line px-3 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
              <UserRound size={17} className="text-slate-400" />
              <input
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-slate-400"
              />
            </span>
          </label>

          <label className="mt-4 block">
            <span className="text-[13px] font-semibold text-slate-700">Mật khẩu</span>
            <span className="mt-1.5 flex h-12 items-center gap-2 rounded-lg border border-line px-3 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15">
              <Lock size={17} className="text-slate-400" />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="***"
                autoComplete="current-password"
                className="w-full bg-transparent text-[15px] outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="grid size-9 place-items-center rounded-md text-slate-400 hover:text-ink"
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>

          <button
            type="submit"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[15px] font-semibold text-white shadow-sm hover:bg-brand-dark active:scale-[0.99]"
          >
            <LogIn size={18} /> Đăng nhập
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-[#0056b3]/15 bg-white/60 p-4 backdrop-blur">
          <div className="text-[12px] font-semibold tracking-wide text-slate-500 uppercase">
            Tài khoản thử nghiệm · mật khẩu 123
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {DEMO.map((name) => {
              const u = users.find((x) => x.username === name)
              if (!u) return null
              const on = username.trim() === name && password === '123'
              const doctor = u.role === 'doctor'
              return (
                <button
                  key={name}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setUsername(name)
                    setPassword('123')
                    setShow(false)
                    setError(null)
                  }}
                  className={`relative flex min-h-[60px] items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left transition-colors ${
                    on ? 'border-brand ring-1 ring-brand bg-brand-soft/50' : 'border-line hover:border-brand/40 hover:bg-brand-soft/40'
                  }`}
                >
                  {doctor && (
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${on ? 'bg-brand text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                      <Stethoscope size={16} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold break-all text-ink">{name}</span>
                    <span className="block text-[11.5px] leading-snug text-muted">{demoSub(u)}</span>
                  </span>
                  {on && <Check size={15} className="shrink-0 text-brand" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
