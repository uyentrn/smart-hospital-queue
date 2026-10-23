import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Eye,
  FlaskConical,
  Plus,
  Save,
  ScanLine,
  SkipForward,
  Timer,
  Volume2,
  X,
  Zap,
} from 'lucide-react'
import { orderStatus, type MedicalRecord, type Patient, type ServiceRequest, type Vitals } from '../../data'
import { PriorityBadge } from '../ActiveStage'
import { Modal, btn } from '../ui'

export type CatalogItem = Pick<ServiceRequest, 'type' | 'name' | 'room' | 'resultSummary'>

const CATALOG: CatalogItem[] = [
  { type: 'IMAGING', name: 'Điện tâm đồ (ECG 12 chuyển đạo)', room: 'Phòng CĐHA 202', resultSummary: 'Nhịp xoang đều, không biến đổi ST-T' },
  { type: 'IMAGING', name: 'Siêu âm tim qua thành ngực', room: 'Phòng CĐHA 204', resultSummary: 'EF 62%, không rối loạn vận động vùng' },
  { type: 'IMAGING', name: 'X-quang ngực thẳng', room: 'Phòng CĐHA 201', resultSummary: 'Bóng tim không to, phổi sáng đều' },
  { type: 'IMAGING', name: 'Holter điện tim 24 giờ', room: 'Phòng CĐHA 202', resultSummary: 'Nhịp xoang, vài ngoại tâm thu nhĩ đơn độc' },
  { type: 'LAB', name: 'Định lượng Troponin T & Bộ mỡ máu', room: 'Phòng XN 105', resultSummary: 'Troponin T bình thường · LDL-C 3,2 mmol/L' },
  { type: 'LAB', name: 'Tổng phân tích tế bào máu', room: 'Phòng XN 105', resultSummary: 'Các chỉ số trong giới hạn bình thường' },
  { type: 'LAB', name: 'NT-proBNP', room: 'Phòng XN 105', resultSummary: 'NT-proBNP 85 pg/mL (bình thường)' },
  { type: 'LAB', name: 'Điện giải đồ & Creatinin', room: 'Phòng XN 105', resultSummary: 'Na 139 · K 4,1 · Creatinin 82 µmol/L' },
]

const QUICK = ['Đau tức ngực', 'Khó thở gắng sức', 'Hồi hộp đánh trống ngực', 'Chóng mặt']

const hhmm = (t: number) => {
  const d = new Date(t)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// Simple adult reference ranges, used only to flag values visually.
const abnormal: Record<keyof Vitals, (v: string) => boolean> = {
  pulse: (v) => !!v && (Number(v) > 100 || Number(v) < 60),
  bp: (v) => {
    const [s, d] = v.split('/').map(Number)
    return !!v && (s >= 140 || d >= 90 || s < 90)
  },
  temp: (v) => !!v && Number(v.replace(',', '.')) >= 37.5,
  spo2: (v) => !!v && Number(v) < 95,
}

export type ChartActions = {
  onDraft: (r: MedicalRecord) => void
  onSaveDraft: () => void
  onToLab: () => void
  onComplete: () => void
  onAddOrder: (item: CatalogItem) => void
  onCancelOrder: (id: string) => void
  onBack: () => void
  onInviteBack: () => void
}

type Props = ChartActions & {
  patient: Patient
  draft: MedicalRecord
  now: number
  readOnly: boolean
  autoSynced: boolean
  dirty: boolean
  next?: Patient
}

function Section({ n, title, field, children, aside }: { n: number; title: string; field: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[13.5px] font-bold text-ink">
          {n}. {title} <code className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-[10.5px] font-medium text-slate-500">{field}</code>
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

const area =
  'w-full resize-none rounded-lg border border-line bg-white px-3 py-2.5 text-[14px] leading-relaxed text-ink outline-none placeholder:text-slate-400 focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:bg-slate-50 disabled:text-slate-600'

function OrderBadge({ o, now }: { o: ServiceRequest; now: number }) {
  const s = orderStatus(o, now)
  if (s === 'COMPLETED')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap text-emerald-700 ring-1 ring-emerald-200 ring-inset">
        <span className="size-1.5 rounded-full bg-emerald-500" /> Đã có kết quả ({hhmm(o.readyAt)})
      </span>
    )
  if (s === 'IN_PROGRESS')
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap text-orange-700 ring-1 ring-orange-200 ring-inset">
        <span className="pulse-dot size-1.5 rounded-full bg-orange-500" /> Đang thực hiện (IN_PROGRESS)
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap text-brand ring-1 ring-brand/20 ring-inset">
      <span className="size-1.5 rounded-full bg-brand" /> Đã chỉ định (ORDERED)
    </span>
  )
}

function AddOrder({ existing, onAdd, disabled }: { existing: string[]; onAdd: (i: CatalogItem) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', k)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-brand/30 bg-white px-2.5 text-[12.5px] font-semibold whitespace-nowrap text-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:border-line disabled:text-slate-400 disabled:hover:bg-white"
      >
        <Plus size={15} /> Thêm chỉ định Xét nghiệm / CĐHA
      </button>
      {open && (
        <div role="menu" className="animate-fade-in absolute right-0 z-30 mt-1.5 w-[340px] rounded-xl border border-line bg-white p-1.5 shadow-xl">
          {(['IMAGING', 'LAB'] as const).map((t) => (
            <div key={t}>
              <div className="px-2.5 pt-2 pb-1 text-[10.5px] font-bold tracking-wider text-muted uppercase">
                {t === 'IMAGING' ? 'Chẩn đoán hình ảnh · IMAGING' : 'Xét nghiệm · LAB'}
              </div>
              {CATALOG.filter((c) => c.type === t).map((c) => {
                const has = existing.includes(c.name)
                return (
                  <button
                    key={c.name}
                    role="menuitem"
                    disabled={has}
                    onClick={() => {
                      onAdd(c)
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent"
                  >
                    {t === 'IMAGING' ? <ScanLine size={15} className="shrink-0 text-sky-600" /> : <FlaskConical size={15} className="shrink-0 text-violet-600" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{c.name}</span>
                      <span className="block text-[11.5px] text-muted">{c.room}</span>
                    </span>
                    {has && <Check size={14} className="text-emerald-600" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PatientChart(props: Props) {
  const { patient: p, draft, now, readOnly, next } = props
  const [detail, setDetail] = useState<ServiceRequest | null>(null)
  const age = new Date().getFullYear() - p.birthYear
  const orders = p.orders ?? []
  const pendingOrders = orders.filter((o) => orderStatus(o, now) !== 'COMPLETED').length
  const canDiagnose = draft.diagnosisText.trim().length > 0
  const isLabReady = p.status === 'lab' && orders.length > 0 && pendingOrders === 0

  const set = (patch: Partial<MedicalRecord>) => props.onDraft({ ...draft, ...patch })
  const setVital = (k: keyof Vitals, v: string) => set({ vitals: { ...draft.vitals, [k]: v } })
  const insert = (chip: string) => {
    const t = draft.chiefComplaint.trim()
    set({ chiefComplaint: t ? `${t.replace(/[.\s]+$/, '')}, ${chip.toLowerCase()}.` : `${chip}.` })
  }

  const vitals: { k: keyof Vitals; label: string; unit: string; w: string }[] = [
    { k: 'pulse', label: 'Mạch', unit: 'l/p', w: 'w-12' },
    { k: 'bp', label: 'HA', unit: 'mmHg', w: 'w-[72px]' },
    { k: 'temp', label: 'Nhiệt độ', unit: '°C', w: 'w-12' },
    { k: 'spo2', label: 'SpO2', unit: '%', w: 'w-10' },
  ]

  const nextLabel = next ? `${next.order} - ${next.name}` : null

  return (
    <div className="flex min-h-0 flex-col bg-canvas">
      {/* Sticky patient banner */}
      <div className={`shrink-0 border-b px-6 py-3.5 ${readOnly ? 'border-slate-300 bg-slate-50' : 'border-line bg-white'}`}>
        {readOnly && (
          <div className="mb-2.5 flex items-center justify-between rounded-lg bg-slate-200/70 px-3 py-1.5 text-[12.5px] text-slate-700">
            <span className="flex items-center gap-1.5 font-semibold">
              <Eye size={14} /> Chế độ xem – chỉ đọc · Bệnh nhân không ở trong phòng khám
            </span>
            <button onClick={props.onBack} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
              <ArrowLeft size={14} /> Quay lại BN đang khám
            </button>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div
            className={`grid h-[60px] min-w-[84px] place-items-center rounded-xl px-2 text-white ${
              p.status === 'inroom' ? 'bg-emerald-600' : p.status === 'called' ? 'bg-orange-500' : 'bg-slate-500'
            }`}
          >
            <div className="text-center leading-none">
              <div className="text-[10px] font-semibold tracking-wider uppercase opacity-80">STT</div>
              <div className="tabular mt-1 text-[27px] font-bold">{p.order}</div>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[21px] leading-tight font-bold tracking-tight text-ink uppercase">{p.name}</h2>
              <span className="tabular text-[14px] font-medium text-muted">
                ({p.gender ?? 'Nam'}, {p.birthYear} - {age} tuổi)
              </span>
              <PriorityBadge p={p} />
            </div>
            <dl className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
              {[
                ['Mã BN', p.id],
                ['Mã BHYT', p.insuranceCode ?? '—'],
                ['Người giám hộ', p.guardian ?? '—'],
                ['Ghi chú tiếp nhận', p.intakeNote ?? '—'],
              ].map(([k, v], i) => (
                <div key={k} className="flex items-center gap-3">
                  {i > 0 && <span className="h-3.5 w-px bg-slate-300" />}
                  <dt className="text-muted">{k}:</dt>
                  <dd className={`-ml-2 font-semibold ${k === 'Ghi chú tiếp nhận' ? 'text-red-700' : 'tabular text-ink'}`}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          {p.status === 'inroom' && p.startedAt && (
            <span className="tabular inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[15px] font-bold text-emerald-700 ring-1 ring-emerald-200">
              <Timer size={16} /> {mmss(now - p.startedAt)}
            </span>
          )}
        </div>
        {!readOnly && (
          <div
            className={`mt-2.5 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium ${
              p.status === 'inroom' ? 'bg-emerald-50 text-emerald-800' : 'bg-orange-50 text-orange-800'
            }`}
          >
            <Zap size={13} className={props.autoSynced ? 'text-emerald-600' : ''} />
            {p.status === 'inroom'
              ? 'Đã tự động chuyển sang ĐANG KHÁM (IN_SERVICE) khi Bác sĩ bắt đầu nhập bệnh án'
              : 'Bệnh nhân đã được gọi · Sẽ tự động chuyển sang ĐANG KHÁM (IN_SERVICE) khi Bác sĩ bắt đầu nhập bệnh án'}
          </div>
        )}
      </div>

      {/* Clinical form body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-5 p-5">
          <div className="space-y-5 rounded-2xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold tracking-wider text-muted uppercase">Khám lâm sàng &amp; Chẩn đoán · MEDICAL_RECORDS</div>
              {!readOnly && (
                <span className="text-[11.5px] text-muted">{props.dirty ? 'Có thay đổi chưa lưu' : draft.savedAt ? `Đã lưu nháp ${draft.savedAt}` : ''}</span>
              )}
            </div>

            <Section n={1} title="Lý do khám & Triệu chứng" field="chief_complaint">
              <textarea rows={3} disabled={readOnly} value={draft.chiefComplaint} onChange={(e) => set({ chiefComplaint: e.target.value })} className={area} placeholder="Nhập lý do khám…" />
              {!readOnly && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK.map((c) => {
                    const has = draft.chiefComplaint.toLowerCase().includes(c.toLowerCase())
                    return (
                      <button
                        key={c}
                        disabled={has}
                        onClick={() => insert(c)}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-line bg-white px-2.5 text-[12px] font-medium text-slate-700 hover:border-brand/40 hover:bg-brand-soft hover:text-brand disabled:cursor-default disabled:border-emerald-200 disabled:bg-emerald-50 disabled:text-emerald-700"
                      >
                        {has ? <Check size={12} /> : <Plus size={12} />} {c}
                      </button>
                    )
                  })}
                </div>
              )}
            </Section>

            <Section n={2} title="Khám lâm sàng & Sinh hiệu" field="examination_note">
              <div className="mb-2 flex flex-wrap items-center gap-x-1 gap-y-2 rounded-lg bg-slate-50 px-2 py-1.5 ring-1 ring-line ring-inset">
                {vitals.map((v, i) => {
                  const bad = abnormal[v.k](draft.vitals[v.k])
                  return (
                    <label key={v.k} className="flex items-center gap-1.5 text-[12.5px]">
                      {i > 0 && <span className="mr-1 h-4 w-px bg-slate-300" />}
                      <span className="font-medium text-muted">{v.label}:</span>
                      <input
                        disabled={readOnly}
                        value={draft.vitals[v.k]}
                        onChange={(e) => setVital(v.k, e.target.value)}
                        inputMode="decimal"
                        className={`tabular h-7 ${v.w} rounded-md border bg-white px-1.5 text-center text-[13px] font-bold outline-none focus:border-brand disabled:bg-transparent ${
                          bad ? 'border-red-300 text-red-700' : 'border-line text-ink'
                        }`}
                      />
                      <span className={`text-[11.5px] ${bad ? 'font-semibold text-red-600' : 'text-muted'}`}>{v.unit}</span>
                    </label>
                  )
                })}
              </div>
              <textarea rows={3} disabled={readOnly} value={draft.examinationNote} onChange={(e) => set({ examinationNote: e.target.value })} className={area} placeholder="Ghi nhận khám lâm sàng…" />
            </Section>

            <Section n={3} title="Chẩn đoán kết luận" field="diagnosis_text">
              <input
                disabled={readOnly}
                value={draft.diagnosisText}
                onChange={(e) => set({ diagnosisText: e.target.value })}
                placeholder="Nhập chẩn đoán kết luận…"
                className={`h-11 w-full rounded-lg border bg-white px-3 text-[14.5px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-slate-400 focus:ring-3 disabled:bg-slate-50 ${
                  canDiagnose || readOnly ? 'border-line focus:border-brand focus:ring-brand/15' : 'border-amber-300 focus:border-amber-500 focus:ring-amber-200'
                }`}
              />
              {!canDiagnose && !readOnly && <p className="mt-1 text-[12px] font-medium text-amber-700">Cần nhập chẩn đoán trước khi hoàn tất khám</p>}
            </Section>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5">
            <div className="mb-1 text-[11px] font-bold tracking-wider text-muted uppercase">SERVICE_REQUESTS · LAB_RESULTS</div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[13.5px] font-bold text-ink">4. Chỉ định Cận lâm sàng &amp; Kết quả</h3>
              <AddOrder existing={orders.map((o) => o.name)} onAdd={props.onAddOrder} disabled={readOnly} />
            </div>
            <div className="space-y-2.5">
              {orders.map((o) => {
                const s = orderStatus(o, now)
                const Icon = o.type === 'IMAGING' ? Zap : FlaskConical
                return (
                  <article
                    key={o.id}
                    className={`rounded-xl border p-3.5 ${
                      s === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50/40' : s === 'IN_PROGRESS' ? 'border-orange-200 bg-orange-50/40' : 'border-line'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg ${o.type === 'IMAGING' ? 'bg-sky-50 text-sky-700' : 'bg-violet-50 text-violet-700'}`}
                      >
                        <Icon size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] leading-snug font-semibold text-ink">
                          {o.name} <span className="font-normal text-muted">· {o.room}</span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">{o.type}</span>
                          <OrderBadge o={o} now={now} />
                        </div>
                      </div>
                      {s === 'ORDERED' && !readOnly && (
                        <button
                          onClick={() => props.onCancelOrder(o.id)}
                          aria-label={`Hủy chỉ định ${o.name}`}
                          title="Hủy chỉ định"
                          className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    {s === 'COMPLETED' && (
                      <div className="mt-2.5 flex items-start justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-emerald-100">
                        <p className="text-[12.5px] leading-relaxed text-slate-700">
                          <span className="font-mono text-[10.5px] text-muted">result_summary:</span> <b className="font-semibold text-ink">{o.resultSummary}</b>
                        </p>
                        <button onClick={() => setDetail(o)} className="shrink-0 text-[12.5px] font-semibold whitespace-nowrap text-brand hover:underline">
                          Xem chi tiết
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
              {!orders.length && (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-[13px] text-muted">Chưa có chỉ định cận lâm sàng</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky unified action footer */}
      <div className="shrink-0 border-t border-line bg-white px-5 py-3 shadow-[0_-6px_16px_-12px_rgba(15,29,43,0.25)]">
        {readOnly ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] text-muted">
              {p.status === 'lab'
                ? isLabReady
                  ? 'Đã có đủ kết quả cận lâm sàng – có thể mời bệnh nhân vào đọc kết quả.'
                  : `Còn ${pendingOrders} chỉ định đang chờ kết quả.`
                : 'Bệnh nhân không ở trong phòng – các thao tác điều phối bị khóa.'}
            </span>
            <div className="flex gap-2">
              <button onClick={props.onBack} className={`${btn.base} ${btn.secondary}`}>
                <ArrowLeft size={16} /> Quay lại BN đang khám
              </button>
              {p.status === 'lab' && (
                <button disabled={!isLabReady} onClick={props.onInviteBack} className={`${btn.base} ${btn.primary}`}>
                  <Volume2 size={16} /> Mời vào phòng đọc kết quả
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="ml-auto flex items-center gap-2">
              <button onClick={props.onSaveDraft} className={`${btn.base} ${btn.ghost} h-12 px-3.5`}>
                <Save size={16} /> Lưu nháp
              </button>
              <button
                disabled={pendingOrders === 0}
                title={pendingOrders === 0 ? 'Không có chỉ định đang chờ kết quả' : undefined}
                onClick={props.onToLab}
                className="inline-flex h-12 items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-3.5 text-left text-violet-800 transition-all hover:bg-violet-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:border-line disabled:bg-white disabled:text-slate-400"
              >
                <FlaskConical size={17} className="shrink-0" />
                <span className="leading-tight">
                  <span className="block text-[13.5px] font-semibold">Lưu tạm &amp; Chờ KQ Cận lâm sàng</span>
                </span>
              </button>
              <button
                disabled={!canDiagnose}
                title={!canDiagnose ? 'Cần nhập chẩn đoán kết luận' : undefined}
                onClick={props.onComplete}
                className="inline-flex h-12 items-center gap-2.5 rounded-lg bg-emerald-600 px-4 text-left text-white shadow-md shadow-emerald-700/25 transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                <CheckCheck size={20} className="shrink-0" />
                <span className="leading-tight">
                  <span className="block text-[14.5px] font-bold">Lưu bệnh án &amp; Hoàn tất khám</span>
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <Modal
          title={detail.name}
          subtitle={`${detail.room} · Kết quả lúc ${hhmm(detail.readyAt)}`}
          icon={detail.type === 'IMAGING' ? <Zap size={19} /> : <FlaskConical size={19} />}
          width={540}
          onClose={() => setDetail(null)}
          footer={
            <button className={`${btn.base} ${btn.primary}`} onClick={() => setDetail(null)}>
              Đóng
            </button>
          }
        >
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-[13.5px] font-semibold text-emerald-900">{detail.resultSummary}</div>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-700">{detail.resultDetail ?? 'Không có mô tả chi tiết. Xem phim/kết quả gốc tại hệ thống PACS/LIS.'}</p>
        </Modal>
      )}
    </div>
  )
}
