export type EventStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

interface EventStatusBadgeProps {
  status: EventStatus | string;
}

const STATUS_STYLES: Record<EventStatus, { label: string; className: string; dotClassName: string }> = {
  OPEN: {
    label: 'Đang mở',
    className: 'bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
  },
  CLOSED: {
    label: 'Đã đóng',
    className: 'bg-slate-100 text-slate-600',
    dotClassName: 'bg-slate-400',
  },
  CANCELLED: {
    label: 'Đã huỷ',
    className: 'bg-red-50 text-red-700',
    dotClassName: 'bg-red-500',
  },
};

export default function EventStatusBadge({ status }: EventStatusBadgeProps) {
  const config = STATUS_STYLES[status as EventStatus] ?? {
    label: status,
    className: 'bg-slate-100 text-slate-600',
    dotClassName: 'bg-slate-400',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`} aria-hidden="true" />
      {config.label}
    </span>
  );
}
