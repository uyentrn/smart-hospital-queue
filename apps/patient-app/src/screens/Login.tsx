import { useId, useRef, useState, type FormEvent, type ReactNode, type Ref } from 'react'
import { CircleAlert, CircleCheck, Eye, EyeOff, Fingerprint, Lightbulb, Loader2, Phone, ScanFace } from 'lucide-react'
import { Button, HospitalMark, cx } from '../ui'

function FloatingInput({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  trailing,
  invalid,
  inputRef,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  autoComplete?: string
  trailing?: ReactNode
  invalid?: boolean
  inputRef?: Ref<HTMLInputElement>
}) {
  const id = useId()
  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        placeholder=" "
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'peer block h-[68px] w-full rounded-2xl border-2 bg-white px-4 pt-6 pb-1.5 text-lg font-medium text-ink outline-none transition',
          'focus:border-brand-700 focus:shadow-[0_0_0_4px_rgba(11,93,97,0.15)]',
          invalid ? 'border-bad' : 'border-line',
          !!trailing && 'pr-16',
        )}
      />
      <label
        htmlFor={id}
        className={cx(
          'pointer-events-none absolute left-4 top-2.5 origin-left text-base font-medium transition-all',
          'peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-lg',
          'peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-base peer-focus:text-brand-800',
          invalid ? 'text-bad' : 'text-ink-2',
        )}
      >
        {label}
      </label>
      {trailing && <div className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</div>}
    </div>
  )
}

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [bio, setBio] = useState(false)
  const [filled, setFilled] = useState(false)
  const submitRef = useRef<HTMLButtonElement>(null)

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (!user.trim() || !pass) {
      setError('Vui lòng nhập đủ Tên đăng nhập và Mật khẩu.')
      return
    }
    if (user.trim().toLowerCase() !== 'benhnhan' || pass !== '123') {
      setError('Tên đăng nhập hoặc mật khẩu chưa đúng. Bạn có thể dùng tài khoản trải nghiệm bên dưới.')
      return
    }
    setError('')
    setLoading(true)
    setTimeout(onLogin, 700)
  }

  const autofill = () => {
    setUser('benhNhan')
    setPass('123')
    setError('')
    setFilled(true)
    submitRef.current?.focus()
  }

  const biometric = () => {
    setBio(true)
    setTimeout(onLogin, 1500)
  }

  return (
    <div className="relative flex h-full flex-col overflow-y-auto bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(120%_90%_at_50%_0%,#d7eeec_0%,rgba(234,245,244,0.6)_45%,rgba(255,255,255,0)_75%)]"
      />
      <div className="relative flex flex-1 flex-col px-6 pt-12 pb-8">
        <div className="flex flex-col items-center text-center">
          <HospitalMark size={92} className="drop-shadow-[0_12px_20px_rgba(6,63,66,0.25)]" />
          <p className="mt-5 text-base font-semibold tracking-[0.12em] text-brand-800 uppercase">Smart Hospital</p>
          <h1 className="mt-1 text-[28px] leading-tight font-bold text-ink">Bệnh viện Thông Minh</h1>
          <p className="mt-2 max-w-[18rem] text-base text-ink-2">Theo dõi lượt khám của bạn theo thời gian thực</p>
        </div>

        <form onSubmit={submit} noValidate className="mt-9 flex flex-col gap-4">
          <FloatingInput
            label="Tên đăng nhập / SĐT"
            value={user}
            onChange={(v) => {
              setUser(v)
              setFilled(false)
            }}
            autoComplete="username"
            invalid={!!error}
          />
          <FloatingInput
            label="Mật khẩu"
            type={show ? 'text' : 'password'}
            value={pass}
            onChange={(v) => {
              setPass(v)
              setFilled(false)
            }}
            autoComplete="current-password"
            invalid={!!error}
            trailing={
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={show}
                className="flex size-12 items-center justify-center rounded-xl text-ink-2 hover:bg-brand-50 hover:text-brand-800"
              >
                {show ? <EyeOff size={24} aria-hidden="true" /> : <Eye size={24} aria-hidden="true" />}
              </button>
            }
          />

          {error && (
            <p role="alert" className="flex gap-2 rounded-xl bg-bad-bg px-4 py-3 text-base font-medium text-bad">
              <CircleAlert size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          <div className="-mt-1 flex justify-end">
            <button type="button" className="min-h-12 px-1 text-base font-semibold text-brand-800 underline-offset-4 hover:underline">
              Quên mật khẩu?
            </button>
          </div>

          <Button ref={submitRef} type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={22} className="animate-spin" aria-hidden="true" /> Đang đăng nhập…
              </>
            ) : (
              'Đăng nhập'
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={autofill}
          className={cx(
            'mt-4 flex w-full items-start gap-3 rounded-2xl border-2 border-dashed px-4 py-3.5 text-left transition active:scale-[0.99]',
            filled ? 'border-ok bg-ok-bg' : 'border-warn/70 bg-warn-bg hover:border-warn',
          )}
        >
          <span
            className={cx(
              'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full',
              filled ? 'bg-ok text-white' : 'bg-warn text-white',
            )}
            aria-hidden="true"
          >
            {filled ? <CircleCheck size={20} /> : <Lightbulb size={20} />}
          </span>
          <span className={cx('text-base leading-snug', filled ? 'text-ok-ink' : 'text-warn')}>
            {filled ? (
              <>
                <strong className="font-bold">Đã điền sẵn tài khoản.</strong> Bấm “Đăng nhập” để tiếp tục.
              </>
            ) : (
              <>
                <strong className="font-bold">Trải nghiệm nhanh:</strong> Chạm để tự điền tài khoản{' '}
                <strong className="font-bold">‘benhNhan’</strong> - mật khẩu <strong className="font-bold">‘123’</strong>
              </>
            )}
          </span>
        </button>

        <div className="my-6 flex items-center gap-3 text-base text-ink-2" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          hoặc
          <span className="h-px flex-1 bg-line" />
        </div>

        <Button variant="secondary" onClick={biometric}>
          <ScanFace size={24} aria-hidden="true" />
          Đăng nhập bằng FaceID / Vân tay
        </Button>

        <p className="mt-auto flex items-center justify-center gap-2 pt-8 text-base text-ink-2">
          <Phone size={18} aria-hidden="true" /> Hỗ trợ 24/7: <strong className="font-semibold text-ink">1900 1234</strong>
        </p>
      </div>

      {bio && (
        <div
          role="alertdialog"
          aria-label="Đang xác thực sinh trắc học"
          className="absolute inset-0 z-50 flex animate-fade-in flex-col items-center justify-center bg-brand-950/95 px-8 text-center text-white"
        >
          <div className="relative flex size-32 items-center justify-center">
            <span className="absolute inset-0 animate-ring rounded-full border-4 border-brand-200/60" aria-hidden="true" />
            <span className="flex size-32 items-center justify-center rounded-full bg-white/10">
              <Fingerprint size={64} strokeWidth={1.6} aria-hidden="true" />
            </span>
          </div>
          <p className="mt-8 text-2xl font-bold">Đang xác thực…</p>
          <p className="mt-2 text-lg text-brand-200">Nhìn vào màn hình hoặc đặt ngón tay lên cảm biến</p>
        </div>
      )}
    </div>
  )
}
