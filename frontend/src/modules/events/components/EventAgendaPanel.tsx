import { Link } from 'react-router-dom';
import { CheckIcon, ChevronRightIcon } from '../../../components/common/Icons';
import { ROUTES } from '../../../constants/routes';
import type { EventSummary } from '../eventsTypes';
import { formatHhMm, isEventFinished, paletteFor, parseEventDates } from './calendarShared';

const formatDayLine = (date: Date) =>
  new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(date);

const formatDayMonth = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

interface EventAgendaPanelProps {
  /** Các sự kiện đang hiển thị trên lịch, đã qua bộ lọc */
  events: EventSummary[];
  categoryOrder?: Map<number, number>;
  className?: string;
}

/**
 * Cột phải của trang lịch: sự kiện kế tiếp phóng to ở trên, rồi lịch trình cả tháng
 * cuộn bên dưới.
 *
 * Bảng lịch trả lời "khi nào, kéo dài bao lâu", còn cột này trả lời "cái gì tới ngay bây
 * giờ và ở đâu" — thứ mà nhìn thanh Gantt không đọc ra được. Danh sách phía dưới giãn
 * hết chiều cao còn lại nên cột không bao giờ hụt một mảng trắng ở đáy.
 */
export default function EventAgendaPanel({ events, categoryOrder, className = '' }: EventAgendaPanelProps) {
  const now = new Date();
  const sorted = [...events].sort((a, b) => a.startAt.localeCompare(b.startAt));
  const next = sorted.find((event) => !isEventFinished(event, now)) ?? null;
  const rest = sorted.filter((event) => event.id !== next?.id);

  const nextDates = next ? parseEventDates(next) : null;
  const nextPalette = next ? paletteFor(next, categoryOrder) : null;

  return (
    <aside
      aria-label="Sự kiện kế tiếp và lịch trình tháng"
      className={`flex flex-col glass-card border-emerald-200/80 p-4 ${className}`}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-extrabold tracking-tight text-ink">Sắp tới</h2>
          <p className="mt-0.5 truncate text-[11.5px] text-slate-400">
            {nextDates ? formatDayLine(nextDates.start) : 'Không còn sự kiện nào phía trước'}
          </p>
        </div>
        {next && (
          <Link
            to={ROUTES.EVENT_DETAIL.replace(':id', String(next.id))}
            aria-label={`Mở chi tiết ${next.name}`}
            title="Mở chi tiết"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-ink-muted transition-all duration-150 hover:bg-ink hover:text-white active:scale-90 raise"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        )}
      </div>

      {next && nextDates && nextPalette ? (
        <div className="shrink-0">
          <div className="mt-4 flex items-start gap-3">
            <p className="shrink-0 text-[30px] font-extrabold leading-none tabular-nums tracking-tight text-ink">
              {formatHhMm(nextDates.start)}
            </p>
            <span className={`mt-0.5 h-11 w-1 shrink-0 rounded-full ${nextPalette.bar}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-slate-400">
                {next.categoryName ?? 'Chưa phân loại'}
              </p>
              <p className="truncate text-[14px] font-bold leading-snug text-ink">{next.name}</p>
            </div>
          </div>

          <dl className="mt-4 space-y-1.5 text-[12.5px]">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-slate-400">Địa điểm</dt>
              <dd className="truncate font-semibold text-ink">{next.location}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-slate-400">Kết thúc</dt>
              <dd className="font-semibold text-ink">{formatHhMm(nextDates.end)}</dd>
            </div>
            {next.availableSeats !== null && (
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-slate-400">Chỗ trống</dt>
                <dd className="font-semibold text-ink">{Math.max(0, next.availableSeats)}</dd>
              </div>
            )}
          </dl>
        </div>
      ) : (
        <p className="mt-4 shrink-0 text-[13px] text-ink-muted">
          Không còn sự kiện nào chưa kết thúc trong khoảng đang xem.
        </p>
      )}

      {rest.length > 0 && (
        <>
          <h3 className="mt-5 shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Lịch trình tháng
          </h3>
          <ul className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto scrollbar-slim">
            {rest.map((event) => {
              const dates = parseEventDates(event);
              const finished = isEventFinished(event, now);
              return (
                <li key={event.id}>
                  <Link
                    to={ROUTES.EVENT_DETAIL.replace(':id', String(event.id))}
                    className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-2.5 py-2 transition-colors duration-150 hover:bg-slate-100"
                  >
                    <span
                      className={[
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px]',
                        finished ? 'border-ink bg-ink text-white' : 'border-slate-300',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {finished && <CheckIcon className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-[12.5px] font-semibold ${finished ? 'text-slate-400 line-through' : 'text-ink'}`}
                      >
                        {event.name}
                      </span>
                      <span className="block truncate text-[10.5px] text-slate-400">{event.location}</span>
                    </span>
                    {dates && (
                      <span className="shrink-0 text-right text-[10.5px] font-semibold tabular-nums text-slate-400">
                        <span className="block">{formatDayMonth(dates.start)}</span>
                        <span className="block">{formatHhMm(dates.start)}</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </aside>
  );
}
