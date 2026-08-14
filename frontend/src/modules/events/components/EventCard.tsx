import { Link } from 'react-router-dom';
import AttendanceRateBar from '../../../components/common/AttendanceRateBar';
import EventStatusBadge from '../../../components/common/EventStatusBadge';
import { ROUTES } from '../../../constants/routes';
import type { EventSummary } from '../eventsTypes';

interface EventCardProps { event: EventSummary; }

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

function ClockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4.5l3 2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6.5-5.61-6.5-11A6.5 6.5 0 1118.5 10c0 5.39-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link
      to={ROUTES.EVENT_DETAIL.replace(':id', String(event.id))}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:flex-row sm:items-center sm:gap-6"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="truncate text-lg font-bold text-slate-900 group-hover:text-blue-700">{event.name}</h2>
          <EventStatusBadge status={event.status} />
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5"><ClockIcon />{formatDateTime(event.startAt)}</span>
          <span className="inline-flex items-center gap-1.5"><PinIcon />{event.location}</span>
        </div>
      </div>
      {event.attendanceRate !== null && (
        <div className="w-full shrink-0 sm:w-44 sm:border-l sm:border-slate-100 sm:pl-6">
          <AttendanceRateBar rate={event.attendanceRate} />
        </div>
      )}
    </Link>
  );
}
