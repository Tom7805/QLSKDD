import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '../../../components/common/Icons';
import { ROUTES } from '../../../constants/routes';
import type { EventSummary } from '../eventsTypes';
import {
  addDays,
  formatHhMm,
  isSameDay,
  paletteFor,
  parseEventDates,
  startOfDay,
} from './calendarShared';

/** Bề rộng cột tên và hai cột số liệu ở đuôi bảng */
const GRID_TEMPLATE = 'minmax(132px, 200px) minmax(0, 1fr) 74px 34px';
/** Thanh rộng hơn mức này mới đủ chỗ ghi nhãn đầy đủ / nhãn gọn bên trong */
const LABEL_FULL_PX = 148;
const LABEL_COMPACT_PX = 62;

const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
/** Hai nhãn ngày phải cách nhau ít nhất bấy nhiêu cột thì mới không dính vào nhau */
const MIN_LABEL_GAP_DAYS = 3;
/** Dưới bề rộng này thì bảng chuyển sang cuộn ngang thay vì bóp 31 cột cho vừa */
const MIN_TABLE_WIDTH = 880;

type Tone = 'open' | 'closed' | 'cancelled';

const TONE_DOT: Record<Tone, string> = {
  open: 'bg-emerald-500',
  closed: 'bg-amber-500',
  cancelled: 'bg-rose-500',
};

const TONE_LABEL: Record<Tone, string> = {
  open: 'Đang mở',
  closed: 'Đã đóng',
  cancelled: 'Đã huỷ',
};

const toneOf = (status: EventSummary['status']): Tone =>
  status === 'CANCELLED' ? 'cancelled' : status === 'CLOSED' ? 'closed' : 'open';

const formatDayMonth = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

interface Row {
  event: EventSummary;
  /** Chỉ số ngày trong tháng (0-based) của mép trái / mép phải thanh */
  startIndex: number;
  endIndex: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  spanDays: number;
  /** Số ngày thật của sự kiện, kể cả phần nằm ngoài tháng đang xem */
  totalDays: number;
  start: Date;
  lastDay: Date;
  end: Date;
  finished: boolean;
  running: boolean;
}

interface EventStatusReportProps {
  events: EventSummary[];
  monthStart: Date;
  loading?: boolean;
  categoryOrder?: Map<number, number>;
}

/**
 * Lịch tháng dạng bảng: mỗi sự kiện MỘT dòng chạy suốt bảng — tên bên trái, thanh màu
 * trải đúng số ngày diễn ra ở giữa, tỷ lệ lấp đầy và trạng thái ở đuôi.
 *
 * Chọn bảng thay cho lưới ô vuông vì lưới làm dở đúng hai việc hay phải làm nhất: so
 * sánh độ dài giữa các sự kiện, và soi trạng thái từng cái mà không phải bấm vào xem.
 * Đổi lại nó bỏ khái niệm "ô ngày" — nên hàng đầu bảng vẫn ghi thứ + ngày để không mất
 * cảm giác đang đọc một cuốn lịch.
 */
export default function EventStatusReport({
  events,
  monthStart,
  loading = false,
  categoryOrder,
}: EventStatusReportProps) {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(0);

  // Bề rộng thật của cột thời gian — cần để biết thanh có đủ chỗ ghi nhãn bên trong không
  useEffect(() => {
    const element = trackRef.current;
    if (!element) return undefined;
    const measure = () => setTrackWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const dayCount = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
  const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(monthStart);

  const days = useMemo(
    () => Array.from({ length: dayCount }, (_, index) => addDays(startOfDay(monthStart), index)),
    [monthStart, dayCount],
  );

  const now = new Date();

  /**
   * Chỉ ghi số ở một số mốc thay vì cả 31 ngày. Ghi hết thì các con số dính liền thành
   * một dãy "101112131415..." không đọc được — mà cũng không cần: ngày chính xác của
   * từng sự kiện đã nằm trên thanh và trong tooltip, hàng này chỉ để định vị.
   *
   * Mốc được chọn: ngày 1, mỗi Thứ 2, ngày cuối tháng, và luôn có hôm nay. Hôm nay được
   * ưu tiên — mốc nào đứng quá sát nó sẽ bị bỏ để hai nhãn không chồng lên nhau.
   */
  const labelIndexes = useMemo(() => {
    const todayIndex = days.findIndex((day) => isSameDay(day, now));
    const candidates = days
      .map((day, index) => ({ index, monday: ((day.getDay() + 6) % 7) === 0 }))
      .filter(({ index, monday }) => monday || index === 0 || index === dayCount - 1)
      .map(({ index }) => index);

    const kept: number[] = [];
    [...candidates, ...(todayIndex >= 0 ? [todayIndex] : [])]
      .sort((a, b) => a - b)
      .forEach((index) => {
        const previous = kept[kept.length - 1];
        if (previous === undefined || index - previous >= MIN_LABEL_GAP_DAYS) {
          kept.push(index);
          return;
        }
        // Quá sát mốc trước: nhường chỗ cho hôm nay, còn lại thì bỏ qua
        if (index === todayIndex) kept[kept.length - 1] = index;
      });
    return { set: new Set(kept), todayIndex };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, dayCount]);

  const rows = useMemo<Row[]>(() => {
    const gridStart = startOfDay(monthStart);
    const gridEnd = addDays(gridStart, dayCount);

    return events
      .map((event) => ({ event, dates: parseEventDates(event) }))
      .filter((item): item is { event: EventSummary; dates: { start: Date; end: Date } } => item.dates !== null)
      .filter(({ dates }) => dates.end > gridStart && dates.start < gridEnd)
      .sort((a, b) => a.dates.start.getTime() - b.dates.start.getTime())
      .map(({ event, dates }) => {
        // Kết thúc đúng 00:00 nghĩa là sự kiện khép lại ở cuối ngày hôm trước
        const lastMoment = new Date(dates.end.getTime() - 1);
        const firstVisible = startOfDay(dates.start < gridStart ? gridStart : dates.start);
        const lastVisible = startOfDay(lastMoment >= gridEnd ? addDays(gridEnd, -1) : lastMoment);
        const startIndex = Math.round((firstVisible.getTime() - gridStart.getTime()) / 86400000);
        const endIndex = Math.round((lastVisible.getTime() - gridStart.getTime()) / 86400000);

        return {
          event,
          startIndex,
          endIndex,
          continuesBefore: dates.start < gridStart,
          continuesAfter: dates.end > gridEnd,
          spanDays: endIndex - startIndex + 1,
          totalDays:
            Math.round((startOfDay(lastMoment).getTime() - startOfDay(dates.start).getTime()) / 86400000) + 1,
          start: dates.start,
          lastDay: startOfDay(lastMoment),
          end: dates.end,
          finished: dates.end < now,
          running: dates.start <= now && dates.end >= now,
        };
      });
    // `now` chỉ dùng để phân loại đã/đang/sắp — không cần dựng lại bảng mỗi phút
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, monthStart, dayCount]);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col glass-card border-indigo-200/80 p-4" aria-label="Đang tải lịch sự kiện">
        <div className="space-y-1">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-9 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col glass-card border-indigo-200/80 p-4">
      {/*
        Màn hẹp thì KHÔNG bóp 31 cột cho vừa (mỗi ngày còn ~9px, thanh sự kiện thành cái
        gạch) — cho cả bảng cuộn ngang, đầu bảng và các dòng cuộn cùng nhau vì nằm chung
        một vùng cuộn.
      */}
      <div className="flex min-h-0 flex-1 overflow-x-auto overflow-y-hidden rounded-2xl border border-slate-200 scrollbar-slim">
        <div className="flex min-h-0 w-full flex-col" style={{ minWidth: MIN_TABLE_WIDTH }}>
        {/* ----------------------------- Đầu bảng ----------------------------- */}
        <div
          className="grid items-center border-b border-slate-200 bg-slate-50"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
        >
          <span className="border-r border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Sự kiện
          </span>
          <span className="border-r border-slate-200 px-2 py-1.5 text-center text-[10px] font-bold capitalize tracking-wide text-slate-500">
            {monthLabel}
          </span>
          <span className="border-r border-slate-200 px-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Lấp đầy
          </span>
          <span className="px-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-slate-400">
            TT
          </span>
        </div>

        {/* Thước ngày: nền giữ nhịp 7 ngày (cuối tuần tô xám, vạch đậm ở mỗi Thứ 2),
            còn chữ chỉ hiện ở vài mốc thưa để không thành một dãy số dính liền */}
        <div
          className="grid items-stretch border-b border-slate-200"
          style={{ gridTemplateColumns: GRID_TEMPLATE }}
          role="group"
          aria-label="Các ngày trong tháng"
        >
          <span className="border-r border-slate-200" />
          <span ref={trackRef} className="relative h-9 border-r border-slate-200">
            <span className="absolute inset-0 flex" aria-hidden="true">
              {days.map((day, index) => {
                const weekdayIndex = (day.getDay() + 6) % 7;
                return (
                  <span
                    key={day.getTime()}
                    className={[
                      'min-w-0 flex-1',
                      index > 0 && weekdayIndex === 0 ? 'border-l border-slate-300' : 'border-l border-slate-100',
                      weekdayIndex >= 5 ? 'bg-slate-100/70' : '',
                      isSameDay(day, now) ? 'bg-indigo-100' : '',
                    ].join(' ')}
                  />
                );
              })}
            </span>

            {days.map((day, index) => {
              if (!labelIndexes.set.has(index)) return null;
              const today = index === labelIndexes.todayIndex;
              return (
                <span
                  key={day.getTime()}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-center leading-tight"
                  style={{ left: `${((index + 0.5) / dayCount) * 100}%` }}
                  title={day.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                >
                  <span className={`block text-[8.5px] font-bold ${today ? 'text-indigo-500' : 'text-slate-300'}`}>
                    {WEEKDAY_SHORT[(day.getDay() + 6) % 7]}
                  </span>
                  <span
                    className={[
                      'mt-px block rounded px-1 text-[10.5px] font-bold tabular-nums',
                      today ? 'bg-indigo-500 text-white' : 'text-slate-500',
                    ].join(' ')}
                  >
                    {day.getDate()}
                  </span>
                </span>
              );
            })}
          </span>
          <span className="border-r border-slate-200" />
          <span />
        </div>

        {/* ------------------------------ Các dòng ------------------------------ */}
        {rows.length === 0 ? (
          <p className="px-4 py-14 text-center text-[13px] text-ink-muted">
            Tháng này chưa có sự kiện nào.
          </p>
        ) : (
          <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto scrollbar-slim">
            {rows.map((row) => {
              const palette = paletteFor(row.event, categoryOrder);
              const tone = toneOf(row.event.status);
              const capacity = row.event.capacity ?? 0;
              const taken = Math.max(0, capacity - (row.event.availableSeats ?? 0));
              const fill = capacity > 0 ? Math.round((taken / capacity) * 100) : 0;
              const leftPercent = (row.startIndex / dayCount) * 100;
              const widthPercent = (row.spanDays / dayCount) * 100;
              const barPx = (widthPercent / 100) * trackWidth;

              const compactLabel = row.totalDays > 1 ? `${row.totalDays} ngày` : formatHhMm(row.start);
              const fullLabel = row.totalDays > 1
                ? `${formatDayMonth(row.start)} – ${formatDayMonth(row.lastDay)} · ${row.totalDays} ngày`
                : `${formatHhMm(row.start)}–${formatHhMm(row.end)}`;
              const insideLabel = barPx >= LABEL_FULL_PX ? fullLabel : barPx >= LABEL_COMPACT_PX ? compactLabel : '';
              // Thanh quá hẹp thì nhãn ra NGOÀI thay vì bị cắt cụt thành "3…"; thanh nằm
              // nửa cuối tháng thì nhãn nhảy sang trái để không tràn khỏi bảng
              const labelAfter = leftPercent + widthPercent < 62;

              return (
                <button
                  key={row.event.id}
                  type="button"
                  onClick={() => navigate(ROUTES.EVENT_DETAIL.replace(':id', String(row.event.id)))}
                  title={`${row.event.name} · ${row.event.location} · ${fullLabel} · ${TONE_LABEL[tone]}`}
                  className="group grid w-full items-stretch text-left transition-colors duration-150 odd:bg-slate-50/40 hover:bg-indigo-50/50 focus:outline-none focus-visible:bg-indigo-50/70"
                  style={{ gridTemplateColumns: GRID_TEMPLATE }}
                >
                  {/* Cột tên — vạch màu loại chạy dọc mép trái để nhận ra loại từ xa */}
                  <span className="relative flex min-w-0 items-center gap-2 border-r border-slate-100 py-1.5 pl-3 pr-2">
                    <span
                      className={`absolute inset-y-1.5 left-0 w-[3px] rounded-r ${palette.dot}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12px] font-bold ${row.finished ? 'text-slate-400' : 'text-ink'}`}>
                        {row.event.name}
                      </span>
                      <span className="block truncate text-[10px] text-slate-400">{row.event.location}</span>
                    </span>
                    <ChevronRightIcon
                      className="h-3.5 w-3.5 shrink-0 text-slate-300 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </span>

                  {/* Cột trục thời gian */}
                  <span className="relative block border-r border-slate-100 py-1.5">
                    <span className="pointer-events-none absolute inset-0 flex" aria-hidden="true">
                      {days.map((day, index) => {
                        const weekdayIndex = (day.getDay() + 6) % 7;
                        return (
                          <span
                            key={day.getTime()}
                            className={[
                              'min-w-0 flex-1',
                              // Vạch đậm ở mỗi Thứ 2 để đọc ra ranh giới tuần mà không cần nhãn
                              index > 0 && weekdayIndex === 0 ? 'border-l border-slate-200' : 'border-l border-slate-100/70',
                              weekdayIndex >= 5 ? 'bg-slate-50' : '',
                              isSameDay(day, now) ? 'bg-indigo-100/60' : '',
                            ].join(' ')}
                          />
                        );
                      })}
                    </span>

                    {/*
                      Thanh dùng dải chuyển sắc thay vì một màu phẳng, cộng một vệt sáng
                      trắng mảnh ở nửa trên (`before:`) để mặt thanh trông cong như một
                      viên thuốc chứ không phẳng lì — thanh dài cả trăm pixel mà tô màu
                      phẳng thì nhìn rất chết.
                    */}
                    <span
                      className={[
                        'absolute flex items-center justify-center overflow-hidden rounded-full px-2 text-white',
                        'bg-gradient-to-r shadow-md transition-all duration-200',
                        'group-hover:scale-y-110 group-hover:shadow-lg',
                        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1/2',
                        'before:rounded-t-full before:bg-gradient-to-b before:from-white/35 before:to-transparent',
                        palette.gradient,
                        palette.glow,
                        row.finished ? 'opacity-55 saturate-[0.6]' : '',
                        row.continuesBefore ? 'rounded-l-sm' : '',
                        row.continuesAfter ? 'rounded-r-sm' : '',
                      ].join(' ')}
                      style={{
                        top: 7,
                        bottom: 7,
                        left: `calc(${leftPercent}% + 2px)`,
                        width: `max(10px, calc(${widthPercent}% - 4px))`,
                      }}
                    >
                      {insideLabel && (
                        <span className="relative truncate text-[10px] font-bold drop-shadow-sm">
                          {row.continuesBefore && '◂ '}
                          {insideLabel}
                        </span>
                      )}
                    </span>

                    {!insideLabel && (
                      <span
                        className="pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-bold text-slate-500"
                        style={
                          labelAfter
                            ? { left: `calc(${leftPercent + widthPercent}% + 6px)` }
                            : { right: `calc(${100 - leftPercent}% + 6px)` }
                        }
                      >
                        {compactLabel}
                      </span>
                    )}
                  </span>

                  {/* Cột lấp đầy */}
                  <span className="flex flex-col justify-center border-r border-slate-100 px-2">
                    <span className="block text-center text-[10.5px] font-bold tabular-nums text-ink">{fill}%</span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className={`block h-full rounded-full ${fill >= 85 ? 'bg-emerald-500' : fill >= 50 ? 'bg-indigo-500' : 'bg-sky-400'}`}
                        style={{ width: `${Math.min(100, fill)}%` }}
                      />
                    </span>
                  </span>

                  {/* Cột trạng thái */}
                  <span className="flex items-center justify-center">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ring-4 ring-white ${TONE_DOT[tone]}`}
                      title={TONE_LABEL[tone]}
                      aria-label={TONE_LABEL[tone]}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* ----------------------------- Chú giải ----------------------------- */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-semibold text-slate-400">
        {(['open', 'closed', 'cancelled'] as Tone[]).map((tone) => (
          <span key={tone} className="inline-flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${TONE_DOT[tone]}`} aria-hidden="true" />
            {TONE_LABEL[tone]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-full bg-slate-300" aria-hidden="true" />
          Màu thanh = loại sự kiện
        </span>
        <span className="ml-auto">Lấp đầy = tỷ lệ chỗ đã đăng ký</span>
      </div>
    </div>
  );
}
