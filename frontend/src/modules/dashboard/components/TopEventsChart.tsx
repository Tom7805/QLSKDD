import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TopEvent } from '../dashboardTypes';

const AXIS_LABEL_MAX_CHARS = 12;
const BAR_IDLE = '#e6e8ec';
const BAR_ACTIVE = '#16181d';

interface ChartDatum {
  eventId: number;
  name: string;
  registered: number;
  capacity: number | null;
  fillRate: number | null;
  /** Tỷ trọng trên tổng lượt đăng ký của top hiện tại */
  share: number;
}

function truncateLabel(name: string) {
  return name.length > AXIS_LABEL_MAX_CHARS ? `${name.slice(0, AXIS_LABEL_MAX_CHARS)}…` : name;
}

/**
 * Hộp số liệu hiện khi rê vào từng cột: nêu đủ số liệu của đúng cột đó (tên, lượt đăng
 * ký, sức chứa, tỷ lệ lấp đầy, tỷ trọng) thay vì chỉ một con số trần như tooltip mặc định.
 */
function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDatum }> }) {
  if (!active || !payload?.length) return null;
  const datum = payload[0].payload;

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Lượt đăng ký', value: `${datum.registered}` },
    { label: 'Sức chứa', value: datum.capacity != null ? `${datum.capacity}` : '—' },
    { label: 'Tỷ lệ lấp đầy', value: datum.fillRate != null ? `${datum.fillRate}%` : '—' },
    { label: 'Tỷ trọng', value: `${datum.share.toFixed(1)}%` },
  ];

  return (
    <div className="pointer-events-none min-w-[190px] rounded-xl bg-ink px-3 py-2.5 text-white shadow-pop">
      <p className="mb-2 border-b border-white/15 pb-1.5 text-[12px] font-bold leading-tight">{datum.name}</p>
      <dl className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <dt className="text-[11px] text-white/60">{row.label}</dt>
            <dd className="text-[11.5px] font-bold tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface TopEventsChartProps {
  events: TopEvent[];
  loading?: boolean;
  onSelect?: (eventId: number) => void;
}

export default function TopEventsChart({ events, loading, onSelect }: TopEventsChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="flex h-[280px] items-end gap-3 px-2 pb-8" aria-label="Đang tải biểu đồ">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex-1 animate-pulse rounded-t-lg bg-slate-100"
            style={{ height: `${40 + ((index * 37) % 55)}%` }}
          />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return <div className="py-16 text-center text-sm text-ink-muted">Chưa có sự kiện nào.</div>;
  }

  const total = events.reduce((sum, event) => sum + event.registered, 0);
  const data: ChartDatum[] = events.map((event) => ({
    eventId: event.eventId,
    name: event.eventName,
    registered: event.registered,
    capacity: event.capacity,
    fillRate: event.fillRate,
    share: total > 0 ? (event.registered / total) * 100 : 0,
  }));

  const activeDatum = activeIndex !== null ? data[activeIndex] : null;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f2f4" />
          <XAxis
            dataKey="name"
            tickFormatter={truncateLabel}
            tick={{ fontSize: 11, fill: '#5b616e' }}
            tickLine={false}
            axisLine={false}
            interval={0}
            height={40}
          />
          <YAxis
            orientation="right"
            domain={[0, 'dataMax + 5']}
            tick={{ fontSize: 11, fill: '#9aa0ab' }}
            tickLine={false}
            axisLine={false}
            width={38}
          />
          {/* Đường gióng ngang tới đỉnh cột đang rê — đọc nhanh giá trị trên trục phải */}
          {activeDatum && (
            <ReferenceLine y={activeDatum.registered} stroke="#16181d" strokeDasharray="4 4" strokeOpacity={0.35} />
          )}
          <Tooltip
            isAnimationActive={false}
            cursor={{ fill: 'rgba(22, 24, 29, 0.04)' }}
            content={<ChartTooltip />}
          />
          <Bar
            dataKey="registered"
            radius={[8, 8, 0, 0]}
            isAnimationActive={false}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onClick={(entry) => {
              const eventId = (entry?.payload as ChartDatum | undefined)?.eventId;
              if (eventId && onSelect) onSelect(eventId);
            }}
            className={onSelect ? 'cursor-pointer' : undefined}
          >
            {data.map((datum, index) => (
              <Cell
                key={datum.eventId}
                fill={activeIndex === index ? BAR_ACTIVE : BAR_IDLE}
                className="transition-[fill] duration-150"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
