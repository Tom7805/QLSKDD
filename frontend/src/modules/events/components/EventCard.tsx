import { Link } from 'react-router-dom';
import AttendanceRateBar from '../../../components/common/AttendanceRateBar';
import EventStatusBadge from '../../../components/common/EventStatusBadge';
import { ClockIcon, PinIcon } from '../../../components/common/Icons';
import { ROUTES } from '../../../constants/routes';
import { categoryDotClass } from './calendarShared';
import type { EventSummary } from '../eventsTypes';

interface EventCardProps {
  event: EventSummary;
  categoryOrder?: Map<number, number>;
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function EventCard({ event, categoryOrder }: EventCardProps) {
  return (
    <Link
      to={ROUTES.EVENT_DETAIL.replace(':id', String(event.id))}
      className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:flex-row sm:items-center sm:gap-6 sm:p-5"
    >
      {/* Vạch màu theo loại sự kiện — cùng bảng màu với khối trên lịch tuần */}
      <span
        className={`hidden h-12 w-1.5 shrink-0 rounded-full sm:block ${
          event.categoryId != null ? categoryDotClass(event.categoryId, categoryOrder) : 'bg-slate-200'
        }`}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="truncate text-[15px] font-bold text-ink group-hover:underline">{event.name}</h2>
          <EventStatusBadge status={event.status} />
          {event.categoryName && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
              {event.categoryName}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
            {formatDateTime(event.startAt)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <PinIcon className="h-4 w-4 shrink-0 text-slate-400" />
            {event.location}
          </span>
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
