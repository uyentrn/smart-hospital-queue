import { useState } from 'react'
import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  Hospital,
  QrCode as QrIcon,
  Smartphone,
  Sparkles,
  Stethoscope,
  SunMedium,
  Sunset,
} from 'lucide-react'
import { DOCTORS, type Person } from '../data'
import { Avatar, Button, ConfirmDialog, PageTitle, cx } from '../ui'

export type BookingPayload = {
  doctorId: string
  department: string
  slot: string
  room: string
  symptomsNote?: string
}

const DEPT_META: {
  id: string
  name: string
  room: string
  doctorIds: string[]
  desc: string
}[] = [
  {
    id: 'noi',
    name: 'Khoa Nội',
    room: 'Phòng 204 • Tầng 2',
    doctorIds: ['ha'],
    desc: 'Khám tổng quát, tiêu hóa, hô hấp thông thường',
  },
  {
    id: 'tim',
    name: 'Khoa Tim mạch',
    room: 'Phòng 305 • Tầng 3',
    doctorIds: ['quan'],
    desc: 'Huyết áp, tim mạch, đau tức ngực, khó thở',
  },
  {
    id: 'noitiet',
    name: 'Khoa Nội tiết',
    room: 'Phòng 210 • Tầng 2',
    doctorIds: ['anh'],
    desc: 'Đường huyết, tiểu đường, tuyến giáp, rối loạn chuyển hóa',
  },
  {
    id: 'tmh',
    name: 'Khoa Tai Mũi Họng',
    room: 'Phòng 115 • Tầng 1',
    doctorIds: ['ngoc'],
    desc: 'Viêm họng, viêm xoang, ù tai, sổ mũi kéo dài',
  },
]

// Triệu chứng đi từ Khái quát (nhóm vùng/hệ cơ quan) -> Chi tiết (triệu chứng cụ thể) -> Gợi ý khoa
const SYMPTOM_TREE: {
  id: string
  general: string
  recommendedDept: string
  details: string[]
}[] = [
  {
    id: 'resp_ent',
    general: 'Tai - Mũi - Họng & Hô hấp trên',
    recommendedDept: 'Khoa Tai Mũi Họng',
    details: [
      'Đau rát họng, nuốt vướng',
      'Nghẹt mũi, chảy dịch mũi kéo dài',
      'Đau nhức vùng trán / hốc mắt (nghi viêm xoang)',
      'Ù tai, nghe kém hoặc đau trong tai',
    ],
  },
  {
    id: 'cardio',
    general: 'Tim mạch & Huyết áp',
    recommendedDept: 'Khoa Tim mạch',
    details: [
      'Chỉ số huyết áp cao bất thường (> 140/90 mmHg)',
      'Hồi hộp, tim đập nhanh, đánh trống ngực',
      'Đau tức ngực trái, khó thở khi gắng sức',
      'Chóng mặt, choáng váng khi thay đổi tư thế',
    ],
  },
  {
    id: 'endocrine',
    general: 'Nội tiết, Đường huyết & Tuyến giáp',
    recommendedDept: 'Khoa Nội tiết',
    details: [
      'Khát nước nhiều, tiểu nhiều, sụt cân nhanh',
      'Kiểm tra đường huyết / tái khám tiểu đường định kỳ',
      'Cổ to hoặc sờ thấy nhân vùng tuyến giáp',
      'Mệt mỏi kéo dài, rối loạn mỡ máu / chuyển hóa',
    ],
  },
  {
    id: 'digest_gen',
    general: 'Tiêu hóa & Nội tổng quát',
    recommendedDept: 'Khoa Nội',
    details: [
      'Đau thượng vị, ợ chua, đầy bụng sau ăn',
      'Sốt nhẹ, mệt mỏi toàn thân chưa rõ nguyên nhân',
      'Rối loạn tiêu hóa, buồn nôn',
      'Khám sức khỏe tổng quát định kỳ',
    ],
  },
]

// Chỉ cho phép đặt lịch từ ngày hôm sau trở đi (Demo hôm nay là 25/10)
const AVAILABLE_DAYS: {
  id: string
  dow: string
  date: string
  daysAway: number
  sessions: {
    id: 'morning' | 'afternoon'
    label: string
    sub: string
    slots: string[]
  }[]
}[] = [
  {
    id: '2026-10-26',
    dow: 'Thứ Hai',
    date: '26/10',
    daysAway: 1,
    sessions: [
      {
        id: 'morning',
        label: 'Ca Sáng',
        sub: '07:00 - 11:00',
        slots: ['07:00 - 08:00', '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00'],
      },
      {
        id: 'afternoon',
        label: 'Ca Chiều',
        sub: '13:00 - 17:00',
        slots: ['13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00'],
      },
    ],
  },
  {
    id: '2026-10-27',
    dow: 'Thứ Ba',
    date: '27/10',
    daysAway: 2,
    sessions: [
      {
        id: 'morning',
        label: 'Ca Sáng',
        sub: '07:00 - 11:00',
        slots: ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00'],
      },
      {
        id: 'afternoon',
        label: 'Ca Chiều',
        sub: '13:00 - 17:00',
        slots: ['13:00 - 14:00', '15:00 - 16:00', '16:00 - 17:00'],
      },
    ],
  },
  {
    id: '2026-10-29',
    dow: 'Thứ Năm',
    date: '29/10',
    daysAway: 4,
    sessions: [
      {
        id: 'morning',
        label: 'Ca Sáng',
        sub: '07:00 - 11:00',
        slots: ['07:00 - 08:00', '09:00 - 10:00'],
      },
      {
        id: 'afternoon',
        label: 'Ca Chiều',
        sub: '13:00 - 17:00',
        slots: ['14:00 - 15:00', '15:00 - 16:00'],
      },
    ],
  },
  {
    id: '2026-10-30',
    dow: 'Thứ Sáu',
    date: '30/10',
    daysAway: 5,
    sessions: [
      {
        id: 'morning',
        label: 'Ca Sáng',
        sub: '07:00 - 11:00',
        slots: ['07:00 - 08:00', '08:00 - 09:00', '10:00 - 11:00'],
      },
    ],
  },
]

export default function Booking({
  person,
  onCreateAppointment,
  onGoHome,
}: {
  person: Person
  onCreateAppointment: (payload: BookingPayload) => void
  onGoHome: () => void
}) {
  // 2 chế độ: 'by-doctor' (Theo Khoa & Bác sĩ) | 'by-patient' (Theo Giờ rảnh & Tình trạng bệnh)
  const [mode, setMode] = useState<'by-doctor' | 'by-patient'>('by-doctor')

  // State chọn Khoa & Bác sĩ
  const [deptName, setDeptName] = useState<string>(DEPT_META[0].name)
  const [doctorId, setDoctorId] = useState<string>(DEPT_META[0].doctorIds[0])

  // State chọn Thời gian theo 3 bước tuần tự (1: Ngày -> 2: Ca khám -> 3: Khung giờ 1 tiếng)
  const [timeStep, setTimeStep] = useState<1 | 2 | 3>(1)
  const [dayId, setDayId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<'morning' | 'afternoon' | null>(null)
  const [slotTime, setSlotTime] = useState<string | null>(null)

  // State chọn Triệu chứng (Khái quát -> Chi tiết) + Ghi chú thêm
  const [generalId, setGeneralId] = useState<string>(SYMPTOM_TREE[0].id)
  const [selectedDetails, setSelectedDetails] = useState<string[]>([])
  const [extraNote, setExtraNote] = useState('')

  // State xác nhận & hoàn tất
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [completedBooking, setCompletedBooking] = useState<BookingPayload | null>(null)

  const selectedDayObj = AVAILABLE_DAYS.find((d) => d.id === dayId)
  const selectedSessionObj = selectedDayObj?.sessions.find((s) => s.id === sessionId)
  const currentGeneralObj = SYMPTOM_TREE.find((g) => g.id === generalId) ?? SYMPTOM_TREE[0]

  // Chuyên khoa & Bác sĩ hiệu lực (tùy theo chế độ đặt lịch)
  const effectiveDeptName = mode === 'by-doctor' ? deptName : currentGeneralObj.recommendedDept
  const effectiveDeptMeta = DEPT_META.find((d) => d.name === effectiveDeptName) ?? DEPT_META[0]
  const effectiveDoctorId =
    mode === 'by-doctor' && effectiveDeptMeta.doctorIds.includes(doctorId)
      ? doctorId
      : effectiveDeptMeta.doctorIds[0]
  const effectiveDoctor = DOCTORS[effectiveDoctorId]

  const toggleDetailSymptom = (item: string) => {
    setSelectedDetails((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    )
  }

  const resetTimeWizard = () => {
    setTimeStep(1)
    setDayId(null)
    setSessionId(null)
    setSlotTime(null)
  }

  const switchMode = (nextMode: 'by-doctor' | 'by-patient') => {
    setMode(nextMode)
    resetTimeWizard()
  }

  const fullSlotLabel =
    selectedDayObj && slotTime ? `${selectedDayObj.dow}, ${selectedDayObj.date} • ${slotTime}` : ''

  const combinedSymptoms = [
    ...selectedDetails,
    extraNote.trim() ? extraNote.trim() : null,
  ]
    .filter(Boolean)
    .join('; ')

  const canSubmit =
    !!selectedDayObj &&
    !!selectedSessionObj &&
    !!slotTime &&
    !!effectiveDoctorId &&
    (mode === 'by-doctor' || selectedDetails.length > 0 || extraNote.trim().length > 0)

  const handleConfirmBooking = () => {
    if (!canSubmit || !selectedDayObj || !slotTime) return
    const payload: BookingPayload = {
      doctorId: effectiveDoctorId,
      department: effectiveDeptMeta.name,
      slot: fullSlotLabel,
      room: effectiveDeptMeta.room,
      symptomsNote: combinedSymptoms || 'Khám kiểm tra theo lịch hẹn',
    }
    onCreateAppointment(payload)
    setConfirmOpen(false)
    setCompletedBooking(payload)
  }

  // MÀN HÌNH THÔNG BÁO SAU KHI ĐẶT LỊCH THÀNH CÔNG
  if (completedBooking) {
    const doc = DOCTORS[completedBooking.doctorId]
    return (
      <div className="px-5 pt-6 pb-8">
        <div className="rounded-[28px] border-2 border-ok/30 bg-ok-bg/60 p-6 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok text-white shadow-md">
            <CalendarCheck size={34} strokeWidth={2.4} aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-ink">Đặt lịch khám thành công!</h1>
          <p className="mt-1.5 text-base text-ink-2">
            Hồ sơ bệnh nhân: <strong className="text-ink">{person.name}</strong>
          </p>

          <dl className="mt-5 divide-y divide-line/70 rounded-2xl bg-white p-4 text-left text-base shadow-sm">
            <div className="flex justify-between gap-2 py-2">
              <dt className="text-ink-2">Chuyên khoa:</dt>
              <dd className="font-bold text-ink">{completedBooking.department}</dd>
            </div>
            <div className="flex justify-between gap-2 py-2">
              <dt className="text-ink-2">Bác sĩ khám:</dt>
              <dd className="font-bold text-ink">{doc.name}</dd>
            </div>
            <div className="flex justify-between gap-2 py-2">
              <dt className="text-ink-2">Thời gian:</dt>
              <dd className="tabular font-extrabold text-brand-800">{completedBooking.slot}</dd>
            </div>
            <div className="flex justify-between gap-2 py-2">
              <dt className="text-ink-2">Phòng khám:</dt>
              <dd className="font-semibold text-ink">{completedBooking.room}</dd>
            </div>
          </dl>
        </div>

        {/* Lưu ý quan trọng cho bệnh nhân */}
        <div className="mt-5 rounded-3xl border-2 border-warn/60 bg-warn-bg p-5 text-warn">
          <h2 className="text-lg font-bold">Lưu ý quan trọng khi đi khám:</h2>
          <ul className="mt-3 flex flex-col gap-3 text-base leading-relaxed">
            <li className="flex items-start gap-3">
              <Clock3 size={22} className="mt-0.5 shrink-0 font-bold" aria-hidden="true" />
              <span>
                Vui lòng <strong>đến sớm 20 – 30 phút</strong> trước giờ khám ({completedBooking.slot.split(' • ')[1]}) để chuẩn bị thủ tục và đo sinh hiệu.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Smartphone size={22} className="mt-0.5 shrink-0 font-bold" aria-hidden="true" />
              <span>
                Cần <strong>mang theo điện thoại</strong> có cài ứng dụng để <strong>quét mã QR tại ki-ốt</strong> để có thể bắt đầu khám theo lịch đã hẹn.
              </span>
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={onGoHome}>Về Trang chủ xem lịch hẹn</Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setCompletedBooking(null)
              resetTimeWizard()
              setSelectedDetails([])
              setExtraNote('')
            }}
          >
            Đặt thêm lịch khám khác
          </Button>
        </div>
      </div>
    )
  }

  // Khối giao diện chọn Ngày -> Ca khám -> Khung giờ (3 bước tuần tự)
  const TimeStepSelector = (
    <section className="rounded-3xl border border-line/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-ink">
          {timeStep === 1
            ? 'Bước 1/3: Chọn ngày khám'
            : timeStep === 2
              ? 'Bước 2/3: Chọn ca khám'
              : 'Bước 3/3: Chọn khung giờ (1 tiếng)'}
        </h2>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-bold text-brand-800">
          {timeStep}/3
        </span>
      </div>

      {/* Thanh tiến trình 3 bước giống form Thêm người thân */}
      <div className="mt-3 mb-4 grid grid-cols-3 gap-2" aria-hidden="true">
        <span className="h-2 rounded-full bg-brand-700" />
        <span
          className={cx(
            'h-2 rounded-full transition-colors',
            timeStep >= 2 ? 'bg-brand-700' : 'bg-line',
          )}
        />
        <span
          className={cx(
            'h-2 rounded-full transition-colors',
            timeStep >= 3 ? 'bg-brand-700' : 'bg-line',
          )}
        />
      </div>

      {/* BƯỚC 1: CHỌN NGÀY KHÁM (Chỉ cho phép đặt từ ngày mai trở đi) */}
      {timeStep === 1 && (
        <div>
          <p className="mb-3 text-sm font-medium text-ink-2">
            Chỉ mở đặt lịch từ ngày hôm sau trở đi và còn khung giờ trống:
          </p>
          <ul className="flex flex-col gap-2.5" role="radiogroup" aria-label="Chọn ngày khám">
            {AVAILABLE_DAYS.map((d) => {
              const selected = dayId === d.id
              const totalSlots = d.sessions.reduce((acc, s) => acc + s.slots.length, 0)
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setDayId(d.id)
                      setSessionId(null)
                      setSlotTime(null)
                    }}
                    className={cx(
                      'flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition',
                      selected
                        ? 'border-brand-700 bg-brand-50 text-brand-900'
                        : 'border-line bg-white text-ink hover:border-brand-700',
                    )}
                  >
                    <div>
                      <p className="text-base font-bold">
                        {d.dow}, {d.date}
                      </p>
                      <p className="text-sm text-ink-2">Còn {totalSlots} khung giờ trống</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-brand-100 px-3 py-1 text-sm font-bold text-brand-900">
                        {d.daysAway} ngày sau
                      </span>
                      {selected && <Check size={20} strokeWidth={2.8} className="text-brand-800" />}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
          <Button
            className="mt-4"
            size="md"
            disabled={!dayId}
            onClick={() => setTimeStep(2)}
          >
            Tiếp tục chọn ca khám <ChevronRight size={20} />
          </Button>
        </div>
      )}

      {/* BƯỚC 2: CHỌN CA KHÁM LỚN (SÁNG / CHIỀU) */}
      {timeStep === 2 && selectedDayObj && (
        <div>
          <p className="mb-3 text-sm font-medium text-ink-2">
            Ngày đã chọn:{' '}
            <strong className="text-ink">
              {selectedDayObj.dow}, {selectedDayObj.date} ({selectedDayObj.daysAway} ngày sau)
            </strong>
          </p>
          <ul className="flex flex-col gap-2.5" role="radiogroup" aria-label="Chọn ca khám">
            {selectedDayObj.sessions.map((ses) => {
              const selected = sessionId === ses.id
              const Icon = ses.id === 'morning' ? SunMedium : Sunset
              return (
                <li key={ses.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setSessionId(ses.id)
                      setSlotTime(null)
                    }}
                    className={cx(
                      'flex min-h-16 w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3 text-left transition',
                      selected
                        ? 'border-brand-700 bg-brand-50 text-brand-900'
                        : 'border-line bg-white text-ink hover:border-brand-700',
                    )}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-900">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold">{ses.label}</p>
                      <p className="tabular text-sm text-ink-2">
                        {ses.sub} • Còn {ses.slots.length} khung giờ
                      </p>
                    </div>
                    {selected && <Check size={22} strokeWidth={2.8} className="text-brand-800" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-4 flex flex-col gap-2.5">
            <Button size="md" disabled={!sessionId} onClick={() => setTimeStep(3)}>
              Tiếp tục chọn khung giờ <ChevronRight size={20} />
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setTimeStep(1)
                setSessionId(null)
              }}
            >
              <ArrowLeft size={18} /> Chọn lại ngày khám
            </Button>
          </div>
        </div>
      )}

      {/* BƯỚC 3: CHỌN KHUNG GIỜ NHỎ (1 TIẾNG) */}
      {timeStep === 3 && selectedDayObj && selectedSessionObj && (
        <div>
          <p className="mb-3 text-sm font-medium text-ink-2">
            Đang chọn:{' '}
            <strong className="text-ink">
              {selectedSessionObj.label} — {selectedDayObj.dow}, {selectedDayObj.date}
            </strong>
          </p>
          <ul className="grid grid-cols-1 gap-2.5" role="radiogroup" aria-label="Chọn khung giờ">
            {selectedSessionObj.slots.map((s) => {
              const selected = slotTime === s
              return (
                <li key={s}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSlotTime(s)}
                    className={cx(
                      'flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-left text-base font-bold transition',
                      selected
                        ? 'border-brand-700 bg-brand-50 text-brand-900'
                        : 'border-line bg-white text-ink hover:border-brand-700',
                    )}
                  >
                    <Clock3 size={20} aria-hidden="true" />
                    <span className="tabular flex-1">{s}</span>
                    <span className="rounded-full bg-ok-bg px-2.5 py-0.5 text-xs font-semibold text-ok-ink">
                      Còn trống
                    </span>
                    {selected && <Check size={22} strokeWidth={2.8} className="text-brand-800" />}
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="mt-4">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setTimeStep(2)
                setSlotTime(null)
              }}
            >
              <ArrowLeft size={18} /> Chọn lại ca khám
            </Button>
          </div>
        </div>
      )}
    </section>
  )

  // Khối chọn tình trạng bệnh từ Khái quát -> Chi tiết
  const SymptomSelector = (
    <section className="rounded-3xl border border-line/80 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-bold text-ink">Tình trạng sức khỏe / Triệu chứng</h2>
      <p className="mt-1 text-sm text-ink-2">
        Chọn nhóm triệu chứng khái quát đến chi tiết để bác sĩ nắm bắt nhanh:
      </p>

      {/* Bước A: Nhóm triệu chứng khái quát */}
      <p className="mt-3.5 text-sm font-bold text-ink">1. Nhóm vấn đề khái quát:</p>
      <div className="mt-2 flex flex-col gap-2" role="radiogroup" aria-label="Nhóm triệu chứng khái quát">
        {SYMPTOM_TREE.map((group) => {
          const active = generalId === group.id
          return (
            <button
              key={group.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setGeneralId(group.id)
                setSelectedDetails([])
                if (mode === 'by-patient') {
                  const recDept = DEPT_META.find((d) => d.name === group.recommendedDept)
                  if (recDept) {
                    setDeptName(recDept.name)
                    setDoctorId(recDept.doctorIds[0])
                  }
                }
              }}
              className={cx(
                'flex items-center justify-between gap-2 rounded-2xl border-2 px-3.5 py-2.5 text-left text-base font-semibold transition',
                active
                  ? 'border-brand-700 bg-brand-50 text-brand-900'
                  : 'border-line bg-surface/60 text-ink hover:border-brand-700',
              )}
            >
              <span>{group.general}</span>
              {active && <Check size={20} strokeWidth={2.8} className="shrink-0 text-brand-800" />}
            </button>
          )
        })}
      </div>

      {/* Bước B: Triệu chứng chi tiết */}
      <p className="mt-4 text-sm font-bold text-ink">2. Triệu chứng chi tiết (có thể chọn nhiều):</p>
      <div className="mt-2 flex flex-col gap-2">
        {currentGeneralObj.details.map((detail) => {
          const checked = selectedDetails.includes(detail)
          return (
            <button
              key={detail}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggleDetailSymptom(detail)}
              className={cx(
                'flex items-start gap-3 rounded-2xl border-2 px-3.5 py-2.5 text-left text-base font-medium transition',
                checked
                  ? 'border-brand-700 bg-brand-50 font-semibold text-brand-900'
                  : 'border-line bg-white text-ink hover:border-brand-700',
              )}
            >
              <span
                className={cx(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2',
                  checked ? 'border-brand-700 bg-brand-700 text-white' : 'border-line bg-white',
                )}
              >
                {checked && <Check size={14} strokeWidth={3} />}
              </span>
              <span>{detail}</span>
            </button>
          )
        })}
      </div>

      {/* Ghi chú thêm */}
      <label htmlFor="symptom-note" className="mt-4 block text-sm font-bold text-ink">
        3. Mô tả thêm (nếu có):
      </label>
      <textarea
        id="symptom-note"
        rows={2}
        value={extraNote}
        onChange={(e) => setExtraNote(e.target.value)}
        placeholder="VD: Triệu chứng kéo dài 3 ngày, đã uống thuốc hạ sốt..."
        className="mt-1.5 w-full rounded-2xl border-2 border-line bg-white p-3 text-base text-ink outline-none focus:border-brand-700"
      />
    </section>
  )

  return (
    <div className="pb-8">
      <PageTitle
        title="Đặt lịch khám"
        subtitle={`Đặt lịch khám cho ${person.name}`}
      />
      {/* Chuyển đổi 2 hình thức đặt lịch */}
      <div className="px-5 pt-2">
        <div
          role="tablist"
          aria-label="Phương thức đặt lịch"
          className="grid grid-cols-2 gap-1.5 rounded-2xl bg-surface p-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'by-doctor'}
            onClick={() => switchMode('by-doctor')}
            className={cx(
              'min-h-12 rounded-xl px-2 py-2 text-sm leading-tight font-bold transition',
              mode === 'by-doctor'
                ? 'bg-white text-brand-900 shadow-sm'
                : 'text-ink-2 hover:text-ink',
            )}
          >
            Theo Khoa & Bác sĩ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'by-patient'}
            onClick={() => switchMode('by-patient')}
            className={cx(
              'min-h-12 rounded-xl px-2 py-2 text-sm leading-tight font-bold transition',
              mode === 'by-patient'
                ? 'bg-white text-brand-900 shadow-sm'
                : 'text-ink-2 hover:text-ink',
            )}
          >
            Theo Giờ rảnh & Bệnh
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 px-5">
        {mode === 'by-doctor' ? (
          <>
            {/* CHẾ ĐỘ 1: Chọn Khoa -> Bác sĩ -> Khung giờ trống (3 bước) -> Tình trạng bệnh */}
            <section className="rounded-3xl border border-line/80 bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                <Hospital size={20} className="text-brand-800" /> Chọn chuyên khoa & bác sĩ
              </h2>
              <div className="mt-3 grid grid-cols-1 gap-2" role="radiogroup" aria-label="Chuyên khoa">
                {DEPT_META.map((d) => {
                  const selected = deptName === d.name
                  return (
                    <button
                      key={d.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => {
                        setDeptName(d.name)
                        setDoctorId(d.doctorIds[0])
                        resetTimeWizard()
                      }}
                      className={cx(
                        'flex items-center justify-between gap-3 rounded-2xl border-2 px-3.5 py-2.5 text-left transition',
                        selected
                          ? 'border-brand-700 bg-brand-50 text-brand-900'
                          : 'border-line bg-white text-ink hover:border-brand-700',
                      )}
                    >
                      <div>
                        <p className="text-base font-bold">{d.name}</p>
                        <p className="text-sm text-ink-2">{d.desc}</p>
                      </div>
                      {selected && <Check size={20} strokeWidth={2.8} className="shrink-0 text-brand-800" />}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 border-t border-line/70 pt-3">
                <p className="text-sm font-bold text-ink-2">Bác sĩ phụ trách chuyên khoa:</p>
                <div className="mt-2 flex items-center gap-3 rounded-2xl bg-surface p-3">
                  <Avatar name={effectiveDoctor.name} photo={effectiveDoctor.photo} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-ink">{effectiveDoctor.name}</p>
                    <p className="text-sm text-ink-2">
                      {effectiveDoctor.title} • {effectiveDeptMeta.room}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {TimeStepSelector}
            {SymptomSelector}
          </>
        ) : (
          <>
            {/* CHẾ ĐỘ 2: Chọn Giờ rảnh của bệnh nhân (3 bước) + Tình trạng bệnh -> Hệ thống gợi ý Bác sĩ & Khoa */}
            {TimeStepSelector}
            {SymptomSelector}

            <section className="rounded-3xl border-2 border-brand-700/40 bg-brand-50/70 p-4">
              <div className="flex items-center gap-2 text-brand-900">
                <Sparkles size={20} className="shrink-0" />
                <h2 className="text-base font-bold">Chuyên khoa & Bác sĩ phù hợp được gợi ý</h2>
              </div>
              <p className="mt-1 text-sm text-ink-2">
                Dựa trên nhóm triệu chứng <strong>"{currentGeneralObj.general}"</strong> và khung giờ rảnh của bạn:
              </p>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-brand-200 bg-white p-3.5 shadow-sm">
                <Avatar name={effectiveDoctor.name} photo={effectiveDoctor.photo} size={52} />
                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-900">
                    {effectiveDeptMeta.name}
                  </span>
                  <p className="mt-1 text-base font-bold text-ink">{effectiveDoctor.name}</p>
                  <p className="text-sm text-ink-2">{effectiveDeptMeta.room}</p>
                </div>
                <Stethoscope size={24} className="shrink-0 text-brand-800" />
              </div>
            </section>
          </>
        )}

        <Button
          disabled={!canSubmit}
          onClick={() => setConfirmOpen(true)}
          className="mt-2"
        >
          <CalendarClock size={22} aria-hidden="true" /> Kiểm tra & Xác nhận đặt lịch
        </Button>
      </div>

      {/* Hộp thoại xác nhận bước cuối cùng */}
      <ConfirmDialog
        open={confirmOpen}
        action="đặt lịch khám"
        userName={person.name}
        icon={CalendarCheck}
        confirmLabel="Xác nhận đặt lịch"
        onConfirm={handleConfirmBooking}
        onClose={() => setConfirmOpen(false)}
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-base">
          <dt className="text-ink-2">Chuyên khoa:</dt>
          <dd className="font-bold text-ink">{effectiveDeptMeta.name}</dd>
          <dt className="text-ink-2">Bác sĩ:</dt>
          <dd className="font-bold text-ink">{effectiveDoctor.name}</dd>
          <dt className="text-ink-2">Phòng khám:</dt>
          <dd className="text-ink">{effectiveDeptMeta.room}</dd>
          <dt className="text-ink-2">Thời gian:</dt>
          <dd className="tabular font-bold text-brand-800">{fullSlotLabel}</dd>
          <dt className="text-ink-2">Tình trạng:</dt>
          <dd className="text-ink">{combinedSymptoms || 'Khám kiểm tra theo lịch hẹn'}</dd>
        </dl>
      </ConfirmDialog>
    </div>
  )
}