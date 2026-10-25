import { useState, type ReactNode } from 'react'
import {
  Activity,
  ArrowLeft,
  CalendarCheck,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  Droplet,
  FileText,
  MessageSquareQuote,
  ScanLine,
  TriangleAlert,
  Waves,
} from 'lucide-react'
import { DOCTORS, VISITS, formatVnd, type Lab } from '../data'
import { Avatar, BottomSheet, cx } from '../ui'

const LAB_ICON = { blood: Droplet, ultrasound: Waves, xray: ScanLine, ecg: Activity }

function Section({ icon: Icon, title, children }: { icon: typeof FileText; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line/80 bg-white p-5">
      <h3 className="flex items-center gap-2.5 text-lg font-bold text-ink">
        <span className="flex size-10 items-center justify-center rounded-full bg-brand-50 text-brand-800">
          <Icon size={22} aria-hidden="true" />
        </span>
        {title}
      </h3>
      <div className="mt-3 text-lg leading-relaxed text-ink">{children}</div>
    </section>
  )
}

export default function HistoryDetail({ visitId, onBack }: { visitId: string; onBack: () => void }) {
  const v = VISITS.find((x) => x.id === visitId)!
  const doc = DOCTORS[v.doctorId]
  const [tab, setTab] = useState<'clinical' | 'para'>('clinical')
  const [lab, setLab] = useState<Lab | null>(null)

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-line/60 bg-white/95 px-2 py-2 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-12 items-center gap-1.5 rounded-xl px-3 text-lg font-semibold text-brand-800 hover:bg-brand-50"
        >
          <ArrowLeft size={24} aria-hidden="true" /> Quay lại
        </button>
        <h1 className="sr-only">Chi tiết lần khám {v.diagnosis}</h1>
      </div>

      <header className="px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="tabular inline-flex items-center gap-1.5 text-base font-semibold text-ink-2">
            <CalendarCheck size={20} aria-hidden="true" /> {v.date} - {v.time}
          </span>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-base font-semibold text-brand-800">{v.department}</span>
        </div>
        <p className="mt-3 text-[28px] leading-tight font-bold text-ink">{v.diagnosis}</p>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface p-3">
          <Avatar name={doc.name} photo={doc.photo} size={52} />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">{doc.name}</p>
            <p className="text-base text-ink-2">{doc.title}</p>
          </div>
          <div className="text-right">
            <p className="text-base text-ink-2">Viện phí</p>
            <p className="tabular text-lg font-bold">{formatVnd(v.fee)}</p>
          </div>
        </div>
      </header>

      <div role="tablist" aria-label="Thông tin lần khám" className="mx-5 mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-surface p-1.5">
        {(
          [
            ['clinical', 'Lâm sàng'],
            ['para', `Cận lâm sàng (${v.labs.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={cx(
              'min-h-12 rounded-xl text-lg font-semibold transition',
              tab === id ? 'bg-white text-brand-900 shadow-[0_2px_8px_-2px_rgba(15,30,38,0.25)]' : 'text-ink-2',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 px-5">
        {tab === 'clinical' ? (
          <div id="panel-clinical" role="tabpanel" aria-labelledby="tab-clinical" className="flex animate-fade-in flex-col gap-3">
            <Section icon={ClipboardList} title="Triệu chứng ban đầu">
              <ul className="flex flex-col gap-1.5">
                {v.symptoms.map((s) => (
                  <li key={s} className="flex gap-2.5">
                    <span className="mt-[11px] size-2 shrink-0 rounded-full bg-brand-700" aria-hidden="true" />
                    {s}
                  </li>
                ))}
              </ul>
            </Section>
            <Section icon={FileText} title="Kết luận chẩn đoán">
              <p className="font-semibold">{v.conclusion}</p>
              <p className="mt-2 text-base text-ink-2">
                Mã ICD-10: <span className="tabular font-semibold text-ink">{v.icd}</span>
              </p>
            </Section>
            <Section icon={MessageSquareQuote} title="Ghi chú của bác sĩ">
              <blockquote className="rounded-2xl border-l-4 border-brand-700 bg-brand-50 px-4 py-3 text-brand-900">
                {v.note}
              </blockquote>
            </Section>
          </div>
        ) : (
          <div id="panel-para" role="tabpanel" aria-labelledby="tab-para" className="animate-fade-in">
            <p className="mb-3 text-base text-ink-2">Chạm vào từng dịch vụ để xem bảng chỉ số chi tiết.</p>
            <ul className="flex flex-col gap-3">
              {v.labs.map((l) => {
                const Icon = LAB_ICON[l.kind]
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setLab(l)}
                      aria-haspopup="dialog"
                      className="flex w-full items-center gap-3.5 rounded-3xl border border-line/80 bg-white p-4 text-left hover:border-brand-700"
                    >
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-800">
                        <Icon size={24} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg leading-snug font-bold">{l.name}</span>
                        <span
                          className={cx(
                            'mt-1.5 flex items-start gap-1.5 text-base font-semibold',
                            l.normal ? 'text-ok-ink' : 'text-warn',
                          )}
                        >
                          {l.normal ? (
                            <CircleCheck size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                          ) : (
                            <TriangleAlert size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                          )}
                          {l.summary}
                        </span>
                      </span>
                      <ChevronRight size={24} className="shrink-0 text-ink-2" aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      <BottomSheet open={!!lab} onClose={() => setLab(null)} title={lab?.name ?? ''} description={lab?.summary}>
        {lab && (
          <>
            <table className="w-full border-separate border-spacing-0 text-left">
              <caption className="sr-only">Bảng chỉ số {lab.name}</caption>
              <thead>
                <tr className="text-base text-ink-2">
                  <th scope="col" className="border-b-2 border-line py-2.5 pr-2 font-semibold">Chỉ số</th>
                  <th scope="col" className="border-b-2 border-line py-2.5 pr-2 text-right font-semibold">Kết quả</th>
                  <th scope="col" className="border-b-2 border-line py-2.5 text-right font-semibold">Tham chiếu</th>
                </tr>
              </thead>
              <tbody>
                {lab.rows.map((r) => (
                  <tr key={r.name} className={r.flag ? 'bg-warn-bg' : undefined}>
                    <th scope="row" className="border-b border-line/70 py-3 pr-2 pl-1 text-base font-semibold text-ink">
                      {r.name}
                    </th>
                    <td className="border-b border-line/70 py-3 pr-2 text-right align-top">
                      <span className={cx('tabular block text-lg font-bold', r.flag ? 'text-warn' : 'text-ink')}>
                        {r.value}
                        {r.flag && (
                          <span className="ml-1 inline-flex items-center rounded-md bg-warn px-1.5 text-base text-white">
                            {r.flag === 'high' ? '↑ Cao' : r.flag === 'low' ? '↓ Thấp' : 'Bất thường'}
                          </span>
                        )}
                      </span>
                      {r.unit && <span className="block text-base text-ink-2">{r.unit}</span>}
                    </td>
                    <td className="tabular border-b border-line/70 py-3 pr-1 text-right align-top text-base text-ink-2">{r.range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-base text-ink-2">
              Kết quả chỉ mang tính tham khảo. Vui lòng trao đổi với bác sĩ để được giải thích cụ thể.
            </p>
          </>
        )}
      </BottomSheet>
    </div>
  )
}
