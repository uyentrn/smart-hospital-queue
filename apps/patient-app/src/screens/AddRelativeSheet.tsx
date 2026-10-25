import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, CircleAlert, Lightbulb, MessageSquareText, RotateCw, ShieldCheck, UserPlus } from 'lucide-react'
import { BottomSheet, Button, cx } from '../ui'

export type NewRelative = { name: string; relation: string; cccd: string; bhyt: string; phone: string }

const RELATIONS = ['Bố', 'Mẹ', 'Vợ/Chồng', 'Con', 'Anh/Chị/Em', 'Khác']
const DEMO_OTP = '123456'
const RESEND_S = 60
const MAX_TRIES = 3

type Field = 'name' | 'cccd' | 'bhyt' | 'phone'

const digits = (s: string) => s.replace(/\D/g, '')
const groupCccd = (s: string) => s.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4')
const groupPhone = (s: string) => s.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')
const maskPhone = (s: string) => `${s.slice(0, 2)}•• ••• ${s.slice(-3)}`

function validate(v: Record<Field, string>) {
  const e: Partial<Record<Field, string>> = {}
  if (v.name.trim().split(/\s+/).length < 2) e.name = 'Vui lòng nhập đầy đủ họ và tên.'
  if (!/^\d{12}$/.test(v.cccd)) e.cccd = 'Số CCCD gồm đúng 12 chữ số.'
  if (!/^[A-Z]{2}\d{13}$/.test(v.bhyt)) e.bhyt = 'Số BHYT gồm 2 chữ cái và 13 chữ số.'
  if (!/^0\d{9}$/.test(v.phone)) e.phone = 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.'
  return e
}

function TextField({
  id,
  label,
  hint,
  error,
  value,
  onChange,
  inputMode,
  maxLength,
  placeholder,
  inputRef,
}: {
  id: Field
  label: string
  hint?: string
  error?: string
  value: string
  onChange: (v: string) => void
  inputMode?: 'numeric' | 'tel' | 'text'
  maxLength?: number
  placeholder?: string
  inputRef?: (el: HTMLInputElement | null) => void
}) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={`rel-${id}`} className="block text-base font-semibold text-ink">
        {label} <span className="text-bad" aria-hidden="true">*</span>
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-base text-ink-2">
          {hint}
        </p>
      )}
      <input
        ref={inputRef}
        id={`rel-${id}`}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        placeholder={placeholder}
        required
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
        className={cx(
          'tabular mt-2 block h-14 w-full rounded-2xl border-2 px-4 text-lg font-medium outline-none placeholder:font-normal placeholder:text-ink-2 focus:border-brand-700 focus:shadow-[0_0_0_4px_rgba(11,93,97,0.15)]',
          error ? 'border-bad' : 'border-line',
        )}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1.5 flex items-start gap-1.5 text-base font-medium text-bad">
          <CircleAlert size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  )
}

export default function AddRelativeSheet({
  open,
  onClose,
  onAdded,
}: {
  open: boolean
  onClose: () => void
  onAdded: (r: NewRelative) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [v, setV] = useState<Record<Field, string>>({ name: '', cccd: '', bhyt: '', phone: '' })
  const [relation, setRelation] = useState('Bố')
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [tries, setTries] = useState(0)
  const [seconds, setSeconds] = useState(RESEND_S)
  const [otpFocused, setOtpFocused] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const refs = useRef<Partial<Record<Field, HTMLInputElement | null>>>({})
  const otpRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setStep(1)
    setV({ name: '', cccd: '', bhyt: '', phone: '' })
    setRelation('Bố')
    setErrors({})
  }, [open])

  useEffect(() => {
    if (step !== 2 || seconds <= 0) return
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [step, seconds])

  const set = (k: Field, raw: string) => {
    const val = k === 'cccd' || k === 'phone' ? digits(raw) : k === 'bhyt' ? raw.toUpperCase().replace(/[^A-Z0-9]/g, '') : raw
    setV((p) => ({ ...p, [k]: val }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }))
  }

  const sendOtp = () => {
    const e = validate(v)
    setErrors(e)
    const first = (['name', 'cccd', 'bhyt', 'phone'] as Field[]).find((k) => e[k])
    if (first) {
      refs.current[first]?.focus()
      return
    }
    setOtp('')
    setOtpError('')
    setTries(0)
    setSeconds(RESEND_S)
    setStep(2)
    setTimeout(() => otpRef.current?.focus(), 50)
  }

  const resend = () => {
    setOtp('')
    setOtpError('')
    setTries(0)
    setSeconds(RESEND_S)
    otpRef.current?.focus()
  }

  const verify = () => {
    if (otp.length < 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số.')
      return
    }
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      if (otp !== DEMO_OTP) {
        const n = tries + 1
        setTries(n)
        setOtp('')
        setOtpError(
          n >= MAX_TRIES
            ? 'Bạn đã nhập sai 3 lần. Vui lòng bấm “Gửi lại mã”.'
            : `Mã OTP chưa đúng. Bạn còn ${MAX_TRIES - n} lần thử.`,
        )
        otpRef.current?.focus()
        return
      }
      onAdded({
        name: v.name.trim().replace(/\s+/g, ' '),
        relation,
        cccd: groupCccd(v.cccd),
        bhyt: v.bhyt,
        phone: groupPhone(v.phone),
      })
    }, 700)
  }

  const locked = tries >= MAX_TRIES

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={step === 1 ? 'Thêm người thân' : 'Xác minh mã OTP'}
      description={step === 1 ? 'Bước 1/2 · Thông tin người thân' : 'Bước 2/2 · Xác minh từ điện thoại người thân'}
      footer={
        step === 1 ? (
          <Button onClick={sendOtp}>
            <MessageSquareText size={22} aria-hidden="true" /> Gửi mã OTP
          </Button>
        ) : (
          <div className="flex flex-col gap-3">
            <Button onClick={verify} disabled={locked || verifying}>
              {verifying ? (
                'Đang xác minh…'
              ) : (
                <>
                  <ShieldCheck size={22} aria-hidden="true" /> Xác minh & thêm người thân
                </>
              )}
            </Button>
            <Button variant="secondary" size="md" onClick={() => setStep(1)}>
              <ArrowLeft size={20} aria-hidden="true" /> Sửa thông tin
            </Button>
          </div>
        )
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-2" aria-hidden="true">
        <span className="h-2 rounded-full bg-brand-700" />
        <span className={cx('h-2 rounded-full', step === 2 ? 'bg-brand-700' : 'bg-line')} />
      </div>

      {step === 1 ? (
        <div className="flex flex-col gap-5">
          <button
            type="button"
            onClick={() => {
              setV({ name: 'Nguyễn Văn E', cccd: '079065001234', bhyt: 'HT2797901112223', phone: '0987654321' })
              setRelation('Anh/Chị/Em')
              setErrors({})
            }}
            className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-warn/70 bg-warn-bg px-4 py-3 text-left text-base text-warn hover:border-warn"
          >
            <Lightbulb size={22} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              <strong className="font-bold">Trải nghiệm nhanh:</strong> Chạm để điền thông tin mẫu
            </span>
          </button>

          <TextField
            id="name"
            label="Họ và tên"
            placeholder="VD: Nguyễn Văn E"
            value={v.name}
            error={errors.name}
            onChange={(x) => set('name', x)}
            inputRef={(el) => (refs.current.name = el)}
          />

          <div>
            <p id="rel-label" className="text-base font-semibold text-ink">
              Mối quan hệ
            </p>
            <div role="radiogroup" aria-labelledby="rel-label" className="mt-2 flex flex-wrap gap-2">
              {RELATIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={relation === r}
                  onClick={() => setRelation(r)}
                  className={cx(
                    'inline-flex min-h-12 items-center gap-1.5 rounded-full border-2 px-4 text-base font-semibold',
                    relation === r ? 'border-brand-700 bg-brand-700 text-white' : 'border-line text-ink',
                  )}
                >
                  {relation === r && <Check size={18} strokeWidth={3} aria-hidden="true" />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          <TextField
            id="cccd"
            label="Số CCCD"
            hint="12 chữ số trên Căn cước công dân"
            inputMode="numeric"
            maxLength={12}
            placeholder="079065001234"
            value={v.cccd}
            error={errors.cccd}
            onChange={(x) => set('cccd', x)}
            inputRef={(el) => (refs.current.cccd = el)}
          />
          <TextField
            id="bhyt"
            label="Số BHYT"
            hint="2 chữ cái + 13 chữ số trên thẻ bảo hiểm y tế"
            maxLength={15}
            placeholder="HT2797901112223"
            value={v.bhyt}
            error={errors.bhyt}
            onChange={(x) => set('bhyt', x)}
            inputRef={(el) => (refs.current.bhyt = el)}
          />
          <TextField
            id="phone"
            label="Số điện thoại của người thân"
            hint="Mã OTP sẽ được gửi tới số này"
            inputMode="tel"
            maxLength={10}
            placeholder="0987654321"
            value={v.phone}
            error={errors.phone}
            onChange={(x) => set('phone', x)}
            inputRef={(el) => (refs.current.phone = el)}
          />
        </div>
      ) : (
        <div>
          <div className="flex gap-3 rounded-2xl bg-brand-50 p-4">
            <MessageSquareText size={24} className="mt-0.5 shrink-0 text-brand-800" aria-hidden="true" />
            <p className="text-base text-brand-900">
              Mã 6 số đã gửi tới điện thoại của <strong>{v.name.trim()}</strong> (
              <span className="tabular font-bold whitespace-nowrap">{maskPhone(v.phone)}</span>). Nhờ người thân đọc mã cho
              bạn.
            </p>
          </div>

          <label htmlFor="otp" className="mt-5 block text-base font-semibold text-ink">
            Nhập mã OTP
          </label>
          <div className="relative mt-2">
            <input
              ref={otpRef}
              id="otp"
              value={otp}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              disabled={locked}
              aria-invalid={!!otpError || undefined}
              aria-describedby={otpError ? 'otp-err' : undefined}
              onFocus={() => setOtpFocused(true)}
              onBlur={() => setOtpFocused(false)}
              onChange={(e) => {
                setOtp(digits(e.target.value).slice(0, 6))
                setOtpError('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && verify()}
              className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
            />
            <div className="grid grid-cols-6 gap-2" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => {
                const current = otpFocused && i === Math.min(otp.length, 5)
                return (
                  <div
                    key={i}
                    className={cx(
                      'tabular flex h-16 items-center justify-center rounded-2xl border-2 text-[28px] font-extrabold text-ink transition',
                      otpError ? 'border-bad bg-bad-bg' : current ? 'border-brand-700 shadow-[0_0_0_4px_rgba(11,93,97,0.18)]' : otp[i] ? 'border-brand-700 bg-brand-50' : 'border-line',
                      locked && 'opacity-60',
                    )}
                  >
                    {otp[i] ?? (current ? <span className="h-8 w-0.5 animate-soft-blink bg-brand-700" /> : '')}
                  </div>
                )
              })}
            </div>
          </div>
          {otpError && (
            <p id="otp-err" role="alert" className="mt-2 flex items-start gap-1.5 text-base font-medium text-bad">
              <CircleAlert size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
              {otpError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            {seconds > 0 && !locked ? (
              <p className="text-base text-ink-2" aria-live="off">
                Gửi lại mã sau <strong className="tabular text-ink">{seconds}s</strong>
              </p>
            ) : (
              <button
                type="button"
                onClick={resend}
                className="inline-flex min-h-12 items-center gap-2 rounded-xl px-2 text-base font-semibold text-brand-800 hover:bg-brand-50"
              >
                <RotateCw size={20} aria-hidden="true" /> Gửi lại mã
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setOtp(DEMO_OTP)
                setOtpError('')
                setTries(0)
              }}
              className="inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-dashed border-warn/70 bg-warn-bg px-4 text-base font-semibold text-warn"
            >
              <Lightbulb size={20} aria-hidden="true" /> Mã demo: {DEMO_OTP}
            </button>
          </div>

          <p className="mt-5 flex items-start gap-2 rounded-2xl bg-surface p-3 text-base text-ink-2">
            <UserPlus size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
            Việc xác minh giúp đảm bảo người thân đồng ý chia sẻ hồ sơ khám bệnh với bạn.
          </p>
        </div>
      )}
    </BottomSheet>
  )
}
