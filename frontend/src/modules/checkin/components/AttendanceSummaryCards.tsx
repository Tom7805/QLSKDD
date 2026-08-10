import type { AttendanceSummary } from '../checkinTypes';

const CARDS = [
  { key: 'totalRegistered', label: 'Tổng đăng ký', color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { key: 'present', label: 'Có mặt', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { key: 'absent', label: 'Vắng', color: 'border-amber-200 bg-amber-50 text-amber-700' },
] as const;

export default function AttendanceSummaryCards({ summary }: { summary: AttendanceSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {CARDS.map((card) => (
        <article key={card.key} className={`rounded-2xl border p-5 shadow-sm ${card.color}`}>
          <p className="text-sm font-semibold">{card.label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{summary[card.key]}</p>
          {card.key === 'present' && <p className="mt-1 text-xs font-medium">Tỷ lệ tham dự {summary.attendanceRate}%</p>}
        </article>
      ))}
    </div>
  );
}
