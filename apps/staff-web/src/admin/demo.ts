// ILLUSTRATIVE DEMO DATA for the Admin prototype. Not connected to any hospital database.
// "Hôm nay" is a fixed snapshot taken at DEMO_SNAPSHOT; history is generated deterministically.

export const DEMO_SNAPSHOT = '09:42'
const SNAP_FRACTION_OF_LAST_BIN = 42 / 60

export type DeptId = 'noi' | 'ngoai' | 'nhi'
export type RangeId = 'today' | 'yesterday' | '7d' | '30d'
export type ServiceId = 'bhyt' | 'dv' | 'tk'
export type ClinicState = 'ok' | 'watch' | 'over' | 'paused'

export const RANGES: { id: RangeId; label: string; days: number }[] = [
  { id: 'today', label: 'Hôm nay', days: 1 },
  { id: 'yesterday', label: 'Hôm qua', days: 1 },
  { id: '7d', label: '7 ngày qua', days: 7 },
  { id: '30d', label: '30 ngày qua', days: 30 },
]

export const DEPARTMENTS: { id: DeptId; code: string; name: string; head: string; location: string }[] = [
  { id: 'noi', code: 'K-NOI', name: 'Khoa Nội', head: 'TS.BS. Trần Văn Hải', location: 'Tòa A · Tầng 1' },
  { id: 'ngoai', code: 'K-NGOAI', name: 'Khoa Ngoại', head: 'BS.CKII Lê Quốc Dũng', location: 'Tòa B · Tầng 2' },
  { id: 'nhi', code: 'K-NHI', name: 'Khoa Nhi', head: 'BS.CKI Phạm Thu Hằng', location: 'Tòa C · Tầng 3' },
]

export const SERVICES: { id: ServiceId; code: string; name: string; normMin: number; insured: boolean; share: number }[] = [
  { id: 'bhyt', code: 'DV-01', name: 'Khám bệnh BHYT', normMin: 10, insured: true, share: 0.55 },
  { id: 'dv', code: 'DV-02', name: 'Khám dịch vụ', normMin: 15, insured: false, share: 0.2 },
  { id: 'tk', code: 'DV-03', name: 'Tái khám', normMin: 8, insured: true, share: 0.25 },
]

export type ClinicCfg = {
  id: string
  name: string
  dept: DeptId
  doctor: string
  hours: string
  services: ServiceId[]
  maxQueue: number
  maxWaitMin: number
  status: 'active' | 'paused'
}

const ALL: ServiceId[] = ['bhyt', 'dv', 'tk']

export const INITIAL_CLINICS: ClinicCfg[] = [
  { id: '101', name: 'Phòng Nội Tim mạch 101', dept: 'noi', doctor: 'BS. Lê Minh Tuấn', hours: '07:00–16:30', services: ALL, maxQueue: 15, maxWaitMin: 30, status: 'active' },
  { id: '102', name: 'Phòng Nội Tim mạch 102', dept: 'noi', doctor: 'BS. Nguyễn Thị Hạnh', hours: '07:00–16:30', services: ALL, maxQueue: 15, maxWaitMin: 30, status: 'active' },
  { id: '103', name: 'Phòng Nội Tim mạch 103', dept: 'noi', doctor: 'BS. Phan Quang Vinh', hours: '07:00–11:30', services: ['bhyt', 'tk'], maxQueue: 15, maxWaitMin: 30, status: 'active' },
  { id: '104', name: 'Phòng Nội Tổng quát 104', dept: 'noi', doctor: 'BS. Đỗ Thanh Bình', hours: '07:00–16:30', services: ALL, maxQueue: 12, maxWaitMin: 35, status: 'active' },
  { id: '105', name: 'Phòng Nội Tổng quát 105', dept: 'noi', doctor: 'BS. Trịnh Văn Long', hours: '07:00–16:30', services: ['bhyt', 'dv'], maxQueue: 15, maxWaitMin: 30, status: 'active' },
  { id: '106', name: 'Phòng Nội Tổng quát 106', dept: 'noi', doctor: 'BS. Hoàng Thu Hà', hours: '07:00–11:30', services: ['bhyt', 'tk'], maxQueue: 15, maxWaitMin: 30, status: 'paused' },
  { id: '107', name: 'Phòng Nội Tim mạch 107', dept: 'noi', doctor: 'BS. Nguyễn Quốc Đạt', hours: '13:00–16:30', services: ALL, maxQueue: 15, maxWaitMin: 30, status: 'active' },
  { id: '108', name: 'Phòng Nội Tổng quát 108', dept: 'noi', doctor: 'BS. Vương Ngọc Diệp', hours: '07:00–16:30', services: ['bhyt', 'tk'], maxQueue: 15, maxWaitMin: 30, status: 'active' },
  { id: '201', name: 'Phòng Khám Ngoại tổng quát 201', dept: 'ngoai', doctor: 'BS. Lương Hữu Nghĩa', hours: '07:00–16:30', services: ALL, maxQueue: 15, maxWaitMin: 30, status: 'active' },
  { id: '202', name: 'Phòng Khám Ngoại chấn thương 202', dept: 'ngoai', doctor: 'BS. Đinh Công Trứ', hours: '07:00–16:30', services: ['bhyt', 'dv'], maxQueue: 18, maxWaitMin: 25, status: 'active' },
  { id: '203', name: 'Phòng Khám Ngoại tiết niệu 203', dept: 'ngoai', doctor: 'BS. Mạc Thị Loan', hours: '07:00–11:30', services: ['bhyt', 'dv'], maxQueue: 12, maxWaitMin: 30, status: 'paused' },
  { id: '301', name: 'Phòng Khám Nhi tổng quát 301', dept: 'nhi', doctor: 'BS. Kha Minh Thư', hours: '07:00–16:30', services: ALL, maxQueue: 20, maxWaitMin: 25, status: 'active' },
]

export const WATCH_RATIO = 0.8

export const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']
const FULL_WEIGHTS = [0.12, 0.17, 0.18, 0.15, 0.11, 0.04, 0.09, 0.08, 0.06]
// Share of a full day's arrivals that has happened by the 09:42 snapshot.
const SNAP_SHARE = FULL_WEIGHTS[0] + FULL_WEIGHTS[1] + FULL_WEIGHTS[2] * SNAP_FRACTION_OF_LAST_BIN
const TODAY_BINS = 3 // 07, 08, 09 (partial)

type Snapshot = {
  arrivals: number
  waiting: number
  serving: number
  completed: number
  skipped: number
  cancelled: number
  avgWait: number | null
  medianWait: number | null
  maxWait: number | null
  alertAt?: string
}

// Snapshot "Hôm nay" (tính đến 09:42). Totals: 248 tiếp nhận · 36 chờ · 12 phục vụ · 187 hoàn thành.
const TODAY: Record<string, Snapshot> = {
  '101': { arrivals: 34, waiting: 9, serving: 1, completed: 22, skipped: 1, cancelled: 1, avgWait: 38, medianWait: 34, maxWait: 61, alertAt: '09:35' },
  '102': { arrivals: 30, waiting: 6, serving: 1, completed: 21, skipped: 1, cancelled: 1, avgWait: 25, medianWait: 22, maxWait: 44 },
  '103': { arrivals: 20, waiting: 2, serving: 1, completed: 17, skipped: 0, cancelled: 0, avgWait: 14, medianWait: 12, maxWait: 26 },
  '104': { arrivals: 28, waiting: 13, serving: 1, completed: 13, skipped: 1, cancelled: 0, avgWait: 27, medianWait: 24, maxWait: 49, alertAt: '09:28' },
  '105': { arrivals: 16, waiting: 1, serving: 1, completed: 13, skipped: 1, cancelled: 0, avgWait: 12, medianWait: 10, maxWait: 21 },
  '106': { arrivals: 9, waiting: 0, serving: 1, completed: 8, skipped: 0, cancelled: 0, avgWait: 9, medianWait: 8, maxWait: 15 },
  '107': { arrivals: 12, waiting: 1, serving: 1, completed: 10, skipped: 0, cancelled: 0, avgWait: 11, medianWait: 9, maxWait: 19 },
  '108': { arrivals: 10, waiting: 0, serving: 1, completed: 9, skipped: 0, cancelled: 0, avgWait: 8, medianWait: 7, maxWait: 14 },
  '201': { arrivals: 22, waiting: 2, serving: 1, completed: 18, skipped: 1, cancelled: 0, avgWait: 13, medianWait: 11, maxWait: 24 },
  '202': { arrivals: 34, waiting: 1, serving: 2, completed: 28, skipped: 2, cancelled: 1, avgWait: 16, medianWait: 14, maxWait: 29 },
  '203': { arrivals: 0, waiting: 0, serving: 0, completed: 0, skipped: 0, cancelled: 0, avgWait: null, medianWait: null, maxWait: null },
  '301': { arrivals: 33, waiting: 1, serving: 1, completed: 28, skipped: 2, cancelled: 1, avgWait: 10, medianWait: 9, maxWait: 18 },
}

// Non-threshold operational events shown as informational alerts.
export const EVENTS: { clinic: string; at: string; text: string; kind: 'info' | 'muted' }[] = [
  { clinic: '201', at: '09:20', text: 'Hàng đợi vừa được mở tiếp nhận', kind: 'info' },
  { clinic: '106', at: '08:55', text: 'Phòng tạm dừng tiếp nhận theo yêu cầu bác sĩ', kind: 'muted' },
]

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Largest-remainder split so parts always sum to the total.
export function distribute(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0) || 1
  const raw = weights.map((w) => (total * w) / sum)
  const out = raw.map(Math.floor)
  let left = total - out.reduce((a, b) => a + b, 0)
  raw
    .map((v, i) => [v - Math.floor(v), i] as const)
    .sort((a, b) => b[0] - a[0])
    .forEach(([, i]) => {
      if (left > 0) {
        out[i]++
        left--
      }
    })
  return out
}

export type DayMetrics = {
  date: Date
  arrivals: number
  completed: number
  skipped: number
  cancelled: number
  avgWait: number | null
  medianWait: number | null
  hourly: (number | null)[]
}

const HISTORY_DAYS = 60

function buildHistory(id: string): DayMetrics[] {
  const t = TODAY[id]
  const r = rng(Number(id) * 7919)
  const base = id === '203' ? 22 : t.arrivals / SNAP_SHARE
  const waitBase = t.avgWait ?? 15
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: HISTORY_DAYS }, (_, k) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (k + 1))
    // No calendar weekday effect: the fixed "today" snapshot is not tied to a real weekday.
    const weekday = 1
    const paused = id === '203' && k < 2
    const arrivals = paused ? 0 : Math.round(base * weekday * (0.85 + r() * 0.3))
    const skipped = Math.round(arrivals * (0.025 + r() * 0.03))
    const cancelled = Math.round(arrivals * (0.008 + r() * 0.015))
    const avg = arrivals ? Math.round(waitBase * (0.75 + r() * 0.45) * weekday) : null
    return {
      date: d,
      arrivals,
      completed: arrivals - skipped - cancelled,
      skipped,
      cancelled,
      avgWait: avg,
      medianWait: avg === null ? null : Math.round(avg * (0.84 + r() * 0.08)),
      hourly: distribute(arrivals, FULL_WEIGHTS),
    }
  })
}

const HISTORY: Record<string, DayMetrics[]> = Object.fromEntries(Object.keys(TODAY).map((id) => [id, buildHistory(id)]))

function todayMetrics(id: string): DayMetrics {
  const t = TODAY[id]
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const bins = distribute(t.arrivals, [FULL_WEIGHTS[0], FULL_WEIGHTS[1], FULL_WEIGHTS[2] * SNAP_FRACTION_OF_LAST_BIN])
  return {
    date: d,
    arrivals: t.arrivals,
    completed: t.completed,
    skipped: t.skipped,
    cancelled: t.cancelled,
    avgWait: t.avgWait,
    medianWait: t.medianWait,
    hourly: HOURS.map((_, i) => (i < TODAY_BINS ? bins[i] : null)),
  }
}

export function clinicState(c: ClinicCfg, waiting: number, avgWait: number | null): ClinicState {
  if (waiting > c.maxQueue || (avgWait ?? 0) > c.maxWaitMin) return 'over'
  if (c.status === 'paused') return 'paused'
  if (waiting >= c.maxQueue * WATCH_RATIO || (avgWait ?? 0) >= c.maxWaitMin * WATCH_RATIO) return 'watch'
  return 'ok'
}

export type Filters = { range: RangeId; dept: DeptId | 'all'; clinic: string | 'all'; service?: ServiceId | 'all' }

export function scopeClinics(cfgs: ClinicCfg[], f: Filters) {
  return cfgs.filter((c) => (f.dept === 'all' || c.dept === f.dept) && (f.clinic === 'all' || c.id === f.clinic))
}

function serviceShare(c: ClinicCfg, s?: ServiceId | 'all') {
  if (!s || s === 'all') return 1
  if (!c.services.includes(s)) return 0
  const total = SERVICES.filter((x) => c.services.includes(x.id)).reduce((a, x) => a + x.share, 0)
  return SERVICES.find((x) => x.id === s)!.share / total
}

function days(id: string, range: RangeId, offset = 0): DayMetrics[] {
  if (range === 'today') return offset ? [HISTORY[id][0]] : [todayMetrics(id)]
  const n = RANGES.find((r) => r.id === range)!.days
  const start = offset * n
  return HISTORY[id].slice(start, start + n)
}

const wavg = (pairs: [number | null, number][]) => {
  const valid = pairs.filter(([v, w]) => v !== null && w > 0) as [number, number][]
  const w = valid.reduce((a, [, x]) => a + x, 0)
  return w ? Math.round(valid.reduce((a, [v, x]) => a + v * x, 0) / w) : null
}

export type ClinicRow = {
  cfg: ClinicCfg
  arrivals: number
  completed: number
  skipped: number
  cancelled: number
  avgWait: number | null
  medianWait: number | null
  waiting: number
  serving: number
  maxWait: number | null
  state: ClinicState
  alertAt?: string
}

export function aggregate(cfgs: ClinicCfg[], f: Filters) {
  const scoped = scopeClinics(cfgs, f)
  const rows: ClinicRow[] = scoped.map((c) => {
    const k = serviceShare(c, f.service)
    const ds = days(c.id, f.range)
    const t = TODAY[c.id]
    const sum = (key: 'arrivals' | 'completed' | 'skipped' | 'cancelled') => Math.round(ds.reduce((a, d) => a + d[key], 0) * k)
    const waiting = Math.round(t.waiting * k)
    return {
      cfg: c,
      arrivals: sum('arrivals'),
      completed: sum('completed'),
      skipped: sum('skipped'),
      cancelled: sum('cancelled'),
      avgWait: k ? wavg(ds.map((d) => [d.avgWait, d.completed])) : null,
      medianWait: k ? wavg(ds.map((d) => [d.medianWait, d.completed])) : null,
      waiting,
      serving: Math.round(t.serving * k),
      maxWait: t.maxWait,
      // Status is always the live (snapshot) state, not the historical range.
      state: clinicState(c, t.waiting, t.avgWait),
      alertAt: t.alertAt,
    }
  })

  const total = (key: keyof Pick<ClinicRow, 'arrivals' | 'completed' | 'skipped' | 'cancelled' | 'waiting' | 'serving'>) =>
    rows.reduce((a, r) => a + r[key], 0)

  const n = RANGES.find((r) => r.id === f.range)!.days
  const hourly = HOURS.map((_, i) => {
    let any = false
    let s = 0
    scoped.forEach((c) => {
      const k = serviceShare(c, f.service)
      days(c.id, f.range).forEach((d) => {
        const v = d.hourly[i]
        if (v !== null) {
          any = true
          s += v * k
        }
      })
    })
    return any ? Math.round(s / n) : null
  })

  const daily =
    f.range === 'today' || f.range === 'yesterday'
      ? []
      : Array.from({ length: n }, (_, j) => {
          const idx = n - 1 - j
          let arrivals = 0
          let completed = 0
          let date = new Date()
          scoped.forEach((c) => {
            const k = serviceShare(c, f.service)
            const d = HISTORY[c.id][idx]
            date = d.date
            arrivals += d.arrivals * k
            completed += d.completed * k
          })
          return { date, arrivals: Math.round(arrivals), completed: Math.round(completed) }
        })

  // Previous comparable period. For "today" compare with yesterday up to the same time.
  const prev = (key: 'arrivals' | 'completed') => {
    if (f.range === 'today') {
      if (key !== 'arrivals') return null
      return Math.round(
        scoped.reduce((a, c) => {
          const y = HISTORY[c.id][0].hourly as number[]
          return a + (y[0] + y[1] + y[2] * SNAP_FRACTION_OF_LAST_BIN) * serviceShare(c, f.service)
        }, 0),
      )
    }
    return Math.round(scoped.reduce((a, c) => a + days(c.id, f.range, 1).reduce((s, d) => s + d[key], 0) * serviceShare(c, f.service), 0))
  }

  return {
    rows,
    arrivals: total('arrivals'),
    completed: total('completed'),
    skipped: total('skipped'),
    cancelled: total('cancelled'),
    waiting: total('waiting'),
    serving: total('serving'),
    avgWait: wavg(rows.map((r) => [r.avgWait, r.completed])),
    medianWait: wavg(rows.map((r) => [r.medianWait, r.completed])),
    hourly,
    daily,
    prevArrivals: prev('arrivals'),
    prevCompleted: prev('completed'),
    days: n,
  }
}

export type Alert = { id: string; clinic: ClinicCfg; severity: 'critical' | 'warning' | 'info' | 'muted'; title: string; text: string; at: string }

const SEV = { critical: 0, warning: 1, info: 2, muted: 3 }

// Alerts derive from the live snapshot and configured thresholds only.
export function buildAlerts(cfgs: ClinicCfg[], f: Pick<Filters, 'dept' | 'clinic'>): Alert[] {
  const scoped = scopeClinics(cfgs, { ...f, range: 'today' })
  const out: Alert[] = []
  scoped.forEach((c) => {
    const t = TODAY[c.id]
    if (t.waiting > c.maxQueue)
      out.push({ id: `${c.id}-q`, clinic: c, severity: 'critical', title: c.name, text: `Hàng đợi vượt ngưỡng cho phép (${t.waiting} / ${c.maxQueue} lượt)`, at: t.alertAt ?? DEMO_SNAPSHOT })
    if ((t.avgWait ?? 0) > c.maxWaitMin)
      out.push({ id: `${c.id}-w`, clinic: c, severity: 'warning', title: c.name, text: `Thời gian chờ vượt ngưỡng cấu hình (TB ${t.avgWait} / ${c.maxWaitMin} phút)`, at: t.alertAt ?? DEMO_SNAPSHOT })
  })
  EVENTS.forEach((e) => {
    const c = scoped.find((x) => x.id === e.clinic)
    if (c) out.push({ id: `${c.id}-e`, clinic: c, severity: e.kind, title: c.name, text: e.text, at: e.at })
  })
  return out.sort((a, b) => SEV[a.severity] - SEV[b.severity] || b.at.localeCompare(a.at))
}

export function snapshotOf(id: string) {
  return TODAY[id]
}

export const deptName = (id: DeptId) => DEPARTMENTS.find((d) => d.id === id)!.name

// Waiting entries for the clinic drawer — elapsed time is measured from check-in to the snapshot, not an estimate.
export function waitingEntries(c: ClinicCfg) {
  const t = TODAY[c.id]
  const r = rng(Number(c.id) * 31)
  const base = Number(c.id) * 10 + t.arrivals - t.waiting
  let elapsed = 2 + Math.round(r() * 4)
  return Array.from({ length: t.waiting }, (_, i) => {
    const e = { stt: base + t.waiting - i, waitedMin: elapsed, priority: r() < 0.18 }
    elapsed += 3 + Math.round(r() * 6)
    return e
  })
    .reverse()
    .map((e) => {
      const [h, m] = DEMO_SNAPSHOT.split(':').map(Number)
      const at = h * 60 + m - e.waitedMin
      return { ...e, checkIn: `${String(Math.floor(at / 60)).padStart(2, '0')}:${String(at % 60).padStart(2, '0')}` }
    })
}

export function recentActivity(c: ClinicCfg) {
  const t = TODAY[c.id]
  if (!t.arrivals) return [{ at: '07:00', text: 'Phòng chưa tiếp nhận lượt nào trong ngày' }]
  const last = Number(c.id) * 10 + t.arrivals
  const list = [
    { at: '09:41', text: `Gọi STT ${last - t.waiting - t.serving + 1} vào phòng khám` },
    { at: '09:38', text: `Hoàn tất khám STT ${last - t.waiting - t.serving}` },
    { at: '09:30', text: `Tiếp nhận STT ${last}` },
  ]
  if (t.alertAt) list.splice(1, 0, { at: t.alertAt, text: 'Hệ thống ghi nhận vượt ngưỡng cấu hình' })
  if (t.skipped) list.push({ at: '09:12', text: `STT ${last - t.waiting - t.serving - 3} chuyển sang Qua lượt (vắng mặt)` })
  return list
}
