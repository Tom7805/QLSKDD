import { Link } from 'react-router-dom';
import AttendanceRateBar from '../../../components/common/AttendanceRateBar';
import EventStatusBadge from '../../../components/common/EventStatusBadge';
import { ROUTES } from '../../../constants/routes';
import type { EventSummary } from '../eventsTypes';

interface EventCardProps { event: EventSummary; }

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link
      to={ROUTES.EVENT_DETAIL.replace(':id', String(event.id))}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:gap-6"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="truncate text-lg font-bold text-slate-900 group-hover:text-blue-700">{event.name}</h2>
          <EventStatusBadge status={event.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="text-slate-400">🕒</span>{formatDateTime(event.startAt)}</span>
          <span className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="text-slate-400">📍</span>{event.location}</span>
        </div>
      </div>
      {event.attendanceRate !== null && (
        <div className="w-full shrink-0 sm:w-56">
          <AttendanceRateBar rate={event.attendanceRate} />
        </div>
      )}
    </Link>
  );
}
