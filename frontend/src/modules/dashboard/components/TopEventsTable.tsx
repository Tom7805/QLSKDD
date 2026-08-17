import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon, SortIcon } from '../../../components/common/Icons';
import { ROUTES } from '../../../constants/routes';
import type { TopEvent } from '../dashboardTypes';

export interface TopEventsTableProps {
  events: TopEvent[];
  loading?: boolean;
  onRowClick?: (eventId: number) => void;
}

type SortKey = 'rank' | 'eventName' | 'registered' | 'capacity' | 'fillRate';

const EMPTY_ROWS = Array.from({ length: 5 }, (_, i) => i);

/** Màu thanh lấp đầy theo ngưỡng — thống nhất với thanh tỷ lệ tham dự ở các trang khác */
function fillTone(rate: number) {
  if (rate < 50) return 'bg-red-400';
  if (rate <= 80) return 'bg-amber-400';
  return 'bg-emerald-500';
}

function FillRateBar({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="text-xs text-slate-400">—</span>;
  return (
    <div className="flex items-center justify-end gap-2.5">
      <div className="relative h-1.5 w-16 min-w-[3rem] overflow-hidden rounded-full bg-slate-100">
        <span
          className={`block h-full rounded-full transition-[width] duration-500 ${fillTone(rate)}`}
          style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-semibold tabular-nums text-ink">{rate}%</span>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = activeKey === sortKey;
  return (
    <th scope="col" className={`px-4 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        aria-label={`Sắp xếp theo ${label}`}
        className={[
          'inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-bold uppercase tracking-wide transition-colors',
          align === 'right' ? 'flex-row-reverse' : '',
          active ? 'text-ink' : 'text-slate-400 hover:text-ink',
        ].join(' ')}
      >
        {label}
        <SortIcon className={`h-3.5 w-3.5 ${active ? 'text-ink' : 'text-slate-300'}`} direction={active ? direction : null} />
      </button>
    </th>
  );
}

export default function TopEventsTable({ events, loading, onRowClick }: TopEventsTableProps) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');

  const gotoDetail = (eventId: number) => {
    if (onRowClick) onRowClick(eventId);
    else navigate(ROUTES.EVENT_DETAIL.replace(':id', String(eventId)));
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      // Cột chữ đọc xuôi A→Z là tự nhiên; cột số thì lớn nhất lên đầu mới hữu ích
      setDirection(key === 'eventName' || key === 'rank' ? 'asc' : 'desc');
    }
  };

  const sorted = useMemo(() => {
    // Giữ thứ hạng gốc do API trả về (đã xếp theo lượt đăng ký) để cột STT luôn ổn định
    const withRank = events.map((event, index) => ({ ...event, rank: index + 1 }));
    if (sortKey === 'rank') {
      return direction === 'asc' ? withRank : [...withRank].reverse();
    }
    const factor = direction === 'asc' ? 1 : -1;
    return [...withRank].sort((a, b) => {
      if (sortKey === 'eventName') return a.eventName.localeCompare(b.eventName, 'vi') * factor;
      // null (chưa có sức chứa / chưa tính được tỷ lệ) luôn xuống cuối, không lẫn với 0
      const left = a[sortKey];
      const right = b[sortKey];
      if (left == null && right == null) return 0;
      if (left == null) return 1;
      if (right == null) return -1;
      return (left - right) * factor;
    });
  }, [events, sortKey, direction]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left align-middle text-sm text-ink-muted">
        <thead className="border-b border-hairline bg-slate-50/60">
          <tr>
            <SortableHeader label="#" sortKey="rank" activeKey={sortKey} direction={direction} onSort={handleSort} />
            <SortableHeader label="Tên sự kiện" sortKey="eventName" activeKey={sortKey} direction={direction} onSort={handleSort} />
            <SortableHeader label="Đăng ký" sortKey="registered" activeKey={sortKey} direction={direction} onSort={handleSort} align="right" />
            <SortableHeader label="Sức chứa" sortKey="capacity" activeKey={sortKey} direction={direction} onSort={handleSort} align="right" />
            <SortableHeader label="Tỷ lệ lấp đầy" sortKey="fillRate" activeKey={sortKey} direction={direction} onSort={handleSort} align="right" />
            <th scope="col" className="w-10 px-2 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {loading ? (
            EMPTY_ROWS.map((i) => (
              <tr key={`skeleton-${i}`}>
                {Array.from({ length: 6 }, (_, cell) => (
                  <td key={cell} className="px-4 py-3">
                    <div className="h-4 animate-pulse rounded bg-slate-100" style={{ width: cell === 1 ? '70%' : '2.5rem' }} />
                  </td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                Chưa có sự kiện nào.
              </td>
            </tr>
          ) : (
            sorted.map((event) => (
              <tr
                key={event.eventId}
                onClick={() => gotoDetail(event.eventId)}
                className="group cursor-pointer transition-colors hover:bg-slate-50"
              >
                <td className="px-4 py-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-bold tabular-nums text-ink-muted transition-colors group-hover:bg-ink group-hover:text-white">
                    {event.rank}
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-ink group-hover:underline">{event.eventName}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">{event.registered}</td>
                <td className="px-4 py-3 text-right tabular-nums">{event.capacity ?? '—'}</td>
                <td className="px-4 py-3"><FillRateBar rate={event.fillRate} /></td>
                <td className="px-2 py-3">
                  <ChevronRightIcon className="h-4 w-4 text-slate-300 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-ink" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
