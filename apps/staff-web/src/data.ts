// "lab" = examined, sent for paraclinical tests (Chờ KQ CLS), returns to the doctor later
export type QStatus = "waiting" | "called" | "inroom" | "done" | "skipped" | "lab"

export type Vitals = { pulse: string; bp: string; temp: string; spo2: string }

// MEDICAL_RECORDS
export type MedicalRecord = {
  chiefComplaint: string
  examinationNote: string
  vitals: Vitals
  diagnosisText: string
  savedAt?: string
}

// SERVICE_REQUESTS + LAB_RESULTS. Status is derived from the timestamps (see orderStatus).
export type ServiceRequest = {
  id: string
  type: "LAB" | "IMAGING"
  name: string
  room: string
  startAt: number
  readyAt: number
  resultSummary: string
  resultDetail?: string
}

export type OrderStatus = "ORDERED" | "IN_PROGRESS" | "COMPLETED"

export const orderStatus = (o: ServiceRequest, now: number): OrderStatus =>
  now >= o.readyAt ? "COMPLETED" : now >= o.startAt ? "IN_PROGRESS" : "ORDERED"

export type Patient = {
  id: string
  order: number
  name: string
  birthYear: number
  priority?: boolean
  status: QStatus
  updatedAt?: string
  transferredFrom?: string
  // Set by the head nurse / admin via "Ưu tiên khám"
  urgent?: boolean
  checkIn?: string
  checkInAt?: number
  gender?: "Nam" | "Nữ"
  insuranceCode?: string
  guardian?: string
  intakeNote?: string
  record?: MedicalRecord
  orders?: ServiceRequest[]
  // epoch ms — drive the "Đã gọi … trước" label and the live exam timer
  calledAt?: number
  startedAt?: number
  callCount: number;
}

export type Specialty = "Tim mạch" | "Tổng quát"

export type Room = {
  id: string
  name: string
  // Short clinic title used in the department command center, e.g. "Phòng Nội Tim mạch 1"
  title: string
  short: string
  specialty: Specialty
  doctor: string
  // Corridor capacity and daily intake quota
  maxWaiting: number
  dailyQuota: number
  closed: boolean
  // Temporarily stop calling new numbers without closing the queue
  paused?: boolean
  patients: Patient[]
}

export type Role = "admin" | "headnurse" | "nurse" | "doctor" | "patient"

export type User = {
  username: string
  password: string
  fullName: string
  role: Role
  room: string | null
  status: "active" | "locked"
  email: string
  phone: string
  patientCode?: string
  // dd/mm/yyyy — when the patient record/account was created
  createdAt?: string
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Quản trị viên",
  headnurse: "Điều dưỡng trưởng",
  nurse: "Điều dưỡng",
  doctor: "Bác sĩ",
  patient: "Bệnh nhân",
}

export const STATUS_META: Record<QStatus, {
  label: string
  badge: string
  dot: string
}> = {
  waiting: {
    label: "Đang chờ",
    badge: "bg-slate-100 text-slate-700 ring-slate-400/30",
    dot: "bg-slate-500",
  },
  called: {
    label: "Đã gọi",
    badge: "bg-orange-50 text-orange-800 ring-orange-500/30",
    dot: "bg-orange-500",
  },
  inroom: {
    label: "Đang khám",
    badge: "bg-emerald-50 text-emerald-800 ring-emerald-600/30",
    dot: "bg-emerald-600",
  },
  lab: {
    label: "Chờ KQ CLS",
    badge: "bg-violet-50 text-violet-800 ring-violet-500/30",
    dot: "bg-violet-500",
  },
  done: {
    label: "Hoàn tất",
    badge: "bg-slate-50 text-slate-400 ring-slate-300/40",
    dot: "bg-slate-300",
  },
  skipped: {
    label: "Qua lượt",
    badge: "bg-amber-50 text-amber-800 ring-amber-500/30",
    dot: "bg-amber-500",
  },
}

export const nowHHMM = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const NAMES = [
  ["Trần Thị Mai", 1968],
  ["Phạm Văn Hùng", 1955],
  ["Lê Thị Hồng Nhung", 1982],
  ["Võ Quốc Bảo", 1974],
  ["Đặng Thu Trang", 1990],
  ["Huỳnh Minh Khoa", 1961],
  ["Ngô Thị Lan", 1979],
  ["Bùi Đức Thắng", 1987],
  ["Trương Gia Huy", 1958],
  ["Lý Thanh Tâm", 1993],
  ["Đỗ Hoàng Nam", 1970],
  ["Phan Ngọc Ánh", 1985],
  ["Vũ Minh Châu", 1966],
  ["Hồ Thị Thu", 1951],
  ["Mai Văn Lộc", 1977],
  ["Châu Bảo Ngọc", 1999],
  ["Tạ Quang Vinh", 1963],
  ["Dương Thị Hà", 1972],
  ["Kiều Anh Tuấn", 1988],
  ["La Thị Kim", 1957],
  ["Quách Văn Sơn", 1981],
  ["Lâm Mỹ Duyên", 1995],
  ["Thái Hữu Phước", 1960],
  ["Cao Thị Yến", 1976],
] as const

type QueueSpec = {
  idPrefix: number
  firstOrder: number
  nameOffset: number
  done: number
  // positions (0-based) inside the finished block that were skipped instead of done
  skipped?: number[]
  // positions inside the finished block that are waiting for paraclinical results
  lab?: number[]
  inroom?: boolean
  called?: boolean
  waiting: number
  // minutes between check-ins
  interval?: number
  inroomFor?: number
  calledFor?: number
}

const hhmm = (t: number) => {
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

const FEMALE = new Set<string>([
  "Trần Thị Mai", "Lê Thị Hồng Nhung", "Đặng Thu Trang", "Ngô Thị Lan", "Lý Thanh Tâm", "Phan Ngọc Ánh",
  "Vũ Minh Châu", "Hồ Thị Thu", "Châu Bảo Ngọc", "Dương Thị Hà", "La Thị Kim", "Lâm Mỹ Duyên", "Cao Thị Yến",
])

const INTAKE = [
  "Tái khám định kỳ tăng huyết áp",
  "Hồi hộp, mệt khi gắng sức",
  "Đau ngực thoáng qua",
  "Khám sức khỏe tim mạch",
  "Chóng mặt, nhức đầu buổi sáng",
  "Tái khám sau đặt stent",
]

function makeQueue(q: QueueSpec): Patient[] {
  const now = Date.now()
  const finished = q.done + (q.skipped?.length ?? 0) + (q.lab?.length ?? 0)
  const n = finished + (q.inroom ? 1 : 0) + (q.called ? 1 : 0) + q.waiting
  const interval = q.interval ?? 4
  return Array.from({ length: n }, (_, i) => {
    const order = q.firstOrder + i
    const [name, birthYear] = NAMES[(i + q.nameOffset) % NAMES.length]
    let status: QStatus = "waiting"
    if (i < finished) status = q.skipped?.includes(i) ? "skipped" : q.lab?.includes(i) ? "lab" : "done"
    else if (q.inroom && i === finished) status = "inroom"
    else if (q.called && i === finished + (q.inroom ? 1 : 0)) status = "called"
    const checkInAt = now - ((n - i) * interval + 1) * 60_000
    return {
      id: `BN-${q.idPrefix}${String(order).slice(-3)}`,
      order,
      name,
      birthYear,
      priority: birthYear < 1960,
      status,
      checkInAt,
      checkIn: hhmm(checkInAt),
      updatedAt: status === "done" || status === "skipped" ? hhmm(checkInAt + 20 * 60_000) : undefined,
      startedAt: status === "inroom" ? now - (q.inroomFor ?? 4 * 60) * 1000 : undefined,
      calledAt: status === "called" ? now - (q.calledFor ?? 60) * 1000 : undefined,
      callCount: 0,
      gender: FEMALE.has(name) ? "Nữ" : "Nam",
      insuranceCode: `DN4${String(7974182910 + (order - 1009) * 7919).slice(-10)}`,
      intakeNote: INTAKE[(i + q.nameOffset) % INTAKE.length],
    }
  })
}

const room = (
  id: string,
  title: string,
  specialty: Specialty,
  doctor: string,
  queue: QueueSpec,
  extra: Partial<Room> = {},
): Room => ({
  id,
  name: `Phòng Nội ${specialty} ${id}`,
  title,
  short: `Phòng ${id}`,
  specialty,
  doctor,
  maxWaiting: 15,
  dailyQuota: 50,
  closed: false,
  patients: makeQueue(queue),
  ...extra,
})

export const INITIAL_ROOMS: Room[] = [
  // 101: 16 done, 1 skipped, 2 waiting for CLS results (1005, 1007), 1009 in service, 1010 called, 14 waiting from 1011.
  seed101(room("101", "Phòng Nội Tim mạch 1", "Tim mạch", "BS. Lê Minh Tuấn", {
    idPrefix: 24, firstOrder: 990, nameOffset: 6, done: 16, skipped: [14], lab: [15, 17], inroom: true, called: true, waiting: 14,
    inroomFor: 6 * 60 + 15, calledFor: 120,
  })),
  room("102", "Phòng Nội Tim mạch 2", "Tim mạch", "BS. Nguyễn Thị Hạnh", {
    idPrefix: 33, firstOrder: 2001, nameOffset: 9, done: 35, skipped: [20], inroom: true, called: true, waiting: 10, interval: 3,
  }),
  room("103", "Phòng Nội Tim mạch 3", "Tim mạch", "BS. Phan Quang Vinh", {
    idPrefix: 39, firstOrder: 3001, nameOffset: 15, done: 20, inroom: true, called: true, waiting: 2, interval: 5,
  }),
  room("104", "Phòng Nội Tổng quát 1", "Tổng quát", "BS. Đỗ Thanh Bình", {
    idPrefix: 43, firstOrder: 4001, nameOffset: 19, done: 15, skipped: [9], inroom: true, waiting: 2, interval: 6,
  }),
  room("105", "Phòng Nội Tổng quát 2", "Tổng quát", "BS. Trịnh Văn Long", {
    idPrefix: 45, firstOrder: 5001, nameOffset: 4, done: 12, inroom: true, called: true, waiting: 3, interval: 6,
  }),
  room(
    "106",
    "Phòng Nội Tổng quát 3",
    "Tổng quát",
    "BS. Hoàng Thu Hà",
    { idPrefix: 46, firstOrder: 6001, nameOffset: 11, done: 8, inroom: true, waiting: 1, interval: 9 },
    { paused: true },
  ),
  room("107", "Phòng Nội Tim mạch 4", "Tim mạch", "BS. Nguyễn Quốc Đạt", {
    idPrefix: 47, firstOrder: 7001, nameOffset: 6, done: 6, inroom: true, called: true, waiting: 2, interval: 10,
  }),
  room("108", "Phòng Nội Tổng quát 4", "Tổng quát", "BS. Vương Ngọc Diệp", {
    idPrefix: 48, firstOrder: 8001, nameOffset: 13, done: 4, inroom: true, waiting: 1, interval: 12,
  }),
]

// Clinical demo content for the doctor workspace (room 101).
function seed101(r: Room): Room {
  const now = Date.now()
  const min = 60_000
  const patch: Record<number, Partial<Patient>> = {
    1009: {
      insuranceCode: "DN47974182910",
      guardian: "Phạm Văn Nam (Con trai)",
      intakeNote: "Đau ngực khó thở từ sáng",
      record: {
        chiefComplaint: "Đau tức ngực trái âm ỉ lan lên vai trái, khó thở khi leo cầu thang 3 ngày nay.",
        examinationNote: "Bệnh nhân tỉnh, tiếp xúc tốt. Tim nhịp đều, T1 T2 rõ. Phổi thông khí rõ hai bên.",
        vitals: { pulse: "88", bp: "150/95", temp: "36.8", spo2: "98" },
        diagnosisText: "Cơn đau thắt ngực ổn định / Tăng huyết áp độ 2",
      },
      orders: [
        {
          id: "SR-1009-1",
          type: "IMAGING",
          name: "Điện tâm đồ (ECG 12 chuyển đạo)",
          room: "Phòng CĐHA 202",
          startAt: now - 20 * min,
          readyAt: now - 4 * min,
          resultSummary: "Nhịp xoang đều 88 ck/p, ST chênh xuống nhẹ ở V5-V6",
          resultDetail:
            "Nhịp xoang đều, tần số 88 chu kỳ/phút. Trục trung gian. PR 0,16s, QRS 0,08s. ST chênh xuống 0,5–1 mm ở V5–V6, sóng T dẹt ở DI, aVL. Không thấy dấu hiệu nhồi máu cơ tim cấp. Đề nghị đối chiếu men tim.",
        },
        {
          id: "SR-1009-2",
          type: "LAB",
          name: "Định lượng Troponin T & Bộ mỡ máu",
          room: "Phòng XN 105",
          startAt: now - 8 * min,
          readyAt: now + 2 * min,
          resultSummary: "Troponin T 0,011 ng/mL (bình thường) · LDL-C 3,9 mmol/L (tăng)",
          resultDetail:
            "Troponin T hs: 0,011 ng/mL (< 0,014). Cholesterol TP: 6,1 mmol/L ↑. Triglycerid: 2,3 mmol/L ↑. HDL-C: 1,0 mmol/L. LDL-C: 3,9 mmol/L ↑.",
        },
      ],
    },
    1005: {
      record: {
        chiefComplaint: "Khó thở khi nằm, phù nhẹ hai chân 1 tuần.",
        examinationNote: "Ran ẩm đáy phổi phải, gan không to. Phù mềm hai cổ chân.",
        vitals: { pulse: "96", bp: "135/85", temp: "36.6", spo2: "95" },
        diagnosisText: "Theo dõi suy tim mạn",
      },
      orders: [
        {
          id: "SR-1005-1",
          type: "IMAGING",
          name: "Siêu âm tim qua thành ngực",
          room: "Phòng CĐHA 204",
          startAt: now - 40 * min,
          readyAt: now - 6 * min,
          resultSummary: "EF 45%, giãn nhẹ thất trái, hở van hai lá nhẹ",
        },
      ],
    },
    1007: {
      record: {
        chiefComplaint: "Hồi hộp đánh trống ngực từng cơn.",
        examinationNote: "Tim nhịp không đều, tần số 102 l/p. Phổi không ran.",
        vitals: { pulse: "102", bp: "128/80", temp: "36.9", spo2: "97" },
        diagnosisText: "Theo dõi rung nhĩ",
      },
      orders: [
        {
          id: "SR-1007-1",
          type: "LAB",
          name: "Xét nghiệm chức năng tuyến giáp (TSH, FT4)",
          room: "Phòng XN 105",
          startAt: now - 15 * min,
          readyAt: now + 6 * min,
          resultSummary: "TSH 0,9 mUI/L · FT4 14 pmol/L (bình thường)",
        },
      ],
    },
  }
  return { ...r, patients: r.patients.map((p) => (patch[p.order] ? { ...p, ...patch[p.order] } : p)) }
}

export type LoadBand = "red" | "orange" | "green"
export type Triage = "overload" | "nearfull" | "available"

export function roomStats(r: Room) {
  const n = (s: QStatus) => r.patients.filter((p) => p.status === s).length
  const waiting = n("waiting")
  const received = r.patients.length
  const waitPct = Math.round((waiting / r.maxWaiting) * 100)
  const quotaPct = Math.round((received / r.dailyQuota) * 100)
  const band: LoadBand = waitPct >= 90 ? "red" : waitPct >= 60 ? "orange" : "green"
  const nearFull = quotaPct >= 90
  const triage: Triage = band === "red" ? "overload" : nearFull ? "nearfull" : "available"
  return {
    waiting,
    called: n("called"),
    inroom: n("inroom"),
    done: n("done"),
    skipped: n("skipped"),
    received,
    remaining: Math.max(0, r.dailyQuota - received),
    waitPct,
    quotaPct,
    band,
    nearFull,
    triage,
  }
}

const staff = (
  username: string,
  fullName: string,
  role: Role,
  room: string | null,
  email: string,
  phone: string,
  status: User["status"] = "active",
): User => ({
  username,
  password: "123",
  fullName,
  role,
  room,
  status,
  email,
  phone,
})

const patient = (
  username: string,
  fullName: string,
  patientCode: string,
  email: string,
  status: User["status"] = "active",
): User => ({
  username,
  password: "123",
  fullName,
  role: "patient",
  room: null,
  status,
  email,
  phone: username,
  patientCode,
  // Deterministic demo date derived from the patient code.
  createdAt: `${String((Number(patientCode.slice(-2)) % 27) + 1).padStart(2, "0")}/${String((Number(patientCode.slice(-3, -1)) % 12) + 1).padStart(2, "0")}/2025`,
})

export const INITIAL_USERS: User[] = [
  staff(
    "admin",
    "Trần Quốc Khánh",
    "admin",
    null,
    "khanh.tq@bvdktt.vn",
    "0903 112 001",
  ),
  staff(
    "dieuDuongTruong",
    "Nguyễn Văn A",
    "headnurse",
    null,
    "a.nv@bvdktt.vn",
    "0912 334 002",
  ),
  staff("bacSi", "Lê Minh Tuấn", "doctor", "101", "tuan.lm@bvdktt.vn", "0903 556 101"),
  staff(
    "dieuDuong",
    "Lê Thị Bích",
    "nurse",
    "101",
    "bich.lt@bvdktt.vn",
    "0988 210 101",
  ),
  staff(
    "dd.hoa",
    "Phạm Thị Hoa",
    "nurse",
    "102",
    "hoa.pt@bvdktt.vn",
    "0935 778 102",
  ),
  staff(
    "dd.minh",
    "Võ Văn Minh",
    "nurse",
    "103",
    "minh.vv@bvdktt.vn",
    "0977 901 103",
  ),
  staff(
    "dd.thao",
    "Đinh Phương Thảo",
    "nurse",
    "104",
    "thao.dp@bvdktt.vn",
    "0918 663 104",
    "locked",
  ),
  staff(
    "dd.quyen",
    "Hà Mỹ Quyên",
    "nurse",
    "104",
    "quyen.hm@bvdktt.vn",
    "0896 221 204",
  ),
  staff("dd.lan", "Trần Ngọc Lan", "nurse", "105", "lan.tn@bvdktt.vn", "0906 455 105"),
  staff("dd.son", "Phạm Hồng Sơn", "nurse", "106", "son.ph@bvdktt.vn", "0917 208 106"),
  staff("dd.my", "Nguyễn Trà My", "nurse", "107", "my.nt@bvdktt.vn", "0938 617 107"),
  staff("dd.khoa", "Lý Đăng Khoa", "nurse", "108", "khoa.ld@bvdktt.vn", "0949 330 108"),
  patient("0903412887", "Trần Thị Mai", "BN-240512", "mai.tranthi68@gmail.com"),
  patient("0912334551", "Phạm Văn Hùng", "BN-240518", "hungpv.55@gmail.com"),
  patient(
    "0988120774",
    "Lê Thị Hồng Nhung",
    "BN-240521",
    "nhung.le82@yahoo.com",
  ),
  patient(
    "0935778220",
    "Võ Quốc Bảo",
    "BN-240497",
    "baovq@outlook.com",
    "locked",
  ),
  patient(
    "0977901336",
    "Đặng Thu Trang",
    "BN-240503",
    "trang.dangthu@gmail.com",
  ),
]
