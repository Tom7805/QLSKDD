import { Link } from 'react-router-dom';
import EventStatusBadge from '../../../components/common/EventStatusBadge';
import { ROUTES } from '../../../constants/routes';
import type { EventSummary } from '../eventsTypes';

interface EventCardProps { event: EventSummary; }

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link to={ROUTES.EVENT_DETAIL.replace(':id', String(event.id))} className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h2 className="line-clamp-2 text-lg font-bold text-slate-900 group-hover:text-blue-700">{event.name}</h2>
        <EventStatusBadge status={event.status} />
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <div><dt className="text-xs font-semibold uppercase text-slate-400">Thời gian</dt><dd className="mt-1 text-slate-700">{formatDateTime(event.startAt)}</dd></div>
        <div><dt className="text-xs font-semibold uppercase text-slate-400">Địa điểm</dt><dd className="mt-1 line-clamp-2 text-slate-700">{event.location}</dd></div>
      </dl>
      <div className="mt-auto border-t border-slate-100 pt-4 text-sm font-semibold text-slate-700">
        {event.capacity !== null && event.availableSeats !== null ? `Còn ${event.availableSeats}/${event.capacity} chỗ` : 'Chưa giới hạn chỗ'}
        {event.attendanceRate !== null && <p className="mt-1 text-xs font-medium text-emerald-700">Tỷ lệ tham dự {event.attendanceRate}%</p>}
      </div>
    </Link>
  );
}
