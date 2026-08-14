import { ROUTES } from '../../../constants/routes';
import type { TopEvent } from '../dashboardTypes';

export interface TopEventsTableProps {
  events: TopEvent[];
  loading?: boolean;
  onRowClick?: (eventId: number) => void;
}

const EMPTY_ROWS = Array.from({ length: 5 }, (_, i) => i);
const BAR_COLOR = '#1c5cab';

function FillRateBar({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="text-xs text-slate-400">—</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-2 w-16 min-w-[4rem] flex-1 rounded bg-slate-100">
        <span
          className="block h-full rounded"
          style={{ width: `${Math.min(100, Math.max(0, rate))}%`, backgroundColor: BAR_COLOR }}
        />
      </div>
      <span className="w-10 text-right text-xs font-medium text-slate-700 tabular-nums">{rate}%</span>
    </div>
  );
}

export default function TopEventsTable({ events, loading, onRowClick }: TopEventsTableProps) {
  const gotoDetail = (eventId: number) => {
    if (onRowClick) onRowClick(eventId);
    else window.location.assign(ROUTES.EVENT_DETAIL.replace(':id', String(eventId)));
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full text-left align-middle text-sm text-slate-600">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <th scope="col" className="px-4 py-3">STT</th>
            <th scope="col" className="px-4 py-3">Tên sự kiện</th>
            <th scope="col" className="px-4 py-3 text-right">Số lượng đăng ký</th>
            <th scope="col" className="px-4 py-3 text-right">Sức chứa</th>
            <th scope="col" className="px-4 py-3 text-right">Tỷ lệ lấp đầy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            EMPTY_ROWS.map((i) => (
              <tr key={`skeleton-${i}`}>
                <td className="px-4 py-3"><div className="h-4 w-6 animate-pulse rounded bg-slate-200" /></td>
                <td className="px-4 py-3"><div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" /></td>
                <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-10 animate-pulse rounded bg-slate-200" /></td>
                <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-10 animate-pulse rounded bg-slate-200" /></td>
                <td className="px-4 py-3 text-right"><div className="ml-auto h-4 w-12 animate-pulse rounded bg-slate-200" /></td>
              </tr>
            ))
          ) : events.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                Chưa có sự kiện nào.
              </td>
            </tr>
          ) : (
            events.map((event, index) => (
              <tr
                key={event.eventId}
                onClick={() => gotoDetail(event.eventId)}
                className="cursor-pointer transition-colors hover:bg-slate-50"
              >
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{event.eventName}</td>
                <td className="px-4 py-3 text-right font-medium tabular-nums">{event.registered}</td>
                <td className="px-4 py-3 text-right tabular-nums">{event.capacity ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <FillRateBar rate={event.fillRate} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
