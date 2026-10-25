import { useState } from 'react'
import {
  BellRing,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  Expand,
  IdCard,
  KeyRound,
  LogOut,
  Phone,
  ShieldCheck,
  SunMedium,
  Unlink,
  UserPlus,
} from 'lucide-react'
import { THEMES, themeVars, type Person } from '../data'
import { Avatar, BottomSheet, ConfirmDialog, HospitalMark, PageTitle, QrCode, cx } from '../ui'
import AddRelativeSheet, { type NewRelative } from './AddRelativeSheet'

function formatBhyt(s: string) {
  if (!/^[A-Z]{2}\d{13}$/.test(s)) return s
  return `${s.slice(0, 2)} ${s.slice(2, 3)} ${s.slice(3, 5)} ${s.slice(5)}`
}

export default function Profile({
  account,
  person,
  people,
  onSwitch,
  onAdd,
  onUnlink,
  onLogout,
  onToast,
}: {
  account: Person
  person: Person
  people: Person[]
  onSwitch: (id: string) => void
  onAdd: (r: NewRelative) => void
  onUnlink: (id: string) => void
  onLogout: () => void
  onToast: (m: string) => void
}) {
  const [sheet, setSheet] = useState<null | 'qr' | 'add'>(null)
  const [confirm, setConfirm] = useState<null | { kind: 'unlink'; person: Person } | { kind: 'logout' }>(null)
  const [notify, setNotify] = useState(true)
  const [copied, setCopied] = useState(false)
  const t = THEMES[person.theme]

  const copyBhyt = async () => {
    try {
      await navigator.clipboard.writeText(person.bhyt)
    } catch {
      /* Clipboard may be unavailable in embedded previews; feedback is still shown. */
    }
    setCopied(true)
    onToast('Đã sao chép Số BHYT')
    setTimeout(() => setCopied(false), 2000)
  }

  const info = [
    { icon: ShieldCheck, label: 'Số BHYT', value: formatBhyt(person.bhyt), copy: true },
    { icon: IdCard, label: 'Số CCCD', value: person.cccd },
    { icon: CalendarDays, label: 'Ngày sinh', value: person.age ? `${person.dob} (${person.age} tuổi)` : person.dob },
    { icon: Phone, label: 'Số điện thoại', value: person.phone },
  ]

  return (
    <div className="pb-8">
      <PageTitle title="Hồ sơ" />

      {/* Digital ID card — tinted with the profile's pastel tone */}
      <div className="px-5 pt-2">
        <div className="relative w-full overflow-hidden rounded-[24px] border-2 border-(--t-200) bg-[linear-gradient(135deg,var(--t-50)_0%,var(--t-100)_50%,var(--t-200)_100%)] p-4 text-(--t-ink) shadow-[0_24px_40px_-24px_rgba(15,30,38,0.55)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -bottom-24 size-60 rounded-full border-[28px] border-white/40"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(115deg,rgba(255,255,255,0.22)_0_2px,transparent_2px_14px)]"
          />

          <div className="relative flex h-full flex-col gap-5">
            <div className="flex items-center gap-2">
              <HospitalMark size={30} className="rounded-lg" />
              <p className="text-base font-bold whitespace-nowrap">BV An Tâm</p>
              <span className="whitespace-nowrap ml-auto rounded-md border-2 border-current/40 bg-white/60 px-2 py-0.5 text-base font-semibold tracking-wide">
                THẺ BỆNH NHÂN
              </span>
            </div>

            <div className="flex items-center gap-5">
              <Avatar name={person.name} theme={t} size={56} className="ring-[3px] ring-white" />
              <p className="mt-2 truncate text-xl leading-tight font-bold">{person.name}</p>
            </div>

            <div className="mt-auto flex gap-0">
              <div className="min-w-0 flex-1">
                <p className="mt-1 text-base font-bold">Mã bệnh nhân:</p>
                <p className="tabular text-lg leading-tight tracking-wider">{person.mrn}</p>
              </div>
              <button
                type="button"
                onClick={() => setSheet('qr')}
                aria-label="Phóng to mã QR để quét tại ki-ốt"
                className="relative shrink-0 rounded-2xl bg-white p-1.5 shadow-lg"
              >
                <QrCode value={person.mrn} size={112} />
                <span className="absolute -top-2 -right-2 flex size-8 items-center justify-center rounded-full bg-(--t-solid) text-white shadow ring-2 ring-white">
                  <Expand size={16} strokeWidth={2.6} aria-hidden="true" />
                </span>
              </button>
            </div>
          </div>
        </div>
        <p className="mt-2.5 text-center text-base text-ink-2">Chạm vào mã QR để phóng to khi quét tại ki-ốt</p>
      </div>

      {/* Personal info */}
      <section className="mt-6 px-5" aria-labelledby="info-title">
        <h2 id="info-title" className="px-1 pb-2 text-lg font-bold text-ink">
          Thông tin cá nhân
        </h2>
        <dl className="divide-y divide-line/70 overflow-hidden rounded-3xl border border-line/80 bg-white">
          {info.map((row) => (
            <div key={row.label} className="flex min-h-[72px] items-center gap-3.5 px-4 py-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-(--t-100) text-(--t-ink)">
                <row.icon size={22} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <dt className="text-base text-ink-2">{row.label}</dt>
                <dd className="tabular text-lg font-semibold break-words text-ink">{row.value}</dd>
              </div>
              {row.copy && (
                <button
                  type="button"
                  onClick={copyBhyt}
                  aria-label="Sao chép Số BHYT"
                  className={cx(
                    'flex size-12 shrink-0 items-center justify-center rounded-xl border-2 transition',
                    copied ? 'border-ok bg-ok-bg text-ok-ink' : 'border-line text-brand-800 hover:border-brand-700',
                  )}
                >
                  {copied ? <Check size={22} strokeWidth={2.8} aria-hidden="true" /> : <Copy size={22} aria-hidden="true" />}
                </button>
              )}
            </div>
          ))}
        </dl>
      </section>

      {/* Guardian switcher */}
      <section className="mt-6 px-5" aria-labelledby="family-title">
        <div className="flex items-end justify-between">
          <h2 id="family-title" className="px-1 pb-2 text-lg font-bold text-ink">
            Người thân
          </h2>
          <p className="pb-2 text-base text-ink-2">Chạm để chuyển hồ sơ</p>
        </div>
        <ul className="flex flex-col gap-3">
          {people.map((p) => {
            const active = p.id === person.id
            const pt = THEMES[p.theme]
            const self = p.id === account.id
            return (
              <li
                key={p.id}
                style={themeVars(pt)}
                className={cx(
                  'overflow-hidden rounded-2xl border-2 transition',
                  active ? 'border-(--t-solid) bg-(--t-100)' : 'border-(--t-200) bg-(--t-50)',
                )}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSwitch(p.id)
                    if (!active) onToast(`Đang xem hồ sơ của ${p.name}`)
                  }}
                  aria-current={active || undefined}
                  className="flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3 text-left"
                >
                  <Avatar name={p.name} theme={pt} size={48} className="ring-2 ring-white" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-lg font-bold text-(--t-ink)">{p.name}</span>
                    <span className="block text-base text-(--t-ink)">
                      {p.relation} · {p.age ? `${p.age} tuổi` : 'Mới thêm'}
                    </span>
                  </span>
                  {active ? (
                    <span className="rounded-full bg-(--t-solid) px-3 py-1 text-base font-semibold text-white">Đang xem</span>
                  ) : (
                    <ChevronRight size={24} className="shrink-0 text-(--t-ink)" aria-hidden="true" />
                  )}
                </button>
                {!self && (
                  <div className="flex items-center justify-between gap-2 border-t border-(--t-200) bg-white/70 py-1 pr-1 pl-4">
                    <span className="text-base text-ink-2">Đã xác minh OTP</span>
                    <button
                      type="button"
                      onClick={() => setConfirm({ kind: 'unlink', person: p })}
                      aria-label={`Hủy liên kết ${p.name}`}
                      className="inline-flex min-h-12 items-center gap-1.5 rounded-xl px-3 text-base font-semibold text-bad hover:bg-bad-bg"
                    >
                      <Unlink size={20} aria-hidden="true" /> Hủy liên kết
                    </button>
                  </div>
                )}
              </li>
            )
          })}
          <li>
            <button
              type="button"
              onClick={() => setSheet('add')}
              className="flex min-h-16 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-brand-700 text-lg font-semibold text-brand-800 hover:bg-brand-50"
            >
              <UserPlus size={24} aria-hidden="true" /> Thêm người thân
            </button>
          </li>
        </ul>
      </section>

      {/* Settings */}
      <section className="mt-6 px-5" aria-labelledby="settings-title">
        <h2 id="settings-title" className="px-1 pb-2 text-lg font-bold text-ink">
          Cài đặt
        </h2>
        <div className="divide-y divide-line/70 overflow-hidden rounded-3xl border border-line/80 bg-white">
          <button
            type="button"
            role="switch"
            aria-checked={notify}
            onClick={() => {
              setNotify((n) => !n)
              onToast(notify ? 'Đã tắt thông báo nhắc gọi số' : 'Đã bật thông báo nhắc gọi số')
            }}
            className="flex min-h-[76px] w-full items-center gap-3.5 px-4 py-3 text-left hover:bg-surface/60"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-800">
              <BellRing size={22} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold">Thông báo nhắc gọi số</span>
              <span className="block text-base text-ink-2">Rung và đọc to khi còn 2 người</span>
            </span>
            <span
              aria-hidden="true"
              className={cx('relative h-8 w-14 shrink-0 rounded-full transition-colors', notify ? 'bg-brand-700' : 'bg-[#7c8b91]')}
            >
              <span
                className={cx(
                  'absolute top-1 flex size-6 items-center justify-center rounded-full bg-white shadow transition-all',
                  notify ? 'left-7 text-brand-800' : 'left-1 text-transparent',
                )}
              >
                <Check size={14} strokeWidth={3.4} />
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onToast('Đã gửi mã OTP đổi mật khẩu tới ' + account.phone)}
            className="flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3 text-left hover:bg-surface/60"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-800">
              <KeyRound size={22} aria-hidden="true" />
            </span>
            <span className="flex-1 text-lg font-semibold">Đổi mật khẩu</span>
            <ChevronRight size={24} className="text-ink-2" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setConfirm({ kind: 'logout' })}
            className="flex min-h-[72px] w-full items-center gap-3.5 px-4 py-3 text-left hover:bg-bad-bg/60"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-bad-bg text-bad">
              <LogOut size={22} aria-hidden="true" />
            </span>
            <span className="flex-1 text-lg font-semibold text-bad">Đăng xuất</span>
          </button>
        </div>
        <p className="mt-5 text-center text-base text-ink-2">Phiên bản 2.5.0 · Bệnh viện Thông Minh</p>
      </section>

      {/* QR enlarge */}
      <BottomSheet
        open={sheet === 'qr'}
        onClose={() => setSheet(null)}
        title="Mã QR bệnh nhân"
        description="Đưa mã này vào khung quét của ki-ốt"
      >
        <div className="flex flex-col items-center pb-2">
          <div className="rounded-3xl border-2 border-(--t-200) bg-white p-4">
            <QrCode value={person.mrn} size={248} />
          </div>
          <p className="mt-4 text-xl font-bold">{person.name}</p>
          <p className="tabular text-2xl font-extrabold tracking-[0.12em] text-(--t-ink)">{person.mrn}</p>
          <p className="mt-4 flex items-center gap-2 rounded-2xl bg-warn-bg px-4 py-3 text-base text-warn">
            <SunMedium size={22} className="shrink-0" aria-hidden="true" />
            Tăng độ sáng màn hình để ki-ốt quét nhanh hơn.
          </p>
        </div>
      </BottomSheet>

      <AddRelativeSheet
        open={sheet === 'add'}
        onClose={() => setSheet(null)}
        onAdded={(r) => {
          onAdd(r)
          setSheet(null)
          onToast(`Đã xác minh và thêm ${r.name} vào danh sách người thân`)
        }}
      />

      <ConfirmDialog
        open={confirm?.kind === 'unlink'}
        action="hủy liên kết"
        userName={confirm?.kind === 'unlink' ? confirm.person.name : ''}
        icon={Unlink}
        tone="danger"
        confirmLabel="Hủy liên kết"
        onConfirm={() => {
          if (confirm?.kind === 'unlink') {
            onUnlink(confirm.person.id)
            onToast(`Đã hủy liên kết với ${confirm.person.name}`)
          }
          setConfirm(null)
        }}
        onClose={() => setConfirm(null)}
      >
        <ul className="flex flex-col gap-1.5">
          <li>• Bạn sẽ không còn xem được hàng đợi, lịch hẹn và lịch sử khám của người này.</li>
          <li>• Hồ sơ gốc tại bệnh viện vẫn được giữ nguyên.</li>
          <li>• Muốn liên kết lại cần xác minh OTP từ điện thoại người thân.</li>
        </ul>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirm?.kind === 'logout'}
        action="đăng xuất"
        userName={account.name}
        icon={LogOut}
        tone="danger"
        confirmLabel="Đăng xuất"
        onConfirm={onLogout}
        onClose={() => setConfirm(null)}
      >
        Bạn sẽ không nhận được thông báo gọi số cho đến khi đăng nhập lại.
      </ConfirmDialog>
    </div>
  )
}
