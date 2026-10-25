import type { CSSProperties } from 'react'

export type QueueStatus = 'called' | 'soon' | 'waiting' | 'paused' | 'missed' | 'cancelled'

export type Queue = {
  id: string
  prefix: string
  ticketNo: number
  currentNo: number
  ahead: number
  service: string
  room: string
  floor: string
  paused?: boolean
  postponed?: boolean
  /** Number of simulation ticks between each call — lower is faster. */
  pace: number
}

export type Person = {
  id: string
  name: string
  shortName: string
  relation: string
  dob: string
  age: number
  gender: string
  mrn: string
  bhyt: string
  cccd: string
  phone: string
  theme: ThemeKey
}

export type ThemeKey = 'blue' | 'red' | 'yellow' | 'green' | 'purple' | 'pink'

export type Theme = { key: ThemeKey; label: string; c50: string; c100: string; c200: string; ink: string; solid: string }

/** Pastel profile tones. `ink` on c50/c100/c200 and white on `solid` are all >= 7:1. */
export const THEMES: Record<ThemeKey, Theme> = {
  blue: { key: 'blue', label: 'Xanh', c50: '#eef5ff', c100: '#d6e7ff', c200: '#b5d3fb', ink: '#0b3266', solid: '#1d4e89' },
  red: { key: 'red', label: 'Đỏ', c50: '#fff1f2', c100: '#ffdce0', c200: '#fbbbc4', ink: '#6b1020', solid: '#9b1c3a' },
  yellow: { key: 'yellow', label: 'Vàng', c50: '#fff9e6', c100: '#ffedb3', c200: '#f9d97a', ink: '#5c3d00', solid: '#6e4a00' },
  green: { key: 'green', label: 'Xanh lá', c50: '#edf9f0', c100: '#d3f1dc', c200: '#a9e2ba', ink: '#0f4425', solid: '#17603a' },
  purple: { key: 'purple', label: 'Tím', c50: '#f5f1ff', c100: '#e6dcff', c200: '#cdbbf7', ink: '#3b1d74', solid: '#5b34a6' },
  pink: { key: 'pink', label: 'Hồng', c50: '#fdf2f8', c100: '#fce7f3', c200: '#fbcfe8', ink: '#831843', solid: '#be185d' },
}


export const THEME_ORDER: ThemeKey[] = ['blue', 'red', 'yellow', 'green', 'purple', 'pink']

export function themeVars(t: Theme) {
  return {
    '--t-50': t.c50,
    '--t-100': t.c100,
    '--t-200': t.c200,
    '--t-ink': t.ink,
    '--t-solid': t.solid,
  } as CSSProperties
}

export const MINUTES_PER_PERSON = 4

export const PEOPLE: Person[] = [
  {
    id: 'self',
    name: 'Nguyễn Văn A',
    shortName: 'Nguyễn Văn A',
    relation: 'Bản thân',
    dob: '14/03/1988',
    age: 38,
    gender: 'Nam',
    mrn: 'BN-26-004815',
    bhyt: 'DN4797912345678',
    cccd: '079 188 012 345',
    phone: '0903 456 789',
    theme: 'blue',
  },
  {
    id: 'dad',
    name: 'Nguyễn Văn B',
    shortName: 'Nguyễn Văn B',
    relation: 'Bố',
    dob: '02/09/1958',
    age: 68,
    gender: 'Nam',
    mrn: 'BN-24-001207',
    bhyt: 'HT2797900112233',
    cccd: '079 058 004 112',
    phone: '0912 222 315',
    theme: 'red',
  },
  {
    id: 'mom',
    name: 'Nguyễn Văn C',
    shortName: 'Nguyễn Văn C',
    relation: 'Mẹ',
    dob: '21/06/1961',
    age: 65,
    gender: 'Nữ',
    mrn: 'BN-24-001208',
    bhyt: 'HT2797900445566',
    cccd: '079 161 007 889',
    phone: '0912 222 316',
    theme: 'yellow',
  },
  {
    id: 'kid',
    name: 'Nguyễn Văn D',
    shortName: 'Nguyễn Văn D',
    relation: 'Con',
    dob: '09/11/2016',
    age: 9,
    gender: 'Nam',
    mrn: 'BN-25-003390',
    bhyt: 'TE1797901234567',
    cccd: '—',
    phone: '0903 456 789',
    theme: 'green',
  },
]

export const INITIAL_QUEUES: Record<string, Queue[]> = {
  self: [
    {
      id: 'noi',
      prefix: 'A',
      ticketNo: 15,
      currentNo: 12,
      ahead: 3,
      service: 'Khám Nội tổng quát',
      room: 'Phòng 204',
      floor: 'Tầng 2',
      pace: 1,
    },
    {
      id: 'xq',
      prefix: 'C',
      ticketNo: 31,
      currentNo: 22,
      ahead: 9,
      service: 'Chụp X-Quang ngực',
      room: 'Phòng 108',
      floor: 'Tầng 1',
      pace: 3,
    },
    {
      id: 'mau',
      prefix: 'B',
      ticketNo: 104,
      currentNo: 99,
      ahead: 5,
      service: 'Lấy máu xét nghiệm',
      room: 'Phòng 112',
      floor: 'Tầng 1',
      paused: true,
      pace: 2,
    },
  ],
  dad: [
    {
      id: 'tim',
      prefix: 'D',
      ticketNo: 7,
      currentNo: 2,
      ahead: 5,
      service: 'Khám Tim mạch',
      room: 'Phòng 305',
      floor: 'Tầng 3',
      pace: 2,
    },
  ],
  mom: [],
  kid: [],
}

export function ticketLabel(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(3, '0')}`
}

export function queueStatus(q: Queue): QueueStatus {
  if (q.paused) return 'paused'
  if (q.ahead <= 0) return 'called'
  if (q.ahead <= 3) return 'soon'
  return 'waiting'
}

export type Doctor = { id: string; name: string; title: string; photo?: string }

export const DOCTORS: Record<string, Doctor> = {
  ha: {
    id: 'ha',
    name: 'BS. Nguyễn Thu Hà',
    title: 'Bác sĩ CKI · Khoa Nội',
    photo:
      'https://images.unsplash.com/photo-1659353888906-adb3e0041693?crop=faces&fit=crop&w=200&h=200&q=80',
  },
  quan: {
    id: 'quan',
    name: 'BS. Lê Minh Quân',
    title: 'ThS.BS · Khoa Tim mạch',
    photo:
      'https://images.unsplash.com/photo-1612349316228-5942a9b489c2?crop=faces&fit=crop&w=200&h=200&q=80',
  },
  anh: {
    id: 'anh',
    name: 'BS. Phạm Đức Anh',
    title: 'Bác sĩ CKII · Khoa Nội tiết',
    photo:
      'https://images.unsplash.com/photo-1741868159744-159b83484687?crop=faces&fit=crop&w=200&h=200&q=80',
  },
  ngoc: { id: 'ngoc', name: 'BS. Trần Bảo Ngọc', title: 'Bác sĩ CKI · Tai Mũi Họng' },
}

export type LabRow = { name: string; value: string; unit: string; range: string; flag?: 'high' | 'low' | 'abnormal' }

export type Lab = {
  id: string
  name: string
  kind: 'blood' | 'ultrasound' | 'xray' | 'ecg'
  summary: string
  normal: boolean
  rows: LabRow[]
}

export type Visit = {
  id: string
  date: string
  time: string
  /** ISO date used for filtering. */
  iso: string
  department: string
  diagnosis: string
  icd: string
  doctorId: string
  fee: number
  symptoms: string[]
  conclusion: string
  note: string
  labs: Lab[]
}

export const VISITS: Visit[] = [
  {
    id: 'v1',
    date: '12/10/2026',
    time: '08:30',
    iso: '2026-10-12',
    department: 'Khoa Nội',
    diagnosis: 'Viêm họng cấp',
    icd: 'J02.9',
    doctorId: 'ha',
    fee: 450000,
    symptoms: ['Đau rát họng 3 ngày', 'Sốt nhẹ 37,8°C về chiều', 'Ho khan, khó nuốt'],
    conclusion: 'Viêm họng cấp do virus, chưa có dấu hiệu bội nhiễm vi khuẩn.',
    note: 'Uống nhiều nước ấm, súc miệng nước muối 3 lần/ngày. Tái khám sau 5 ngày nếu còn sốt.',
    labs: [
      {
        id: 'l1',
        name: 'Tổng phân tích tế bào máu',
        kind: 'blood',
        summary: 'Các chỉ số trong giới hạn bình thường',
        normal: true,
        rows: [
          { name: 'Bạch cầu (WBC)', value: '8,2', unit: 'G/L', range: '4,0 – 10,0' },
          { name: 'Hồng cầu (RBC)', value: '4,5', unit: 'T/L', range: '3,8 – 5,2' },
          { name: 'Huyết sắc tố (HGB)', value: '132', unit: 'g/L', range: '120 – 150' },
          { name: 'Tiểu cầu (PLT)', value: '245', unit: 'G/L', range: '150 – 400' },
        ],
      },
      {
        id: 'l2',
        name: 'Xét nghiệm CRP',
        kind: 'blood',
        summary: 'CRP tăng nhẹ — phù hợp viêm cấp',
        normal: false,
        rows: [{ name: 'CRP định lượng', value: '12,4', unit: 'mg/L', range: '< 5,0', flag: 'high' }],
      },
    ],
  },
  {
    id: 'v2',
    date: '28/08/2026',
    time: '14:15',
    iso: '2026-08-28',
    department: 'Khoa Tim mạch',
    diagnosis: 'Tăng huyết áp độ 1',
    icd: 'I10',
    doctorId: 'quan',
    fee: 820000,
    symptoms: ['Đau đầu vùng chẩm buổi sáng', 'Huyết áp đo tại nhà 145/92 mmHg'],
    conclusion: 'Tăng huyết áp nguyên phát độ 1, chưa có tổn thương cơ quan đích.',
    note: 'Giảm muối, đi bộ 30 phút mỗi ngày. Đo huyết áp sáng và tối, ghi lại vào sổ theo dõi.',
    labs: [
      {
        id: 'l3',
        name: 'Điện tâm đồ (ECG)',
        kind: 'ecg',
        summary: 'Nhịp xoang đều, tần số 78 lần/phút',
        normal: true,
        rows: [
          { name: 'Nhịp tim', value: '78', unit: 'lần/phút', range: '60 – 100' },
          { name: 'Khoảng PR', value: '160', unit: 'ms', range: '120 – 200' },
          { name: 'QRS', value: '90', unit: 'ms', range: '< 120' },
        ],
      },
      {
        id: 'l4',
        name: 'Mỡ máu (Bộ lipid)',
        kind: 'blood',
        summary: 'Cholesterol LDL cao hơn mức khuyến nghị',
        normal: false,
        rows: [
          { name: 'Cholesterol toàn phần', value: '5,9', unit: 'mmol/L', range: '< 5,2', flag: 'high' },
          { name: 'LDL-C', value: '3,8', unit: 'mmol/L', range: '< 3,4', flag: 'high' },
          { name: 'HDL-C', value: '1,3', unit: 'mmol/L', range: '> 1,0' },
          { name: 'Triglycerid', value: '1,6', unit: 'mmol/L', range: '< 1,7' },
        ],
      },
    ],
  },
  {
    id: 'v3',
    date: '03/06/2026',
    time: '09:00',
    iso: '2026-06-03',
    department: 'Khoa Nội tiết',
    diagnosis: 'Kiểm tra đường huyết định kỳ',
    icd: 'Z13.1',
    doctorId: 'anh',
    fee: 1250000,
    symptoms: ['Khám sức khỏe định kỳ', 'Tiền sử gia đình có người mắc tiểu đường'],
    conclusion: 'Đường huyết và chức năng tuyến giáp bình thường.',
    note: 'Duy trì chế độ ăn hiện tại. Kiểm tra lại sau 12 tháng.',
    labs: [
      {
        id: 'l5',
        name: 'Xét nghiệm đường huyết',
        kind: 'blood',
        summary: 'Đường huyết bình thường',
        normal: true,
        rows: [
          { name: 'Glucose lúc đói', value: '5,2', unit: 'mmol/L', range: '3,9 – 6,4' },
          { name: 'HbA1c', value: '5,4', unit: '%', range: '< 5,7' },
        ],
      },
      {
        id: 'l6',
        name: 'Siêu âm tuyến giáp',
        kind: 'ultrasound',
        summary: 'Nhu mô đồng nhất, không thấy nhân',
        normal: true,
        rows: [
          { name: 'Thùy phải', value: '45 × 15', unit: 'mm', range: 'Bình thường' },
          { name: 'Thùy trái', value: '43 × 14', unit: 'mm', range: 'Bình thường' },
          { name: 'Nhân giáp', value: 'Không', unit: '', range: 'Không' },
        ],
      },
    ],
  },
  {
    id: 'v4',
    date: '15/02/2026',
    time: '10:45',
    iso: '2026-02-15',
    department: 'Khoa Nội',
    diagnosis: 'Viêm dạ dày',
    icd: 'K29.7',
    doctorId: 'ha',
    fee: 380000,
    symptoms: ['Đau thượng vị sau ăn', 'Ợ chua, đầy hơi'],
    conclusion: 'Viêm dạ dày cấp, nghi liên quan chế độ ăn.',
    note: 'Ăn đúng giờ, tránh đồ cay và cà phê. Uống thuốc trước bữa ăn 30 phút.',
    labs: [
      {
        id: 'l7',
        name: 'Siêu âm ổ bụng',
        kind: 'ultrasound',
        summary: 'Gan, mật, tụy, lách bình thường',
        normal: true,
        rows: [
          { name: 'Gan', value: 'Bình thường', unit: '', range: 'Bình thường' },
          { name: 'Túi mật', value: 'Không sỏi', unit: '', range: 'Không sỏi' },
          { name: 'Tụy, lách', value: 'Bình thường', unit: '', range: 'Bình thường' },
        ],
      },
    ],
  },
  {
    id: 'v5',
    date: '20/11/2025',
    time: '07:50',
    iso: '2025-11-20',
    department: 'Khoa Tai Mũi Họng',
    diagnosis: 'Viêm xoang mạn tính',
    icd: 'J32.9',
    doctorId: 'ngoc',
    fee: 560000,
    symptoms: ['Nghẹt mũi kéo dài 2 tháng', 'Chảy dịch mũi sau'],
    conclusion: 'Viêm xoang hàm hai bên mạn tính.',
    note: 'Rửa mũi bằng nước muối sinh lý sáng và tối. Tái khám sau 1 tháng.',
    labs: [
      {
        id: 'l8',
        name: 'X-Quang xoang (Blondeau)',
        kind: 'xray',
        summary: 'Mờ nhẹ xoang hàm hai bên',
        normal: false,
        rows: [
          { name: 'Xoang hàm phải', value: 'Mờ nhẹ', unit: '', range: 'Sáng', flag: 'abnormal' },
          { name: 'Xoang hàm trái', value: 'Mờ nhẹ', unit: '', range: 'Sáng', flag: 'abnormal' },
          { name: 'Xoang trán', value: 'Sáng', unit: '', range: 'Sáng' },
        ],
      },
    ],
  },
]

export function formatVnd(n: number) {
  return n.toLocaleString('vi-VN') + 'đ'
}

export const SLOTS = ['Thứ Tư, 22/10 · 08:00', 'Thứ Tư, 22/10 · 09:30', 'Thứ Sáu, 24/10 · 14:00', 'Thứ Hai, 27/10 · 08:30']

export type Appointment = {
  id: string
  personId: string
  doctorId: string
  department: string
  slot: string
  room: string
  status: 'upcoming' | 'cancelled'
  cancelReason?: string
}

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'ap1',
    personId: 'self',
    doctorId: 'quan',
    department: 'Khoa Tim mạch',
    slot: 'Thứ Sáu, 24/10 · 14:00',
    room: 'Phòng 305 · Tầng 3',
    status: 'upcoming',
    cancelReason: 'Hệ thống hủy do người dùng bỏ lượt',
  },
  {
    id: 'ap2',
    personId: 'dad',
    doctorId: 'ha',
    department: 'Khoa Nội',
    slot: 'Thứ Hai, 27/10 · 08:30',
    room: 'Phòng 204 · Tầng 2',
    status: 'upcoming',
  },
]
